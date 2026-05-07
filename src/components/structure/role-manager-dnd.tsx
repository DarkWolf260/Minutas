'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, GripVertical, PlusCircle } from 'lucide-react';
import type { StaffRole, Department } from '@/lib/types';
import { DEPARTMENT_IDS } from '@/lib/constants/departments';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDroppable,
  pointerWithin,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRoleItem({
  role,
  onRemove,
  onToggleSingle,
  onToggleHidden,
}: {
  role: StaffRole;
  onRemove: (role: StaffRole) => void;
  onToggleSingle: (name: string, checked: boolean) => void;
  onToggleHidden: (name: string, checked: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: role.name,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-2 bg-background touch-none">
      <div className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </span>
        <span className="font-medium flex-1 min-w-0 truncate text-sm" title={role.name}>
          {role.name}
        </span>
        <div className="flex items-center space-x-1 shrink-0 ml-auto">
          <div className="flex flex-col items-center mr-1">
            <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none mb-1">Único</span>
            <Switch
              checked={role.is_single}
              onCheckedChange={(checked) => onToggleSingle(role.name, checked)}
              aria-label={`Marcar como cargo único para ${role.name}`}
              className="scale-75"
            />
          </div>
          <div className="flex flex-col items-center mr-1">
            <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none mb-1">Ocultar</span>
            <Switch
              checked={role.is_hidden || false}
              onCheckedChange={(checked) => onToggleHidden(role.name, checked)}
              aria-label={`Ocultar cargo ${role.name} de reportes`}
              className="scale-75"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(role)}
            aria-label={`Eliminar cargo ${role.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RoleColumn({
  id,
  title,
  roles,
  onPrepareRemove,
  onToggleRoleSingle,
  onToggleRoleHidden,
  onPrepareRemoveDepartment,
}: {
  id: string;
  title: string;
  roles: StaffRole[];
  onPrepareRemove: (role: StaffRole) => void;
  onToggleRoleSingle: (name: string, checked: boolean) => void;
  onToggleRoleHidden: (name: string, checked: boolean) => void;
  onPrepareRemoveDepartment: (deptId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card ref={setNodeRef} className="flex flex-col bg-muted/50 min-h-64">
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {id !== 'unassigned' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => onPrepareRemoveDepartment(id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-2 space-y-2 flex-1">
        <SortableContext items={roles.map((r) => r.name)} strategy={verticalListSortingStrategy}>
          {roles.map((role) => (
            <SortableRoleItem
              key={role.name}
              role={role}
              onRemove={onPrepareRemove}
              onToggleSingle={onToggleRoleSingle}
              onToggleHidden={onToggleRoleHidden}
            />
          ))}
        </SortableContext>
        {roles.length === 0 && (
          <div className="flex items-center justify-center h-full text-xs text-center text-muted-foreground p-4">
            Arrastra un cargo aquí
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoleManagerDnD({
  roles,
  onRolesChange,
  onSave,
  departments,
  handleAddDepartment,
  newDepartmentName,
  setNewDepartmentName,
  onPrepareRemoveRole,
  onPrepareRemoveDepartment,
}: {
  roles: StaffRole[];
  onRolesChange: (roles: StaffRole[]) => void;
  onSave: () => void;
  departments: Department[];
  handleAddDepartment: () => void;
  newDepartmentName: string;
  setNewDepartmentName: (value: string) => void;
  onPrepareRemoveRole: (role: StaffRole) => void;
  onPrepareRemoveDepartment: (deptId: string) => void;
}) {
  const [newRoleName, setNewRoleName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeRole = useMemo(() => {
    return activeId ? roles.find((r) => r.name === activeId) : null;
  }, [activeId, roles]);

  const handleAddRole = () => {
    if (
      newRoleName.trim() &&
      !roles.find((r) => r.name.toLowerCase() === newRoleName.trim().toLowerCase())
    ) {
      const newRole: StaffRole = {
        name: newRoleName.trim(),
        is_single: false,
        department_scope: [DEPARTMENT_IDS.OPERATIONS],
      };
      onRolesChange([...roles, newRole]);
      setNewRoleName('');
    }
  };

  const handleToggleSingle = (roleName: string, checked: boolean) => {
    onRolesChange(roles.map((r) => (r.name === roleName ? { ...r, is_single: checked } : r)));
  };

  const handleSaveChanges = () => {
    onSave();
    setFeedback('¡Cargos guardados exitosamente!');
    setTimeout(() => setFeedback(''), 3000);
  };
  
  const handleToggleHidden = (roleName: string, checked: boolean) => {
    onRolesChange(roles.map((r) => (r.name === roleName ? { ...r, is_hidden: checked } : r)));
  };

  const allDepartments = useMemo(() => departments, [departments]);

  const roleBuckets = useMemo(() => {
    const buckets: Record<string, StaffRole[]> = {
      unassigned: [],
    };
    allDepartments.forEach((d) => {
      buckets[d.id] = [];
    });

    roles.forEach((role) => {
      const scope = (role.department_scope ?? [])[0] || 'unassigned';
      const bucket = buckets[scope];
      if (bucket) {
        bucket.push(role);
      } else {
        buckets.unassigned?.push(role);
      }
    });
    return buckets;
  }, [roles, allDepartments]);

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

  function findContainer(id: string) {
    if (roleBuckets[id]) {
      return id;
    }
    return Object.keys(roleBuckets).find((key) => {
      const bucket = roleBuckets[key];
      return bucket ? bucket.some((r: StaffRole) => r.name === id) : false;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    const activeId = active.id as string;
    if (!over) return;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const activeIndex = roles.findIndex((r: StaffRole) => r.name === activeId);
    if (activeIndex === -1) return;

    const currentRole = roles[activeIndex];
    if (!currentRole) return;

    const newRoles = [...roles];
    newRoles[activeIndex] = {
      ...currentRole,
      department_scope: overContainer === 'unassigned' ? [] : [overContainer],
    };

    onRolesChange(newRoles);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer) return;

    if (active.id !== over.id && activeContainer === overContainer) {
      const oldIndex = roles.findIndex((r: StaffRole) => r.name === active.id);
      const newIndex = roles.findIndex((r: StaffRole) => r.name === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onRolesChange(arrayMove(roles, oldIndex, newIndex));
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold">Añadir Nuevo Departamento</Label>
              <div className="flex gap-2">
                <Input
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="Ej: Logística"
                  className="bg-background"
                />
                <Button onClick={handleAddDepartment}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Añadir Nuevo Cargo</Label>
              <div className="flex gap-2">
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ej: Paramédico"
                  className="bg-background"
                />
                <Button onClick={handleAddRole}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Cargo
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RoleColumn
            id="unassigned"
            title="Cargos Globales"
            roles={roleBuckets.unassigned || []}
            onPrepareRemove={onPrepareRemoveRole}
            onToggleRoleSingle={handleToggleSingle}
            onToggleRoleHidden={handleToggleHidden}
            onPrepareRemoveDepartment={() => {}}
          />
          {allDepartments.map((dept) => (
            <RoleColumn
              key={dept.id}
              id={dept.id}
              title={dept.name}
              roles={roleBuckets[dept.id] || []}
              onPrepareRemove={onPrepareRemoveRole}
              onToggleRoleSingle={handleToggleSingle}
              onToggleRoleHidden={handleToggleHidden}
              onPrepareRemoveDepartment={onPrepareRemoveDepartment}
            />
          ))}
        </div>

        <div className="flex justify-end mt-6 items-center">
          {feedback && <p className="text-sm text-green-600 mr-4">{feedback}</p>}
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </div>
      </div>
      <DragOverlay>
        {activeRole ? (
          <Card className="p-2 bg-background touch-none border shadow-sm">
            <div className="flex items-center gap-2">
              <span className="cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
              </span>
              <span className="font-medium flex-1 min-w-0 truncate text-sm" title={activeRole.name}>
                {activeRole.name}
              </span>
              <div className="flex items-center space-x-1 shrink-0 ml-auto">
                <Switch checked={activeRole.is_single} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

