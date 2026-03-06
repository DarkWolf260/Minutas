
import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LayoutGrid, PlusCircle, GripVertical } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Department, StaffRole } from '@/types';
import { SortableRoleItem } from './sortable-role-item';

interface RoleSortableListProps {
    roles: StaffRole[];
    departments: Department[];
    onUpdateRole: (name: string, updates: Partial<StaffRole>) => void;
    onReorder: (activeId: string, overId: string) => void;
}

export function RoleSortableList({
    roles,
    departments,
    onUpdateRole,
    onReorder,
}: RoleSortableListProps) {
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const activeRole = React.useMemo(
        () => roles.find((r) => r.name === activeId),
        [roles, activeId]
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && over) {
            onReorder(active.id as string, over.id as string);
        }
        setActiveId(null);
    };

    const visibleRoles = roles.filter((r) => !r.isHidden);
    const hiddenRoles = roles.filter((r) => r.isHidden);

    return (
        <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="pb-3 border-b border-primary/10">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary">
                        <LayoutGrid className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Organización de la Orden del Día</CardTitle>
                        <CardDescription className="text-xs">
                            Define el orden en que aparecerán los cargos en los reportes operativos.
                        </CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <Select
                        value=""
                        onValueChange={(val) => {
                            onUpdateRole(val, { isHidden: false });
                            toast.success(`Cargo "${val}" añadido localmente a la organización.`);
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs bg-white/50 border-primary/20 w-[200px]">
                            <PlusCircle className="h-3 w-3 mr-2" />
                            <SelectValue placeholder="Añadir cargo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {hiddenRoles.map((role) => (
                                <SelectItem key={role.name} value={role.name}>
                                    {role.name}
                                </SelectItem>
                            ))}
                            {hiddenRoles.length === 0 && (
                                <div className="p-2 text-[10px] text-center text-muted-foreground italic">
                                    No hay más cargos ocultos
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="divide-y divide-primary/5">
                        <SortableContext
                            items={visibleRoles.map((r) => r.name)}
                            strategy={verticalListSortingStrategy}
                        >
                            {visibleRoles.map((role, idx) => (
                                <SortableRoleItem
                                    key={role.name}
                                    role={role}
                                    index={idx}
                                    departments={departments}
                                    onRemoveFromList={() => {
                                        onUpdateRole(role.name, { isHidden: true });
                                        toast.info(`Cargo "${role.name}" quitado de la organización.`);
                                    }}
                                />
                            ))}
                        </SortableContext>
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
                            {activeId && activeRole ? (
                                <div className="flex items-center justify-between p-3 px-6 bg-background border rounded-lg shadow-xl ring-2 ring-primary/20">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="text-primary shrink-0 cursor-grabbing p-1">
                                            <GripVertical className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate">{activeRole.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-mono">
                                                {(activeRole.departmentScope ?? []).length > 0
                                                    ? departments.find(
                                                        (d) => d.id === (activeRole.departmentScope ?? [])[0]
                                                    )?.name || 'Varios'
                                                    : 'Global'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>
                        {visibleRoles.length === 0 && (
                            <div className="p-12 text-center text-sm text-primary/60 italic font-medium">
                                No hay cargos visibles en la organización. <br />
                                Usa el selector de arriba para añadir cargos.
                            </div>
                        )}
                    </div>
                </DndContext>
            </CardContent>
        </Card>
    );
}
