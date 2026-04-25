'use client';

import * as React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  Template,
  TemplateConfig,
  FieldConfig,
  SectionConfig,
  FieldType,
  TextModifier,
} from '@/lib/types';
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
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseTemplate } from '@/lib/template-parser';

import { SnippetOptionEditor } from '@/components/template/snippet-option-editor';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { STATISTICS_SECTIONS } from '@/lib/constants/statistics';
import { Layers, BarChart3, Settings2, Plus, Trash2, ChevronDown, ChevronUp, Save, Search, Check, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { StatisticRule } from '@/lib/types';

const initialConfig: TemplateConfig = {
  fields: {},
  sections: [],
  layout: [],
};

const OPERATORS = [
  { value: '=', label: '=' },
  { value: '!=', label: '!=' },
  { value: 'filled', label: 'Lleno' },
  { value: 'empty', label: 'Vacío' },
  { value: 'not_empty', label: 'No Vacío' },
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'No Contiene' },
  { value: 'starts_with', label: 'Empieza con' },
  { value: 'ends_with', label: 'Termina con' },
  { value: 'extract_value', label: 'Extraer num' },
  { value: '>', label: 'Mayor que' },
  { value: '<', label: 'Menor que' },
  { value: '>=', label: 'Mayor/igual' },
  { value: '<=', label: 'Menor/igual' }
] as const;

