'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useRoles } from '@/hooks/use-roles';
import type { FieldConfig } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnits } from '@/hooks/use-units';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ChevronUp, ChevronDown, Save, PlusCircle } from 'lucide-react';

export function GlobalTagsManager() {
  const {
    definitions,
    saveDefinitions,
    isLoaded: definitionsLoaded,
  } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { units, saveUnits, isLoaded: unitsLoadedHook } = useUnits();
  
  // Use local state to avoid saving on every keystroke
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [localReportaRoles, setLocalReportaRoles] = useState<string[]>([]);
  const [localUnits, setLocalUnits] = useState<string[]>([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when data loads
  useEffect(() => {
    if (definitionsLoaded) {
      const values: Record<string, string> = {};
      Object.keys(definitions).forEach(key => {
        values[key] = definitions[key]?.value || '';
      });
      setLocalValues(values);
    }
  }, [definitions, definitionsLoaded]);

  useEffect(() => {
    if (settingsLoaded) {
      setLocalReportaRoles(settings.reportaRoleIds || []);
    }
  }, [settings, settingsLoaded]);

  useEffect(() => {
    if (unitsLoadedHook) {
      setLocalUnits([...units]);
    }
  }, [units, unitsLoadedHook]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save definitions
      const newDefinitions = { ...definitions };
      Object.keys(localValues).forEach(key => {
        if (newDefinitions[key]) {
          newDefinitions[key] = { ...newDefinitions[key]!, value: localValues[key] || '' };
        }
      });
      
      // 2. Perform all saves
      await Promise.all([
        saveDefinitions(newDefinitions),
        saveSettings({ ...settings, reportaRoleIds: localReportaRoles }),
        saveUnits([...localUnits].sort())
      ]);
      
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReportRole = (roleName: string) => {
    if (roleName && !localReportaRoles.includes(roleName)) {
      setLocalReportaRoles(prev => [...prev, roleName]);
    }
  };

  const handleRemoveReportRole = (roleName: string) => {
    setLocalReportaRoles(prev => prev.filter(r => r !== roleName));
  };

  const handleMoveReportRole = (index: number, direction: 'up' | 'down') => {
    const newRoles = [...localReportaRoles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newRoles.length) {
      const temp = newRoles[index]!;
      newRoles[index] = newRoles[targetIndex]!;
      newRoles[targetIndex] = temp;
      setLocalReportaRoles(newRoles);
    }
  };

  const handleAddLocalUnit = () => {
    if (newUnitName && !localUnits.includes(newUnitName)) {
      setLocalUnits(prev => [...prev, newUnitName]);
      setNewUnitName('');
    }
  };

  const handleRemoveLocalUnit = (unitToRemove: string) => {
    setLocalUnits(prev => prev.filter(u => u !== unitToRemove));
  };

  const allDefaultFieldKeys = useMemo(() => ['Municipio', 'Estado', 'REDAN', 'ZOEDAN'], []);
  const orderedFields = useMemo(() => Object.keys(definitions), [definitions]);

  const generalFields = useMemo(() => {
    return orderedFields.filter((key: string) => definitions[key] && allDefaultFieldKeys.includes(key));
  }, [orderedFields, definitions, allDefaultFieldKeys]);

  if (!definitionsLoaded || !rolesLoaded || !unitsLoadedHook || !settingsLoaded) {
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
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Define los valores globales que se utilizarán automáticamente en tus reportes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {generalFields.map((key: string) => {
                const config = definitions[key];
                if (!config) return null;
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {config.label}
                    </Label>
                    <Input
                      id={key}
                      value={localValues[key] || ''}
                      onChange={(e) =>
                        setLocalValues(prev => ({ ...prev, [key]: e.target.value }))
                      }
                      className="bg-background w-full"
                      disabled={key === 'Hora' || key === 'Fecha'}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Personal que Reporta</h4>
              <p className="text-xs text-muted-foreground">
                Gestiona los cargos que se usarán para rellenar la etiqueta [Reporta].
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Añadir Cargo
                </Label>
                <Select onValueChange={handleAddReportRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecciona un cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((role) => !localReportaRoles.includes(role.name))
                      .map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cargos Seleccionados (Prioridad)
                </Label>
                <div className="space-y-2 rounded-md border p-2 bg-muted/5 min-h-[50px]">
                  {localReportaRoles.length > 0 ? (
                    localReportaRoles.map((roleName, index) => (
                      <div
                        key={roleName}
                        className="flex items-center justify-between rounded-md p-2 bg-background border shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{roleName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveReportRole(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveReportRole(index, 'down')}
                            disabled={index === localReportaRoles.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Separator orientation="vertical" className="h-4 mx-1" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveReportRole(roleName)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-[11px] text-muted-foreground italic">
                      No has seleccionado ningún cargo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Gestión de Unidades</h4>
              <p className="text-xs text-muted-foreground">
                Añade o elimina unidades de la lista de vehículos operativos.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Añadir Nueva Unidad
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: Alpha 3"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLocalUnit();
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 shrink-0" 
                    onClick={handleAddLocalUnit}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Unidades Operativas (Borrador)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-md border p-2 bg-muted/5">
                  {localUnits.length > 0 ? (
                    localUnits.map((unit) => (
                      <div
                        key={unit}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 bg-background border shadow-sm group"
                      >
                        <span className="text-[11px] font-medium truncate pr-1">{unit}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleRemoveLocalUnit(unit)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-2 text-center text-[10px] text-muted-foreground italic">
                      No hay unidades configuradas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2 shrink-0 shadow-sm"
              title="Guardar Configuración"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
