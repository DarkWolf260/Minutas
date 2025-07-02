
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useRoles } from '@/hooks/use-roles';
import type { FieldConfig, FieldType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SortableFieldItem({ fieldName, config, onUpdate, onRemove }: { fieldName: string; config: FieldConfig; onUpdate: (fieldName: string, newConfig: FieldConfig) => void; onRemove: () => void; }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fieldName });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
    };
    
    if (!config) {
        return null;
    }

    const handleTypeChange = (value: FieldType) => {
        onUpdate(fieldName, { ...config, type: value });
    };
    
    return (
        <Card ref={setNodeRef} style={style} className="p-3 bg-muted/50 touch-none">
            <div className="flex items-center gap-4">
                <span {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </span>
                <Label htmlFor={fieldName} className="flex-1 font-semibold">{config.label}</Label>
                <Select
                    value={config.type || 'text'}
                    onValueChange={handleTypeChange}
                >
                    <SelectTrigger className="w-[140px] bg-background h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="textarea">Área de Texto</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    );
}

export function GlobalTagsManager() {
    const { definitions, saveDefinitions, removeDefinition, isLoaded: definitionsLoaded } = useFieldDefinitions();
    const { roles, isLoaded: rolesLoaded } = useRoles();
    const [newDefinitionName, setNewDefinitionName] = useState('');
    const [definitionToRemove, setDefinitionToRemove] = useState<string | null>(null);

    // Derive orderedFields directly from definitions to prevent stale state issues.
    const orderedFields = useMemo(() => Object.keys(definitions), [definitions]);

    const handleUpdateDefinition = (fieldName: string, newConfig: FieldConfig) => {
        const newDefinitions = { ...definitions, [fieldName]: newConfig };
        saveDefinitions(newDefinitions);
    };

    const handleAddDefinition = () => {
        if (newDefinitionName.trim() && !definitions[newDefinitionName.trim()]) {
            const newName = newDefinitionName.trim();
            const newDefinitions = {
                ...definitions,
                [newName]: { label: newName, type: 'text', value: '', sectionId: 'custom' },
            };
            saveDefinitions(newDefinitions);
            setNewDefinitionName('');
        }
    };
    
    const handleConfirmRemove = () => {
        if (definitionToRemove) {
            removeDefinition(definitionToRemove);
            setDefinitionToRemove(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        // Ensure `over` is not null and we are not dropping on the same item
        if (over && active.id !== over.id) {
            const oldIndex = orderedFields.indexOf(active.id as string);
            const newIndex = orderedFields.indexOf(over.id as string);
            
            if (oldIndex === -1 || newIndex === -1) {
                return;
            }

            const newOrder = arrayMove(orderedFields, oldIndex, newIndex);
            
            const newDefinitions: Record<string, FieldConfig> = {};
            newOrder.forEach(key => {
                if (definitions[key]) {
                    newDefinitions[key] = definitions[key];
                }
            });
            saveDefinitions(newDefinitions);
        }
    };
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const defaultFieldKeys = useMemo(() => ['Municipio', 'Estado', 'Director', 'Jefe de Operaciones', 'REDAN', 'ZOEDAN', 'Fecha', 'Hora'], []);

    const generalFields = useMemo(() => {
        return defaultFieldKeys.filter(key => definitions[key]);
    }, [definitions, defaultFieldKeys]);

    const customFields = useMemo(() => orderedFields.filter(key => !defaultFieldKeys.includes(key) && definitions[key]?.type !== 'textarea' && !definitions[key]?.label.startsWith('Descripción') && !definitions[key]?.label.startsWith('Conclusión')), [orderedFields, defaultFieldKeys, definitions]);

    if (!definitionsLoaded || !rolesLoaded) {
        return (
             <Card className="max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-20 w-full" />
                     <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <>
            <Card className="max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>Gestor de Etiquetas Globales</CardTitle>
                    <CardDescription>
                        Define etiquetas predefinidas para toda la aplicación y consulta las etiquetas generadas por los cargos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Datos Generales</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Estos valores se usarán en todas las plantillas que incluyan la etiqueta correspondiente (ej. {`{Municipio}`}). Las etiquetas "Fecha" y "Hora" son fijas.
                        </p>
                        <div className="space-y-2">
                             {generalFields.map(key => {
                                const config = definitions[key];
                                if (!config) return null; // Defensive check
                                return (
                                <div key={key} className="flex items-center gap-4 rounded-md border p-3 bg-card">
                                    <Label htmlFor={key} className="w-48 font-semibold shrink-0">{config.label}</Label>
                                    <Input
                                        id={key}
                                        value={config.value || ''}
                                        onChange={(e) => handleUpdateDefinition(key, { ...config, value: e.target.value })}
                                        className="bg-background"
                                        disabled={key === 'Hora' || key === 'Fecha'}
                                    />
                                </div>
                             )})}
                        </div>
                    </div>
                    
                    <Separator />

                    <div>
                         <h3 className="text-lg font-semibold mb-2">Etiquetas Personalizadas</h3>
                         <p className="text-sm text-muted-foreground mb-4">
                            Añade tus propias etiquetas globales y define su tipo de campo por defecto (ej. Texto, Área de texto). Puedes reordenarlas arrastrándolas.
                        </p>
                        <div className="space-y-2 mb-4 max-w-md">
                             <Label>Añadir Nueva Etiqueta</Label>
                             <div className="flex gap-2">
                                <Input
                                    value={newDefinitionName}
                                    onChange={(e) => setNewDefinitionName(e.target.value)}
                                    placeholder="Ej: Lesionados"
                                />
                                <Button onClick={handleAddDefinition}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir
                                </Button>
                             </div>
                        </div>

                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <SortableContext items={customFields} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                     {customFields.map(key => (
                                        <SortableFieldItem 
                                            key={key}
                                            fieldName={key}
                                            config={definitions[key]}
                                            onUpdate={handleUpdateDefinition}
                                            onRemove={() => setDefinitionToRemove(key)}
                                        />
                                     ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                        {customFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center p-4 border-2 border-dashed rounded-md mt-4">
                                No has creado etiquetas personalizadas.
                            </p>
                        )}
                    </div>

                    <Separator />
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Etiquetas de Cargos</h3>
                         <p className="text-sm text-muted-foreground mb-4">
                            Estas etiquetas se generan automáticamente a partir de los cargos que definas en Configuración. Úsalas en tus plantillas (ej. {`{Jefe de los Servicios}`}).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {roles.map(role => (
                                <Badge key={role.name} variant="secondary">{role.name}</Badge>
                            ))}
                             {roles.length === 0 && <p className="text-sm text-muted-foreground">No hay cargos definidos.</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!definitionToRemove} onOpenChange={(open) => !open && setDefinitionToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La etiqueta "{definitionToRemove}" será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDefinitionToRemove(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRemove}>
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
