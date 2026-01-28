'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  Template,
  TemplateConfig,
  FieldConfig,
  SectionConfig,
  FieldType,
  SnippetOption,
} from '@/types';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseTemplate } from '@/lib/template-parser';
import { Textarea } from '@/components/ui/textarea';
import { SnippetOptionEditor } from '@/components/snippet-option-editor';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { STATISTICS_SECTIONS } from '@/constants/statistics';
import { ChevronDown, ChevronUp, Layers, BarChart3, Settings2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const initialConfig: TemplateConfig = {
  fields: {},
  sections: [],
  layout: [],
};

const TargetFieldEditor = ({
  fieldId,
  config,
  allFields,
  onConfigChange,
  siblingFieldIds,
}: {
  fieldId: string;
  config: FieldConfig;
  allFields: Record<string, FieldConfig>;
  onConfigChange: (fieldId: string, newConfig: Partial<FieldConfig>) => void;
  siblingFieldIds: string[];
}) => {
  const textareaFields = useMemo(() => {
    return siblingFieldIds.filter((id) => allFields[id]?.type === 'textarea' && id !== fieldId);
  }, [siblingFieldIds, allFields, fieldId]);

  const handleTargetChange = (newTarget: string) => {
    onConfigChange(fieldId, { targetField: newTarget });
  };

  return (
    <div className="p-2 border rounded-md bg-muted/30 space-y-2 mt-2 ml-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <Label className="text-xs font-semibold">Destino del Texto (para Dropdown)</Label>
      </div>
      <Select value={config.targetField} onValueChange={handleTargetChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Selecciona un campo..." />
        </SelectTrigger>
        <SelectContent>
          {textareaFields.map((id) => (
            <SelectItem key={id} value={id} className="text-xs">
              {id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground italic">
        El texto se enviará a este campo del reporte.
      </p>
    </div>
  );
};

const FieldEditor = React.memo(function FieldEditor({
  fieldId,
  fieldConfig,
  allFields,
  onConfigChange,
  siblingFieldIds,
  optionsDefinedInTemplate,
}: {
  fieldId: string;
  fieldConfig: FieldConfig;
  allFields: Record<string, FieldConfig>;
  onConfigChange: (fieldId: string, newConfig: Partial<FieldConfig>) => void;
  siblingFieldIds: string[];
  optionsDefinedInTemplate: boolean;
}) {
  const { definitions } = useFieldDefinitions();

  const globalDefinition = definitions[fieldId];
  const finalType = fieldConfig.type || globalDefinition?.type || 'text';
  const isTypeDefinedInTemplate = !!parseTemplate(`{${fieldId}:${finalType}}`).fieldTypes.get(
    fieldId
  );

  return (
    <div className="border rounded-md bg-background shadow-xs hover:border-primary/30 transition-all p-2 mb-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1.5 bg-muted rounded text-primary flex-shrink-0">
                  <Layers className="h-3.5 w-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Campo: {fieldId}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Label className="text-xs font-semibold truncate" title={fieldId}>
            {fieldConfig.label || fieldId}
          </Label>
          {isTypeDefinedInTemplate && (
            <Badge
              variant="outline"
              className="text-[9px] py-0 px-1 bg-blue-50 text-blue-600 border-blue-200"
            >
              Fijo
            </Badge>
          )}
        </div>
        <Select
          value={finalType}
          onValueChange={(value) => onConfigChange(fieldId, { type: value as FieldType })}
          disabled={isTypeDefinedInTemplate}
        >
          <SelectTrigger className="w-[120px] h-8 text-[11px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text" className="text-xs">
              Texto
            </SelectItem>
            <SelectItem value="textarea" className="text-xs">
              Área de Texto
            </SelectItem>
            <SelectItem value="dropdown" className="text-xs">
              Dropdown
            </SelectItem>
            <SelectItem value="time-hlv" className="text-xs">
              Hora (HLV)
            </SelectItem>
            <SelectItem value="date" className="text-xs">
              Fecha
            </SelectItem>
            <SelectItem value="semantic" className="text-xs">
              Estadística Fija
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {finalType === 'dropdown' && (
        <div className="mt-1">
          <TargetFieldEditor
            fieldId={fieldId}
            config={fieldConfig}
            allFields={allFields}
            onConfigChange={onConfigChange}
            siblingFieldIds={siblingFieldIds}
          />
          {!optionsDefinedInTemplate && (
            <div className="mt-2 scale-95 origin-top-left ml-4">
              <SnippetOptionEditor
                config={fieldConfig}
                onUpdate={(newConfig) => onConfigChange(fieldId, newConfig)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export function TemplateEditor({
  template,
  config,
  onConfigChange,
  onTemplateChange,
}: {
  template: Template;
  config: TemplateConfig;
  onConfigChange: (config: TemplateConfig) => void;
  onTemplateChange: (template: Template) => void;
}) {
  const [localTemplate, setLocalTemplate] = useState<Template>(template);
  const [localConfig, setLocalConfig] = useState<TemplateConfig>(() =>
    JSON.parse(JSON.stringify({ ...initialConfig, ...(config || {}) }))
  );
  const [optionsDefinedInTemplate, setOptionsDefinedInTemplate] = useState(
    new Map<string, boolean>()
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalTemplate(template);
    setLocalConfig(config);

    const { templateOptions } = parseTemplate(template.content);
    setOptionsDefinedInTemplate(new Map(Array.from(templateOptions.keys()).map((k) => [k, true])));

    setHasChanges(false);
  }, [template, config]);

  const handleSaveChanges = () => {
    onConfigChange(localConfig);
    onTemplateChange(localTemplate);
    setHasChanges(false);
    toast.success('Cambios guardados correctamente en la plantilla.');
  };

  const handleFieldChange = useCallback((fieldId: string, newConfig: Partial<FieldConfig>) => {
    setLocalConfig((prev) => {
      const updatedFields = { ...prev.fields };

      updatedFields[fieldId] = {
        ...(updatedFields[fieldId] || { label: fieldId, type: 'text' }),
        ...newConfig,
      } as FieldConfig;

      if (newConfig.type === 'time-hlv') {
        Object.keys(updatedFields).forEach((fId) => {
          const field = updatedFields[fId];
          if (field && fId !== fieldId && field.type === 'time-hlv') {
            updatedFields[fId] = { ...field, type: 'text' };
          }
        });
      }

      return { ...prev, fields: updatedFields };
    });
    setHasChanges(true);
  }, []);

  const handleSectionChange = (sectionId: string, updates: Partial<SectionConfig>) => {
    setLocalConfig((prev) => {
      const updatedSections = (prev.sections || []).map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      );
      return { ...prev, sections: updatedSections };
    });
    setHasChanges(true);
  };

  const statisticsOptions = useMemo(() => {
    return STATISTICS_SECTIONS.flatMap((s) =>
      s.items.map((i) => ({
        value: `${i.code} ${i.label}`,
        label: `${i.code} - ${i.label}`,
      }))
    );
  }, []);

  const sectionsById = useMemo(
    () =>
      (localConfig.sections || []).reduce(
        (acc, section) => {
          acc[section.id] = section;
          return acc;
        },
        {} as Record<string, SectionConfig>
      ),
    [localConfig.sections]
  );

  const addedTopLevelFields = useMemo(() => new Set<string>(), []);

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Editor de Plantilla: {localTemplate.name}</CardTitle>
          <CardDescription>
            Configura los tipos de campo. La estructura se define en el archivo .txt.
          </CardDescription>
        </div>
        <Button onClick={handleSaveChanges} disabled={!hasChanges}>
          {hasChanges ? 'Guardar Cambios' : 'Guardado'}
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1 w-full">
        <CardContent className="pt-2">
          <div className="space-y-2 mb-6">
            <Label htmlFor="template-name">Nombre de la Plantilla</Label>
            <Input
              id="template-name"
              value={localTemplate.name}
              onChange={(e) => {
                setLocalTemplate((p) => ({ ...p, name: e.target.value }));
                setHasChanges(true);
              }}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Estructura del Formulario</h3>

            <div className="space-y-4 p-1 rounded-md bg-muted/30">
              {(localConfig.layout || []).map((itemId, index) => {
                if (
                  itemId.startsWith('section_') ||
                  itemId.startsWith('sec_') ||
                  itemId.startsWith('cond_')
                ) {
                  const section = sectionsById[itemId];
                  if (!section) return null;
                  return (
                    <Card
                      key={`${section.id}-${index}`}
                      className="bg-background overflow-hidden shadow-sm border-l-4 border-l-primary/30"
                    >
                      <CardHeader className="p-3 bg-muted/40 border-b">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                              {section.label}
                              {section.isRepeatable && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20"
                                >
                                  Repetible
                                </Badge>
                              )}
                            </CardTitle>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                            <Select
                              value={section.statisticsCategory || 'none'}
                              onValueChange={(val) =>
                                handleSectionChange(section.id, {
                                  statisticsCategory: val === 'none' ? undefined : val,
                                })
                              }
                            >
                              <SelectTrigger className="h-7 text-[10px] w-full bg-background/50 border-dashed">
                                <SelectValue placeholder="Anexar Estadística..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-xs italic">
                                  Niguna estadística
                                </SelectItem>
                                {statisticsOptions.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-[10px]"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 space-y-0.5 bg-muted/5">
                        {section.layout?.map((fieldId, fieldIdx) => {
                          const fieldConfig = localConfig.fields[fieldId];
                          if (!fieldConfig) return null;

                          return (
                            <FieldEditor
                              key={`${section.id}-${fieldId}-${fieldIdx}`}
                              fieldId={fieldId}
                              fieldConfig={fieldConfig}
                              allFields={localConfig.fields}
                              onConfigChange={handleFieldChange}
                              siblingFieldIds={section.fieldIds}
                              optionsDefinedInTemplate={
                                optionsDefinedInTemplate.get(fieldId) || false
                              }
                            />
                          );
                        })}
                        {section.fieldIds.length === 0 && (
                          <p className="text-[11px] text-muted-foreground text-center p-2 italic">
                            Sin campos definidos.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                } else if (itemId === 'section_separator' || itemId === 'sec_separator') {
                  return <div key={`${itemId}-${index}`} className="h-px bg-foreground/20 my-4" />;
                } else {
                  const fieldId = itemId;
                  const fieldConfig = localConfig.fields[fieldId];
                  if (!fieldConfig || fieldConfig.type === 'predefined') return null;

                  addedTopLevelFields.add(fieldId);

                  return (
                    <FieldEditor
                      key={`top-${fieldId}-${index}`}
                      fieldId={fieldId}
                      fieldConfig={fieldConfig}
                      allFields={localConfig.fields}
                      onConfigChange={handleFieldChange}
                      siblingFieldIds={Array.from(addedTopLevelFields)}
                      optionsDefinedInTemplate={optionsDefinedInTemplate.get(fieldId) || false}
                    />
                  );
                }
              })}
              {(localConfig.layout || []).length === 0 && (
                <div className="text-center p-6 border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    No se detectaron campos o secciones en la plantilla.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verifica la sintaxis <code>{`{campo}`}</code> o <code>["Sección"...]</code> en
                    tu archivo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
