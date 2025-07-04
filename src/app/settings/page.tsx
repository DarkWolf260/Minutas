
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { StaffRole, Department } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { useDepartments } from '@/hooks/use-departments';
import { GuardStaffEditor } from '@/components/guard-staff-editor';
import { useUnits } from '@/hooks/use-units';
import { useRoles } from '@/hooks/use-roles';
import { Switch } from '@/components/ui/switch';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
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
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useGuards } from '@/hooks/use-guards';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useSettings } from '@/hooks/use-settings';

function SortableRoleItem({ role, onRemove, onToggleSingle }: { role: StaffRole; onRemove: (role: StaffRole) => void; onToggleSingle: (name: string, checked: boolean) => void }) {
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
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card ref={setNodeRef} style={style} className="p-2 bg-background touch-none">
             <div className="flex items-center gap-2">
                <span {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </span>
                <span className="font-medium flex-1 min-w-0 truncate text-sm" title={role.name}>{role.name}</span>
                <div className="flex items-center space-x-1 shrink-0 ml-auto">
                    <Switch
                        checked={role.isSingle}
                        onCheckedChange={(checked) => onToggleSingle(role.name, checked)}
                        aria-label={`Marcar como cargo único para ${role.name}`}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onRemove(role)} aria-label={`Eliminar cargo ${role.name}`}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function RoleColumn({ id, title, roles, onPrepareRemove, onToggleRoleSingle, onPrepareRemoveDepartment }: { id: string, title: string, roles: StaffRole[], onPrepareRemove: (role: StaffRole) => void, onToggleRoleSingle: (name: string, checked: boolean) => void, onPrepareRemoveDepartment: (deptId: string) => void }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <Card ref={setNodeRef} className="flex flex-col bg-muted/50 min-h-64">
            <CardHeader className='p-3 border-b flex flex-row items-center justify-between'>
                <CardTitle className='text-base'>{title}</CardTitle>
                {id !== 'unassigned' && id !== 'OPERATIONS' && (
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onPrepareRemoveDepartment(id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="p-2 space-y-2 flex-1">
                <SortableContext items={roles.map(r => r.name)} strategy={verticalListSortingStrategy}>
                    {roles.map(role => (
                        <SortableRoleItem 
                            key={role.name} 
                            role={role}
                            onRemove={onPrepareRemove}
                            onToggleSingle={onToggleRoleSingle}
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
    )
}

function RoleManager({
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
        return activeId ? roles.find(r => r.name === activeId) : null;
    }, [activeId, roles]);

    const handleAddRole = () => {
        if (newRoleName.trim() && !roles.find(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase())) {
            const newRole: StaffRole = {
                name: newRoleName.trim(),
                isSingle: false,
                departmentScope: ['OPERATIONS']
            };
            onRolesChange([...roles, newRole]);
            setNewRoleName('');
        }
    };

    const handleToggleSingle = (roleName: string, checked: boolean) => {
        onRolesChange(roles.map(r => r.name === roleName ? {...r, isSingle: checked} : r));
    };

    const handleSaveChanges = () => {
        onSave();
        setFeedback('¡Cargos guardados exitosamente!');
        setTimeout(() => setFeedback(''), 3000);
    };

    const allDepartments = useMemo(() => ([
        { id: 'OPERATIONS', name: 'Operaciones' },
        ...departments
    ]), [departments]);

    const roleBuckets = useMemo(() => {
        const buckets: Record<string, StaffRole[]> = {
            unassigned: []
        };
        allDepartments.forEach(d => buckets[d.id] = []);

        roles.forEach(role => {
            const scope = (role.departmentScope ?? [])[0] || 'unassigned';
            if (buckets[scope]) {
                buckets[scope].push(role);
            } else {
                buckets.unassigned.push(role);
            }
        });
        return buckets;
    }, [roles, allDepartments]);
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function findContainer(id: string) {
        if (roleBuckets[id]) {
            return id;
        }
        return Object.keys(roleBuckets).find((key) => roleBuckets[key].some(r => r.name === id));
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

        onRolesChange((prevRoles) => {
            const activeIndex = prevRoles.findIndex((r) => r.name === activeId);
            const newRoles = [...prevRoles];
            newRoles[activeIndex] = {
                ...newRoles[activeIndex],
                departmentScope: overContainer === 'unassigned' ? [] : [overContainer],
            };
            
            return newRoles;
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        
        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over.id as string);
        
        if (!activeContainer || !overContainer) return;

        if (active.id !== over.id && activeContainer === overContainer) {
             onRolesChange((currentRoles) => {
                const oldIndex = currentRoles.findIndex((r) => r.name === active.id);
                const newIndex = currentRoles.findIndex((r) => r.name === over.id);
                return arrayMove(currentRoles, oldIndex, newIndex);
            });
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
                        roles={roleBuckets.unassigned} 
                        onPrepareRemove={onPrepareRemoveRole} 
                        onToggleRoleSingle={handleToggleSingle}
                        onPrepareRemoveDepartment={() => {}}
                    />
                    {allDepartments.map(dept => (
                        <RoleColumn 
                            key={dept.id} 
                            id={dept.id} 
                            title={dept.name} 
                            roles={roleBuckets[dept.id] || []} 
                            onPrepareRemove={onPrepareRemoveRole} 
                            onToggleRoleSingle={handleToggleSingle}
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
                    <Card className="p-2 bg-background touch-none shadow-xl">
                        <div className="flex items-center gap-2">
                            <span className="cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
                                <GripVertical className="h-5 w-5" />
                            </span>
                            <span className="font-medium flex-1 min-w-0 truncate text-sm" title={activeRole.name}>{activeRole.name}</span>
                            <div className="flex items-center space-x-1 shrink-0 ml-auto">
                                <Switch
                                    checked={activeRole.isSingle}
                                />
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
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

export default function SettingsPage() {
    const { units, saveUnits, isLoaded: unitsLoaded, clearAllUnits } = useUnits();
    const { roles: initialRoles, saveRoles, isLoaded: rolesLoaded, clearAllRoles } = useRoles();
    const { departments, addDepartment, removeDepartment, updateDepartment, isLoaded: deptsLoaded, clearAllDepartments } = useDepartments();
    const { clearAllReports } = useReports();
    const { clearAllTemplates } = useTemplates();
    const { clearAllGuards } = useGuards();
    const { clearAllDefinitions } = useFieldDefinitions();
    const { clearAllSettings } = useSettings();
    
    const [newUnit, setNewUnit] = useState('');
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [departmentStaffFeedback, setDepartmentStaffFeedback] = useState('');

    const [editableRoles, setEditableRoles] = useState<StaffRole[]>([]);
    
    const [roleToDelete, setRoleToDelete] = useState<StaffRole | null>(null);
    const [departmentIdToDelete, setDepartmentIdToDelete] = useState<string | null>(null);

    const [actionToConfirm, setActionToConfirm] = useState<string | null>(null);


    useEffect(() => {
        if (rolesLoaded) {
          setEditableRoles(initialRoles);
        }
    }, [initialRoles, rolesLoaded]);

    const showDepartmentFeedback = (message: string) => {
        setDepartmentStaffFeedback(message);
        setTimeout(() => setDepartmentStaffFeedback(''), 3000);
    };

    const handleDepartmentStaffSave = useCallback((deptName: string) => {
        showDepartmentFeedback(`Personal de "${deptName}" guardado.`);
    }, []);

    const handleAddUnit = () => {
        if (newUnit && !units.includes(newUnit)) {
          saveUnits([...units, newUnit].sort());
          setNewUnit('');
        }
    };

    const handleRemoveUnit = (unitToRemove: string) => {
        saveUnits(units.filter((unit) => unit !== unitToRemove));
    };

    const handleAddDepartment = () => {
        if (newDepartmentName.trim() && !departments.find(d => d.name.toLowerCase() === newDepartmentName.trim().toLowerCase())) {
            addDepartment({
                id: `dept_${Date.now()}`,
                name: newDepartmentName.trim(),
                staff: {}
            });
            setNewDepartmentName('');
        }
    };
    
    const handlePrepareRemoveRole = (role: StaffRole) => {
        setRoleToDelete(role);
    };

    const handleConfirmRemoveRole = () => {
        if (roleToDelete) {
            const newRoles = editableRoles.filter(r => r.name !== roleToDelete.name);
            setEditableRoles(newRoles);
            saveRoles(newRoles);
            setRoleToDelete(null);
        }
    };
    
    const handlePrepareRemoveDepartment = (deptId: string) => {
        setDepartmentIdToDelete(deptId);
    };

    const handleConfirmRemoveDepartment = () => {
        if (departmentIdToDelete) {
            removeDepartment(departmentIdToDelete);
            // Also update roles that were assigned to this department
            const newRoles = editableRoles.map(r => ({
                ...r,
                departmentScope: r.departmentScope.filter(id => id !== departmentIdToDelete)
            }));
            setEditableRoles(newRoles);
            saveRoles(newRoles);
            setDepartmentIdToDelete(null);
        }
    };
    
    const departmentBeingDeleted = useMemo(() => {
        if (!departmentIdToDelete) return null;
        return departments.find(d => d.id === departmentIdToDelete) || null;
    }, [departmentIdToDelete, departments]);


    const isLoaded = unitsLoaded && rolesLoaded && deptsLoaded;
    
    const handleConfirmReset = () => {
        if (!actionToConfirm) return;

        switch (actionToConfirm) {
            case 'reports':
                clearAllReports();
                break;
            case 'templates':
                clearAllTemplates();
                break;
            case 'staff':
                clearAllRoles();
                clearAllDepartments();
                clearAllGuards();
                clearAllUnits();
                break;
            case 'definitions':
                clearAllDefinitions();
                break;
            case 'all':
                clearAllReports();
                clearAllTemplates();
                clearAllRoles();
                clearAllDepartments();
                clearAllGuards();
                clearAllUnits();
                clearAllDefinitions();
                clearAllSettings();
                localStorage.removeItem('app-report-draft');
                localStorage.removeItem('report-app-welcome-seen');
                window.location.reload();
                break;
        }

        setActionToConfirm(null);
    };

    const resetOptions: { [key: string]: { title: string; description: string; buttonLabel: string; } } = {
        reports: {
            title: '¿Limpiar todos los reportes?',
            description: 'Esta acción es irreversible. Se eliminarán permanentemente todos los reportes de novedades que has guardado.',
            buttonLabel: 'Limpiar Reportes'
        },
        templates: {
            title: '¿Limpiar todas las plantillas?',
            description: 'Esta acción es irreversible. Se eliminarán permanentemente todas las plantillas y sus configuraciones asociadas.',
            buttonLabel: 'Limpiar Plantillas'
        },
        staff: {
            title: '¿Restablecer personal, guardias y unidades?',
            description: 'Se eliminarán todas las guardias, departamentos, cargos personalizados y unidades, volviendo a la configuración por defecto. El personal y las unidades asignadas se perderán.',
            buttonLabel: 'Restablecer Personal y Unidades'
        },
        definitions: {
            title: '¿Restablecer etiquetas globales?',
            description: 'Se eliminarán todas las etiquetas globales personalizadas, volviendo a la configuración por defecto.',
            buttonLabel: 'Restablecer Etiquetas'
        },
        all: {
            title: '¿Restablecer toda la aplicación?',
            description: '¡ADVERTENCIA! Esta acción es irreversible. Se eliminará TODA la información guardada (reportes, plantillas, configuraciones, personal) y se restaurará la aplicación a su estado inicial. Es como abrirla por primera vez.',
            buttonLabel: 'Restablecer Toda la Aplicación'
        }
    };

    if (!isLoaded) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
                <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
                <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
            </div>
        );
    }

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <Card className="max-w-4xl mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle>Gestión de Cargos y Departamentos</CardTitle>
                        <CardDescription>Define la estructura de personal de la organización. Arrastra los cargos para asignarlos a un departamento, luego asigna el personal a cada rol.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Cargos y Departamentos</h3>
                            <RoleManager 
                                roles={editableRoles} 
                                onRolesChange={setEditableRoles} 
                                onSave={() => saveRoles(editableRoles)}
                                departments={departments}
                                handleAddDepartment={handleAddDepartment}
                                newDepartmentName={newDepartmentName}
                                setNewDepartmentName={setNewDepartmentName}
                                onPrepareRemoveRole={handlePrepareRemoveRole}
                                onPrepareRemoveDepartment={handlePrepareRemoveDepartment}
                            />
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Asignación de Personal (Departamentos)</h3>
                             {departmentStaffFeedback && <p className="text-sm text-green-600 mb-4">{departmentStaffFeedback}</p>}
                            {departments.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {departments.map((dept) => (
                                        <div key={dept.id} className="space-y-4 rounded-lg border p-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-lg">Personal de {dept.name}</h4>
                                            </div>
                                            <GuardStaffEditor
                                                scopeId={dept.id}
                                                guard={dept}
                                                roles={editableRoles}
                                                onUpdate={(updated) => updateDepartment(updated as Department)}
                                                onSave={() => handleDepartmentStaffSave(dept.name)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ): (
                                 <p className="text-sm text-muted-foreground p-4 text-center border rounded-md col-span-full">No hay departamentos definidos.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="max-w-4xl mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle>Gestión de Unidades</CardTitle>
                        <CardDescription>Añade o elimina unidades de la lista de vehículos operativos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label>Añadir Nueva Unidad</Label>
                            <div className="flex gap-2 max-w-sm">
                                <Input
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    placeholder="Ej: Alpha 3"
                                />
                                <Button onClick={handleAddUnit}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Unidades Existentes</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-2">
                                {units.length > 0 ? (
                                    units.map((unit) => (
                                        <div key={unit} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50">
                                            <span>{unit}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveUnit(unit)}
                                                aria-label={`Eliminar Unidad ${unit}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-sm text-muted-foreground">
                                        No hay unidades.
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card className="max-w-4xl mx-auto shadow-lg border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle />
                            Zona de Peligro
                        </CardTitle>
                        <CardDescription>
                            Las siguientes acciones son destructivas y no se pueden deshacer. Úsalas con precaución.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.keys(resetOptions).map(key => (
                            <div key={key} className="flex items-center justify-between p-3 rounded-md border border-dashed border-destructive/50">
                                <div>
                                    <h4 className="font-semibold">{resetOptions[key].buttonLabel}</h4>
                                    <p className="text-sm text-muted-foreground">{resetOptions[key].description.split('.')[0]}.</p>
                                </div>
                                <Button variant="destructive" onClick={() => setActionToConfirm(key)}>
                                    {resetOptions[key].buttonLabel}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El cargo "{roleToDelete?.name}" será eliminado permanentemente de la lista de cargos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRemoveRole}>
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!departmentIdToDelete} onOpenChange={(open) => !open && setDepartmentIdToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El departamento "{departmentBeingDeleted?.name}" será eliminado. Todos los cargos asignados a él pasarán a la columna "Cargos Globales".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDepartmentIdToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRemoveDepartment}>
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => !open && setActionToConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{actionToConfirm ? resetOptions[actionToConfirm].title : ''}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionToConfirm ? resetOptions[actionToConfirm].description : ''}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setActionToConfirm(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmReset}>
                            Sí, continuar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
