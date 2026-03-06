
'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';
import { Department, StaffRole } from '@/types';
import { arrayMove } from '@dnd-kit/sortable';
import { DepartmentCard } from './structure/department-card';
import { RoleCard } from './structure/role-card';
import { RoleSortableList } from './structure/role-sortable-list';
import { getInstitutionalData } from './structure/institutional-data';

interface StructureManagerProps {
  roles: StaffRole[];
  departments: Department[];
  onRolesChange: (roles: StaffRole[]) => void;
  onDepartmentsChange: (departments: Department[]) => void;
  onSave: () => void;
}

export function StructureManager({
  roles,
  departments,
  onRolesChange,
  onDepartmentsChange,
  onSave,
}: StructureManagerProps) {
  const [selectedDeptId, setSelectedDeptId] = React.useState<string>('all');

  // Local state for roles and departments to allow manual saving
  const [localRoles, setLocalRoles] = React.useState<StaffRole[]>(roles);
  const [localDepts, setLocalDepts] = React.useState<Department[]>(departments);

  // Sync with props when they load initially
  React.useEffect(() => {
    if (roles.length > 0 && localRoles.length === 0) {
      setLocalRoles(roles);
    }
  }, [roles, localRoles.length]);

  React.useEffect(() => {
    if (departments.length > 0 && localDepts.length === 0) {
      setLocalDepts(departments);
    }
  }, [departments, localDepts.length]);

  const handleAddDept = (name: string) => {
    if (localDepts.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Ya existe un departamento con ese nombre');
      return;
    }
    const newDept: Department = {
      id: generateId('dept'),
      name: name,
      staff: {},
    };
    setLocalDepts((prev) => [...prev, newDept]);
    toast.success('Departamento añadido (localmente)');
  };

  const handleRemoveDepartment = (id: string) => {
    setLocalDepts((prev) => prev.filter((d) => d.id !== id));
    // Also update roles that reference this department
    setLocalRoles((prev) =>
      prev.map((r) => {
        if (!r.departmentScope) return r;
        return {
          ...r,
          departmentScope: r.departmentScope.filter((scopeId) => scopeId !== id),
        };
      })
    );
    toast.success('Departamento eliminado (localmente)');
  };

  const handleAddRole = (name: string) => {
    if (localRoles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Ya existe un cargo con ese nombre');
      return;
    }
    const newRole: StaffRole = {
      name: name,
      isSingle: false,
      departmentScope: selectedDeptId !== 'all' && selectedDeptId !== 'global' ? [selectedDeptId] : [],
      isHidden: false,
      order: localRoles.length,
    };
    setLocalRoles((prev) => [...prev, newRole]);
    toast.success('Cargo añadido (localmente)');
  };

  const handleRemoveRole = (name: string) => {
    setLocalRoles((prev) => prev.filter((r) => r.name !== name));
    toast.success('Cargo eliminado (localmente)');
  };

  const handleLoadInstitutional = () => {
    const { newDepts, newRoles } = getInstitutionalData();
    setLocalDepts((prev) => {
      const existingNames = new Set(prev.map((d) => d.name.toLowerCase()));
      const filteredNew = newDepts.filter((d) => !existingNames.has(d.name.toLowerCase()));
      return [...prev, ...filteredNew];
    });

    setLocalRoles((prev) => {
      const existingNames = new Set(prev.map((r) => r.name.toLowerCase()));
      const filteredNew = newRoles.filter((r) => !existingNames.has(r.name.toLowerCase()));
      return [...prev, ...filteredNew];
    });

    toast.success('Estructura institucional cargada (localmente)');
  };

  const handleUpdateRole = (roleName: string, updates: Partial<StaffRole>) => {
    setLocalRoles((prev) =>
      prev.map((r) => (r.name === roleName ? { ...r, ...updates } : r))
    );
  };

  const handleAssignDept = (roleName: string, deptId: string) => {
    const updates =
      deptId === 'global'
        ? { departmentScope: [] }
        : { departmentScope: [deptId] };
    handleUpdateRole(roleName, updates);
  };

  const handleReorderRoles = (activeId: string, overId: string) => {
    setLocalRoles((items) => {
      const oldIndex = items.findIndex((i) => i.name === activeId);
      const newIndex = items.findIndex((i) => i.name === overId);
      const reordered = arrayMove(items, oldIndex, newIndex);
      return reordered.map((role, idx) => ({ ...role, order: idx }));
    });
  };

  const handleSaveAll = () => {
    // Persist all changes to parent/DB
    onDepartmentsChange(localDepts);
    onRolesChange(localRoles);
    if (onSave) onSave();
    toast.success('Estructura guardada exitosamente');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentCard
          departments={localDepts}
          selectedDeptId={selectedDeptId}
          onSelectDept={setSelectedDeptId}
          onAdd={handleAddDept}
          onRemove={handleRemoveDepartment}
          onLoadInstitutional={handleLoadInstitutional}
        />

        <RoleCard
          roles={localRoles}
          departments={localDepts}
          selectedDeptId={selectedDeptId}
          onSelectDept={setSelectedDeptId}
          onAdd={handleAddRole}
          onRemove={handleRemoveRole}
          onUpdateRole={handleUpdateRole}
          onAssignDept={handleAssignDept}
        />
      </div>

      <RoleSortableList
        roles={localRoles}
        departments={localDepts}
        onUpdateRole={handleUpdateRole}
        onReorder={handleReorderRoles}
      />

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveAll} className="shadow-lg px-8">
          Guardar Cambios de Estructura
        </Button>
      </div>
    </div>
  );
}
