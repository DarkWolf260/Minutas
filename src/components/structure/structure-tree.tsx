'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Building2,
  User,
  Plus,
  Trash2,
  ChevronRight,
  PlusCircle,
  Briefcase,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Department, StaffRole, StaffMember } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';

interface StructureTreeProps {
  departments: Department[];
  roles: StaffRole[];
  onAddDept: (name: string) => void;
  onRemoveDept: (id: string) => void;
  onAddRole: (name: string, deptId?: string) => void;
  onRemoveRole: (name: string) => void;
  onUpdateRole: (name: string, updates: Partial<StaffRole>) => void;
  onReorderDepts: (departments: Department[]) => void;
  onReorderRoles: (roles: StaffRole[]) => void;
  onUpdatePersonnel: (personnel: StaffMember[]) => void;
  personnel?: StaffMember[];
  showPersonnel?: boolean;
  compact?: boolean;
}

/**
 * A helper component that renders a Sheet on mobile and a Dialog on desktop
 */
const ResponsiveModal = ({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t-2 border-primary/20 p-6 pb-12 focus-visible:outline-none">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
            <SheetDescription className="text-sm">{description}</SheetDescription>
          </SheetHeader>
          <div className="py-2">
            {children}
          </div>
          <SheetFooter className="mt-8 flex flex-col gap-3">
            {footer}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        <DialogFooter>
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SortableMemberBadge = React.memo(({ member }: { member: StaffMember }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `member-${member.id}` });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 60 : undefined,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }} {...attributes} {...listeners} onContextMenu={(e) => e.preventDefault()} className={cn("cursor-grab active:cursor-grabbing touch-none select-none", isDragging && "opacity-50")}>
      <Badge variant="secondary" className="text-[10px] py-1 px-2 flex items-center gap-1.5 bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 transition-colors">
        <GripVertical className="h-3 w-3 opacity-30" />
        {member.name}
      </Badge>
    </div>
  );
});

const RoleRow = React.memo(({
  role,
  members = [],
  showPersonnel = false,
  onRemove,
  onUpdate
}: {
  role: StaffRole;
  members?: StaffMember[];
  showPersonnel?: boolean;
  onRemove: (name: string) => void;
  onUpdate: (name: string, updates: Partial<StaffRole>) => void;
}) => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col hover:bg-muted/5 transition-colors group select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      <div className="flex items-center justify-between py-1 px-1 sm:px-4">
        <div className="flex items-center min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate" title={role.name}>
              {role.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <div className="flex items-center gap-1 mr-1">
            <Label htmlFor={`single-${role.name}`} className="text-[10px] uppercase font-bold text-muted-foreground/60 hidden sm:block">Único</Label>
            <Switch
              id={`single-${role.name}`}
              checked={role.isSingle}
              onCheckedChange={(checked) => onUpdate(role.name, { isSingle: checked })}
              className="scale-75 sm:scale-90"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(role.name)}
            className="h-7 w-7 flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showPersonnel && !isMobile && (
        <div className="px-14 pb-2">
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <Badge key={m.id} variant="secondary" className="text-[10px] py-1 px-2 bg-primary/5 text-primary border-primary/10">
                {m.name}
              </Badge>
            ))}
            {members.length === 0 && null}
          </div>
        </div>
      )}
    </div>
  );
});

