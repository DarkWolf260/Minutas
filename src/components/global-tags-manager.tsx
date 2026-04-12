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
import { useDepartments } from '@/hooks/use-departments';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';

export function GlobalTagsManager() {
  const { definitions, saveDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { departments, isLoaded: deptsLoaded } = useDepartments();

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
      const existingRoleNames = new Set(roles.map(r => r.name));
      const cleanedReportaRoles = localReportaRoles.filter(role => existingRoleNames.has(role));
      
      await Promise.all([
        saveDefinitions(newDefinitions),
        saveSettings({ ...settings, reportaRoleIds: cleanedReportaRoles })
      ]);

      // Update local state with cleaned roles
      setLocalReportaRoles(cleanedReportaRoles);
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

  const TAG_OPTIONS: Record<string, { label: string; value: string }[]> = {
    Estado: [{ label: 'Anzoátegui', value: 'Anzoátegui' }],
    ZOEDAN: [{ label: 'Anzoátegui', value: 'Anzoátegui' }],
    REDAN: [{ label: 'Oriente', value: 'Oriente' }],
    Municipio: [
      { label: '', value: 'none' },
      { label: 'Guanta', value: 'Guanta' },
      { label: 'Juan Antonio Sotillo', value: 'Juan Antonio Sotillo' },
      { label: 'Urbaneja', value: 'Urbaneja' },
    ],
  };

  const groupedRoles = useMemo(() => {
    if (!rolesLoaded || !deptsLoaded) return {};
    
    // Sort roles to ensure consistent order
    const availableRoles = [...roles]
      .filter(r => !r.isStatus && !localReportaRoles.includes(r.name))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    const groups: Record<string, typeof roles> = {};
    
    // 1. Global Roles
    const globalRoles = availableRoles.filter(r => !r.departmentScope || r.departmentScope.length === 0);
    if (globalRoles.length > 0) {
      groups['Cargos Globales'] = globalRoles;
    }

    // 2. Department Roles
    departments.forEach(dept => {
      const deptRoles = availableRoles.filter(r => r.departmentScope?.includes(dept.id));
      if (deptRoles.length > 0) {
        groups[dept.name] = deptRoles;
      }
    });

    return groups;
  }, [roles, departments, rolesLoaded, deptsLoaded, localReportaRoles]);

  if (!definitionsLoaded || !rolesLoaded || !settingsLoaded || !deptsLoaded) {
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
        <CardTitle>Ajustes Generales</CardTitle>
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
              
              const options = TAG_OPTIONS[key];
              
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {config.label}
                  </Label>
                  
                  {options ? (
                    <Select 
                      value={(!localValues[key] || localValues[key] === '') ? 'none' : localValues[key]} 
                      onValueChange={(val) => setLocalValues(prev => ({ ...prev, [key]: val === 'none' ? '' : val }))}
                    >
                      <SelectTrigger id={key} className="bg-background w-full">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={key}
                      value={localValues[key] || ''}
                      onChange={(e) =>
                        setLocalValues(prev => ({ ...prev, [key]: e.target.value }))
                      }
                      className="bg-background w-full"
                      disabled={key === 'Hora' || key === 'Fecha'}
                    />
                  )}
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
                  {Object.entries(groupedRoles).map(([groupName, groupRoles], idx) => (
                    <SelectGroup key={groupName}>
                      {idx > 0 && <SelectSeparator />}
                      <SelectLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 bg-muted/20">
                        {groupName}
                      </SelectLabel>
                      {groupRoles.map((role) => (
                        <SelectItem key={role.name} value={role.name} className="pl-4">
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  {Object.keys(groupedRoles).length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No hay cargos disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cargos Seleccionados (Prioridad)
              </Label>
              <div className="space-y-2 rounded-md border p-2 bg-muted/5 min-h-[50px]">
                {(() => {
                  const existingRoleNames = new Set(roles.map(r => r.name));
                  const validRoles = localReportaRoles.filter(role => existingRoleNames.has(role));
                  
                  if (validRoles.length > 0) {
                    return validRoles.map((roleName, index) => (
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
                            disabled={index === validRoles.length - 1}
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
                    ));
                  }
                  
                  return (
                    <div className="py-4 text-center text-[11px] text-muted-foreground italic">
                      No has seleccionado ningún cargo válido.
                    </div>
                  );
                })()}
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
