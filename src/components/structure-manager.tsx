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
import { Department, StaffRole, StaffMember } from '@/types';
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
  personnel?: StaffMember[];
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
}: StructureManagerProps) {


  // Local state for roles and departments to allow manual saving
  const [localRoles, setLocalRoles] = React.useState<StaffRole[]>(roles);
  const [localDepts, setLocalDepts] = React.useState<Department[]>(departments);

  // Sync with props when they load initially (only once)
  const isInitialized = React.useRef(false);

    const STATUS_ROLE_NAMES = ['vacaciones', 'reposo', 'permiso', 'ausente', 'apoyo'];

  React.useEffect(() => {
    const patchRoles = (rs: StaffRole[]) => {
      return rs.map(r => {
        const nameLower = (r.name || '').toLowerCase().trim();
        if (STATUS_ROLE_NAMES.includes(nameLower) && !r.isStatus) {
          return { ...r, isStatus: true };
        }
        return r;
      });
    };

    if (!isInitialized.current && rolesLoaded && deptsLoaded) {
      let updatedRoles = patchRoles(roles);
      
      // Ensure 'Ausente' role exists as it's a vital status role now
      const hasAusente = updatedRoles.some(r => r.name.toLowerCase() === 'ausente');
      if (!hasAusente) {
        updatedRoles.push({
          name: 'Ausente',
          isStatus: true,
          isSingle: false,
          isHidden: false,
          order: updatedRoles.length,
          departmentScope: []
        });
      }
      
      setLocalRoles(updatedRoles);
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
              departments={localDepts}
              roles={localRoles}
              onAddDept={handleAddDept}
              onRemoveDept={handleRemoveDepartment}
              onAddRole={handleAddRole}
              onRemoveRole={handleRemoveRole}
              onUpdateRole={handleUpdateRole}
              onLoadInstitutional={handleLoadInstitutional}
              personnel={personnel}
              showPersonnel={true}
            />
          </TabsContent>
          
          <TabsContent 
            value="sorter" 
            className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col animate-in fade-in duration-300"
          >
            <RoleSorter 
              roles={localRoles}
              onReorder={setLocalRoles}
              onUpdate={handleUpdateRole}
              onRemove={handleRemoveRole}
              onSave={handleSaveAll}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop view: Classic side-by-side grid */}
      <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch md:flex-1 md:min-h-0">
        {/* Left Column: Hierarchical Tree View (Dynamic Management) */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          <StructureTree 
            departments={localDepts}
            roles={localRoles}
            onAddDept={handleAddDept}
            onRemoveDept={handleRemoveDepartment}
            onAddRole={handleAddRole}
            onRemoveRole={handleRemoveRole}
            onUpdateRole={handleUpdateRole}
            onLoadInstitutional={handleLoadInstitutional}
            personnel={personnel}
            showPersonnel={false}
          />
        </div>

        {/* Right Column: Organization for Reports (Sorting) */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <RoleSorter 
            roles={localRoles}
            onReorder={setLocalRoles}
            onUpdate={handleUpdateRole}
            onRemove={handleRemoveRole}
            onSave={handleSaveAll}
          />
        </div>
      </div>
    </div>
  );
}