const SortableRoleRow = React.memo(({
  role,
  members = [],
  showPersonnel = false,
  onRemove,
  onUpdate
}: {
  role: StaffRole;
  members?: StaffMember[];
  showPersonnel?: boolean;
  onRemove: (name: string) => void;
  onUpdate: (name: string, updates: Partial<StaffRole>) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `role-item-${role.name}` });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const isMobile = useIsMobile();

  return (
    <div ref={setNodeRef} style={{ ...style, userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }} className={cn("flex flex-col hover:bg-muted/10 transition-colors group select-none", isDragging && "bg-muted/30 z-50")}>
      <div className="flex items-center justify-between p-1 px-1 sm:px-4">
        <div className="flex items-center gap-1.5 min-w-0">
          <button 
            {...attributes} 
            {...listeners} 
            onContextMenu={(e) => e.preventDefault()}
            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary shrink-0 -ml-1 touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex items-center min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate" title={role.name}>
                {role.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <div className="flex items-center gap-1 mr-1">
            <Label htmlFor={`single-sort-${role.name}`} className="text-[10px] uppercase font-bold text-muted-foreground/60 hidden sm:block">Único</Label>
            <Switch
              id={`single-sort-${role.name}`}
              checked={role.isSingle}
              onCheckedChange={(checked) => onUpdate(role.name, { isSingle: checked })}
              className="scale-75 sm:scale-90"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(role.name)}
            className="h-7 w-7 flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showPersonnel && !isMobile && (
        <div className="px-14 pb-2">
          <SortableContext
            items={members.map(m => `member-${m.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <SortableMemberBadge key={m.id} member={m} />
              ))}
              {members.length === 0 && null}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  );
});

const SortableDeptItem = React.memo(({
  dept,
  showPersonnel,
  onAddRole,
  onRemoveDept,
  onRemoveRole,
  onUpdateRole
}: {
  dept: any;
  showPersonnel: boolean;
  onAddRole: (e: any) => void;
  onRemoveDept: (e: any) => void;
  onRemoveRole: (name: string) => void;
  onUpdateRole: (name: string, updates: Partial<StaffRole>) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `dept-${dept.id}` });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-50 opacity-50")}>
      <AccordionItem
        value={dept.id}
        className="rounded-lg border border-muted/30 bg-card shadow-sm overflow-hidden border-b-0 group select-none"
      >
        <div className="flex items-center w-full min-w-0">
          <button 
            {...attributes} 
            {...listeners} 
            onContextMenu={(e) => e.preventDefault()}
            className="px-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <AccordionTrigger className="flex-1 hover:no-underline p-1 py-1 bg-muted/5 data-[state=open]:bg-muted/10 [&>svg]:hidden group min-w-0">
            <div className="flex items-center gap-1 w-full min-w-0">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
              <div className="flex flex-col items-start text-left min-w-0">
                <span 
                  className="font-bold text-[13px] truncate w-full select-none"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
                >
                  {dept.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-0.5">
                  {dept.roles.length} {dept.roles.length === 1 ? 'Cargo' : 'Cargos'}
                </span>
              </div>
            </div>
          </AccordionTrigger>

          <div className="flex items-center gap-0.5 pr-1 bg-muted/5 group-data-[state=open]:bg-muted/10 h-8 transition-colors shrink-0 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onAddRole(e);
              }}
              className="h-7 w-7 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all rounded-full"
              title="Añadir Cargo"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveDept(e);
              }}
              className="h-7 w-7 flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full opacity-0 group-hover:opacity-100"
              title="Eliminar Departamento"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <AccordionContent className="p-0 border-t border-muted/20">
          <div className="divide-y divide-muted/20">
            <SortableContext
              items={dept.roles.map((r: any) => `role-item-${r.name}`)}
              strategy={verticalListSortingStrategy}
            >
              {dept.roles.map((role: any) => (
                <SortableRoleRow
                  key={role.name}
                  role={role}
                  members={role.members}
                  showPersonnel={showPersonnel}
                  onRemove={onRemoveRole}
                  onUpdate={onUpdateRole}
                />
              ))}
            </SortableContext>
            {dept.roles.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground bg-muted/5">
                Sin cargos asignados.
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
});

function StructureTreeComponent({
  departments,
  roles,
  onAddDept,
  onRemoveDept,
  onAddRole,
  onRemoveRole,
  onUpdateRole,
  onReorderDepts,
  onReorderRoles,
  onUpdatePersonnel,
  personnel = [],
  showPersonnel = false,
  compact = false,
}: StructureTreeProps) {
  const isMobile = useIsMobile();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track the last time a local action occurred to prevent prop-sync flickering
  const lastActionTimeRef = React.useRef<number>(0);

  // Optimistic local state
  const [localDepts, setLocalDepts] = useState<Department[]>(departments);
  const [localRoles, setLocalRoles] = useState<StaffRole[]>(roles);

  // Sync with props only when necessary (e.g. workspace change or long delay after action)
  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTimeRef.current;

    // If the number of departments changed, always sync
    // Otherwise, only sync if more than 1000ms have passed since the last local action
    if (departments.length !== localDepts.length || timeSinceLastAction > 1000) {
      setLocalDepts(departments);
    }
  }, [departments]); // Still rely on departments content, but filter by time

  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTimeRef.current;

    // If the number of roles changed, always sync
    // Otherwise, only sync if more than 1000ms have passed since the last local action
    if (roles.length !== localRoles.length || timeSinceLastAction > 1000) {
      setLocalRoles(roles);
    }
  }, [roles]);

  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [targetDeptId, setTargetDeptId] = useState<string | undefined>(undefined);

  // States for delete confirmations
  const [confirmDeleteDept, setConfirmDeleteDept] = useState<{ id: string, name: string } | null>(null);
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<{ name: string } | null>(null);

  // Group roles by department, filtering out personnel statuses (Vacations, etc.) from the tree
  const globalRoles = localRoles
    .filter(r => (r.departmentScope ?? []).length === 0 && !r.isStatus)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const deptMap = localDepts
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(d => ({
      ...d,
      roles: localRoles
        .filter(r => (r.departmentScope ?? []).includes(d.id) && !r.isStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(r => ({
          ...r,
          members: personnel.filter(p => p.department === d.id && p.roleId === r.name)
        }))
    }));

  const globalRolesWithMembers = globalRoles.map(r => ({
    ...r,
    members: personnel.filter(p => (p.department === 'none' || !p.department) && p.roleId === r.name)
  }));

  const handleExpandAll = useCallback(() => {
    setExpandedItems(departments.map(d => d.id));
  }, [departments]);

  const handleCollapseAll = useCallback(() => {
    setExpandedItems([]);
  }, []);

  const submitAddDept = useCallback(() => {
    if (newDeptName.trim()) {
      onAddDept(newDeptName.trim());
      setNewDeptName('');
      setIsAddDeptOpen(false);
    }
  }, [newDeptName, onAddDept]);

  const submitAddRole = useCallback(() => {
    if (newRoleName.trim()) {
      onAddRole(newRoleName.trim(), targetDeptId);
      setNewRoleName('');
      setIsAddRoleOpen(false);
    }
  }, [newRoleName, onAddRole, targetDeptId]);

  const openAddRole = useCallback((deptId?: string) => {
    setTargetDeptId(deptId);
    setIsAddRoleOpen(true);
  }, []);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // 1. Department Reordering
    if (activeId.startsWith('dept-') && overId.startsWith('dept-')) {
      const oldIndex = localDepts.findIndex(d => d.id === activeId.replace('dept-', ''));
      const newIndex = localDepts.findIndex(d => d.id === overId.replace('dept-', ''));
      const reordered = arrayMove(localDepts, oldIndex, newIndex).map((d, i) => ({ ...d, order: i }));

      lastActionTimeRef.current = Date.now();
      setLocalDepts(reordered);
      onReorderDepts(reordered);
    }
    // 2. Role Reordering (within department)
    else if (activeId.startsWith('role-item-') && overId.startsWith('role-item-')) {
      const activeRoleName = activeId.replace('role-item-', '');
      const overRoleName = overId.replace('role-item-', '');

      const oldIndex = localRoles.findIndex(r => r.name === activeRoleName);
      const newIndex = localRoles.findIndex(r => r.name === overRoleName);

      const reordered = arrayMove(localRoles, oldIndex, newIndex).map((r, i) => ({ ...r, order: i }));

      lastActionTimeRef.current = Date.now();
      setLocalRoles(reordered);
      onReorderRoles(reordered);
    }
    // 3. Personnel Reordering (within role or between roles)
    else if (activeId.startsWith('member-')) {
      const activeMemberId = activeId.replace('member-', '');

      // Find what we are over
      let overRoleName: string | null = null;
      let newIndex = 0;

      if (overId.startsWith('member-')) {
        const overMemberId = overId.replace('member-', '');
        const overMember = personnel.find(p => p.id === overMemberId);
        if (overMember) {
          overRoleName = overMember.roleId || null;
          newIndex = personnel.filter(p => p.roleId === overRoleName).findIndex(p => p.id === overMemberId);
        }
      } else if (overId.startsWith('role-item-')) {
        overRoleName = overId.replace('role-item-', '');
        newIndex = personnel.filter(p => p.roleId === overRoleName).length;
      }

      if (overRoleName) {
        const updatedPersonnel = [...personnel];
        const activeIndex = updatedPersonnel.findIndex(p => p.id === activeMemberId);

        if (activeIndex !== -1) {
          const [movedMember] = updatedPersonnel.splice(activeIndex, 1);
          if (movedMember) {
            // Update role and department if moved to a role scoped to a department
            const targetRole = roles.find(r => r.name === overRoleName);
            const targetDeptId = (targetRole?.departmentScope ?? [])[0] || 'none';

            const updatedMember = {
              ...movedMember,
              roleId: overRoleName,
              department: targetDeptId === 'none' ? undefined : targetDeptId
            };

            // Re-insert at new position among role members
            const currentRoleMembers = updatedPersonnel.filter(p => p.roleId === overRoleName);
            const overItem = currentRoleMembers[newIndex] || currentRoleMembers[currentRoleMembers.length - 1];
            const insertGlobalIndex = overItem ? updatedPersonnel.indexOf(overItem) : updatedPersonnel.length;

            updatedPersonnel.splice(insertGlobalIndex, 0, updatedMember);

            // Recalculate all orders
            const finalPersonnel = updatedPersonnel.map((p, i) => ({ ...p, order: i }));
            onUpdatePersonnel(finalPersonnel);
          }
        }
      }
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col flex-1 min-h-0 w-full max-w-full overflow-x-hidden",
        !compact && "Card border bg-card shadow-sm overflow-hidden rounded-xl",
        isMobile && "select-none"
      )}
      style={isMobile ? { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } : {}}
    >
      {!compact && (
        <CardHeader className="pb-3 border-b bg-muted/5 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base font-bold truncate">Organigrama Institucional</CardTitle>
                <CardDescription className="text-[10px] sm:text-[11px] leading-tight mt-0.5 max-w-[200px] sm:max-w-none truncate">
                  Estructura de departamentos y cargos.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-muted/30 p-1 rounded-lg border w-full sm:w-auto justify-center sm:justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandAll}
                  className="flex-1 sm:flex-initial h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-background/50"
                >
                  Expandir Todo
                </Button>
                <div className="w-px h-3 bg-muted-foreground/20 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapseAll}
                  className="flex-1 sm:flex-initial h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-background/50"
                >
                  Contraer
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => setIsAddDeptOpen(true)}
                  className="h-9 sm:h-8 text-[11px] shadow-sm bg-primary hover:bg-primary/90 w-full"
                >
                  <PlusCircle className="mr-1 h-3.5 w-3.5" />
                  Departamento
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      )}

      {compact && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDeptOpen(true)}
            className="h-8 text-[10px] uppercase font-bold tracking-tight bg-background shadow-sm hover:bg-primary/5 hover:text-primary transition-all rounded-lg"
          >
            <Plus className="h-3 w-3 mr-1.5" /> Nuevo Dept.
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleExpandAll} className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium">Expandir</Button>
            <div className="w-px h-3 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={handleCollapseAll} className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive transition-colors font-medium">Contraer</Button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden w-full max-w-full">
        <ScrollArea className="h-full w-full" type="auto">
          <div className="space-y-1.5 pb-4 px-0.5 sm:px-2 pt-1.5">
            {/* Cargos Globales Section */}
            <div className="rounded-xl border border-muted/30 bg-card/50 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b">
                <div className="flex items-center min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">Cargos Globales</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">Visibles institucionalmente</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openAddRole()}
                    className="h-9 w-9 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all rounded-full"
                    title="Añadir Cargo"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-muted/30">
                {globalRolesWithMembers.map(role => (
                  <RoleRow
                    key={role.name}
                    role={role}
                    members={role.members}
                    showPersonnel={showPersonnel}
                    onRemove={(name) => setConfirmDeleteRole({ name })}
                    onUpdate={onUpdateRole}
                  />
                ))}
                {globalRoles.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground italic">
                    Sin cargos globales definidos.
                  </div>
                )}
              </div>
            </div>

            {/* Departments Accordion */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localDepts.map(d => `dept-${d.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <Accordion
                  type="multiple"
                  className="space-y-2 w-full"
                  value={expandedItems}
                  onValueChange={setExpandedItems}
                >
                  {deptMap.map(dept => (
                    <SortableDeptItem
                      key={dept.id}
                      dept={dept}
                      showPersonnel={showPersonnel}
                      onAddRole={() => openAddRole(dept.id)}
                      onRemoveDept={() => setConfirmDeleteDept({ id: dept.id, name: dept.name })}
                      onRemoveRole={(name) => setConfirmDeleteRole({ name })}
                      onUpdateRole={onUpdateRole}
                    />
                  ))}
                </Accordion>
              </SortableContext>

              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.4',
                    },
                  },
                }),
              }}>
                {activeId ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg border bg-card shadow-2xl scale-105 z-[100] border-primary pointer-events-none min-w-[200px]">
                    <GripVertical className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold truncate">
                      {activeId.startsWith('dept-') 
                        ? localDepts.find(d => d.id === activeId.replace('dept-', ''))?.name 
                        : activeId.startsWith('role-item-')
                          ? activeId.replace('role-item-', '')
                          : activeId.startsWith('member-')
                            ? personnel.find(p => p.id === activeId.replace('member-', ''))?.name
                            : activeId}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </ScrollArea>
      </div>

      <ResponsiveModal
        isOpen={isAddDeptOpen}
        onOpenChange={setIsAddDeptOpen}
        title="Añadir Departamento"
        description="Crea una nueva unidad operativa para organizar el personal."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddDeptOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={submitAddDept} disabled={!newDeptName.trim()} className="w-full sm:w-auto">
              Crear Departamento
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="dept-name">Nombre</Label>
          <Input
            id="dept-name"
            placeholder="Nombre del departamento..."
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAddDept()}
            autoFocus
          />
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        isOpen={isAddRoleOpen}
        onOpenChange={setIsAddRoleOpen}
        title="Añadir Cargo"
        description={targetDeptId
          ? `Añadir cargo al departamento seleccionado.`
          : 'Define un nuevo cargo global para la institución.'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={submitAddRole} disabled={!newRoleName.trim()} className="w-full sm:w-auto">
              Crear Cargo
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="role-name">Nombre del Cargo</Label>
          <Input
            id="role-name"
            placeholder="Ej: Director, Jefe de Guardia..."
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAddRole()}
            autoFocus
          />
        </div>
      </ResponsiveModal>

      <ConfirmDialog
        open={!!confirmDeleteDept}
        onOpenChange={(open) => !open && setConfirmDeleteDept(null)}
        title="Eliminar Departamento"
        message={`¿Estás seguro de que deseas eliminar el departamento "${confirmDeleteDept?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteDept) {
            onRemoveDept(confirmDeleteDept.id);
            setConfirmDeleteDept(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteRole}
        onOpenChange={(open) => !open && setConfirmDeleteRole(null)}
        title="Eliminar Cargo"
        message={`¿Estás seguro de que deseas eliminar el cargo "${confirmDeleteRole?.name}"?`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteRole) {
            onRemoveRole(confirmDeleteRole.name);
            setConfirmDeleteRole(null);
          }
        }}
      />
    </div>
  );
}

export const StructureTree = StructureTreeComponent;

