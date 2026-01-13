
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

import { usePersonnel } from '@/hooks/use-personnel';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Search } from 'lucide-react';

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
    const { personnel } = usePersonnel();
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberCedula, setNewMemberCedula] = useState('');
    const [showNewCedula, setShowNewCedula] = useState(false);
    const [openPersonnel, setOpenPersonnel] = useState(false);

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

    const handleAdd = (memberData?: { id?: string, name: string, cedula?: string }) => {
        const name = memberData?.name || newMemberName;
        const cedula = memberData?.cedula || newMemberCedula;

        if (name.trim() && canAdd) {
            const newMember: StaffMember = {
                id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                personnelId: memberData?.id, // Save the link if it comes from suggestions
                name: name.trim(),
                cedula: (memberData?.cedula || showNewCedula) ? cedula.trim() : undefined,
            };
            const updatedMembers = isSingle ? [newMember] : [...staffMembers, newMember];
            onUpdate(updatedMembers);
            setNewMemberName('');
            setNewMemberCedula('');
            setShowNewCedula(false);
            setOpenPersonnel(false);
        }
    };

    const handleRemove = (memberId: string) => {
        onUpdate(staffMembers.filter(m => m.id !== memberId));
    };

    const filteredPersonnel = useMemo(() => {
        const query = newMemberName.toLowerCase().trim();
        const activePersonnel = personnel.filter(p => p.status === 'activo' || !p.status);

        if (!query) return activePersonnel.slice(0, 5);
        return activePersonnel.filter(p => p.name.toLowerCase().includes(query)).slice(0, 10);
    }, [personnel, newMemberName]);

    return (
        <TooltipProvider>
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="space-y-2 rounded-md border p-3 bg-background">
                    {canAdd && (
                        <div className="flex gap-2 items-start">
                            <div className="flex-1 space-y-1.5 relative">
                                <Popover open={openPersonnel} onOpenChange={setOpenPersonnel}>
                                    <PopoverTrigger asChild>
                                        <div className="relative">
                                            <Input
                                                value={newMemberName}
                                                onChange={(e) => {
                                                    setNewMemberName(e.target.value);
                                                    if (!openPersonnel) setOpenPersonnel(true);
                                                }}
                                                placeholder={`Añadir a ${label}...`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAdd();
                                                    }
                                                }}
                                                onFocus={() => setOpenPersonnel(true)}
                                            />
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredPersonnel.length > 0 ? (
                                                <div className="space-y-1">
                                                    <p className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground">Personal Sugerido</p>
                                                    {filteredPersonnel.map(p => (
                                                        <Button
                                                            key={p.id}
                                                            variant="ghost"
                                                            className="w-full justify-start text-xs h-9 px-2"
                                                            onClick={() => handleAdd({ id: p.id, name: p.name, cedula: p.cedula })}
                                                        >
                                                            <div className="flex flex-col items-start">
                                                                <span className="font-medium">{p.name}</span>
                                                                {p.cedula && <span className="text-[10px] opacity-60">{p.cedula}</span>}
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="p-2 text-center text-xs text-muted-foreground">No hay coincidencias en el personal global.</p>
                                            )}
                                            {newMemberName && (
                                                <div className="border-t mt-1 pt-1">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start text-xs h-8 px-2 text-primary"
                                                        onClick={() => handleAdd()}
                                                    >
                                                        Añadir "{newMemberName}" temporalmente
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
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
                                        <CreditCard className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Añadir Cédula</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleAdd()} className="shrink-0">
                                        <UserPlus className="h-4 w-4" />
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
                                        <Input value={member.name} onChange={(e) => handleMemberUpdate(member.id, { name: e.target.value })} className="h-8" />
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
