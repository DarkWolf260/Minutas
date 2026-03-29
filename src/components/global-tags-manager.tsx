'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useRoles } from '@/hooks/use-roles';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/use-settings';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';

export function GlobalTagsManager() {
  const { definitions, saveDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  
  // Use local state to avoid saving on every keystroke
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [localReportaRoles, setLocalReportaRoles] = useState<string[]>([]);
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
        saveSettings({ ...settings, reportaRoleIds: localReportaRoles })
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

  const allDefaultFieldKeys = useMemo(() => ['Municipio', 'Estado', 'REDAN', 'ZOEDAN'], []);
  const orderedFields = useMemo(() => Object.keys(definitions), [definitions]);

  const generalFields = useMemo(() => {
    return orderedFields.filter((key: string) => definitions[key] && allDefaultFieldKeys.includes(key));
  }, [orderedFields, definitions, allDefaultFieldKeys]);

  if (!definitionsLoaded || !rolesLoaded || !settingsLoaded) {
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
    <Card className="shadow-lg h-full">
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
  );
}
