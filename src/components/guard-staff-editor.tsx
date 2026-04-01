'use client';

import { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Guard, Staff, StaffRole, Department, StaffMember } from '@/types';
import { Trash2, Search, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonnel } from '@/hooks/use-personnel';
import { usePersonnelHistory } from '@/hooks/use-personnel-history';

import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface StaffListEditorProps {
  label: string;
  staffMembers: StaffMember[];
  isSingle: boolean;
  onUpdate: (newMembers: StaffMember[]) => void;
  showObservations?: boolean;
}

function SortableStaffItem({
  member,
  onRemove,
  onUpdateMember, // New prop
}: {
  member: StaffMember;
  onRemove: (id: string) => void;
  onUpdateMember?: (updated: StaffMember) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      {...{
        ref: setNodeRef,
        style,
        className: cn(
          'flex flex-col p-3 pl-4 hover:bg-muted/20 transition-colors group bg-card border-b last:border-0',
          isDragging && 'opacity-50 border-primary/50 bg-muted/30 z-[100]'
        ),
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Drag, Name/Cedula and Observation (on desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-[200px] shrink-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab p-1.5 text-muted-foreground hover:text-foreground shrink-0 touch-none active:cursor-grabbing rounded hover:bg-muted transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-foreground/90 truncate">{member.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground/70 tracking-tighter uppercase">
                {member.cedula || 'SIN CÉDULA'}
              </p>
            </div>
          </div>

          {/* Observation Input - Inline on desktop, below on mobile */}
          {onUpdateMember && (
            <div className="flex-1 w-full sm:max-w-md pl-7 sm:pl-0">
              <Input
                placeholder="Observación (ej. Comisión...)"
                value={member.observation || ''}
                onChange={(e) => onUpdateMember({ ...member, observation: e.target.value })}
                className="h-8 sm:h-7 text-[11px] bg-background/50 border-dashed focus-visible:ring-1 focus-visible:ring-primary/30 w-full"
              />
            </div>
          )}
        </div>

        {/* Right Side: Delete Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all rounded-lg"
          onClick={() => onRemove(member.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function StaffListEditor({ 
  label, 
  staffMembers, 
  isSingle, 
  onUpdate,
  showObservations 
}: StaffListEditorProps) {
  const { setNodeRef } = useDroppable({
    id: label,
  });
  const { personnel } = usePersonnel();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Internal ref to manage focus and click-outside logic safely
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (p: StaffMember) => {
    if (isSingle) {
      onUpdate([p]);
    } else {
      // Multi-select logic
      if (!staffMembers.some((m) => m.id === p.id || m.personnelId === p.id)) {
        onUpdate([...staffMembers, { ...p, personnelId: p.id }]);
      }
    }
    setOpen(false);
    setSearchQuery('');
  };

  const handleRemove = (memberId: string) => {
    onUpdate(staffMembers.filter((m) => m.id !== memberId));
  };

  const handleUpdateMember = (updated: StaffMember) => {
    onUpdate(staffMembers.map((m) => (m.id === updated.id ? updated : m)));
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
                <div className="relative group/input">
                  <Input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!open) setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!open) setOpen(true);
                    }}
                    placeholder={`Añadir ${label}...`}
                    className="h-9 px-3 bg-muted/20 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 rounded-none transition-all placeholder:text-muted-foreground/40 placeholder:font-medium"
                  />
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="p-0 border-none shadow-xl rounded-md w-[calc(100vw-2rem)] sm:w-80"
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
                  <ScrollArea
                    className="max-h-[380px] p-1"
                    type="always"
                  >
                    {/* Custom Text Option when searching */}
                    {searchQuery.trim() && (
                      <div className="p-1 border-b bg-primary/5">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs h-auto py-2 px-3 rounded-md hover:bg-primary/10 text-primary font-bold"
                          onClick={() => {
                            const customName = searchQuery.trim();
                            const pseudoMember: StaffMember = {
                              id: `custom-${Date.now()}-${customName.replace(/\s+/g, '-').toLowerCase()}`,
                              workspaceId: '',
                              name: customName,
                            };
                            handleAdd(pseudoMember);
                          }}
                        >
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span>Usar "{searchQuery}" como texto libre</span>
                            <span className="text-[10px] opacity-60 font-medium">Añadir sin registro en base de datos</span>
                          </div>
                        </Button>
                      </div>
                    )}

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
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div
          ref={setNodeRef}
          className={cn(
            'divide-y divide-muted/50 min-h-[40px]',
            staffMembers.length === 0 && canAdd && 'hidden'
          )}
        >
          {staffMembers.length > 0 ? (
            <SortableContext
              id={label}
              items={staffMembers.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-muted/50">
                {staffMembers.map((member) => (
                  <SortableStaffItem 
                    key={member.id} 
                    member={member} 
                    onRemove={handleRemove} 
                    onUpdateMember={showObservations ? handleUpdateMember : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            !canAdd && (
              <div className="p-4 text-center text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest italic">
                Cargo No Asignado
              </div>
            )
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
}

export const GuardStaffEditor = forwardRef<any, GuardStaffEditorProps>(({
  guard,
  roles,
  onUpdate,
  onSave,
}, ref) => {
  const [staff, setStaff] = useState<Staff>(guard.staff || {});
  const { recordAssignments } = usePersonnelHistory();
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

  useEffect(() => {
    setStaff(guard.staff || {});
  }, [guard.staff]);

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
        handleListUpdate(activeContainer, arrayMove(containerMembers, oldIndex, newIndex));
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
    return roles.filter((role) => !role.isHidden);
  }, [roles]);

  useImperativeHandle(ref, () => ({
    save: handleSave
  }));

  return (
    <div className="space-y-4 p-1 relative">
      {/* Save Button - Mobile FAB ONLY (Desktop uses Header button) */}
      <div className={cn(
        "z-50 transition-all duration-300 md:hidden",
        // Mobile: Floating Action Button (Raised to avoid BottomNav)
        "fixed bottom-24 right-6 flex items-center justify-center translate-y-0"
      )}>
        <Button 
          onClick={handleSave} 
          className={cn(
            "shadow-lg gap-2 font-bold",
            // Mobile Square with rounded edges
            "rounded-xl w-14 h-14 p-0 shadow-lg shadow-primary/20",
            "active:scale-95 bg-primary text-primary-foreground"
          )}
        >
          <Save className="h-6 w-6" />
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
                    {activeMember?.name}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground/70 tracking-tighter uppercase">
                    {activeMember?.cedula || 'SIN CÉDULA'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
});

GuardStaffEditor.displayName = 'GuardStaffEditor';
