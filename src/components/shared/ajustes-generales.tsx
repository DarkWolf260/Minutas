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
import { Switch } from '@/components/ui/switch';
import { useTemplates } from '@/hooks/use-templates';
import { cn } from '@/lib/utils';

export function AjustesGenerales() {
  const { definitions, saveDefinitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { departments, isLoaded: deptsLoaded } = useDepartments();
  const { templates, isLoaded: templatesLoaded } = useTemplates();
  const { isAdmin } = useUser();
  const { isCloud, currentWorkspace } = useWorkspaceManager();

  const isBlocked = isCloud && !isAdmin;

  // Use local state to avoid saving on every keystroke
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [localReportaRoles, setLocalReportaRoles] = useState<string[]>([]);
  const [localGroupConsecutive, setLocalGroupConsecutive] = useState(false);
  const [localGroupByTemplateType, setLocalGroupByTemplateType] = useState(false);
  const [localGroupedTemplateIds, setLocalGroupedTemplateIds] = useState<string[]>([]);
  const [localEnableNumbering, setLocalEnableNumbering] = useState(false);
  const [localNumberingType, setLocalNumberingType] = useState<'general' | 'template'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isTemplateListExpanded, setIsTemplateListExpanded] = useState(false);

  const lastSavedValues = useRef<Record<string, string>>({});
  const lastSavedReportaRoles = useRef<string[]>([]);
  const lastSavedGroupConsecutive = useRef<boolean>(false);
  const lastSavedGroupByTemplateType = useRef<boolean>(false);
  const lastSavedGroupedTemplateIds = useRef<string[]>([]);
  const lastSavedEnableNumbering = useRef<boolean>(false);
  const lastSavedNumberingType = useRef<'general' | 'template'>('general');

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

      const groupConsecutive = !!settings.group_consecutive_reports;
      if (lastSavedGroupConsecutive.current !== groupConsecutive) {
        setLocalGroupConsecutive(groupConsecutive);
        lastSavedGroupConsecutive.current = groupConsecutive;
      }

      const enableNumbering = !!settings.enable_report_numbering;
      if (lastSavedEnableNumbering.current !== enableNumbering) {
        setLocalEnableNumbering(enableNumbering);
        lastSavedEnableNumbering.current = enableNumbering;
      }

      const groupByTemplateType = !!settings.group_by_template_type;
      if (lastSavedGroupByTemplateType.current !== groupByTemplateType) {
        setLocalGroupByTemplateType(groupByTemplateType);
        lastSavedGroupByTemplateType.current = groupByTemplateType;
      }

      const groupedTemplateIds = settings.grouped_template_ids || [];
      const currentLastSavedGrouped = JSON.stringify(lastSavedGroupedTemplateIds.current);
      const incomingGrouped = JSON.stringify(groupedTemplateIds);
      if (currentLastSavedGrouped !== incomingGrouped) {
        setLocalGroupedTemplateIds(groupedTemplateIds);
        lastSavedGroupedTemplateIds.current = groupedTemplateIds;
      }

      const numberingType = settings.report_numbering_type || 'general';
      if (lastSavedNumberingType.current !== numberingType) {
        setLocalNumberingType(numberingType);
        lastSavedNumberingType.current = numberingType;
      }
    }
  }, [
    settings.reportarole_ids,
    settings.group_consecutive_reports,
    settings.group_by_template_type,
    settings.grouped_template_ids,
    settings.enable_report_numbering,
    settings.report_numbering_type,
    settingsLoaded
  ]);

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
        saveSettings({ 
          ...settings, 
          reportarole_ids: cleanedReportaRoles,
          group_consecutive_reports: localGroupConsecutive,
          group_by_template_type: localGroupByTemplateType,
          grouped_template_ids: localGroupedTemplateIds,
          enable_report_numbering: localEnableNumbering,
          report_numbering_type: localNumberingType
        })
      ]);

      // Update refs to prevent sync loops
      const savedValues: Record<string, string> = {};
      Object.keys(localValues).forEach(key => {
        savedValues[key] = localValues[key] || '';
      });
      lastSavedValues.current = savedValues;
      lastSavedReportaRoles.current = cleanedReportaRoles;
      lastSavedGroupConsecutive.current = localGroupConsecutive;
      lastSavedGroupByTemplateType.current = localGroupByTemplateType;
      lastSavedGroupedTemplateIds.current = localGroupedTemplateIds;
      lastSavedEnableNumbering.current = localEnableNumbering;
      lastSavedNumberingType.current = localNumberingType;

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

  const activeTemplates = useMemo(() => {
    return templates.filter(t => t.is_active !== false);
  }, [templates]);

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

  if (!definitionsLoaded || !rolesLoaded || !settingsLoaded || !deptsLoaded || !templatesLoaded) {
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

            <Separator className="my-2" />

            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Visualización de Novedades</h4>
                <p className="text-xs text-muted-foreground">
                  Personaliza cómo se muestran las novedades en la barra lateral.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="group-reports-toggle" className="text-sm font-semibold cursor-pointer">
                    Agrupar novedades consecutivas
                  </Label>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Agrupa los reportes adyacentes del mismo tipo/plantilla en una sola tarjeta expandible.
                  </p>
                </div>
                <Switch
                  id="group-reports-toggle"
                  checked={localGroupConsecutive}
                  onCheckedChange={(val) => {
                    setLocalGroupConsecutive(val);
                    if (val) {
                      setLocalGroupByTemplateType(false);
                    }
                  }}
                  disabled={isBlocked}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="group-by-template-toggle" className="text-sm font-semibold cursor-pointer">
                    Agrupar por tipo de plantilla
                  </Label>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Agrupa todas las novedades del mismo tipo de plantilla en carpetas globales en la barra lateral.
                  </p>
                </div>
                <Switch
                  id="group-by-template-toggle"
                  checked={localGroupByTemplateType}
                  onCheckedChange={(val) => {
                    setLocalGroupByTemplateType(val);
                    if (val) {
                      setLocalGroupConsecutive(false);
                    }
                  }}
                  disabled={isBlocked}
                />
              </div>

              {localGroupByTemplateType && (
                <div className="border rounded-xl bg-muted/5 pl-8 pr-4 py-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">
                      Seleccionar plantillas a agrupar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Agrega las plantillas que deseas agrupar en la barra lateral. Las no agregadas se mostrarán de forma individual.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Select Dropdown to Add Template */}
                    <div className="space-y-2 max-w-sm">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Añadir Plantilla
                      </Label>
                      {(() => {
                        const availableTemplates = activeTemplates.filter(t => !localGroupedTemplateIds.includes(t.id));
                        return (
                          <Select
                            value=""
                            onValueChange={(templateId) => {
                              if (templateId && !localGroupedTemplateIds.includes(templateId)) {
                                setLocalGroupedTemplateIds(prev => [...prev, templateId]);
                              }
                            }}
                            disabled={isBlocked}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={isBlocked ? "Bloqueado por Administración" : "Selecciona una plantilla..."} />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                              {availableTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name.replace(/\{.*?\}/g, '').trim()}
                                </SelectItem>
                              ))}
                              {availableTemplates.length === 0 && (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                  No hay más plantillas disponibles
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </div>

                    {/* List of Selected Templates */}
                    <div className="space-y-2 max-w-md">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Plantillas Seleccionadas para Agrupar
                      </Label>
                      <div className="space-y-2 rounded-md border p-2 bg-muted/5 min-h-[50px]">
                        {localGroupedTemplateIds.length > 0 ? (
                          localGroupedTemplateIds.map((templateId, index) => {
                            const template = activeTemplates.find(t => t.id === templateId);
                            const displayName = template ? template.name.replace(/\{.*?\}/g, '').trim() : 'Plantilla Desconocida';
                            return (
                              <div
                                key={templateId}
                                className="flex items-center justify-between rounded-md p-2 bg-background border shadow-sm transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                    {index + 1}
                                  </span>
                                  <span className="text-xs font-semibold">{displayName}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    if (isBlocked) return;
                                    setLocalGroupedTemplateIds(prev => prev.filter(id => id !== templateId));
                                  }}
                                  disabled={isBlocked}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-4 text-center text-[11px] text-muted-foreground italic">
                            Ninguna plantilla seleccionada.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="numbering-toggle" className="text-sm font-semibold cursor-pointer">
                    Numeración de novedades
                  </Label>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Enumera automáticamente las novedades en el reporte final y al exportar a Word.
                  </p>
                </div>
                <Switch
                  id="numbering-toggle"
                  checked={localEnableNumbering}
                  onCheckedChange={setLocalEnableNumbering}
                  disabled={isBlocked}
                />
              </div>

              {localEnableNumbering && (
                <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-sm pl-8 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="space-y-0.5">
                    <Label htmlFor="numbering-type" className="text-sm font-semibold cursor-pointer">
                      Tipo de numeración
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Elige si la secuencia numérica será general o se reiniciará por cada tipo de plantilla.
                    </p>
                  </div>
                  <Select
                    value={localNumberingType}
                    onValueChange={(val: any) => setLocalNumberingType(val)}
                    disabled={isBlocked}
                  >
                    <SelectTrigger id="numbering-type" className="w-[200px] bg-background">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="general">General (1, 2, 3...)</SelectItem>
                      <SelectItem value="template">Por tipo de plantilla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
