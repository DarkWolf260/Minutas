'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
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
import type { FieldConfig, FieldType, SnippetOption } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnits } from '@/hooks/use-units';
import { SnippetOptionEditor } from './snippet-option-editor';

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
        <Card ref={setNodeRef} style={style} className="bg-card p-0 touch-none">
            <div className="flex items-center gap-4 p-3">
                <span {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                </span>
                <Label htmlFor={fieldName} className="flex-1 font-semibold">{config.label}</Label>
                <Select
                    value={config.type || 'text'}
                    onValueChange={handleTypeChange}
                >
                    <SelectTrigger className="w-[150px] bg-background h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="textarea">Área de Texto</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            {config.type === 'dropdown' && (
                <div className="pb-3 pr-3">
                    <SnippetOptionEditor 
                        config={config}
                        onUpdate={(newConfig) => onUpdate(fieldName, newConfig)}
                    />
                </div>
            )}
        </Card>
    );
}

export function GlobalTagsManager() {
    const { definitions, saveDefinitions, removeDefinition, isLoaded: definitionsLoaded } = useFieldDefinitions();
    const { roles, isLoaded: rolesLoaded } = useRoles();
    const { units, isLoaded: unitsLoaded } = useUnits();
    const [newDefinitionName, setNewDefinitionName] = useState('');
    const [definitionToRemove, setDefinitionToRemove] = useState<string | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const orderedFields = useMemo(() => Object.keys(definitions), [definitions]);

    const handleUpdateDefinition = (fieldName: string, newConfig: FieldConfig) => {
        const newDefinitions = { ...definitions, [fieldName]: newConfig };
        saveDefinitions(newDefinitions);
    };

    const handleAddDefinition = () => {
        const newName = newDefinitionName.trim();
        if (!newName) return;

        const definitionExists = Object.keys(definitions).some(
            key => key.toLowerCase() === newName.toLowerCase()
        );

        if (definitionExists) {
            setFeedbackMessage(`La etiqueta "${newName}" ya existe o es una etiqueta general.`);
            setTimeout(() => setFeedbackMessage(''), 3000);
            return;
        }
        
        const newDefinitions = {
            ...definitions,
            [newName]: { label: newName, type: 'text', value: '', sectionId: 'custom' },
        };
        saveDefinitions(newDefinitions);
        setNewDefinitionName('');
        setFeedbackMessage('');
    };
    
    const handleConfirmRemove = () => {
        if (definitionToRemove) {
            removeDefinition(definitionToRemove);
            setDefinitionToRemove(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
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

    const allDefaultFieldKeys = useMemo(() => [
        'Municipio', 'Estado', 'Director', 'Jefe de Operaciones', 'REDAN', 'ZOEDAN', 'Fecha', 'Hora'
    ], []);

    const generalFields = useMemo(() => {
         return orderedFields.filter(key => definitions[key] && allDefaultFieldKeys.includes(key));
    }, [orderedFields, definitions, allDefaultFieldKeys]);


    const customFields = useMemo(() => {
        return orderedFields.filter(key => definitions[key] && !allDefaultFieldKeys.includes(key));
    }, [orderedFields, definitions, allDefaultFieldKeys]);


    if (!definitionsLoaded || !rolesLoaded || !unitsLoaded) {
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
                                if (!config) return null;
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
                            Añade tus propias etiquetas globales y define su tipo de campo por defecto. Para los "Dropdown", puedes definir una lista de opciones con texto predefinido.
                        </p>
                        <div className="space-y-2 mb-4 max-w-md">
                             <Label>Añadir Nueva Etiqueta</Label>
                             <div className="flex gap-2">
                                <Input
                                    value={newDefinitionName}
                                    onChange={(e) => setNewDefinitionName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddDefinition();
                                        }
                                    }}
                                    placeholder="Ej: Lesionados"
                                />
                                <Button onClick={handleAddDefinition}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir
                                </Button>
                             </div>
                             {feedbackMessage && <p className="text-sm text-destructive pt-1">{feedbackMessage}</p>}
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
                        <h3 className="text-lg font-semibold mb-2">Etiquetas de Cargos y Unidades</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Estas etiquetas se generan automáticamente a partir de los cargos y unidades definidos en <Link href="/settings" className="text-primary underline">Configuración</Link>. La etiqueta <code className="font-mono bg-muted px-1 py-0.5 rounded">{`{Unidad}`}</code> es especial: se convertirá automáticamente en un campo de selección para las unidades que hayas registrado.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {roles.map(role => (
                                <Badge key={role.name} variant="secondary">{role.name}</Badge>
                            ))}
                            <Badge variant="outline">Unidad</Badge>
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
