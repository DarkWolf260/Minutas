'use client';

import React from 'react';
import { Building2, Save, CheckCircle2, ArrowUpDown } from 'lucide-react';
import { RoleSorter } from './structure/role-sorter';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';
import { Department, StaffRole } from '@/types';
import { StructureTree } from '@/components/structure/structure-tree';
import { getInstitutionalData } from './structure/institutional-data';

interface StructureManagerProps {
  roles: StaffRole[];
  departments: Department[];
  onRolesChange: (roles: StaffRole[]) => void;
  onDepartmentsChange: (departments: Department[]) => void;
  onSave: () => void;
  rolesLoaded?: boolean;
  deptsLoaded?: boolean;
}

export function StructureManager({
  roles,
  departments,
  onRolesChange,
  onDepartmentsChange,
  onSave,
  rolesLoaded = true,
  deptsLoaded = true,
}: StructureManagerProps) {


  // Local state for roles and departments to allow manual saving
  const [localRoles, setLocalRoles] = React.useState<StaffRole[]>(roles);
  const [localDepts, setLocalDepts] = React.useState<Department[]>(departments);

  // Sync with props when they load initially (only once)
  const isInitialized = React.useRef(false);

  React.useEffect(() => {
    if (!isInitialized.current && roles.length > 0) {
      setLocalRoles(roles);
      if (departments.length > 0) {
        setLocalDepts(departments);
        isInitialized.current = true;
      }
    } else if (!isInitialized.current && deptsLoaded && rolesLoaded) {
      // If loaded but empty, still mark as initialized
      setLocalRoles(roles);
      setLocalDepts(departments);
      isInitialized.current = true;
    }
  }, [roles, departments, deptsLoaded, rolesLoaded]);

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
    toast.success('Departamento añadido');
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
    toast.success('Departamento eliminado');
  };

  const handleAddRole = (name: string, deptId?: string) => {
    if (localRoles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Ya existe un cargo con ese nombre');
      return;
    }
    const newRole: StaffRole = {
      name: name,
      isSingle: false,
      departmentScope: deptId ? [deptId] : [],
      isHidden: false,
      order: localRoles.length,
    };
    setLocalRoles((prev) => [...prev, newRole]);
    toast.success('Cargo añadido');
  };

  const handleRemoveRole = (name: string) => {
    setLocalRoles((prev) => prev.filter((r) => r.name !== name));
    toast.success('Cargo eliminado');
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

    toast.success('Estructura institucional cargada');
  };

  const handleUpdateRole = (roleName: string, updates: Partial<StaffRole>) => {
    setLocalRoles((prev) =>
      prev.map((r) => (r.name === roleName ? { ...r, ...updates } : r))
    );
  };

  const handleSaveAll = () => {
    // Persist all changes to parent/DB
    onDepartmentsChange(localDepts);
    onRolesChange(localRoles);
    if (onSave) onSave();
    toast.success('Estructura guardada exitosamente');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 min-h-0">
        {/* Left Column: Hierarchical Tree View (Dynamic Management) */}
        <div className="lg:col-span-8 h-full flex flex-col">
          <StructureTree 
            departments={localDepts}
            roles={localRoles}
            onAddDept={handleAddDept}
            onRemoveDept={handleRemoveDepartment}
            onAddRole={handleAddRole}
            onRemoveRole={handleRemoveRole}
            onUpdateRole={handleUpdateRole}
            onLoadInstitutional={handleLoadInstitutional}
          />
        </div>

        {/* Right Column: Organization for Reports (Sorting) */}
        <div className="lg:col-span-4 h-full flex flex-col">
          <RoleSorter 
            roles={localRoles}
            onReorder={setLocalRoles}
            onSave={handleSaveAll}
          />
        </div>
      </div>
    </div>
  );
}
