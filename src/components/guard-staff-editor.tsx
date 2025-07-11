
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Guard, Staff, StaffRole, Department, StaffMember } from '@/types';
import { PlusCircle, Trash2, UserPlus, CreditCard } from 'lucide-react';
import { CedulaInput } from './cedula-input';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditableStaffMember extends StaffMember {
  isEditingCedula?: boolean;
}

interface StaffListEditorProps {
  label: string;
  staffMembers: StaffMember[];
  isSingle: boolean;
  onUpdate: (newMembers: StaffMember[]) => void;
}

function StaffListEditor({ label, staffMembers, isSingle, onUpdate }: StaffListEditorProps) {
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberCedula, setNewMemberCedula] = useState('');
    const [showNewCedula, setShowNewCedula] = useState(false);

    const [editableMembers, setEditableMembers] = useState<EditableStaffMember[]>(staffMembers);

    useEffect(() => {
        setEditableMembers(staffMembers);
    }, [staffMembers]);
    
    const handleMemberUpdate = (memberId: string, updates: Partial<StaffMember>) => {
        const updatedMembers = editableMembers.map(m => m.id === memberId ? { ...m, ...updates } : m);
        onUpdate(updatedMembers);
    };

    const handleToggleCedula = (memberId: string) => {
        setEditableMembers(
            editableMembers.map(m => m.id === memberId ? { ...m, isEditingCedula: !m.isEditingCedula } : m)
        );
    };

    const canAdd = !isSingle || (isSingle && staffMembers.length === 0);

    const handleAdd = () => {
        if (newMemberName.trim() && canAdd) {
            const newMember: StaffMember = {
                id: `staff_${Date.now()}`,
                name: newMemberName.trim(),
                cedula: showNewCedula ? newMemberCedula.trim() : undefined,
            };
            const updatedMembers = isSingle ? [newMember] : [...staffMembers, newMember];
            onUpdate(updatedMembers);
            setNewMemberName('');
            setNewMemberCedula('');
            setShowNewCedula(false);
        }
    };

    const handleRemove = (memberId: string) => {
        onUpdate(staffMembers.filter(m => m.id !== memberId));
    };
    
    return (
        <TooltipProvider>
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="space-y-2 rounded-md border p-3 bg-background">
                    {canAdd && (
                        <div className="flex gap-2 items-start">
                            <div className="flex-1 space-y-1.5">
                                <Input 
                                    value={newMemberName} 
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    placeholder={`Añadir a ${label}...`}
                                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAdd();}}}
                                />
                                {showNewCedula && (
                                     <CedulaInput
                                        value={newMemberCedula}
                                        onChange={setNewMemberCedula}
                                        placeholder="Cédula (Opcional)"
                                    />
                                )}
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                     <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewCedula(!showNewCedula)} className={cn("shrink-0", showNewCedula && "bg-muted")}>
                                        <CreditCard className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Añadir Cédula</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" onClick={handleAdd} className="shrink-0">
                                        <UserPlus className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Añadir Personal</p></TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                    {editableMembers.length > 0 && (
                        <div className="space-y-1 pt-2 max-h-48 overflow-y-auto pr-1">
                            {editableMembers.map(member => (
                                <div key={member.id} className="flex items-start gap-2 rounded-md p-2 text-sm bg-muted/50">
                                    <div className="flex-1 space-y-1.5">
                                        <Input value={member.name} onChange={(e) => handleMemberUpdate(member.id, { name: e.target.value })} className="h-8"/>
                                        {(member.isEditingCedula || member.cedula) && (
                                            <CedulaInput 
                                                value={member.cedula || ''} 
                                                onChange={(cedula) => handleMemberUpdate(member.id, { cedula })}
                                                placeholder="Cédula (Opcional)"
                                            />
                                        )}
                                    </div>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleToggleCedula(member.id)} className={cn("h-8 w-8 shrink-0", (member.isEditingCedula || member.cedula) && "bg-muted")}>
                                                <CreditCard className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{(member.isEditingCedula || member.cedula) ? "Ocultar Cédula" : "Añadir Cédula"}</p></TooltipContent>
                                    </Tooltip>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => handleRemove(member.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Eliminar</p></TooltipContent>
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
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

  useEffect(() => {
    setStaff(guard.staff || {});
  }, [guard.staff]);

  const handleSave = () => {
    onUpdate({ ...guard, staff });
    onSave();
  };

  const handleListUpdate = (roleName: string, newMembers: StaffMember[]) => {
      setStaff(prev => ({
          ...prev,
          [roleName]: newMembers,
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
            staffMembers={staff[role.name] || []}
            isSingle={role.isSingle}
            onUpdate={(members) => handleListUpdate(role.name, members)}
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
