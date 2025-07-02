
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
import type { Staff } from '@/types';
import { useRoles } from '@/hooks/use-roles';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';

interface OrdenDelDiaFormProps {
    selectedGuard: string;
    initialData: Staff | undefined;
}

export function OrdenDelDiaForm({ selectedGuard, initialData }: OrdenDelDiaFormProps) {
  const { definitions } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const [periodo, setPeriodo] = useState('');
  const [staff, setStaff] = useState<Staff>({});

  const [generatedOrder, setGeneratedOrder] = useState('');
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copiar');

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
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    setPeriodo(`${formatDate(today)} AL ${formatDate(tomorrow)}`);
  }, []);

  useEffect(() => {
    if (initialData && rolesLoaded) {
      const newStaffState: Staff = {};
      roles.forEach(role => {
        newStaffState[role.name] = initialData[role.name] || [];
      });
      setStaff(newStaffState);
    } else if (rolesLoaded) {
      const newStaffState: Staff = {};
      roles.forEach(role => {
        newStaffState[role.name] = [];
      });
      setStaff(newStaffState);
    }
  }, [initialData, roles, rolesLoaded]);

  const handleStaffChange = (roleName: string, value: string) => {
    const roleConfig = roles.find(r => r.name === roleName);
    const personnel = roleConfig?.isSingle ? [value] : value.split('\n').filter(Boolean);
    
    setStaff(prev => ({
        ...prev,
        [roleName]: personnel
    }));
  };

  const handleGenerateOrder = () => {
    const reportParts = [
      `*ORDEN DEL DÍA DEL INSTITUTO AUTONOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES DEL MUNICIPIO ${(globalSettings['Municipio'] || '').toUpperCase()} ESTADO ${(globalSettings['Estado'] || '').toUpperCase()}*`,
      ``,
      `*DIRECTOR*`,
      (globalSettings['Director'] || '').toUpperCase(),
      ``,
      `*JEFE DE OPERACIONES*`,
      (globalSettings['Jefe de Operaciones'] || '').toUpperCase(),
      ``,
      `*GRUPO DE GUARDIA:* “${selectedGuard}”`,
      ``,
      `*PERIODO:* ${periodo}`,
    ];

    Object.entries(staff).forEach(([role, personnel]) => {
      if (personnel && personnel.length > 0 && personnel.some(p => p.trim() !== '')) {
        reportParts.push(``, `*${role.toUpperCase()}*`, personnel.join('\n'));
      }
    });
    
    const order = reportParts.join('\n').trim();

    setGeneratedOrder(order);
    setIsResultDialogOpen(true);
    setCopyButtonText('Copiar');
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
                <Label>Grupo de Guardia</Label>
                <Input readOnly value={`“${selectedGuard}”`} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="periodo">Periodo</Label>
                <Input id="periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}/>
            </div>
        </div>
        {roles.map(role => (
          <div className="space-y-2" key={role.name}>
            <Label>{role.name}</Label>
            {role.isSingle ? (
              <Input 
                value={(staff[role.name] || [])[0] || ''} 
                onChange={(e) => handleStaffChange(role.name, e.target.value)} 
              />
            ) : (
              <Textarea 
                rows={2} 
                value={(staff[role.name] || []).join('\n')} 
                onChange={(e) => handleStaffChange(role.name, e.target.value)} 
              />
            )}
          </div>
        ))}
      </div>
       <div className="flex justify-end pt-6">
        <Button onClick={handleGenerateOrder}>Generar Orden del Día</Button>
      </div>

      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Orden del Día Generada</DialogTitle>
            <DialogDescription>
              Puedes copiar el texto generado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              readOnly
              value={generatedOrder}
              className="h-80 text-sm whitespace-pre-wrap font-mono"
            />
          </div>
          <DialogFooter>
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
