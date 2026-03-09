'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useSettings } from '@/hooks/use-settings';
import { compareRanks } from '@/lib/utils';
import { StaffListEditor } from './guard-staff-editor';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import type { Staff, StaffMember, StaffRole, FieldConfig } from '@/types';

interface OrdenDelDiaFormProps {
  selectedGuard: string;
  initialData: Staff | undefined;
}

const formatStaffMember = (member: StaffMember): string => {
  const rank = member.rank ? `${member.rank} ` : '';
  return `${rank}${member.name}`;
};

export function OrdenDelDiaForm({ selectedGuard, initialData }: OrdenDelDiaFormProps) {
  const { definitions } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { settings, saveSettings } = useSettings();
  const { personnel, isLoaded: personnelLoaded } = usePersonnel();
  const [periodo, setPeriodo] = useState('');
  const [staff, setStaff] = useState<Staff>({});

  const [generatedOrder, setGeneratedOrder] = useState('');
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copiar');
  const [isSnapshotSaved, setIsSnapshotSaved] = useState(false);
  const lastInitializedGuard = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeMember = useMemo(() => {
    if (!activeId) return null;
    for (const roleMembers of Object.values(staff)) {
      const found = roleMembers.find((m) => m.id === activeId);
      if (found) return found;
    }
    return null;
  }, [staff, activeId]);

  const globalSettings = useMemo(() => {
    const settings: Record<string, string> = {};
    Object.entries(definitions).forEach(([key, config]) => {
      const fieldConfig = config as FieldConfig;
      if (fieldConfig.type === 'predefined') {
        settings[key] = fieldConfig.value || '';
      }
    });
    return settings;
  }, [definitions]);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    setPeriodo(`${formatDate(today)} AL ${formatDate(tomorrow)}`);
  }, []);

  useEffect(() => {
    if (lastInitializedGuard.current === selectedGuard) return;

    if (rolesLoaded && personnelLoaded) {
      const newStaffState: Staff = {};
      roles.forEach((role: StaffRole) => {
        const roleNameLower = role.name.toLowerCase();
        let assignedMembers = (initialData && initialData[role.name]) || [];

        // Override Director/Chief assignments from Global Personnel
        if (
          roleNameLower === 'director' ||
          roleNameLower === 'jefe de operaciones' ||
          roleNameLower === 'jefe de departamento'
        ) {
          const globalMatch = personnel.find(
            (p: StaffMember) => p.roleId === role.name || p.roleId === roleNameLower
          );
          if (globalMatch) {
            assignedMembers = [globalMatch];
          }
        }

        // Apply Hierarchical Sorting as DEFAULT
        // (This only happens on initialization, manual DND will then take over)
        newStaffState[role.name] = [...assignedMembers].sort((a, b) =>
          compareRanks(a.rank, b.rank)
        );
      });

      setStaff(newStaffState);
      lastInitializedGuard.current = selectedGuard;
    }
  }, [initialData, roles, rolesLoaded, personnel, personnelLoaded, selectedGuard]);

  const handleRoleStaffUpdate = (roleName: string, members: StaffMember[]) => {
    setStaff((prev: Staff) => ({
      ...prev,
      [roleName]: members,
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source container
    let activeContainer: string | null = null;
    for (const [roleName, members] of Object.entries(staff)) {
      if (members.some((m) => m.id === activeId)) {
        activeContainer = roleName;
        break;
      }
    }

    // Find destination container
    let overContainer: string | null = null;
    if (staff[overId]) {
      overContainer = overId;
    } else {
      for (const [roleName, members] of Object.entries(staff)) {
        if (members.some((m) => m.id === overId)) {
          overContainer = roleName;
          break;
        }
      }
    }

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const containerMembers = staff[activeContainer];
      if (!containerMembers) return;

      const oldIndex = containerMembers.findIndex((m) => m.id === activeId);
      const newIndex = containerMembers.findIndex((m) => m.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        handleRoleStaffUpdate(activeContainer, arrayMove(containerMembers, oldIndex, newIndex));
      }
    } else {
      const sourceMembers = staff[activeContainer];
      if (!sourceMembers) return;

      const activeIndex = sourceMembers.findIndex((m) => m.id === activeId);
      const activeItem = sourceMembers[activeIndex];
      if (!activeItem) return;

      const destMembers = staff[overContainer] || [];
      const overIndex = destMembers.findIndex((m) => m.id === overId);

      const targetRole = roles.find((r) => r.name === overContainer);

      setStaff((prev) => {
        const newStaff = { ...prev };
        if (activeContainer) {
          newStaff[activeContainer] = (prev[activeContainer] || []).filter((m) => m.id !== activeId);
        }

        if (overContainer) {
          const currentDestMembers = prev[overContainer] || [];
          if (targetRole?.isSingle) {
            newStaff[overContainer] = [activeItem];
          } else {
            const updatedDestMembers = [...currentDestMembers];
            if (overIndex === -1) {
              updatedDestMembers.push(activeItem);
            } else {
              updatedDestMembers.splice(overIndex, 0, activeItem);
            }
            newStaff[overContainer] = updatedDestMembers;
          }
        }
        return newStaff;
      });
    }
  };

  const handleUseForFinalReport = () => {
    let startDate, endDate;
    const parts = periodo.split(' AL ');
    if (parts.length === 2) {
      const startStr = parts[0];
      const endStr = parts[1];
      if (startStr && endStr) {
        const startParts = startStr.split('/');
        const endParts = endStr.split('/');
        if (startParts.length === 3 && endParts.length === 3) {
          // DD/MM/YYYY -> YYYY-MM-DD for Date constructor
          startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}T00:00:00`);
          endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}T00:00:00`);
        }
      }
    }

    saveSettings({
      ...settings,
      finalReportStaffSnapshot: staff,
      finalReportStartDate: startDate && !isNaN(startDate.getTime()) ? startDate.toISOString() : '',
      finalReportEndDate: endDate && !isNaN(endDate.getTime()) ? endDate.toISOString() : '',
    });
    setIsSnapshotSaved(true);
  };

  const handleGenerateOrder = () => {
    // Helper to find a key case-insensitively
    const findInsensitive = (obj: Record<string, string>, key: string): string => {
      if (!obj) return '';
      const keyLower = key.toLowerCase();
      const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === keyLower);
      return foundKey ? (obj[foundKey] ?? '') : '';
    };

    const jefeDeOperaciones = (() => {
      const key = Object.keys(staff).find((k) => k.toLowerCase() === 'jefe de operaciones');
      if (key) {
        const list = staff[key];
        if (list && list.length > 0) {
          const first = list[0];
          if (first) return formatStaffMember(first).trim();
        }
      }
      return '';
    })();

    const director = (() => {
      const key = Object.keys(staff).find((k) => k.toLowerCase() === 'director');
      if (key) {
        const list = staff[key];
        if (list && list.length > 0) {
          const first = list[0];
          if (first) return formatStaffMember(first).trim();
        }
      }
      return '';
    })();

    // Fallback if not in staff list (though they should be if added as roles)
    // We already removed them from globalSettings, so we rely on Staff.

    const municipio = findInsensitive(globalSettings, 'Municipio');
    const estado = findInsensitive(globalSettings, 'Estado');

    const reportParts = [
      `*ORDEN DEL DÍA DEL INSTITUTO AUTONOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES DEL MUNICIPIO ${(municipio || '').toUpperCase()} ESTADO ${(estado || '').toUpperCase()}*`,
      ``,
      `*DIRECTOR*`,
      director,
      ``,
      `*JEFE DE OPERACIONES*`,
      jefeDeOperaciones,
      ``,
      `*GRUPO DE GUARDIA:* “${selectedGuard}”`,
      ``,
      `*PERIODO:* ${periodo}`,
    ];

    Object.entries(staff).forEach(([role, personnelList]) => {
      // Skip Director and Jefe de Operaciones as they are in the header
      if (role.toLowerCase() === 'director' || role.toLowerCase() === 'jefe de operaciones') return;

      if (
        personnelList &&
        personnelList.length > 0 &&
        personnelList.some((p: StaffMember) => p.name.trim() !== '')
      ) {
        reportParts.push(
          ``,
          `*${role.toUpperCase()}*`,
          personnelList.map(formatStaffMember).join('\n')
        );
      }
    });

    const order = reportParts.join('\n').trim();

    setGeneratedOrder(order);
    setIsResultDialogOpen(true);
    setCopyButtonText('Copiar');
    setIsSnapshotSaved(false);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedOrder);
    setCopyButtonText('¡Copiado!');
    setTimeout(() => setCopyButtonText('Copiar'), 2000);
  };

  return (
    <div>
      <div className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Grupo de Guardia
            </Label>
            <Input readOnly value={`“${selectedGuard}”`} className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="periodo"
              className="text-xs uppercase font-bold text-muted-foreground tracking-wider"
            >
              Periodo
            </Label>
            <Input
              id="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {roles
              .filter((r: StaffRole) => !r.isHidden)
              .map((role: StaffRole) => (
                <StaffListEditor
                  key={role.name}
                  label={role.name}
                  staffMembers={staff[role.name] || []}
                  isSingle={role.isSingle}
                  onUpdate={(members) => handleRoleStaffUpdate(role.name, members)}
                />
              ))}
          </div>
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.4',
                  },
                },
              }),
            }}
          >
            {activeId && activeMember ? (
              <div className="flex items-center justify-between p-3 pl-4 bg-background border rounded-lg shadow-xl ring-2 ring-primary/20">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-muted-foreground shrink-0 cursor-grabbing p-1.5">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground/90 truncate">
                      {activeMember.name}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/70 tracking-tighter uppercase">
                      {activeMember.cedula || 'SIN CÉDULA'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <div className="flex justify-end pt-6">
        <Button onClick={handleGenerateOrder}>Generar Orden del Día</Button>
      </div>

      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle>Orden del Día Generada</DialogTitle>
            <DialogDescription>
              Puedes copiar el texto generado o guardar el personal para el reporte final.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <Textarea
              readOnly
              value={generatedOrder}
              className="w-full h-full min-h-[50vh] text-sm whitespace-pre-wrap font-mono"
            />
          </div>
          <DialogFooter className="mt-auto pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleUseForFinalReport}
              disabled={isSnapshotSaved}
            >
              {isSnapshotSaved ? 'Guardado para Reporte Final' : 'Usar para Reporte Final'}
            </Button>
            <Button type="button" onClick={handleCopyToClipboard}>
              {copyButtonText}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
