'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFieldDefinitions } from '@/hooks/configuracion';
import { useRoles } from '@/hooks/personal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/configuracion';
import { useDepartments } from '@/hooks/personal';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/components/providers/user-provider';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Building2, Users, Settings2, Sliders } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Trash2, ChevronUp, ChevronDown, Save, Layers, Folders, ListOrdered, Hash, FileText, Type } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AjustesGeneralesForm } from './ajustes-generales-form';
import { Switch } from '@/components/ui/switch';
import { useTemplates } from '@/hooks/plantillas';
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

  const [textSize, setTextSize] = useState(() => {
    try {
      return localStorage.getItem('minutas-text-size') || 'normal';
    } catch (e) {
      return 'normal';
    }
  });

  const handleUpdateTextSize = (size: string) => {
    try {
      localStorage.setItem('minutas-text-size', size);
      setTextSize(size);
      window.dispatchEvent(new Event('minutas-text-size-changed'));
    } catch (e) {
      // ignore
    }
  };

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
      const promises: Promise<any>[] = [];

      if (!isBlocked) {
        // 1. Save definitions
        const newDefinitions = { ...definitions };
        Object.keys(localValues).forEach(key => {
          if (newDefinitions[key]) {
            newDefinitions[key] = { ...newDefinitions[key]!, value: localValues[key] || '' };
          }
        });
        promises.push(saveDefinitions(newDefinitions));

        // 2. Perform all saves including roles
        const existingRoleNames = new Set(roles.map(r => r.name));
        const cleanedReportaRoles = localReportaRoles.filter(role => existingRoleNames.has(role));
        promises.push(
          saveSettings({
            ...settings,
            reportarole_ids: cleanedReportaRoles,
            group_consecutive_reports: localGroupConsecutive,
            group_by_template_type: localGroupByTemplateType,
            grouped_template_ids: localGroupedTemplateIds,
            enable_report_numbering: localEnableNumbering,
            report_numbering_type: localNumberingType
          })
        );
      } else {
        // Cloud non-admin user: only save visualization settings to prevent RLS/sync errors
        promises.push(
          saveSettings({
            ...settings,
            group_consecutive_reports: localGroupConsecutive,
            group_by_template_type: localGroupByTemplateType,
            grouped_template_ids: localGroupedTemplateIds,
            enable_report_numbering: localEnableNumbering,
            report_numbering_type: localNumberingType
          })
        );
      }

      await Promise.all(promises);

      // Update refs to prevent sync loops
      if (!isBlocked) {
        const savedValues: Record<string, string> = {};
        Object.keys(localValues).forEach(key => {
          savedValues[key] = localValues[key] || '';
        });
        lastSavedValues.current = savedValues;
        const existingRoleNames = new Set(roles.map(r => r.name));
        const cleanedReportaRoles = localReportaRoles.filter(role => existingRoleNames.has(role));
        lastSavedReportaRoles.current = cleanedReportaRoles;
        setLocalReportaRoles(cleanedReportaRoles);
      }

      lastSavedGroupConsecutive.current = localGroupConsecutive;
      lastSavedGroupByTemplateType.current = localGroupByTemplateType;
      lastSavedGroupedTemplateIds.current = localGroupedTemplateIds;
      lastSavedEnableNumbering.current = localEnableNumbering;
      lastSavedNumberingType.current = localNumberingType;

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

  const FIELD_ORDER = useMemo(() => ['Estado', 'Municipio', 'REDAN', 'ZOEDAN'], []);

  const generalFields = useMemo(() => {
    return FIELD_ORDER.filter((key: string) => definitions[key]);
  }, [FIELD_ORDER, definitions]);

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
      <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
        {/* Header Skeleton */}
        <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-hidden p-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="rounded-xl border p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
            <div className="rounded-xl border p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Header fijo centrado */}
      <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              Ajustes Generales
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Define los valores globales que se utilizarán automáticamente en tus reportes.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="h-9 px-4 shrink-0 shadow-xs font-bold gap-2 rounded-xl"
            title="Guardar Configuración"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          {isBlocked && (
            <Alert className="bg-amber-500/5 border-amber-500/20 text-amber-600 rounded-2xl">
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium ml-2">
                Esta área de trabajo está en la nube. Los ajustes generales solo pueden ser modificados por un administrador desde el Panel de Control.
              </AlertDescription>
            </Alert>
          )}

          {/* Bloque 1: Valores Institucionales */}
          <Card className="shadow-xs border-muted/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Valores Institucionales
              </CardTitle>
              <CardDescription>
                Configura los datos geográficos y de jurisdicción por defecto asignados a esta base operativa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AjustesGeneralesForm
                values={localValues}
                onChange={(key, val) => setLocalValues(prev => ({ ...prev, [key]: val }))}
                definitions={definitions}
                fieldKeys={generalFields}
                disabled={isBlocked}
              />
            </CardContent>
          </Card>

          {/* Bloque 2: Personal que Reporta */}
          <Card className="shadow-xs border-muted/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Personal que Reporta
              </CardTitle>
              <CardDescription>
                Gestiona y ordena por prioridad los cargos institucionales que se usarán para autocompletar la etiqueta [Reporta].
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Añadir Cargo
                </Label>
                <Select onValueChange={handleAddReportRole} disabled={isBlocked}>
                  <SelectTrigger className="h-10 w-full rounded-xl bg-background shadow-xs">
                    <SelectValue placeholder={isBlocked ? "Bloqueado por Administración" : "Selecciona un cargo para añadir a la lista..."} />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cargos Seleccionados (Prioridad)
                </Label>
                <div className="space-y-2 rounded-xl border p-2 bg-muted/5 min-h-[50px]">
                  {(() => {
                    const existingRoleNames = new Set(roles.map(r => r.name));
                    const validRoles = localReportaRoles.filter(role => existingRoleNames.has(role));

                    if (validRoles.length > 0) {
                      return validRoles.map((roleName, index) => (
                        <div
                          key={roleName}
                          className="flex items-center justify-between rounded-lg p-2.5 bg-background border shadow-xs transition-all"
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
                              className="h-7 w-7 rounded-lg"
                              onClick={() => handleMoveReportRole(index, 'up')}
                              disabled={index === 0}
                              title="Subir prioridad"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => handleMoveReportRole(index, 'down')}
                              disabled={index === validRoles.length - 1}
                              title="Bajar prioridad"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Separator orientation="vertical" className="h-4 mx-1" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveReportRole(roleName)}
                              disabled={isBlocked}
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ));
                    }

                    return (
                      <div className="py-4 text-center text-xs text-muted-foreground italic">
                        No has seleccionado ningún cargo para reportar.
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloque 3: Visualización de Novedades */}
          <Card className="shadow-xs border-muted/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                Visualización de Novedades
              </CardTitle>
              <CardDescription>
                Personaliza cómo se muestran y agrupan los reportes en la barra lateral y exportaciones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-xs transition-colors hover:bg-muted/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="group-reports-toggle" className="text-sm font-semibold cursor-pointer">
                      Agrupar novedades consecutivas
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Agrupa los reportes adyacentes del mismo tipo/plantilla en una sola tarjeta expandible.
                    </p>
                  </div>
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
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-xs transition-colors hover:bg-muted/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                    <Folders className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="group-by-template-toggle" className="text-sm font-semibold cursor-pointer">
                      Agrupar por tipo de plantilla
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Agrupa todas las novedades del mismo tipo de plantilla en carpetas globales en la barra lateral.
                    </p>
                  </div>
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
                />
              </div>

              {localGroupByTemplateType && (
                <div className="border rounded-xl bg-muted/10 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Seleccionar plantillas a agrupar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Agrega las plantillas que deseas agrupar en la barra lateral. Las no agregadas se mostrarán de forma individual.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
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
                          >
                            <SelectTrigger className="h-10 w-full rounded-xl bg-background shadow-xs">
                              <SelectValue placeholder="Selecciona una plantilla para agrupar..." />
                            </SelectTrigger>
                            <SelectContent className="z-[200]">
                              {availableTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  <span className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>{template.name.replace(/\{.*?\}/g, '').trim()}</span>
                                  </span>
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

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Plantillas Seleccionadas para Agrupar
                      </Label>
                      <div className="space-y-2 rounded-xl border p-2 bg-background min-h-[50px]">
                        {localGroupedTemplateIds.length > 0 ? (
                          localGroupedTemplateIds.map((templateId, index) => {
                            const template = activeTemplates.find(t => t.id === templateId);
                            const displayName = template ? template.name.replace(/\{.*?\}/g, '').trim() : 'Plantilla Desconocida';
                            return (
                              <div
                                key={templateId}
                                className="flex items-center justify-between rounded-lg p-2.5 bg-muted/20 border shadow-xs transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                    {index + 1}
                                  </span>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs font-semibold truncate">{displayName}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setLocalGroupedTemplateIds(prev => prev.filter(id => id !== templateId));
                                  }}
                                  title="Eliminar plantilla"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-4 text-center text-xs text-muted-foreground italic">
                            Ninguna plantilla seleccionada.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-xs transition-colors hover:bg-muted/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                    <ListOrdered className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="numbering-toggle" className="text-sm font-semibold cursor-pointer">
                      Numeración de novedades
                    </Label>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Enumera automáticamente las novedades en el reporte final y al exportar a Word.
                    </p>
                  </div>
                </div>
                <Switch
                  id="numbering-toggle"
                  checked={localEnableNumbering}
                  onCheckedChange={setLocalEnableNumbering}
                />
              </div>

              {localEnableNumbering && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 bg-muted/10 shadow-xs animate-in slide-in-from-top-2 fade-in duration-200">
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
                  >
                    <SelectTrigger id="numbering-type" className="w-full sm:w-[220px] h-10 rounded-xl bg-background shadow-xs shrink-0">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="general">
                        <span className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>General (1, 2, 3...)</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="template">
                        <span className="flex items-center gap-2">
                          <Folders className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>Por tipo de plantilla</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bloque 4: Interfaz y Accesibilidad */}
          <Card className="shadow-xs border-muted/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Interfaz y Accesibilidad
              </CardTitle>
              <CardDescription>
                Personaliza la escala de tamaño de las fuentes y elementos de la interfaz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 bg-muted/5 shadow-xs gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                    <Type className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Tamaño del texto</Label>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Ajusta la escala de tamaño de las letras de la interfaz.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 bg-muted/30 rounded-xl border border-muted/50 w-full sm:w-[320px] shrink-0 bg-background shadow-xs">
                  {(['small', 'normal', 'large', 'xlarge'] as const).map((size) => {
                    const labels: Record<string, string> = {
                      small: 'Pequeño',
                      normal: 'Normal',
                      large: 'Grande',
                      xlarge: 'Extra'
                    };
                    const isActive = textSize === size;
                    return (
                      <Button
                        key={size}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleUpdateTextSize(size)}
                        className={cn(
                          "h-8 text-[10px] uppercase font-bold rounded-lg transition-all",
                          isActive ? "shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {labels[size]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
