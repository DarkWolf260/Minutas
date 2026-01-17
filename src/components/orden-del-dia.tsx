
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import type { Staff, StaffMember } from '@/types';
import { useRoles } from '@/hooks/use-roles';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useSettings } from '@/hooks/use-settings';
import { StaffListEditor } from './guard-staff-editor';

interface OrdenDelDiaFormProps {
  selectedGuard: string;
  initialData: Staff | undefined;
}

const formatStaffMember = (member: StaffMember): string => {
  const rank = member.rank ? `${member.rank} ` : '';
  return `${rank}${member.name}`;
}

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

  const globalSettings = useMemo(() => {
    const settings: Record<string, string> = {};
    Object.entries(definitions).forEach(([key, config]) => {
      if (config.type === 'predefined') {
        settings[key] = config.value || '';
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
    if (initialData && rolesLoaded && personnelLoaded) {
      const newStaffState: Staff = {};
      roles.forEach(role => {
        const roleNameLower = role.name.toLowerCase();
        let assignedMembers = initialData[role.name] || [];

        // Override Director/Chief assignments from Global Personnel
        if (roleNameLower === 'director' || roleNameLower === 'jefe de operaciones' || roleNameLower === 'jefe de departamento') {
          // Match personnel by roleId (assuming roleId stores role Name)
          const globalMatch = personnel.find(p => p.roleId === role.name || p.roleId === roleNameLower);
          if (globalMatch) {
            // Create a fresh staff member entry based on global personnel
            assignedMembers = [globalMatch];
          }
        }
        newStaffState[role.name] = assignedMembers;
      });
      setStaff(newStaffState);
    } else if (rolesLoaded) {
      const newStaffState: Staff = {};
      roles.forEach(role => {
        newStaffState[role.name] = [];
      });
      setStaff(newStaffState);
    }
  }, [initialData, roles, rolesLoaded, personnel, personnelLoaded]);

  const handleRoleStaffUpdate = (roleName: string, members: StaffMember[]) => {
    setStaff(prev => ({
      ...prev,
      [roleName]: members
    }));
  };

  const handleUseForFinalReport = () => {
    let startDate, endDate;
    const parts = periodo.split(' AL ');
    if (parts.length === 2) {
      const [startStr, endStr] = parts;
      const startParts = startStr.split('/');
      const endParts = endStr.split('/');
      if (startParts.length === 3 && endParts.length === 3) {
        // DD/MM/YYYY -> YYYY-MM-DD for Date constructor
        startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}T00:00:00`);
        endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}T00:00:00`);
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
      const foundKey = Object.keys(obj).find(k => k.toLowerCase() === keyLower);
      return foundKey ? obj[foundKey] : '';
    };

    const jefeDeOperaciones = (() => {
      const key = Object.keys(staff).find(k => k.toLowerCase() === 'jefe de operaciones');
      if (key && staff[key] && staff[key].length > 0) {
        return formatStaffMember(staff[key][0]).trim();
      }
      return '';
    })();

    const director = (() => {
      const key = Object.keys(staff).find(k => k.toLowerCase() === 'director');
      if (key && staff[key] && staff[key].length > 0) {
        return formatStaffMember(staff[key][0]).trim();
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

    Object.entries(staff).forEach(([role, personnel]) => {
      // Skip Director and Jefe de Operaciones as they are in the header
      if (role.toLowerCase() === 'director' || role.toLowerCase() === 'jefe de operaciones') return;

      if (personnel && personnel.length > 0 && personnel.some(p => p.name.trim() !== '')) {
        reportParts.push(``, `*${role.toUpperCase()}*`, personnel.map(formatStaffMember).join('\n'));
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
            <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Grupo de Guardia</Label>
            <Input readOnly value={`“${selectedGuard}”`} className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodo" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Periodo</Label>
            <Input id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="bg-background" />
          </div>
        </div>

        <div className="space-y-4">
          {roles.filter(r => !r.isHidden).map(role => (
            <StaffListEditor
              key={role.name}
              label={role.name}
              staffMembers={staff[role.name] || []}
              isSingle={role.isSingle}
              onUpdate={(members) => handleRoleStaffUpdate(role.name, members)}
            />
          ))}
        </div>
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
            <Button type="button" variant="outline" onClick={handleUseForFinalReport} disabled={isSnapshotSaved}>
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
