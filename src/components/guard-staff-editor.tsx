
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Guard, Staff, StaffRole, Department, StaffMember } from '@/types';
import { Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonnel } from '@/hooks/use-personnel';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface StaffListEditorProps {
    label: string;
    staffMembers: StaffMember[];
    isSingle: boolean;
    onUpdate: (newMembers: StaffMember[]) => void;
}

export function StaffListEditor({ label, staffMembers, isSingle, onUpdate }: StaffListEditorProps) {
    const { personnel } = usePersonnel();
    const [searchQuery, setSearchQuery] = useState('');
    const [openPersonnel, setOpenPersonnel] = useState(false);

    const handleAdd = (p: StaffMember) => {
        if (isSingle) {
            onUpdate([p]);
        } else {
            // Check if already added
            if (!staffMembers.some(m => m.id === p.id || m.personnelId === p.id)) {
                onUpdate([...staffMembers, { ...p, personnelId: p.id }]);
            }
        }
        setSearchQuery('');
        setOpenPersonnel(false);
    };

    const handleRemove = (memberId: string) => {
        onUpdate(staffMembers.filter(m => m.id !== memberId));
    };

    const filteredPersonnel = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const activePersonnel = personnel.filter(p => p.status === 'activo' || !p.status);

        if (!query) return activePersonnel.slice(0, 5);
        return activePersonnel.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.cedula && p.cedula.includes(query))
        ).slice(0, 10);
    }, [personnel, searchQuery]);

    const canAdd = !isSingle || (isSingle && staffMembers.length === 0);

    return (
        <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{label}</Label>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {canAdd && (
                    <div className="p-2 border-b bg-muted/30">
                        <Popover open={openPersonnel} onOpenChange={setOpenPersonnel}>
                            <PopoverTrigger asChild>
                                <div className="relative group">
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            if (!openPersonnel) setOpenPersonnel(true);
                                        }}
                                        placeholder={`Seleccionar para ${label}...`}
                                        className="h-9 pl-9 bg-background border-none shadow-none focus-visible:ring-0 transition-all rounded-lg"
                                        onFocus={() => setOpenPersonnel(true)}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 shadow-2xl border-none rounded-xl" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {filteredPersonnel.length > 0 ? (
                                        <div className="space-y-1">
                                            <p className="px-2 py-1.5 text-[10px] uppercase font-bold text-primary/70 tracking-widest">Personal Disponible</p>
                                            {filteredPersonnel.map(p => (
                                                <Button
                                                    key={p.id}
                                                    variant="ghost"
                                                    className="w-full justify-start text-xs h-11 px-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-all"
                                                    onClick={() => handleAdd(p)}
                                                >
                                                    <div className="flex flex-col items-start min-w-0">
                                                        <span className="font-bold truncate w-full">{p.name}</span>
                                                        <span className="text-[10px] opacity-60 font-mono tracking-tighter">{p.cedula || 'SIN CÉDULA'}</span>
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center">
                                            <p className="text-xs text-muted-foreground font-medium">No se encontró personal activo con ese nombre o cédula.</p>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}

                <div className={cn("divide-y divide-muted/50 max-h-48 overflow-y-auto", staffMembers.length === 0 && canAdd && "hidden")}>
                    {staffMembers.length > 0 ? (
                        staffMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 pl-4 hover:bg-muted/20 transition-colors group">
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-foreground/90 truncate">{member.name}</p>
                                    <p className="text-[10px] font-mono text-muted-foreground/70 tracking-tighter uppercase">{member.cedula || 'SIN CÉDULA'}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                    onClick={() => handleRemove(member.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        !canAdd && <div className="p-4 text-center text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest italic">Cargo No Asignado</div>
                    )}
                </div>
            </div>
        </div>
    );
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
