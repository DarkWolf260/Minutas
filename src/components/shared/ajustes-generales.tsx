'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
import { useUser } from '@/components/providers/user-provider';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { AjustesGeneralesForm } from './ajustes-generales-form';

export function AjustesGenerales() {
  const { definitions, saveDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { departments, isLoaded: deptsLoaded } = useDepartments();
  const { isAdmin } = useUser();
  const { isCloud, currentWorkspace } = useWorkspaceManager();

  const isBlocked = isCloud && !isAdmin;

  // Use local state to avoid saving on every keystroke
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [localReportaRoles, setLocalReportaRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedValues = useRef<Record<string, string>>({});
  const lastSavedReportaRoles = useRef<string[]>([]);

  // Sync local state when data loads
  useEffect(() => {
    if (definitionsLoaded) {
      const values: Record<string, string> = {};
      let hasChangesFromOutside = false;

      Object.keys(definitions).forEach(key => {
        const globalValue = definitions[key]?.value || '';
        values[key] = globalValue;

        // Only consider it an "outside change" if it's different from what we last saved
        if (lastSavedValues.current[key] === undefined || lastSavedValues.current[key] !== globalValue) {
          hasChangesFromOutside = true;
        }
      });

      if (hasChangesFromOutside) {
        setLocalValues(values);
        lastSavedValues.current = values;
      }
    }
  }, [definitions, definitionsLoaded]);

  useEffect(() => {
    if (settingsLoaded) {
      const globalRoles = settings.reportarole_ids || [];
      const currentLastSaved = JSON.stringify(lastSavedReportaRoles.current);
      const incomingGlobal = JSON.stringify(globalRoles);

      if (currentLastSaved !== incomingGlobal) {
        setLocalReportaRoles(globalRoles);
        lastSavedReportaRoles.current = globalRoles;
      }
    }
  }, [settings.reportarole_ids, settingsLoaded]);

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
        saveSettings({ ...settings, reportarole_ids: cleanedReportaRoles })
      ]);

      // Update refs to prevent sync loops
      const savedValues: Record<string, string> = {};
      Object.keys(localValues).forEach(key => {
        savedValues[key] = localValues[key] || '';
      });
      lastSavedValues.current = savedValues;
      lastSavedReportaRoles.current = cleanedReportaRoles;

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


  const groupedRoles = useMemo(() => {
    if (!rolesLoaded || !deptsLoaded) return {};

    // Sort roles to ensure consistent order
    const availableRoles = [...roles]
      .filter(r => !r.is_status && !localReportaRoles.includes(r.name))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const groups: Record<string, typeof roles> = {};

    // 1. Global Roles
    const globalRoles = availableRoles.filter(r => !r.department_scope || r.department_scope.length === 0);
    if (globalRoles.length > 0) {
      groups['Cargos Globales'] = globalRoles;
    }

    // 2. Department Roles
    departments.forEach(dept => {
      const deptRoles = availableRoles.filter(r => r.department_scope?.includes(dept.id));
      if (deptRoles.length > 0) {
        groups[dept.name] = deptRoles;
      }
    });

    return groups;
  }, [roles, departments, rolesLoaded, deptsLoaded, localReportaRoles]);

  if (!definitionsLoaded || !rolesLoaded || !settingsLoaded || !deptsLoaded) {
    return (
      <Card className="shadow-lg h-full flex flex-col overflow-hidden">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="p-6 space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-64" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-muted/50 h-full flex flex-col overflow-hidden">
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ajustes Generales</CardTitle>
            <CardDescription className="mt-1">
              Define los valores globales que se utilizarán automáticamente en tus reportes.
            </CardDescription>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 py-0.5 bg-muted rounded-full">
              Área de Trabajo
            </span>
            <span className="text-sm font-bold text-primary truncate max-w-[200px]">
              {currentWorkspace}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1" type="always">
          <div className="p-6 space-y-6">
            {isBlocked && (
              <Alert className="bg-amber-500/5 border-amber-500/20 text-amber-600 rounded-2xl mb-2">
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-[11px] font-medium ml-2">
                  Esta área de trabajo está en la nube. Los ajustes generales solo pueden ser modificados por un administrador desde el Panel de Control.
                </AlertDescription>
              </Alert>
            )}

            <AjustesGeneralesForm
              values={localValues}
              onChange={(key, val) => setLocalValues(prev => ({ ...prev, [key]: val }))}
              definitions={definitions}
              fieldKeys={generalFields}
              disabled={isBlocked}
            />

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
                  <Select onValueChange={handleAddReportRole} disabled={isBlocked}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={isBlocked ? "Bloqueado por Administración" : "Selecciona un cargo..."} />
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
                                disabled={isBlocked}
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
              {!isBlocked && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-9 px-4 shrink-0 shadow-sm font-bold"
                  title="Guardar Configuración"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


