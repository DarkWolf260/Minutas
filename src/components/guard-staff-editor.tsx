'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Guard, Staff, StaffRole, Department, StaffMember } from '@/types';
import { Trash2, Search, Check, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonnel } from '@/hooks/use-personnel';
import { usePersonnelHistory } from '@/hooks/use-personnel-history';
import { LEADER_ROLES } from '@/constants/roles';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';

interface StaffListEditorProps {
  label: string;
  staffMembers: StaffMember[];
  isSingle: boolean;
  onUpdate: (newMembers: StaffMember[]) => void;
}

export function StaffListEditor({ label, staffMembers, isSingle, onUpdate }: StaffListEditorProps) {
  const { personnel } = usePersonnel();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Internal ref to manage focus and click-outside logic safely
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (p: StaffMember) => {
    if (isSingle) {
      onUpdate([p]);
      setOpen(false);
      setSearchQuery('');
    } else {
      // Multi-select logic
      if (!staffMembers.some((m) => m.id === p.id || m.personnelId === p.id)) {
        onUpdate([...staffMembers, { ...p, personnelId: p.id }]);
      }
      // Keep open and focused
      inputRef.current?.focus();
      setSearchQuery('');
    }
  };

  const handleRemove = (memberId: string) => {
    onUpdate(staffMembers.filter((m) => m.id !== memberId));
  };

  // Filter logic
  const filteredPersonnel = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const activePersonnel = personnel.filter((p) => p.status === 'activo' || !p.status);

    if (!query) return activePersonnel.slice(0, 50); // Show up to 50 without search
    return activePersonnel.filter(
      (p) => p.name.toLowerCase().includes(query) || (p.cedula && p.cedula.includes(query))
    ); // Show all results when searching
  }, [personnel, searchQuery]);

  const canAdd = !isSingle || (isSingle && staffMembers.length === 0);

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
        {label}
      </Label>
      <div className="rounded-md border bg-card shadow-sm overflow-hidden" ref={containerRef}>
        {canAdd && (
          <div className="p-1 border-b bg-muted/30">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverAnchor asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                  <Input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!open) setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    // Using onPointerDown/onClick to ensure open state but preventing
                    // the popover's outside-click logic from conflicting
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!open) setOpen(true);
                    }}
                    placeholder={`Seleccionar para ${label}...`}
                    className="h-9 pl-9 bg-background border-none shadow-none focus-visible:ring-0 rounded-lg"
                  />
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="p-0 border-none shadow-xl rounded-md w-80"
                align="start"
                sideOffset={5}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  // Properly handle interactions with the container or input
                  if (containerRef.current?.contains(e.target as Node)) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="bg-popover border rounded-md overflow-hidden">
                  {/* Fixed header outside scroll */}
                  <div className="px-2 py-2 text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest bg-muted/30 border-b">
                    Personal Disponible
                  </div>
                  {/* Scrollable content */}
                  <div
                    className="max-h-[380px] overflow-y-auto p-1"
                    style={{ scrollbarWidth: 'thin' }}
                    onWheel={(e) => {
                      // Prevent popover from blocking wheel events
                      e.stopPropagation();
                    }}
                  >
                    {filteredPersonnel.length > 0 ? (
                      <div className="space-y-0.5">
                        {filteredPersonnel.map((p) => {
                          const isSelected = staffMembers.some(
                            (m) => m.id === p.id || m.personnelId === p.id
                          );
                          return (
                            <Button
                              key={p.id}
                              variant="ghost"
                              disabled={isSelected}
                              className={cn(
                                'w-full justify-start text-left text-xs h-auto py-2 px-3 rounded-md transition-all',
                                isSelected ? 'opacity-50' : 'hover:bg-primary/5 hover:text-primary'
                              )}
                              onClick={() => handleAdd(p)}
                            >
                              <div className="flex flex-col items-start min-w-0 flex-1">
                                <span className="font-bold w-full">{p.name}</span>
                                <span className="text-[10px] opacity-60 font-mono tracking-tighter">
                                  {p.cedula || 'SIN CÉDULA'}
                                </span>
                              </div>
                              {isSelected && <Check className="h-3 w-3 ml-2 opacity-50" />}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">
                          No se encontraron resultados.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div
          className={cn(
            'divide-y divide-muted/50 max-h-48 overflow-y-auto',
            staffMembers.length === 0 && canAdd && 'hidden'
          )}
        >
          {staffMembers.length > 0
            ? staffMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 pl-4 hover:bg-muted/20 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground/90 truncate">{member.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/70 tracking-tighter uppercase">
                    {member.cedula || 'SIN CÉDULA'}
                  </p>
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
            : !canAdd && (
              <div className="p-4 text-center text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest italic">
                Cargo No Asignado
              </div>
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

export function GuardStaffEditor({
  guard,
  roles,
  onUpdate,
  onSave,
  scopeId,
}: GuardStaffEditorProps) {
  const [staff, setStaff] = useState<Staff>(guard.staff || {});
  const { recordAssignments } = usePersonnelHistory();

  useEffect(() => {
    setStaff(guard.staff || {});
  }, [guard.staff]);

  const handleSave = async () => {
    onUpdate({ ...guard, staff });
    // Record history for the current date
    const today = format(new Date(), 'yyyy-MM-dd');
    await recordAssignments(guard.id, staff, today);
    onSave();
  };

  const handleListUpdate = (roleName: string, newMembers: StaffMember[]) => {
    setStaff((prev) => ({
      ...prev,
      [roleName]: newMembers,
    }));
  };

  const availableRoles = useMemo(() => {
    return roles.filter((role) => {
      // Explicit exclusions requested by user
      if (role.name === LEADER_ROLES.DIRECTOR || role.name === LEADER_ROLES.JEFE_OPERACIONES)
        return false;

      // Explicit inclusions requested by user
      if (role.name === 'Analista de CEMUPRAD') return true;

      // Default scope logic
      return (
        !role.departmentScope ||
        role.departmentScope.length === 0 ||
        role.departmentScope.includes(scopeId)
      );
    });
  }, [roles, scopeId]);

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-4">
        {availableRoles.map((role) => (
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
            No hay cargos definidos para este departamento. Puedes definirlos en "Gestión de
            Personal".
          </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave}>Guardar Personal</Button>
      </div>
    </div>
  );
}
