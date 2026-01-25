
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
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useGuards } from '@/hooks/use-guards';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useSettings } from '@/hooks/use-settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlobalTagsManager } from '@/components/global-tags-manager';
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

export default function SettingsPage() {
    const { units, saveUnits, isLoaded: unitsLoaded, clearAllUnits } = useUnits();
    const { roles: initialRoles, saveRoles, isLoaded: rolesLoaded, clearAllRoles } = useRoles();
    const { departments, addDepartment, removeDepartment, updateDepartment, isLoaded: deptsLoaded, clearAllDepartments } = useDepartments();
    const { settings, saveSettings, isLoaded: settingsLoaded, clearAllSettings } = useSettings();
    const { clearAllReports } = useReports();
    const { clearAllTemplates } = useTemplates();
    const { clearAllGuards } = useGuards();
    const { clearAllDefinitions } = useFieldDefinitions();

    const [newUnit, setNewUnit] = useState('');
    const [actionToConfirm, setActionToConfirm] = useState<string | null>(null);

    const isLoaded = unitsLoaded && rolesLoaded && deptsLoaded && settingsLoaded;

    const handleAddUnit = () => {
        if (newUnit && !units.includes(newUnit)) {
            saveUnits([...units, newUnit].sort());
            setNewUnit('');
        }
    };

    const handleRemoveUnit = (unitToRemove: string) => {
        saveUnits(units.filter(u => u !== unitToRemove));
    };

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

    const handleReportTagRoleChange = (value: string) => {
        saveSettings({ ...settings, reportaRoleId: value, analistaRoleId: value });
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
                        <CardTitle>Configuración de Etiquetas de Reporte</CardTitle>
                        <CardDescription>
                            Selecciona el cargo que se usará para rellenar las etiquetas dinámicas en los reportes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2 max-w-sm">
                            <Label>Cargo para etiquetas Reporta y Analista</Label>
                            <Select
                                value={settings.reportaRoleId}
                                onValueChange={handleReportTagRoleChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un cargo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {initialRoles.map(role => (
                                        <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <div className="flex flex-col sm:flex-row gap-2 sm:max-w-sm">
                                <Input
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    placeholder="Ej: Alpha 3"
                                    className="flex-1"
                                />
                                <Button onClick={handleAddUnit} className="w-full sm:w-auto">
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

                <GlobalTagsManager />

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
                        {Object.entries(resetOptions).map(([key, option]) => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 rounded-md border border-dashed border-destructive/50">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-destructive">{option.buttonLabel}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {option.description.split('.')[0]}.
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={() => setActionToConfirm(key)}
                                    className="w-full sm:w-auto shrink-0 shadow-sm"
                                >
                                    {option.buttonLabel}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>


            <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => !open && setActionToConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionToConfirm && resetOptions[actionToConfirm]?.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionToConfirm && resetOptions[actionToConfirm]?.description}
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
