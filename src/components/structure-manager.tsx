'use client';

import React from 'react';
import { Building2, Save, CheckCircle2, ArrowUpDown } from 'lucide-react';
import { RoleSorter } from './structure/role-sorter';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';
import { Department, StaffRole, StaffMember } from '@/lib/types';
import { StructureTree } from '@/components/structure/structure-tree';

interface StructureManagerProps {
  roles: StaffRole[];
  departments: Department[];
  onRolesChange: (roles: StaffRole[]) => void;
  onDepartmentsChange: (departments: Department[]) => void;
  onSave: () => void;
  rolesLoaded?: boolean;
  deptsLoaded?: boolean;
  personnel?: StaffMember[];
  onUpdatePersonnel?: (personnel: StaffMember[]) => void;
}

export function StructureManager({
  roles,
  departments,
  onRolesChange,
  onDepartmentsChange,
  onSave,
  rolesLoaded = true,
  deptsLoaded = true,
  personnel = [],
  onUpdatePersonnel,
}: StructureManagerProps) {


  const STATUS_ROLE_NAMES = ['vacaciones', 'reposo', 'permiso', 'ausente', 'apoyo'];

  const patchRoles = (rs: StaffRole[]) => {
    return rs.map(r => {
      const nameLower = (r.name || '').toLowerCase().trim();
      if (STATUS_ROLE_NAMES.includes(nameLower) && !r.isStatus) {
        return { ...r, isStatus: true };
      }
      return r;
    });
  };

  const processedRoles = React.useMemo(() => patchRoles(roles), [roles]);

  const handleAddDept = React.useCallback((name: string) => {
    if (departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Ya existe un departamento con ese nombre');
      return;
    }
    const newDept: Department = {
      id: generateId('dept'),
      name: name,
      staff: {},
    };
    onDepartmentsChange([...departments, newDept]);
    toast.success('Departamento añadido');
  }, [departments, onDepartmentsChange]);

  const handleRemoveDepartment = React.useCallback((id: string) => {
    const updatedDepts = departments.filter((d) => d.id !== id);
    onDepartmentsChange(updatedDepts);
    
    // Also update roles that reference this department
    const updatedRoles = roles.map((r) => {
      if (!r.departmentScope) return r;
      return {
        ...r,
        departmentScope: r.departmentScope.filter((scopeId) => scopeId !== id),
      };
    });
    onRolesChange(updatedRoles);
    toast.success('Departamento eliminado');
  }, [departments, roles, onDepartmentsChange, onRolesChange]);

  const handleAddRole = React.useCallback((name: string, deptId?: string) => {
    if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Ya existe un cargo con ese nombre');
      return;
    }
    const newRole: StaffRole = {
      name: name,
      isSingle: false,
      isHidden: true,
      departmentScope: deptId ? [deptId] : [],
      order: roles.length,
    };
    onRolesChange([...roles, newRole]);
    toast.success('Cargo añadido');
  }, [roles, onRolesChange]);

  const handleRemoveRole = React.useCallback((name: string) => {
    const updatedRoles = roles.filter((r) => r.name !== name);
    onRolesChange(updatedRoles);
    toast.success('Cargo eliminado');
  }, [roles, onRolesChange]);

  const handleUpdateRole = React.useCallback((roleName: string, updates: Partial<StaffRole>) => {
    const updatedRoles = roles.map((r) => (r.name === roleName ? { ...r, ...updates } : r));
    onRolesChange(updatedRoles);
  }, [roles, onRolesChange]);

    // Auto-saved handled by handlers
;

  return (
    <div className="md:flex-1 md:flex md:flex-col md:min-h-0 bg-transparent">
      {/* Mobile view: Tabbed interface to expand space */}
      <div className="flex flex-col md:hidden">
        <Tabs defaultValue="tree" className="w-full bg-transparent">
          <TabsList className="grid w-full grid-cols-2 mb-2 shrink-0">
            <TabsTrigger value="tree" className="text-xs font-bold uppercase transition-all">Organigrama</TabsTrigger>
            <TabsTrigger value="sorter" className="text-xs font-bold uppercase transition-all">Jerarquía</TabsTrigger>
          </TabsList>
          
          <TabsContent 
            value="tree" 
            className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col animate-in fade-in duration-300"
          >
            <StructureTree 
              departments={departments}
              roles={processedRoles}
              onAddDept={handleAddDept}
              onRemoveDept={handleRemoveDepartment}
              onAddRole={handleAddRole}
              onRemoveRole={handleRemoveRole}
              onUpdateRole={handleUpdateRole}
              onReorderDepts={onDepartmentsChange}
              onReorderRoles={onRolesChange}
              onUpdatePersonnel={onUpdatePersonnel || (() => {})}
              personnel={personnel}
              showPersonnel={true}
            />
          </TabsContent>
          
          <TabsContent 
            value="sorter" 
            className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col animate-in fade-in duration-300"
          >
            <RoleSorter 
              roles={processedRoles}
              departments={departments}
              onReorder={onRolesChange}
              onUpdate={handleUpdateRole}
              onRemove={handleRemoveRole}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop view: Classic side-by-side grid */}
      <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch md:flex-1 md:min-h-0">
        {/* Left Column: Hierarchical Tree View (Dynamic Management) */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <StructureTree 
            departments={departments}
            roles={processedRoles}
            onAddDept={handleAddDept}
            onRemoveDept={handleRemoveDepartment}
            onAddRole={handleAddRole}
            onRemoveRole={handleRemoveRole}
            onUpdateRole={handleUpdateRole}
            onReorderDepts={onDepartmentsChange}
            onReorderRoles={onRolesChange}
            onUpdatePersonnel={onUpdatePersonnel || (() => {})}
            personnel={personnel}
            showPersonnel={false}
          />
        </div>

        {/* Right Column: Organization for Reports (Sorting) */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <RoleSorter 
            roles={processedRoles}
            departments={departments}
            onReorder={onRolesChange}
            onUpdate={handleUpdateRole}
            onRemove={handleRemoveRole}
          />
        </div>
      </div>
    </div>
  );
}
