
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import type { AppSettings, Guard } from '@/types';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { GuardStaffEditor } from '@/components/guard-staff-editor';
import { OrdenDelDiaForm } from '@/components/orden-del-dia';

export default function OrdenDelDiaPage() {
    // Hooks for both tabs
    const { guards, saveGuards, isLoaded: guardsLoaded } = useGuards();
    const { roles, isLoaded: rolesLoaded } = useRoles();
    const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();

    // State for Generador tab
    const [selectedGuardId, setSelectedGuardId] = useState<string>('');

    // State for Gestión tab
    const [newGuardName, setNewGuardName] = useState('');
    const [guardFeedback, setGuardFeedback] = useState('');
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [settingsFeedback, setSettingsFeedback] = useState('');

    // Sync local settings state when global settings change
    useEffect(() => {
        if (settingsLoaded) {
          setCurrentSettings(settings);
        }
    }, [settings, settingsLoaded]);
    
    // Sync selectedGuardId with the active guard from settings
    useEffect(() => {
        if (settingsLoaded && settings.activeGuardId && guardsLoaded && guards.some(g => g.id === settings.activeGuardId)) {
            setSelectedGuardId(settings.activeGuardId);
        }
    }, [settings, settingsLoaded, guards, guardsLoaded]);

    const handleActiveGuardChange = (guardId: string) => {
        if (!guardId) return;
        setSelectedGuardId(guardId);
        // Also update the global active guard setting
        const newSettings = { ...settings, activeGuardId: guardId };
        saveSettings(newSettings);
        setCurrentSettings(newSettings); // Keep local state in sync
    };

    // Handlers for Gestión tab
    const handleSettingChange = (key: keyof AppSettings, value: any) => {
        setCurrentSettings(prev => ({...prev, [key]: value}));
    };
    
    const handleSaveRotationSettings = () => {
        // Only save the duration, as activeGuardId is managed by the main selector
        const settingsToSave: AppSettings = {
            activeGuardId: settings.activeGuardId,
            guardShiftDuration: currentSettings.guardShiftDuration,
        };
        saveSettings(settingsToSave);
        setSettingsFeedback('¡Configuración de rotación guardada!');
        setTimeout(() => setSettingsFeedback(''), 3000);
    }
    
    const handleAddGuard = () => {
        if (newGuardName && !guards.find(g => g.id === newGuardName.toUpperCase())) {
          const newGuardObj: Guard = {
            id: newGuardName.toUpperCase(),
            staff: {},
          };
          const updatedGuards = [...guards, newGuardObj].sort((a, b) => a.id.localeCompare(b.id));
          saveGuards(updatedGuards);
          setNewGuardName('');
        }
    };
    
    const handleRemoveGuard = (guardIdToRemove: string) => {
        const updatedGuards = guards.filter((guard) => guard.id !== guardIdToRemove);
        saveGuards(updatedGuards);
    };

    const handleUpdateGuard = (updatedGuard: Guard) => {
        const updatedGuards = guards.map(g => g.id === updatedGuard.id ? updatedGuard : g);
        saveGuards(updatedGuards);
    };
    
    const showGuardFeedback = (message: string) => {
        setGuardFeedback(message);
        setTimeout(() => setGuardFeedback(''), 3000);
    }
    
    const handleGuardStaffSave = useCallback((guardId: string) => {
        showGuardFeedback(`Personal de la Guardia "${guardId}" guardado.`);
    }, []);

    const selectedGuardForForm = guards.find(g => g.id === selectedGuardId);

    const isLoaded = guardsLoaded && rolesLoaded && settingsLoaded;

    if (!isLoaded) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <Skeleton className="h-10 w-full max-w-sm mx-auto mb-4" />
                <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Tabs defaultValue="generador" className="max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generador">Generador de Orden del Día</TabsTrigger>
                    <TabsTrigger value="gestion">Gestión de Guardias</TabsTrigger>
                </TabsList>
                <TabsContent value="generador" className="mt-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Generar Orden del Día</CardTitle>
                            <CardDescription>
                                Selecciona una guardia para generar su reporte. Esta selección también definirá la guardia activa para el reporte de cierre.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2 max-w-xs">
                                    <Label htmlFor="guard-select">Guardia Activa</Label>
                                    <Select value={selectedGuardId} onValueChange={handleActiveGuardChange}>
                                        <SelectTrigger id="guard-select">
                                            <SelectValue placeholder="Selecciona una guardia..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {guards.map((guard) => (
                                                <SelectItem key={guard.id} value={guard.id}>
                                                    Guardia "{guard.id}"
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {selectedGuardId ? (
                                <OrdenDelDiaForm selectedGuard={selectedGuardId} initialData={selectedGuardForForm?.staff} />
                                ) : (
                                    <div className="text-center text-muted-foreground pt-10">
                                        Por favor, selecciona una guardia para empezar.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="gestion" className="mt-6">
                     <div className="space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Rotación de Guardia</CardTitle>
                                <CardDescription>
                                    La guardia activa se selecciona desde la pestaña "Generador". Aquí puedes configurar la duración del turno.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label>Guardia Activa Actual</Label>
                                        <div className="h-10 flex items-center px-3 py-2 rounded-md border border-input bg-muted">
                                            {settings.activeGuardId ? `Guardia "${settings.activeGuardId}"` : 'Ninguna seleccionada'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="shift-duration">Duración del Turno (horas)</Label>
                                        <Input
                                            id="shift-duration"
                                            type="number"
                                            value={currentSettings.guardShiftDuration || 24}
                                            onChange={(e) => handleSettingChange('guardShiftDuration', parseInt(e.target.value, 10) || 0)}
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end items-center gap-4">
                                    {settingsFeedback && <p className="text-sm text-green-600">{settingsFeedback}</p>}
                                    <Button onClick={handleSaveRotationSettings}>Guardar Configuración</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Personal de Operaciones</CardTitle>
                                <CardDescription>Añade guardias y asigna el personal a cada una.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label>Añadir Nueva Guardia</Label>
                                    <div className="flex gap-2 max-w-sm">
                                        <Input value={newGuardName} onChange={(e) => setNewGuardName(e.target.value)} placeholder="Ej: E" />
                                        <Button onClick={handleAddGuard}><PlusCircle className="mr-2 h-4 w-4" />Añadir</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Guardias Existentes</Label>
                                    {guardFeedback && <p className="text-sm text-green-600">{guardFeedback}</p>}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {guards.map((guard) => (
                                            <Card key={guard.id}>
                                                <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                                                    <CardTitle className="text-base">Guardia "{guard.id}"</CardTitle>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                                                        onClick={() => handleRemoveGuard(guard.id)}
                                                        aria-label={`Eliminar Guardia ${guard.id}`}
                                                    ><Trash2 className="h-4 w-4" /></Button>
                                                </CardHeader>
                                                <CardContent className="p-4">
                                                    <GuardStaffEditor
                                                        scopeId="OPERATIONS"
                                                        guard={guard}
                                                        roles={roles}
                                                        onUpdate={handleUpdateGuard}
                                                        onSave={() => handleGuardStaffSave(guard.id)}
                                                    />
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {guards.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center border rounded-md col-span-full">No hay guardias definidas.</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
