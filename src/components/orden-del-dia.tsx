'use client';

import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Trash2, Plus, Clock, StickyNote, Copy, CheckIcon, Eye, Save, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import type { Staff, StaffMember, StaffRole, FieldConfig } from '@/types';
import { generateId } from '@/lib/utils/id';

import { formatStaffMember } from '@/lib/formatters';

interface Activity {
  id: string;
  content: string;
}

interface Note {
  id: string;
  content: string;
}

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'def-1', content: '*08:00 HLV* Se realiza cambio y recepción de Guardia' },
  { id: 'def-2', content: '*08:00 HLV* El jefe de los Servicios reporta novedades al jefe de Operaciones dando inicio a la guardia de 24 Horas.' },
  { id: 'def-3', content: '*08:30 HLV* Se envía reporte meteorológico a la central de Protección Civil Anzoátegui.' },
  { id: 'def-4', content: '*12:00 HLV a 13:00 HLV* Se realiza reporte Meteorológico' },
  { id: 'def-5', content: '*14:30 HLV* Se envía reporte meteorológico a la central de Protección Civil Anzoátegui.' },
  { id: 'def-6', content: '*17:30 HLV* Se envía reporte meteorológico a la central de Protección Civil Anzoátegui.' },
  { id: 'def-7', content: '*18:00 - 19:00 HLV* Se realiza reporte Meteorológico.' },
  { id: 'def-8', content: '*20:00 HLV* Se realiza mantenimiento limpieza de las unidades e instalaciones de la sede.' },
  { id: 'def-9', content: '*20:30 HLV* Se envía reporte meteorológico a la central de Protección Civil Anzoátegui.' },
  { id: 'def-10', content: '*21:00 HLV* Se inicia el periodo de descanso del personal.' },
  { id: 'def-11', content: '*06:00 HLV - 07:00 HLV* Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
  { id: 'def-12', content: '*06:00 HLV* Culmina el periodo de descanso del personal.' },
  { id: 'def-13', content: '*08:00 HLV* Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
  { id: 'def-14', content: '*08:00 HLV* Se envía reporte final de novedades correspondiente a la guardia de 24 Horas del día a la dirección estadal y ZOEDAN / Se da culminación a la guardia de 24 Horas.' },
];

const DEFAULT_NOTES: Note[] = [
  { id: 'note-1', content: 'ESTA ORDEN DE OPERACIONES DEBE SER CUMPLIDA A CABALIDAD, EL INCUMPLIMIENTO DE LAS MISMAS ACARREARÁ COMO CONSECUENCIA SANCIONES ADMINISTRATIVAS.' },
  { id: 'note-2', content: 'LA ORDEN DE OPERACIONES DEBE SER REALIZADA Y DIFUNDIDA TODOS LOS DÍAS POR EL JEFE DE LOS SERVICIOS DE GUARDIA.' },
  { id: 'note-3', content: 'LA UNIDAD AMBULANCIA DEL AMBULATORIO TITO GONZÁLEZ HEREDIA EN APOYO A LAS OPERACIONES DEL INSTITUTO.' },
  { id: 'note-4', content: 'EL ASEO DE LAS UNIDADES E INSTALACIONES (OFICINAS, CUADRA, BAÑOS Y COCINA) DEBE SER REALIZADA DIARIAMENTE.' },
];

interface OrdenDelDiaFormProps {
  selectedGuard: string;
  initialData: Staff | undefined;
  periodo: string;
}

export const OrdenDelDiaForm = forwardRef<{ generateOrder: () => void }, OrdenDelDiaFormProps>(
  ({ selectedGuard, initialData, periodo }, ref) => {
    const { definitions } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const isMobile = useIsMobile();
  const { settings, saveSettings, isLoaded: isSettingsLoaded } = useSettings();
  const { personnel, isLoaded: personnelLoaded } = usePersonnel();
  const [staff, setStaff] = useState<Staff>({});

  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);

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
    if (lastInitializedGuard.current === selectedGuard) return;

    if (rolesLoaded && personnelLoaded && isSettingsLoaded) {
      // Priority 1: Check for existing draft for this guard
      if (settings.ordenDelDiaDraft && settings.ordenDelDiaDraft.guardId === selectedGuard) {
        setStaff(settings.ordenDelDiaDraft.staff);
        setActivities(settings.ordenDelDiaDraft.activities);
        setNotes(settings.ordenDelDiaDraft.notes);
        lastInitializedGuard.current = selectedGuard;
        return;
      }

      // Priority 2: Use Initial Data or default generation
      const newStaffState: Staff = {};
      roles.forEach((role: StaffRole) => {
        const roleNameLower = role.name.toLowerCase();
        let assignedMembers = (initialData && initialData[role.name]) || [];

        assignedMembers = assignedMembers.map((member: StaffMember) => {
          const latestData = personnel.find((p: StaffMember) => p.id === member.id);
          return latestData || member;
        });

        if (
          roleNameLower === 'director' ||
          roleNameLower === 'jefe de operaciones' ||
          roleNameLower === 'jefe de los servicios' ||
          roleNameLower === 'jefe de departamento'
        ) {
          const globalMatch = personnel.find(
            (p: StaffMember) => p.roleId?.toLowerCase() === roleNameLower
          );
          if (globalMatch) {
            assignedMembers = [globalMatch];
          }
        }

        newStaffState[role.name] = [...assignedMembers].sort((a, b) =>
          compareRanks(a.rank, b.rank)
        );
      });

      setStaff(newStaffState);
      setActivities(DEFAULT_ACTIVITIES);
      setNotes(DEFAULT_NOTES);
      lastInitializedGuard.current = selectedGuard;
    }
  }, [initialData, roles, rolesLoaded, personnel, personnelLoaded, selectedGuard, isSettingsLoaded, settings.ordenDelDiaDraft]);

  // Debounced Auto-Save for Draft
  useEffect(() => {
    if (!rolesLoaded || !personnelLoaded || !isSettingsLoaded || !selectedGuard) return;
    
    // Avoid saving if state is still essentially the default/initial and matches existing draft
    if (lastInitializedGuard.current !== selectedGuard) return;

    const timer = setTimeout(() => {
      saveSettings({
        ordenDelDiaDraft: {
          staff,
          activities,
          notes,
          guardId: selectedGuard,
          updatedAt: new Date().toISOString()
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [staff, activities, notes, selectedGuard, isSettingsLoaded, rolesLoaded, personnelLoaded, saveSettings]);

  const handleRoleStaffUpdate = (roleName: string, members: StaffMember[]) => {
    setStaff((prev: Staff) => ({
      ...prev,
      [roleName]: members,
    }));
  };

  const handleAddActivity = () => {
    setActivities([...activities, { id: generateId('act'), content: '' }]);
  };

  const handleUpdateActivity = (id: string, value: string) => {
    setActivities(activities.map(a => a.id === id ? { ...a, content: value } : a));
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const handleAddNote = () => {
    setNotes([...notes, { id: generateId('note'), content: '' }]);
  };

  const handleUpdateNote = (id: string, value: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content: value } : n));
  };

  const handleRemoveNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleRestoreDefaults = () => {
    // Explicitly clear the draft so it's not re-loaded by the initialization effect
    saveSettings({
      ...settings,
      ordenDelDiaDraft: undefined
    });
    
    setActivities(DEFAULT_ACTIVITIES);
    setNotes(DEFAULT_NOTES);
    lastInitializedGuard.current = null; // Trigger re-init for staff if needed
    toast.success('Valores restaurados por defecto');
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

      const targetRole = roles.find((r: StaffRole) => r.name === overContainer);

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
      finalReportGuardId: selectedGuard,
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

    // Removed ACTIVIDADES / OBSERVACIONES header and textoExtra as requested

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
          personnelList.map(m => formatStaffMember(m, false, true)).join('\n')
        );
      }
    });

    const order = reportParts.join('\n').trim();

    // Secondary parts: Activities and Notes
    const secondaryParts: string[] = [];

    if (activities.length > 0) {
      secondaryParts.push(``, `*ACTIVIDADES DEL DÍA*`);
      activities.forEach(act => {
        if (act.content.trim()) {
          secondaryParts.push(``, `- ${act.content.trim()}`);
        }
      });
    }

    if (notes.length > 0) {
      secondaryParts.push(``, `*NOTA:*`);
      notes.forEach(note => {
        if (note.content.trim()) {
          secondaryParts.push(``, `*${note.content.trim()}*`);
        }
      });
    }

    // Combine all
    const finalReport = [
      order,
      ...secondaryParts,
      ``,
      `*PROTECCIÓN CIVIL GUANTA*`
    ].join('\n').trim();

    setGeneratedOrder(finalReport);
    setIsResultDialogOpen(true);
    setCopyButtonText('Copiar');
    setIsSnapshotSaved(false);
  };

  useImperativeHandle(ref, () => ({
    generateOrder: handleGenerateOrder,
  }));

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedOrder);
    setCopyButtonText('¡Copiado!');
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopyButtonText('Copiar'), 2000);
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-2">
          <Card className="shadow-sm flex flex-col h-[650px] 2xl:h-[750px] transition-all overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-base uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Distribución de Personal
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4 pt-0" type="always">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 gap-4">
                {roles
                  .filter((r: StaffRole) => !r.isHidden)
                  .map((role: StaffRole) => (
                    <StaffListEditor
                      key={role.name}
                      label={role.name}
                      staffMembers={staff[role.name] || []}
                      isSingle={role.isSingle}
                      onUpdate={(members) => handleRoleStaffUpdate(role.name, members)}
                      showObservations={true}
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
            </ScrollArea>
          </Card>

          {/* ACTIVIDADES DEL DÍA */}
          <Card className="shadow-sm flex flex-col h-[650px] 2xl:h-[750px] transition-all overflow-hidden">
            <CardHeader className="pb-3 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                      Actividades del Día
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] uppercase font-bold text-primary hover:text-primary hover:bg-primary/10"
                      onClick={handleRestoreDefaults}
                    >
                      Restaurar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] uppercase font-bold"
                      onClick={handleAddActivity}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Añadir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="pt-4 flex-1" type="always">
                <div className="space-y-3 px-4">
                  {activities.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg bg-muted/5">
                      No hay actividades registradas.
                    </p>
                  )}
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                      <Textarea
                        className="flex-1 min-h-[40px] text-xs font-mono py-2 bg-background resize-none scrollbar-none"
                        placeholder="Descripción de la actividad..."
                        value={activity.content}
                        rows={1}
                        onChange={(e) => {
                          handleUpdateActivity(activity.id, e.target.value);
                          // Auto-resize
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
          </Card>

          {/* NOTAS ADICIONALES */}
          <Card className="shadow-sm flex flex-col h-[650px] 2xl:h-[750px] transition-all overflow-hidden">
            <CardHeader className="pb-3 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                      Notas Adm.
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] uppercase font-bold"
                      onClick={handleAddNote}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Añadir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="pt-4 flex-1" type="always">
                <div className="space-y-3 px-4">
                  {notes.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg bg-muted/5">
                      No hay notas registradas.
                    </p>
                  )}
                  {notes.map((note) => (
                    <div key={note.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                      <Textarea
                        className="flex-1 min-h-[40px] text-xs font-mono py-2 bg-background resize-none scrollbar-none"
                        placeholder="Contenido de la nota..."
                        value={note.content}
                        rows={1}
                        onChange={(e) => {
                          handleUpdateNote(note.id, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
          </Card>
        </div>
      </div>
      
      {/* Resultado - Responsive */}
      {isMobile ? (
        <Sheet open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6">
            <SheetHeader className="text-left">
              <SheetTitle>Orden del Día Generada</SheetTitle>
              <SheetDescription>
                Revisa la orden generada. Puedes copiar el texto para usarlo donde necesites.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 min-h-0 mt-4 border rounded-md bg-muted/50 overflow-hidden">
              <ScrollArea className="h-full w-full" type="always">
                <div className="p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {generatedOrder}
                </div>
              </ScrollArea>
            </div>
            <SheetFooter className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleUseForFinalReport}
                disabled={isSnapshotSaved}
              >
                {isSnapshotSaved ? 'Guardado para Reporte Final' : 'Usar para Reporte Final'}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="w-full"
              >
                <Link to="/reporte-final">
                  Ir a Reporte Final
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button className="flex-1" type="button" onClick={handleCopyToClipboard}>
                  {copyButtonText === 'Copiar' ? (
                    <Copy className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckIcon className="mr-2 h-4 w-4" />
                  )}
                  {copyButtonText}
                </Button>
                <SheetClose asChild>
                  <Button type="button" variant="secondary">
                    Cerrar
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-3xl flex flex-col p-6">
            <DialogHeader className="pb-4">
              <DialogTitle>Orden del Día Generada</DialogTitle>
              <DialogDescription>
                Revisa la orden generada. Puedes copiar el texto para usarlo donde necesites o guardarlo para el reporte final.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 border rounded-md bg-muted/50 overflow-hidden">
              <ScrollArea className="h-full w-full" type="always">
                <div className="p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {generatedOrder}
                </div>
              </ScrollArea>
            </div>
            <DialogFooter className="mt-auto pt-6 flex-wrap gap-2">
              <div className="flex-1 flex gap-2 flex-wrap sm:flex-nowrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseForFinalReport}
                  disabled={isSnapshotSaved}
                  className="flex-1 sm:flex-none"
                >
                  {isSnapshotSaved ? 'Guardado' : 'Guardar Personal'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="flex-1 sm:flex-none"
                >
                  <Link to="/reporte-final">
                    Ir a Reporte Final
                  </Link>
                </Button>
              </div>
              <Button type="button" onClick={handleCopyToClipboard} className="w-full sm:w-auto gap-2">
                {copyButtonText === 'Copiar' ? (
                  <Copy className="h-4 w-4" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                {copyButtonText}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="w-full sm:w-auto">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});