// Searchable Category Selector Component
const SearchableCategorySelector = ({
  value,
  onSelect,
  placeholder = "Selecciona una categoría...",
  className = "",
  customTrigger
}: {
  value: string;
  onSelect: (val: string) => void;
  placeholder?: string;
  className?: string;
  customTrigger?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const all = STATISTICS_SECTIONS;
    if (!search) return all;
    const lowerSearch = search.toLowerCase();
    
    return all.map((section: any) => ({
      ...section,
      items: (section.items || []).filter((item: any) => 
        item.label.toLowerCase().includes(lowerSearch) || 
        item.code.toLowerCase().includes(lowerSearch)
      )
    })).filter((section: any) => section.items.length > 0);
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {customTrigger || (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between text-left font-normal truncate", className, value === 'none' && "text-muted-foreground")}
          >
            {value === 'none' ? placeholder : value}
            <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setSearch("")}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-3">
            <div
              className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                value === 'none' && "bg-accent/50 text-accent-foreground font-medium"
              )}
              onClick={() => {
                onSelect('none');
                setOpen(false);
              }}
            >
              {value === 'none' && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </span>
              )}
              Ninguna (Ignorar)
            </div>

            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron categorías.
              </div>
            ) : (
              filteredOptions.map((section: any) => (
                <div key={section.title} className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider bg-primary/5 rounded-sm">
                    {section.title}
                  </div>
                  {section.items.map((item: any) => {
                    const fullLabel = `${item.code} ${item.label}`;
                    const isSelected = value === fullLabel;
                    return (
                      <div
                        key={item.code}
                        className={cn(
                          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                          isSelected && "bg-accent text-accent-foreground font-medium"
                        )}
                        onClick={() => {
                          onSelect(fullLabel);
                          setOpen(false);
                        }}
                      >
                        {isSelected && (
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                        <span className="font-mono text-xs opacity-70 mr-2">{item.code}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
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

  return (
    <div className="border rounded-md bg-background shadow-xs hover:border-primary/30 transition-all p-3 mb-2 group">
      <div className="flex items-center justify-between gap-4 overflow-hidden mb-2">
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <div className="p-1.5 bg-muted rounded text-primary flex-shrink-0 group-hover:bg-primary/10 transition-colors">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <Label className="text-xs font-bold truncate text-foreground/90" title={fieldId}>
              {fieldConfig.label || fieldId}
            </Label>
            {fieldConfig.label && fieldConfig.label !== fieldId && (
              <span className="text-[9px] text-muted-foreground font-mono truncate">{fieldId}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={finalType}
            onValueChange={(value) => onConfigChange(fieldId, { type: value as FieldType })}
          >
            <SelectTrigger className="w-[100px] h-7 text-[10px] bg-muted/20 border-transparent hover:border-muted-foreground/20 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text" className="text-xs">Texto</SelectItem>
              <SelectItem value="textarea" className="text-xs">Área de Texto</SelectItem>
              <SelectItem value="dropdown" className="text-xs">Dropdown</SelectItem>
              <SelectItem value="time-hlv" className="text-xs">Hora (HLV)</SelectItem>
              <SelectItem value="date" className="text-xs">Fecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metadata & Modifiers Row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {fieldConfig.required && (
          <Badge variant="outline" className="text-[10px] h-5 bg-destructive/5 text-destructive border-destructive/20 px-1.5 py-0 font-bold uppercase">
            Obligatorio
          </Badge>
        )}

        {(fieldConfig.modifiers || []).map(m => (
          <Badge key={m} variant="secondary" className="text-[10px] h-5 bg-primary/5 text-primary border-primary/20 px-1.5 py-0 font-medium uppercase">
            {m === 'upper' ? 'MAYÚSCULAS' : m === 'lower' ? 'minúsculas' : m === 'title' ? 'Tipo Título' : m}
          </Badge>
        ))}

        {(fieldConfig.defaultValue !== undefined || fieldConfig.value !== undefined) && (
          <div className="flex items-start gap-1 text-[11px] bg-muted/40 px-2 py-1.5 rounded border border-muted-foreground/10 text-muted-foreground w-full">
            <span className="font-bold opacity-70 uppercase tracking-tighter shrink-0 mt-0.5 text-[10px]">
              {fieldConfig.value ? 'Texto Inicial:' : 'Default:'}
            </span>
            <span className="italic whitespace-normal break-words leading-normal text-muted-foreground/90">
              "{fieldConfig.value !== undefined ? fieldConfig.value : fieldConfig.defaultValue}"
            </span>
          </div>
        )}
      </div>

      {finalType === 'dropdown' && (
        <div className="mt-1 pt-2 border-t border-muted/50">
          {!optionsDefinedInTemplate ? (
            <div className="scale-95 origin-top-left">
              <SnippetOptionEditor
                config={fieldConfig}
                onUpdate={(newConfig) => onConfigChange(fieldId, newConfig)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Check className="h-2.5 w-2.5 text-green-500" />
                <span>Opciones definidas en código:</span>
                <Badge variant="outline" className="h-3.5 text-[8px] px-1 bg-green-50/50 text-green-600 border-green-200">
                  {fieldConfig.snippetOptions?.length || 0} ítems
                </Badge>
              </div>
              {fieldConfig.snippetOptions && fieldConfig.snippetOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-3 mt-1.5">
                  {fieldConfig.snippetOptions.slice(0, 6).map((o, idx) => (
                    <span key={idx} className="text-[10px] text-foreground/70 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 font-medium">
                      {o.label}
                    </span>
                  ))}
                  {fieldConfig.snippetOptions.length > 6 && (
                    <span className="text-[10px] text-muted-foreground self-center italic ml-1">
                      +{fieldConfig.snippetOptions.length - 6} más
                    </span>
                  )}
                </div>
              )}
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
  const [localConfig, setLocalConfig] = useState<TemplateConfig>(() => {
    return JSON.parse(JSON.stringify({ ...initialConfig, ...(config || {}) }));
  });
  const [optionsDefinedInTemplate, setOptionsDefinedInTemplate] = useState(
    new Map<string, boolean>()
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalTemplate(template);
    
    // Parse the template to get live information from the content
    const result = parseTemplate(template.content);
    const { templateOptions, fieldNames, fieldTypes, fieldModifiers, fieldWidths, requiredFields, defaultValues, predefinedValues, sections: parsedSections } = result;
    
    // Update options defined in template map
    setOptionsDefinedInTemplate(new Map<string, boolean>(Array.from(templateOptions.keys()).map((k) => [k as string, true])));

    // Construct fields object from the parser result Maps
    const parsedFields: Record<string, FieldConfig> = {};
    fieldNames.forEach(name => {
      parsedFields[name] = {
        label: name, // Default label
        type: fieldTypes.get(name) || 'text',
        required: requiredFields.has(name),
        defaultValue: defaultValues.get(name),
        value: predefinedValues.get(name),
        modifiers: (fieldModifiers.get(name) || []) as TextModifier[],
        isFullWidth: fieldWidths.get(name) || false,
      };
    });

    // Merge parsed fields into localConfig to ensure live data is available
    setLocalConfig(prev => {
      const mergedFields = { ...prev.fields };
      
      // Update each field with data from the parser
      Object.keys(parsedFields).forEach(id => {
        const existingField = mergedFields[id];
        const newField = parsedFields[id]!;
        
        mergedFields[id] = {
          ...(existingField || { type: 'text', label: id }),
          ...newField,
          // Preserve custom label if already set in local config and different from ID
          label: (existingField?.label && existingField.label !== id) ? existingField.label : newField.label
        };
      });

      return {
        ...prev,
        fields: mergedFields,
        // If config is empty or initial, use parsed sections
        sections: prev.sections?.length > 0 ? prev.sections : parsedSections,
      };
    });

    setHasChanges(false);
  }, [template]);

  const handleSaveChanges = () => {
    onConfigChange(localConfig);
    onTemplateChange(localTemplate);
    setHasChanges(false);
    toast.success("Cambios guardados correctamente");
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

  const availableFields = useMemo(() => {
    const fields = Object.keys(localConfig.fields);
    const repeatableFields = new Set<string>();
    
    (localConfig.sections || []).forEach(sec => {
      if (sec.isRepeatable && sec.fieldIds) {
        sec.fieldIds.forEach(id => repeatableFields.add(id));
      }
    });

    const result = [...fields];
    repeatableFields.forEach(id => {
      result.push(`${id}*`);
      result.push(`${id} (1)`);
    });
    
    return result.sort();
  }, [localConfig.fields, localConfig.sections]);

  const [showRules, setShowRules] = useState(false);

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



  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Column Left: Sidebar with Truly Unified Control Card */}
        <div className="lg:col-span-5 xl:col-span-4 h-full min-h-0">
          <Card className="shadow-lg border-none overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full w-full">
                <div className="p-6 space-y-6">
                  {/* Header Info & Save */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Settings2 className="h-6 w-6" />
                        <h2 className="text-xl font-bold tracking-tight">Editor de Plantilla</h2>
                      </div>
                    </div>
                    <Button onClick={handleSaveChanges} disabled={!hasChanges} className="w-full h-10 text-sm shadow-md font-semibold">
                      <Save className="h-4 w-4 mr-2" />
                      {hasChanges ? 'Guardar Cambios' : 'Guardado'}
                    </Button>
                  </div>

                  <div className="h-px bg-muted" />

                  {/* General Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Datos Generales</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Nombre de la Plantilla
                        </Label>
                        <Input
                          id="template-name"
                          value={localTemplate.name}
                          onChange={(e) => {
                            setLocalTemplate((p) => ({ ...p, name: e.target.value }));
                            setHasChanges(true);
                          }}
                          className="h-9 text-xs bg-muted/30 focus:bg-background transition-colors border-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stats-category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Categoría Estadística (Defecto)
                        </Label>
                        <SearchableCategorySelector
                          value={localTemplate.statisticsCategory || 'none'}
                          onSelect={(val) => {
                            setLocalTemplate((p) => ({ ...p, statisticsCategory: val === 'none' ? '' : val }));
                            setHasChanges(true);
                          }}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            Sub-categorías Estadísticas (Defecto)
                          </Label>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] text-primary hover:bg-primary/5 px-2 font-bold uppercase tracking-wider"
                            onClick={() => {
                              const current = localTemplate.statisticsSubCategories || [];
                              setLocalTemplate(p => ({ ...p, statisticsSubCategories: [...current, ''] }));
                              setHasChanges(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Añadir
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {(localTemplate.statisticsSubCategories || []).map((sub, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <div className="flex-1">
                                <SearchableCategorySelector
                                  value={sub || 'none'}
                                  onSelect={(val) => {
                                    const newList = [...(localTemplate.statisticsSubCategories || [])];
                                    newList[idx] = val === 'none' ? '' : val;
                                    setLocalTemplate(p => ({ ...p, statisticsSubCategories: newList }));
                                    setHasChanges(true);
                                  }}
                                  placeholder="Selecciona sub-categoría..."
                                />
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                                onClick={() => {
                                  const newList = (localTemplate.statisticsSubCategories || []).filter((_, i) => i !== idx);
                                  setLocalTemplate(p => ({ ...p, statisticsSubCategories: newList }));
                                  setHasChanges(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-muted" />

                  {/* Conditional Rules Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reglas Condicionales</h3>
                        {(localTemplate.statisticsRules || []).length > 0 && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] h-4 px-1.5">
                            {(localTemplate.statisticsRules || []).length}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] bg-background shrink-0 px-2"
                        onClick={() => {
                          const newRules = [...(localTemplate.statisticsRules || []), { fieldId: '', operator: '=', condition: '', category: '' }];
                          setLocalTemplate(p => ({ ...p, statisticsRules: newRules as StatisticRule[] }));
                          setHasChanges(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Nueva
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(localTemplate.statisticsRules || []).length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/5">
                          <p className="text-[10px] text-muted-foreground">Sin reglas automáticas.</p>
                        </div>
                      )}
                      {(() => {
                        const renderConditionInputs = (cond: any, onChange: (field: string, val: any) => void) => (
                          <>
                            <div className="flex gap-2">
                              <Select
                                value={cond.fieldId || ''}
                                onValueChange={(val) => onChange('fieldId', val)}
                              >
                                <SelectTrigger className="h-8 text-[10px] flex-1 bg-background border-muted shadow-sm">
                                  <SelectValue placeholder="Campo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableFields.map((f) => (
                                    <SelectItem key={f} value={f} className="text-xs">
                                      {f}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={cond.operator || '='}
                                onValueChange={(val) => onChange('operator', val)}
                              >
                                <SelectTrigger className="h-8 w-[100px] text-[10px] shrink-0 px-2 bg-background border-muted shadow-sm font-mono">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {OPERATORS.map(op => (
                                    <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {cond.operator !== 'empty' && cond.operator !== 'not_empty' && cond.operator !== 'extract_value' && (
                              (() => {
                                const fieldConfig = cond.fieldId ? localConfig.fields[cond.fieldId] : undefined;
                                const isDropdown = fieldConfig?.type === 'dropdown';
                                const options = fieldConfig?.snippetOptions || [];

                                if (isDropdown && options.length > 0) {
                                  return (
                                    <Select
                                      value={cond.condition || ''}
                                      onValueChange={(val) => onChange('condition', val)}
                                    >
                                      <SelectTrigger className="h-8 text-[10px] w-full bg-background border-muted shadow-sm">
                                        <SelectValue placeholder="Selecciona una opción..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {options.map((opt: any) => (
                                          <SelectItem key={opt.id} value={opt.label || ''} className="text-xs">
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  );
                                }

                                return (
                                  <Input
                                    className="h-8 text-[10px] w-full bg-background border-muted shadow-sm"
                                    placeholder="Valor..."
                                    value={cond.condition || ''}
                                    onChange={(e) => onChange('condition', e.target.value)}
                                  />
                                );
                              })()
                            )}
                          </>
                        );

                        return (localTemplate.statisticsRules || []).map((rule, idx) => {
                          const updateRule = (updatedFields: Partial<StatisticRule>) => {
                            const newRules = [...(localTemplate.statisticsRules || [])];
                            newRules[idx] = { ...newRules[idx], ...updatedFields };
                            setLocalTemplate(p => ({ ...p, statisticsRules: newRules }));
                            setHasChanges(true);
                          };

                          return (
                            <div
                              key={idx}
                              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-lg border border-muted/50 group hover:border-primary/30 transition-colors"
                            >
                              <div className="flex flex-col gap-2 w-full min-w-0">
                                {/* Primary Condition */}
                                {renderConditionInputs(rule, (field, val) => updateRule({ [field]: val }))}

                                {/* Secondary Conditions */}
                                {rule.conditions?.map((secCond, cIdx) => (
                                  <div key={cIdx} className="flex flex-col gap-2 w-full mt-2 pt-2 border-t border-muted/30 relative">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                        <div className="w-1 h-3 bg-primary/40 rounded-full"></div> Y (AND)
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => {
                                          const newSecConditions = [...(rule.conditions || [])];
                                          newSecConditions.splice(cIdx, 1);
                                          updateRule({ conditions: newSecConditions });
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    {renderConditionInputs(secCond, (field, val) => {
                                      const newSecConditions = [...(rule.conditions || [])];
                                      newSecConditions[cIdx] = { ...newSecConditions[cIdx], [field]: val };
                                      updateRule({ conditions: newSecConditions });
                                    })}
                                  </div>
                                ))}

                                {/* Add Secondary Condition Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-full text-[10px] mt-1 border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    const newSecConditions = [...(rule.conditions || []), { fieldId: '', operator: '=' as const, condition: '' }];
                                    updateRule({ conditions: newSecConditions as any });
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Añadir condición (Y)
                                </Button>

                                <div className="flex items-center gap-2 pt-2 border-t border-muted/50 mt-1">
                              <SearchableCategorySelector
                                value={rule.category || 'none'}
                                onSelect={(val) => {
                                  const finalVal = val === 'none' ? '' : val;
                                  const newRules = (localTemplate.statisticsRules || []).map((r, i) =>
                                    i === idx ? { ...r, category: finalVal } : r
                                  );
                                  setLocalTemplate(p => ({ ...p, statisticsRules: newRules }));
                                  setHasChanges(true);
                                }}
                                className="h-8 bg-primary/5 border-dashed border-primary/20 hover:bg-primary/10"
                                placeholder="Categoría Destino"
                              />

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => {
                                  const newRules = (localTemplate.statisticsRules || []).filter((_, i) => i !== idx);
                                  setLocalTemplate(p => ({ ...p, statisticsRules: newRules }));
                                  setHasChanges(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Column Right: Form Structure */}
        <div className="lg:col-span-7 xl:col-span-8 h-full min-h-0">
          <Card className="shadow-md border-none overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="bg-muted/20 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg sm:text-xl">Estructura de la Plantilla</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <ScrollArea className="h-full w-full">
                <div className="p-6 space-y-4">
                  {(() => {
                    const addedTopLevelFields = new Set<string>();
                    const sectionsById = (localConfig.sections || []).reduce(
                      (acc, s) => ({ ...acc, [s.id]: s }),
                      {} as Record<string, SectionConfig>
                    );

                    const renderSectionCard = (section: SectionConfig, index: number) => {
                      if (section.isSeparator || section.id.includes('separator')) {
                        return <div key={`${section.id}-${index}`} className="h-px bg-muted-foreground/20 my-4 w-full" />;
                      }

                      const title = section.label || (section.condition ? `Si ${section.condition.fieldId} ${section.condition.operator} ${section.condition.value || "..."}` : section.id);

                      return (
                        <Card
                          key={`${section.id}-${index}`}
                          className={cn(
                            "bg-background overflow-hidden shadow-sm border-l-4 transition-all",
                            section.condition ? "border-l-primary/40 bg-primary/5" : "border-l-muted-foreground/30"
                          )}
                        >
                          <CardHeader className="p-2 bg-muted/20 border-b">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {section.condition ? (
                                  <div className="p-1 bg-primary/10 rounded text-primary">
                                    <BarChart3 className="h-3 w-3" />
                                  </div>
                                ) : (
                                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <CardTitle className="text-[11px] font-bold uppercase tracking-tight truncate">
                                  {title}
                                </CardTitle>
                                {section.isRepeatable && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20 px-1"
                                  >
                                    Repetible
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <SearchableCategorySelector
                                  value={section.statisticsCategory || 'none'}
                                  onSelect={(val) => {
                                    handleSectionChange(section.id, { statisticsCategory: val === 'none' ? '' : val });
                                  }}
                                  className="h-6 w-[180px] bg-muted/50 border-transparent hover:bg-muted transition-colors"
                                  placeholder="Categoría Estadística..."
                                />
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 bg-background/50">
                            {(section.layout || []).length > 0 ? (
                              section.layout!.map((childId, childIdx) => {
                                if (childId.startsWith('sec_') || childId.startsWith('cond_') || childId.startsWith('section_')) {
                                  const childSection = sectionsById[childId];
                                  if (childSection) return renderSectionCard(childSection, childIdx);
                                }

                                const fieldConfig = localConfig.fields[childId];
                                if (!fieldConfig) return null;
                                return (
                                  <FieldEditor
                                    key={`${section.id}-${childId}-${childIdx}`}
                                    fieldId={childId}
                                    fieldConfig={fieldConfig}
                                    allFields={localConfig.fields}
                                    onConfigChange={handleFieldChange}
                                    siblingFieldIds={section.fieldIds || []}
                                    optionsDefinedInTemplate={optionsDefinedInTemplate.get(childId) || false}
                                  />
                                );
                              })
                            ) : (
                              <p className="text-[10px] text-muted-foreground italic text-center py-2">
                                Sin campos detectados.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    };

                    const renderGroupCard = (group: SectionConfig[], groupIndex: number) => {
                      const firstItem = group[0];
                      if (!firstItem) return null;
                      const commonField = firstItem.condition?.fieldId;

                      return (
                        <Card key={`group-${commonField}-${groupIndex}`} className="border-l-4 border-l-primary/60 shadow-md bg-primary/[0.02] overflow-hidden">
                          <CardHeader className="p-3 bg-primary/10 border-b">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-primary/20 rounded text-primary">
                                <BarChart3 className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-primary truncate">
                                  Lógica de {commonField}
                                </CardTitle>
                                <p className="text-[9px] text-muted-foreground font-medium">
                                  {group.length} casos detectados basados en este campo
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0 divide-y divide-primary/10 bg-background/40">
                            {group.map((section) => (
                              <div key={section.id} className="p-3 hover:bg-primary/[0.03] transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/30 px-2 py-0.5">
                                      {section.condition?.operator === '=' ? 'SI ES' : section.condition?.operator} "{section.condition?.value}"
                                    </Badge>
                                    {section.label && (
                                      <span className="text-[10px] text-muted-foreground font-medium">{section.label}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                                  {(section.layout || []).length > 0 ? (
                                    section.layout!.map((childId, childIdx) => {
                                      const fieldConfig = localConfig.fields[childId];
                                      if (!fieldConfig) return null;
                                      return (
                                        <FieldEditor
                                          key={`${section.id}-${childId}-${childIdx}`}
                                          fieldId={childId}
                                          fieldConfig={fieldConfig}
                                          allFields={localConfig.fields}
                                          onConfigChange={handleFieldChange}
                                          siblingFieldIds={section.fieldIds || []}
                                          optionsDefinedInTemplate={optionsDefinedInTemplate.get(childId) || false}
                                        />
                                      );
                                    })
                                  ) : (
                                    <p className="text-[9px] text-muted-foreground italic pl-2">Sin campos específicos en este caso.</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    };

                    const layoutItems = localConfig.layout || [];
                    const renderedItems: React.ReactNode[] = [];
                    let i = 0;

                    while (i < layoutItems.length) {
                      const itemId = layoutItems[i];
                      if (!itemId) { i++; continue; }

                      const section = sectionsById[itemId];

                      // Detect groupable consecutive conditional sections
                      if (section?.condition && section.condition.fieldId) {
                        const group: SectionConfig[] = [section];
                        let j = i + 1;
                        while (j < layoutItems.length) {
                          const nextId = layoutItems[j];
                          if (!nextId) { j++; continue; }
                          const nextSec = sectionsById[nextId];
                          if (nextSec?.condition && nextSec.condition.fieldId === section.condition.fieldId) {
                            group.push(nextSec);
                            j++;
                          } else {
                            break;
                          }
                        }

                        if (group.length > 1) {
                          renderedItems.push(renderGroupCard(group, i));
                          i = j;
                          continue;
                        }
                      }

                      // Normal rendering
                      if (itemId.startsWith('section_') || itemId.startsWith('sec_') || itemId.startsWith('cond_')) {
                        if (section) renderedItems.push(renderSectionCard(section, i));
                      } else if (itemId === 'section_separator' || itemId === 'sec_separator') {
                        renderedItems.push(<div key={`${itemId}-${i}`} className="h-px bg-foreground/20 my-4" />);
                      } else {
                        const fieldConfig = localConfig.fields[itemId];
                        if (fieldConfig && fieldConfig.type !== 'predefined') {
                          addedTopLevelFields.add(itemId);
                          renderedItems.push(
                            <FieldEditor
                              key={`top-${itemId}-${i}`}
                              fieldId={itemId}
                              fieldConfig={fieldConfig}
                              allFields={localConfig.fields}
                              onConfigChange={handleFieldChange}
                              siblingFieldIds={Array.from(addedTopLevelFields)}
                              optionsDefinedInTemplate={optionsDefinedInTemplate.get(itemId) || false}
                            />
                          );
                        }
                      }
                      i++;
                    }

                    return renderedItems;
                  })()}

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
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

