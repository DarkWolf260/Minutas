'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ChevronRight,
  PlusCircle,
  Briefcase,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import { Department, StaffRole, StaffMember } from '@/types';

interface StructureTreeProps {
  departments: Department[];
  roles: StaffRole[];
  onAddDept: (name: string) => void;
  onRemoveDept: (id: string) => void;
  onAddRole: (name: string, deptId?: string) => void;
  onRemoveRole: (name: string) => void;
  onUpdateRole: (name: string, updates: Partial<StaffRole>) => void;
  onLoadInstitutional: () => void;
  personnel?: StaffMember[];
  showPersonnel?: boolean;
}

export function StructureTree({
  departments,
  roles,
  onAddDept,
  onRemoveDept,
  onAddRole,
  onRemoveRole,
  onUpdateRole,
  onLoadInstitutional,
  personnel = [],
  showPersonnel = false,
}: StructureTreeProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [targetDeptId, setTargetDeptId] = useState<string | undefined>(undefined);

  // Group roles by department, filtering out personnel statuses (Vacations, etc.) from the tree
  const globalRoles = roles.filter(r => (r.departmentScope ?? []).length === 0 && !r.isStatus);
  const deptMap = departments.map(d => ({
    ...d,
    roles: roles.filter(r => (r.departmentScope ?? []).includes(d.id) && !r.isStatus).map(r => ({
      ...r,
      members: personnel.filter(p => p.department === d.id && p.roleId === r.name)
    }))
  }));

  const globalRolesWithMembers = globalRoles.map(r => ({
    ...r,
    members: personnel.filter(p => (p.department === 'none' || !p.department) && p.roleId === r.name)
  }));

  const handleExpandAll = () => {
    setExpandedItems(departments.map(d => d.id));
  };

  const handleCollapseAll = () => {
    setExpandedItems([]);
  };

  const handleAddDept = () => {
    if (newDeptName.trim()) {
      onAddDept(newDeptName.trim());
      setNewDeptName('');
      setIsAddDeptOpen(false);
    }
  };

  const handleAddRole = () => {
    if (newRoleName.trim()) {
      onAddRole(newRoleName.trim(), targetDeptId);
      setNewRoleName('');
      setIsAddRoleOpen(false);
    }
  };

  const openAddRole = (deptId?: string) => {
    setTargetDeptId(deptId);
    setIsAddRoleOpen(true);
  };

  return (
    <Card className="border-muted/50 bg-muted/5 shadow-inner overflow-hidden flex flex-col flex-1 min-h-0">
      <CardHeader className="pb-3 border-b bg-background/50 backdrop-blur-sm">
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-muted/30 p-1 rounded-lg border sm:mr-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExpandAll}
                className="h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-background/50"
              >
                Expandir Todo
              </Button>
              <div className="w-px h-3 bg-muted-foreground/20 mx-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCollapseAll}
                className="h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-background/50"
              >
                Contraer
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLoadInstitutional}
                className="flex-1 sm:flex-initial h-9 sm:h-8 text-[11px] hover:bg-primary/5 border-primary/20"
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
                Cargar IPP
              </Button>
              <Button 
                size="sm" 
                onClick={() => setIsAddDeptOpen(true)}
                className="flex-1 sm:flex-initial h-9 sm:h-8 text-[11px] shadow-sm bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="mr-1 h-3.5 w-3.5" />
                Departamento
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full pr-4 -mr-4" type="always">
          <div className="space-y-4 pb-4">
            {/* Cargos Globales Section */}
            <div className="rounded-xl border border-muted/30 bg-card overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 bg-muted/20 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">Cargos Globales</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 border-muted-foreground/30">BASE</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Visibles institucionalmente</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openAddRole()}
                    className="h-8 text-xs hover:bg-primary/10 text-primary font-bold bg-primary/5 border border-primary/10 px-3"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Añadir Cargo
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
                    onRemove={onRemoveRole} 
                    onUpdate={onUpdateRole} 
                  />
                ))}
                {globalRoles.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Sin cargos globales definidos.
                  </div>
                )}
              </div>
            </div>

            {/* Departments Accordion */}
            <Accordion 
              type="multiple" 
              className="space-y-3"
              value={expandedItems}
              onValueChange={setExpandedItems}
            >
              {deptMap.map(dept => (
                <AccordionItem 
                  key={dept.id} 
                  value={dept.id}
                  className="rounded-xl border border-muted/30 bg-card shadow-sm overflow-hidden border-b-0"
                >
                  <div className="flex items-center group">
                    <AccordionTrigger className="flex-1 hover:no-underline p-4 py-3 bg-muted/5 group-data-[state=open]:bg-muted/10 [&>svg]:hidden">
                      <div className="flex items-center gap-3 w-full">
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                        <div className="p-2 rounded-lg bg-primary/5 text-primary group-data-[state=open]:bg-primary/10 transition-colors">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start text-left min-w-0">
                          <span className="font-bold text-sm truncate w-full">{dept.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {dept.roles.length} {dept.roles.length === 1 ? 'Cargo' : 'Cargos'}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <div className="flex items-center gap-1.5 pr-3 bg-muted/5 group-data-[state=open]:bg-muted/10 h-14 transition-colors ml-auto">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddRole(dept.id);
                        }}
                        className="h-9 p-0 w-9 sm:w-auto sm:px-3 text-xs hover:bg-primary/10 text-primary font-bold bg-primary/5 border border-primary/10"
                        title="Añadir Cargo"
                      >
                        <Plus className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Cargo</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar departamento ${dept.name}?`)) {
                            onRemoveDept(dept.id);
                          }
                        }}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <AccordionContent className="p-0 border-t border-muted/20">
                    <div className="divide-y divide-muted/20">
                      {dept.roles.map(role => (
                        <RoleRow
                          key={role.name} 
                          role={role} 
                          members={role.members}
                          showPersonnel={showPersonnel}
                          onRemove={onRemoveRole} 
                          onUpdate={onUpdateRole} 
                        />
                      ))}
                      {dept.roles.length === 0 && (
                        <div className="p-8 text-center text-xs text-muted-foreground bg-muted/5">
                          Sin cargos asignados.
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {departments.length === 0 && (
              <div className="rounded-xl border border-dashed border-muted-foreground/20 p-12 text-center bg-muted/5">
                <Building2 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No hay departamentos definidos</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddDeptOpen(true)}
                  className="mt-2 text-primary"
                >
                  Configurar el primero
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Departamento</DialogTitle>
            <DialogDescription>
              Crea una nueva unidad operativa para organizar el personal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Nombre</Label>
              <Input
                id="dept-name"
                placeholder="Nombre del departamento..."
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDeptOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddDept} disabled={!newDeptName.trim()}>Crear Departamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Añadir Cargo</DialogTitle>
            <DialogDescription>
              {targetDeptId 
                ? `Añadir cargo al departamento seleccionado.`
                : 'Define un nuevo cargo global para la institución.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nombre del Cargo</Label>
              <Input
                id="role-name"
                placeholder="Ej: Director, Jefe de Guardia..."
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddRole} disabled={!newRoleName.trim()}>Crear Cargo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function RoleRow({ 
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
}) {
  return (
    <div className="flex items-center justify-between p-3.5 px-5 hover:bg-muted/10 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded-full bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate" title={role.name}>
            {role.name}
          </span>
          {showPersonnel && members.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {members.map(m => (
                <Badge key={m.id} variant="secondary" className="text-[9px] py-0 h-4 bg-primary/5 text-primary border-primary/10">
                  {m.name}
                </Badge>
              ))}
            </div>
          )}
          {showPersonnel && members.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic mt-0.5">Vacante</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-6 shrink-0 ml-auto">
        <div className="flex items-center gap-2">
          <Label htmlFor={`single-${role.name}`} className="text-[10px] uppercase font-bold text-muted-foreground/70 hidden sm:block">Único</Label>
          <Switch 
            id={`single-${role.name}`}
            checked={role.isSingle}
            onCheckedChange={(checked) => onUpdate(role.name, { isSingle: checked })}
            className="scale-75 data-[state=checked]:bg-primary"
          />
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (confirm(`¿Eliminar cargo ${role.name}?`)) {
              onRemove(role.name);
            }
          }}
          className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
