
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Guard, Staff, StaffRole, Department } from '@/types';
import { PlusCircle, Trash2 } from 'lucide-react';

interface StaffListEditorProps {
  label: string;
  staffNames: string[];
  isSingle: boolean;
  onUpdate: (newNames: string[]) => void;
}

function StaffListEditor({ label, staffNames, isSingle, onUpdate }: StaffListEditorProps) {
    const [newName, setNewName] = useState('');

    const canAdd = !isSingle || (isSingle && staffNames.length === 0);

    const handleAdd = () => {
        if (newName.trim() && canAdd) {
            const updatedNames = isSingle ? [newName.trim()] : [...staffNames, newName.trim()];
            onUpdate(updatedNames);
            setNewName('');
        }
    };

    const handleRemove = (nameToRemove: string) => {
        onUpdate(staffNames.filter(name => name !== nameToRemove));
    };
    
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="space-y-2 rounded-md border p-3 bg-background">
                 {canAdd && (
                    <div className="flex gap-2">
                        <Input 
                            value={newName} 
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={`Añadir a ${label}...`}
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAdd();}}}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={handleAdd} className="shrink-0">
                            <PlusCircle className="h-4 w-4"/>
                        </Button>
                    </div>
                 )}
                {staffNames.length > 0 && (
                    <div className="space-y-1 pt-2 max-h-32 overflow-y-auto">
                        {staffNames.map(name => (
                            <div key={name} className="flex items-center justify-between rounded-md p-2 text-sm bg-muted/50">
                                <span>{name}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(name)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

interface GuardStaffEditorProps {
  guard: Guard | Department;
  roles: StaffRole[];
  onUpdate: (updatedGuard: Guard | Department) => void;
  onSave: () => void;
  scopeId: string;
}

export function GuardStaffEditor({ guard, roles, onUpdate, onSave, scopeId }: GuardStaffEditorProps) {
  const [staff, setStaff] = useState<Staff>(guard.staff || {});

  const handleSave = () => {
    onUpdate({ ...guard, staff });
    onSave();
  };

  const handleListUpdate = (roleName: string, newNames: string[]) => {
      setStaff(prev => ({
          ...prev,
          [roleName]: newNames,
      }));
  };

  const availableRoles = useMemo(() => {
    return roles.filter(role => 
        !role.departmentScope || role.departmentScope.length === 0 || role.departmentScope.includes(scopeId)
    );
  }, [roles, scopeId]);

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-4">
        {availableRoles.map(role => (
          <StaffListEditor 
            key={role.name}
            label={role.name}
            staffNames={staff[role.name] || []}
            isSingle={role.isSingle}
            onUpdate={(names) => handleListUpdate(role.name, names)}
          />
        ))}
        {availableRoles.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
                No hay cargos definidos para este departamento. Puedes definirlos en "Gestión de Personal".
            </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave}>Guardar Personal</Button>
      </div>
    </div>
  );
}
