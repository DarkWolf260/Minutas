'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, ShieldCheck, Users, Building2, Briefcase, LayoutGrid, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StaffRole, Department } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StructureManagerProps {
    roles: StaffRole[];
    departments: Department[];
    onRolesChange: (roles: StaffRole[]) => void;
    onDepartmentsChange: (departments: Department[]) => void;
    onAddDepartment: (name: string) => void;
    onRemoveDepartment: (id: string) => void;
    onAddRole: (name: string) => void;
    onRemoveRole: (name: string) => void;
    onSave: () => void;
}

export function StructureManager({
    roles,
    departments,
    onRolesChange,
    onDepartmentsChange,
    onAddDepartment,
    onRemoveDepartment,
    onAddRole,
    onRemoveRole,
    onSave
}: StructureManagerProps) {
    const [newDeptName, setNewDeptName] = useState('');
    const [newRoleName, setNewRoleName] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

    const handleAddDept = () => {
        if (!newDeptName.trim()) return;
        onAddDepartment(newDeptName.trim());
        setNewDeptName('');
    };

    const handleAddRole = () => {
        if (!newRoleName.trim()) return;
        onAddRole(newRoleName.trim());
        setNewRoleName('');
    };

    const handleLoadInstitutional = () => {
        if (!window.confirm('¿Estás seguro de cargar la estructura institucional? Esto añadirá los departamentos y cargos estándar (no eliminará los actuales).')) return;

        const institutionalDepts = [
            { id: 'ops', name: 'Departamento de Operaciones' },
            { id: 'cemuprad', name: 'CEMUPRAD' },
            { id: 'educ', name: 'Departamento de Educación' },
            { id: 'riesgos', name: 'Departamento de Gestión de Riesgos' },
            { id: 'it', name: 'Departamento de Informática' },
            { id: 'log', name: 'Departamento de Logística' },
        ];

        // Since we want to link them correctly, we'll generate the IDs here
        const newDepts: Department[] = [...departments];
        const deptMap: Record<string, string> = { 'global': 'global', 'OPERATIONS': 'OPERATIONS' };

        const normalize = (s: string) => s.toLowerCase()
            .replace(/^departamento de /, '')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .trim();

        institutionalDepts.forEach(d => {
            const normD = normalize(d.name);
            const existing = departments.find(ext => {
                const normExt = normalize(ext.name);
                return normExt === normD || normExt.includes(normD) || normD.includes(normExt);
            });

            if (!existing) {
                const newId = `dept_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                newDepts.push({ id: newId, name: d.name, staff: {} });
                deptMap[d.id] = newId;
            } else {
                deptMap[d.id] = existing.id;
            }
        });

        // Update departments first
        if (newDepts.length > departments.length) {
            onDepartmentsChange(newDepts);
        }

        const institutionalRoles: StaffRole[] = [
            // Global (Director first)
            { name: 'Director', isSingle: true, departmentScope: [], isHidden: false },
            { name: 'Administrador', isSingle: true, departmentScope: [], isHidden: true },
            { name: 'Jefe de Recursos Humanos', isSingle: true, departmentScope: [], isHidden: true },
            { name: 'Secretaria', isSingle: true, departmentScope: [], isHidden: true },
            // Ops (Visible by default)
            { name: 'Jefe de Operaciones', isSingle: true, departmentScope: [deptMap['ops']].filter(Boolean) as string[], isHidden: false },
            { name: 'Jefe de Servicio', isSingle: true, departmentScope: [deptMap['ops'], 'OPERATIONS'].filter(Boolean) as string[], isHidden: false },
            { name: 'Técnico', isSingle: false, departmentScope: [deptMap['ops'], 'OPERATIONS'].filter(Boolean) as string[], isHidden: false },
            { name: 'Auxiliar', isSingle: false, departmentScope: [deptMap['ops'], 'OPERATIONS'].filter(Boolean) as string[], isHidden: false },
            { name: 'Conductor', isSingle: false, departmentScope: [deptMap['ops'], 'OPERATIONS'].filter(Boolean) as string[], isHidden: false },
            // others (Hidden by default)
            { name: 'Jefe de CEMUPRAD', isSingle: true, departmentScope: [deptMap['cemuprad']].filter(Boolean) as string[], isHidden: true },
            { name: 'Analista de CEMUPRAD', isSingle: false, departmentScope: [deptMap['cemuprad']].filter(Boolean) as string[], isHidden: true },
            { name: 'Auxiliar de CEMUPRAD', isSingle: false, departmentScope: [deptMap['cemuprad']].filter(Boolean) as string[], isHidden: true },
            { name: 'Jefe de Educación', isSingle: true, departmentScope: [deptMap['educ']].filter(Boolean) as string[], isHidden: true },
            { name: 'Auxiliar de Educación', isSingle: false, departmentScope: [deptMap['educ']].filter(Boolean) as string[], isHidden: true },
            { name: 'Jefe de Gestión de Riesgos', isSingle: true, departmentScope: [deptMap['riesgos']].filter(Boolean) as string[], isHidden: true },
            { name: 'Analista de Riesgos', isSingle: false, departmentScope: [deptMap['riesgos']].filter(Boolean) as string[], isHidden: true },
            { name: 'Jefe de Informática', isSingle: true, departmentScope: [deptMap['it']].filter(Boolean) as string[], isHidden: true },
            { name: 'Jefe de Logística', isSingle: true, departmentScope: [deptMap['log']].filter(Boolean) as string[], isHidden: true },
            { name: 'Personal de Logística', isSingle: false, departmentScope: [deptMap['log']].filter(Boolean) as string[], isHidden: true },
        ];

        const newRoles = [...roles];
        institutionalRoles.forEach(r => {
            const existingIndex = newRoles.findIndex(ext => ext.name.toLowerCase() === r.name.toLowerCase());
            if (existingIndex === -1) {
                if (r.name === 'Director') {
                    newRoles.unshift(r); // Add Director at the beginning
                } else {
                    newRoles.push(r);
                }
            } else {
                // Update existing role's scope and hidden state
                newRoles[existingIndex] = {
                    ...newRoles[existingIndex],
                    departmentScope: r.departmentScope,
                    isHidden: r.isHidden
                };

                // If it's the director, move to front
                if (r.name === 'Director' && existingIndex > 0) {
                    const [director] = newRoles.splice(existingIndex, 1);
                    newRoles.unshift(director);
                }
            }
        });

        onRolesChange(newRoles);
        toast.success('Estructura institucional actualizada correctamente.');
    };

    const handleUpdateRole = (roleName: string, updates: Partial<StaffRole>) => {
        const newRoles = roles.map(r => r.name === roleName ? { ...r, ...updates } : r);
        onRolesChange(newRoles);
    };

    const handleAssignDept = (roleName: string, deptId: string) => {
        const newRoles = roles.map(r =>
            r.name === roleName
                ? { ...r, departmentScope: deptId === 'global' ? [] : [deptId] }
                : r
        );
        onRolesChange(newRoles);
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = roles.findIndex((r) => r.name === active.id);
            const newIndex = roles.findIndex((r) => r.name === over.id);
            onRolesChange(arrayMove(roles, oldIndex, newIndex));
        }
    };

    const handleMoveRole = (index: number, direction: 'up' | 'down') => {
        const newRoles = [...roles];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newRoles.length) return;

        const temp = newRoles[index];
        newRoles[index] = newRoles[newIndex];
        newRoles[newIndex] = temp;

        onRolesChange(newRoles);
    };

    const filteredRoles = useMemo(() => {
        if (selectedDeptId === 'all') return roles;
        return roles.filter(r => {
            if (selectedDeptId === 'global') return (r.departmentScope || []).length === 0;
            if (selectedDeptId === 'OPERATIONS') return (r.departmentScope || []).includes('OPERATIONS');
            return (r.departmentScope || []).includes(selectedDeptId);
        });
    }, [roles, selectedDeptId]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departments Management */}
                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Departamentos</CardTitle>
                                <CardDescription className="text-xs">Unidades organizativas de la institución</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLoadInstitutional} className="text-[10px] font-bold h-7 px-2">
                            Cargar Estructura Institucional
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nuevo departamento..."
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                className="h-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                            />
                            <Button size="sm" onClick={handleAddDept} className="shrink-0">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Añadir
                            </Button>
                        </div>

                        <div className="rounded-xl border bg-muted/20 divide-y divide-muted/60 overflow-hidden">
                            <div className="flex items-center justify-between p-3 px-4 bg-muted/40">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Nombre</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Acción</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors cursor-pointer",
                                        selectedDeptId === 'global' && "bg-primary/10 border-r-2 border-primary"
                                    )}
                                    onClick={() => setSelectedDeptId('global')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full", selectedDeptId === 'global' ? "bg-primary" : "bg-slate-400")} />
                                        <span className={cn("text-sm font-medium", selectedDeptId === 'global' && "text-primary")}>Cargos Globales</span>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold">Base</Badge>
                                </div>
                                <div
                                    className={cn(
                                        "flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors cursor-pointer",
                                        selectedDeptId === 'all' && "bg-muted/50 border-r-2 border-muted-foreground/30"
                                    )}
                                    onClick={() => setSelectedDeptId('all')}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full", selectedDeptId === 'all' ? "bg-muted-foreground" : "bg-muted-foreground/40")} />
                                        <span className={cn("text-sm font-medium", selectedDeptId === 'all' && "text-foreground font-bold")}>Todos los departamentos</span>
                                    </div>
                                </div>
                                {departments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 px-4 hover:bg-muted/30 transition-colors group cursor-pointer",
                                            selectedDeptId === dept.id && "bg-primary/10 border-r-2 border-primary"
                                        )}
                                        onClick={() => setSelectedDeptId(dept.id)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn("h-2 w-2 rounded-full", selectedDeptId === dept.id ? "bg-primary" : "bg-primary/40")} />
                                            <span className={cn("text-sm font-medium truncate", selectedDeptId === dept.id && "text-primary")}>{dept.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveDepartment(dept.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {departments.length === 0 && (
                                    <div className="p-8 text-center text-xs text-muted-foreground font-medium italic">
                                        No hay departamentos personalizados.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Roles Management */}
                <Card className="shadow-sm border-muted/60">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Briefcase className="h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Cargos / Roles</CardTitle>
                                <CardDescription className="text-xs">Definición de funciones y su alcance</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Ver:</span>
                            <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                                <SelectTrigger className="h-7 text-[10px] w-[180px] bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los cargos</SelectItem>
                                    <SelectItem value="global">Cargos Globales</SelectItem>
                                    <SelectItem value="OPERATIONS">Operaciones</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nuevo cargo..."
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="h-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                            />
                            <Button size="sm" onClick={handleAddRole} className="shrink-0">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Añadir
                            </Button>
                        </div>

                        <div className="rounded-xl border bg-muted/20 divide-y divide-muted/60 overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 p-3 px-4 bg-muted/40">
                                <div className="col-span-5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Nombre</div>
                                <div className="col-span-4 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Alcance</div>
                                <div className="col-span-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-center">Único</div>
                                <div className="col-span-1"></div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {filteredRoles.map((role) => (
                                    <div key={role.name} className="grid grid-cols-12 gap-2 p-3 px-4 hover:bg-muted/30 transition-colors group items-center">
                                        <div className="col-span-5 min-w-0">
                                            <span className="text-sm font-medium truncate block" title={role.name}>{role.name}</span>
                                        </div>
                                        <div className="col-span-4">
                                            <Select
                                                value={(role.departmentScope ?? [])[0] || 'global'}
                                                onValueChange={(val) => handleAssignDept(role.name, val)}
                                            >
                                                <SelectTrigger className="h-7 text-[11px] bg-background">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="global">Cargos Globales</SelectItem>
                                                    <SelectItem value="OPERATIONS">Operaciones</SelectItem>
                                                    {departments.map(d => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <Switch
                                                checked={role.isSingle}
                                                onCheckedChange={(checked) => handleUpdateRole(role.name, { isSingle: checked })}
                                                className="scale-75"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={() => onRemoveRole(role.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredRoles.length === 0 && (
                                    <div className="p-8 text-center text-xs text-muted-foreground font-medium italic">
                                        No hay cargos definidos para este filtro.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Orden del Día Organization */}
            <Card className="shadow-sm border-primary/20 bg-primary/5">
                <CardHeader className="pb-3 border-b border-primary/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/20 text-primary">
                            <LayoutGrid className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Organización de la Orden del Día</CardTitle>
                            <CardDescription className="text-xs">Define el orden en que aparecerán los cargos en los reportes operativos.</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <Select
                            value=""
                            onValueChange={(val) => {
                                const newRoles = roles.map(r => r.name === val ? { ...r, isHidden: false } : r);
                                onRolesChange(newRoles);
                                toast.success(`Cargo "${val}" añadido a la organización.`);
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs bg-white/50 border-primary/20 w-[200px]">
                                <PlusCircle className="h-3 w-3 mr-2" />
                                <SelectValue placeholder="Añadir cargo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.filter(r => r.isHidden).map(role => (
                                    <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                                ))}
                                {roles.filter(r => r.isHidden).length === 0 && (
                                    <div className="p-2 text-[10px] text-center text-muted-foreground italic">No hay más cargos ocultos</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="divide-y divide-primary/5">
                            <SortableContext items={roles.filter(r => !r.isHidden).map(r => r.name)} strategy={verticalListSortingStrategy}>
                                {roles.filter(r => !r.isHidden).map((role, idx) => (
                                    <SortableRoleItem
                                        key={role.name}
                                        role={role}
                                        index={idx}
                                        departments={departments}
                                        onRemoveFromList={() => {
                                            const newRoles = roles.map(r => r.name === role.name ? { ...r, isHidden: true } : r);
                                            onRolesChange(newRoles);
                                            toast.info(`Cargo "${role.name}" quitado de la organización.`);
                                        }}
                                    />
                                ))}
                            </SortableContext>
                            {roles.filter(r => !r.isHidden).length === 0 && (
                                <div className="p-12 text-center text-sm text-primary/60 italic font-medium">
                                    No hay cargos visibles en la organización. <br />
                                    Usa el selector de arriba para añadir cargos.
                                </div>
                            )}
                        </div>
                    </DndContext>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
                <Button onClick={() => { onSave(); toast.success('Estructura guardada correctamente'); }} className="shadow-lg px-8">
                    Guardar Cambios de Estructura
                </Button>
            </div>
        </div>
    );
}

function SortableRoleItem({ role, index, departments, onRemoveFromList }: { role: StaffRole; index: number; departments: Department[]; onRemoveFromList: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: role.name });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between p-3 px-6 hover:bg-primary/10 transition-colors group",
                isDragging && "bg-primary/20 shadow-lg relative z-50 rounded-lg"
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-primary/40 hover:text-primary transition-colors">
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className={cn("text-sm font-bold truncate transition-opacity", role.isHidden && "opacity-40")}>{role.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">
                        {(role.departmentScope ?? []).length > 0
                            ? (role.departmentScope?.includes('OPERATIONS') ? 'Operaciones' : departments.find(d => d.id === (role.departmentScope ?? [])[0])?.name || 'Varios')
                            : 'Global'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-[10px] font-mono tabular-nums bg-primary/10 text-primary border-primary/20">#{index + 1}</Badge>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={onRemoveFromList}
                    title="Quitar de la lista de organización"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
