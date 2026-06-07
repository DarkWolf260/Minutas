'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import type {
  Template,
  TemplateConfig,
  FieldConfig,
  TextModifier,
} from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { STATISTICS_SECTIONS } from '@/lib/constants/statistics';
import { BarChart3, Settings2, Plus, Trash2, ChevronDown, Save, Search, Check, X, Copy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { StatisticRule } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

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
  customTrigger,
  disabled = false
}: {
  value: string;
  onSelect: (val: string) => void;
  placeholder?: string;
  className?: string;
  customTrigger?: React.ReactNode;
  disabled?: boolean;
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
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        {customTrigger || (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
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

export function TemplateEditor({
  template,
  config,
  onTemplateChange,
  isReadOnly = false,
}: {
  template: Template;
  config: TemplateConfig;
  onTemplateChange: (template: Template) => void;
  isReadOnly?: boolean;
}) {
  const [localTemplate, setLocalTemplate] = useState<Template>(() => {
    const rules = template.statistics_rules || [];
    const metaRule = rules.find(r => r.field_id === '__meta__');
    const disableMain = metaRule ? (metaRule as any).disable_main_stat_on_apoyo : template.disable_main_stat_on_apoyo;
    const disabledSubs = metaRule ? (metaRule as any).disabled_sub_categories_on_apoyo : template.disabled_sub_categories_on_apoyo;
    return {
      ...template,
      disable_main_stat_on_apoyo: disableMain ?? false,
      disabled_sub_categories_on_apoyo: disabledSubs ?? [],
      statistics_rules: rules.filter(r => r.field_id !== '__meta__')
    };
  });
  const [localConfig, setLocalConfig] = useState<TemplateConfig>(() => {
    return JSON.parse(JSON.stringify({ ...initialConfig, ...(config || {}) }));
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Parse the template to get live information from the content
    const result = parseTemplate(template.content);
    const { fieldNames, fieldTypes, fieldModifiers, fieldWidths, requiredFields, defaultValues, predefinedValues, sections: parsedSections } = result;

    // Construct fields object from the parser result Maps
    const parsedFields: Record<string, FieldConfig> = {};
    fieldNames.forEach(name => {
      parsedFields[name] = {
        label: name, // Default label
        type: fieldTypes.get(name) || 'text',
        required: requiredFields.has(name),
        default_value: defaultValues.get(name),
        value: predefinedValues.get(name),
        modifiers: (fieldModifiers.get(name) || []) as TextModifier[],
        is_full_width: fieldWidths.get(name) || false,
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

    const rules = template.statistics_rules || [];
    const metaRule = rules.find(r => r.field_id === '__meta__');
    const disableMain = metaRule ? (metaRule as any).disable_main_stat_on_apoyo : template.disable_main_stat_on_apoyo;
    const disabledSubs = metaRule ? (metaRule as any).disabled_sub_categories_on_apoyo : template.disabled_sub_categories_on_apoyo;

    setLocalTemplate({
      ...template,
      disable_main_stat_on_apoyo: disableMain ?? false,
      disabled_sub_categories_on_apoyo: disabledSubs ?? [],
      statistics_rules: rules.filter(r => r.field_id !== '__meta__')
    });

    setHasChanges(false);
  }, [template]);

  const handleSaveChanges = () => {
    if (isReadOnly) return;
    const cleanRules = localTemplate.statistics_rules || [];
    const metaRule = {
      field_id: '__meta__',
      disable_main_stat_on_apoyo: localTemplate.disable_main_stat_on_apoyo,
      disabled_sub_categories_on_apoyo: localTemplate.disabled_sub_categories_on_apoyo
    };

    const finalTemplate = {
      ...localTemplate,
      statistics_rules: [...cleanRules, metaRule]
    };

    onTemplateChange(finalTemplate);
    setHasChanges(false);
    toast.success("Cambios guardados correctamente");
  };

  const availableFields = useMemo(() => {
    const fields = Object.keys(localConfig.fields);
    const repeatableFields = new Set<string>();

    (localConfig.sections || []).forEach(sec => {
      if (sec.is_repeatable && sec.field_ids) {
        sec.field_ids.forEach(id => repeatableFields.add(id));
      }
    });

    const result = [...fields];
    repeatableFields.forEach(id => {
      result.push(`${id}*`);
      result.push(`${id} (1)`);
    });

    return result.sort();
  }, [localConfig.fields, localConfig.sections]);

  return (
    <div className="w-full md:h-full md:flex md:flex-col md:min-h-0 space-y-4 pb-20 sm:pb-0 animate-in fade-in duration-300">
      <Card className="shadow-lg border-none overflow-hidden md:h-full md:flex md:flex-col md:min-h-0">
        <CardContent className="p-6 space-y-6 md:flex-1 md:flex md:flex-col md:min-h-0 overflow-hidden">
          {/* Header Info & Save (Horizontal Layout) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Settings2 className="h-5 w-5" />
                <h2 className="text-lg font-bold tracking-tight">Editor de Plantilla</h2>
              </div>
            </div>
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isReadOnly}
              className={cn(
                "h-9 px-6 text-xs shadow-md font-bold rounded-xl shrink-0 sm:w-auto transition-all duration-300",
                hasChanges && !isReadOnly
                  ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              )}
            >
              <Save className="h-4 w-4 mr-2" />
              {isReadOnly ? 'Solo Lectura' : hasChanges ? 'Guardar Cambios' : 'Guardado'}
            </Button>
          </div>

          <div className="h-px bg-muted shrink-0" />

          {/* Grid Layout: 2 Columns on Desktop */}
          <div className="flex-1 md:min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch overflow-hidden">
            {/* Left Column (lg:col-span-4): Datos Generales */}
            <div className="lg:col-span-4 space-y-6 lg:border-r lg:border-muted lg:pr-8 flex flex-col overflow-y-auto max-h-full pr-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Datos Generales</h3>
              </div>

              {/* Nombre de la Plantilla */}
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
                  disabled={isReadOnly}
                  className="h-9 text-xs bg-muted/30 focus:bg-background transition-colors border-muted rounded-xl"
                />
              </div>

              {/* Categoría Estadística */}
              <div className="space-y-2">
                <Label htmlFor="stats-category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Categoría Estadística (Defecto)
                </Label>
                <SearchableCategorySelector
                  value={localTemplate.statistics_category || 'none'}
                  onSelect={(val) => {
                    setLocalTemplate((p) => ({ ...p, statistics_category: val === 'none' ? '' : val }));
                    setHasChanges(true);
                  }}
                  disabled={isReadOnly}
                  className="rounded-xl h-9 text-xs bg-muted/30 hover:bg-background"
                />
              </div>

              {/* Omitir por Apoyo Institucional - Principal */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/20 border border-muted/50 rounded-xl animate-in fade-in duration-300">
                <div className="flex flex-col space-y-0.5 max-w-[80%]">
                  <Label htmlFor="disable-main-stat-on-apoyo" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 cursor-pointer">
                    Omitir Estadística Principal
                  </Label>
                  <span className="text-[9px] text-muted-foreground leading-normal">
                    Desactiva la categoría estadística principal por defecto si se marca "Apoyo institucional"
                  </span>
                </div>
                <Switch
                  id="disable-main-stat-on-apoyo"
                  checked={!!localTemplate.disable_main_stat_on_apoyo}
                  onCheckedChange={(checked) => {
                    setLocalTemplate((p) => ({ ...p, disable_main_stat_on_apoyo: checked }));
                    setHasChanges(true);
                  }}
                  disabled={isReadOnly}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>


              {/* Sub-categorías */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Sub-categorías Estadísticas
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-primary hover:bg-primary/5 px-2 font-bold uppercase tracking-wider rounded-lg"
                    onClick={() => {
                      const current = localTemplate.statistics_sub_categories || [];
                      setLocalTemplate(p => ({ ...p, statistics_sub_categories: [...current, ''] }));
                      setHasChanges(true);
                    }}
                    disabled={isReadOnly}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Añadir
                  </Button>
                </div>

                <div className="space-y-2">
                  {(localTemplate.statistics_sub_categories || []).map((sub, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <SearchableCategorySelector
                          value={sub || 'none'}
                          onSelect={(val) => {
                            const newList = [...(localTemplate.statistics_sub_categories || [])];
                            newList[idx] = val === 'none' ? '' : val;
                            setLocalTemplate(p => ({ ...p, statistics_sub_categories: newList }));
                            setHasChanges(true);
                          }}
                          disabled={isReadOnly}
                          placeholder="Selecciona sub-categoría..."
                          className="rounded-xl h-9 text-xs bg-muted/30 hover:bg-background"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted/20 px-3 py-1 rounded-xl border border-muted/50 shrink-0 h-9 shadow-sm">
                        <Label htmlFor={`disable-sub-apoyo-${idx}`} className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/75 cursor-pointer">
                          Omitir Apoyo
                        </Label>
                        <Switch
                          id={`disable-sub-apoyo-${idx}`}
                          checked={(localTemplate.disabled_sub_categories_on_apoyo || []).includes(sub)}
                          onCheckedChange={(checked) => {
                            const currentDisabled = [...(localTemplate.disabled_sub_categories_on_apoyo || [])];
                            let nextDisabled: string[];
                            if (checked) {
                              nextDisabled = currentDisabled.includes(sub) ? currentDisabled : [...currentDisabled, sub];
                            } else {
                              nextDisabled = currentDisabled.filter(c => c !== sub);
                            }
                            setLocalTemplate(p => ({ ...p, disabled_sub_categories_on_apoyo: nextDisabled }));
                            setHasChanges(true);
                          }}
                          disabled={isReadOnly}
                          className="scale-75 data-[state=checked]:bg-orange-500"
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0 rounded-xl"
                        onClick={() => {
                          const newList = (localTemplate.statistics_sub_categories || []).filter((_, i) => i !== idx);
                          setLocalTemplate(p => ({ ...p, statistics_sub_categories: newList }));
                          setHasChanges(true);
                        }}
                        disabled={isReadOnly}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(localTemplate.statistics_sub_categories || []).length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic">Sin subcategorías por defecto.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (lg:col-span-8): Reglas Condicionales */}
            <div className="lg:col-span-8 md:h-full md:flex md:flex-col md:min-h-0 overflow-hidden space-y-4">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reglas Condicionales</h3>
                  {(localTemplate.statistics_rules || []).length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] h-4 px-1.5">
                      {(localTemplate.statistics_rules || []).length}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] bg-background shrink-0 px-2 rounded-lg"
                  onClick={() => {
                    const newRules = [...(localTemplate.statistics_rules || []), { field_id: '', operator: '=', condition: '', category: '', categories: [] }];
                    setLocalTemplate(p => ({ ...p, statistics_rules: newRules as StatisticRule[] }));
                    setHasChanges(true);
                  }}
                  disabled={isReadOnly}
                >
                  <Plus className="h-3 w-3 mr-1" /> Nueva Regla
                </Button>
              </div>

              {/* Scrollable Rules Container */}
              <ScrollArea className="flex-1 md:min-h-0 pr-4 -mr-4">
                <div className="space-y-4 pb-6">
                  {(localTemplate.statistics_rules || []).length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/5">
                      <BarChart3 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/65">Sin reglas automáticas configuradas.</p>
                      <p className="text-xs text-muted-foreground/50 mt-1 max-w-[280px] mx-auto">Configura reglas para mapear palabras clave de los reportes a estadísticas automáticamente.</p>
                    </div>
                  )}
                  {(() => {
                    const renderConditionInputs = (cond: any, onChange: (field: string, val: any) => void) => {
                      const hasValue = cond.operator !== 'empty' && cond.operator !== 'not_empty' && cond.operator !== 'extract_value';
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 w-full items-center">
                          <div className={cn("sm:col-span-6", !hasValue && "sm:col-span-8")}>
                            <Select
                              value={cond.field_id || ''}
                              onValueChange={(val) => onChange('field_id', val)}
                              disabled={isReadOnly}
                            >
                              <SelectTrigger className="h-8 text-[10px] w-full bg-background border-muted shadow-sm rounded-lg" disabled={isReadOnly}>
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
                          </div>

                          <div className={cn("sm:col-span-3", !hasValue && "sm:col-span-4")}>
                            <Select
                              value={cond.operator || '='}
                              onValueChange={(val) => onChange('operator', val)}
                              disabled={isReadOnly}
                            >
                              <SelectTrigger className="h-8 w-full text-[10px] px-2 bg-background border-muted shadow-sm font-mono rounded-lg" disabled={isReadOnly}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {OPERATORS.map(op => (
                                  <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {hasValue && (
                            <div className="sm:col-span-3">
                              {(() => {
                                const fieldConfig = cond.field_id ? localConfig.fields[cond.field_id] : undefined;
                                const isDropdown = fieldConfig?.type === 'dropdown';
                                const options = fieldConfig?.snippet_options || [];

                                if (isDropdown && options.length > 0) {
                                  return (
                                    <Select
                                      value={cond.condition || ''}
                                      onValueChange={(val) => onChange('condition', val)}
                                      disabled={isReadOnly}
                                    >
                                      <SelectTrigger className="h-8 text-[10px] w-full bg-background border-muted shadow-sm rounded-lg" disabled={isReadOnly}>
                                        <SelectValue placeholder="Valor..." />
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
                                    className="h-8 text-[10px] w-full bg-background border-muted shadow-sm rounded-lg"
                                    placeholder="Valor..."
                                    value={cond.condition || ''}
                                    onChange={(e) => onChange('condition', e.target.value)}
                                    disabled={isReadOnly}
                                  />
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (localTemplate.statistics_rules || []).map((rule, idx) => {
                      const updateRule = (updatedFields: Partial<StatisticRule>) => {
                        const newRules = [...(localTemplate.statistics_rules || [])];
                        newRules[idx] = { ...newRules[idx], ...updatedFields };
                        setLocalTemplate(p => ({ ...p, statistics_rules: newRules }));
                        setHasChanges(true);
                      };

                      return (
                        <div
                           key={idx}
                          className="bg-muted/20 p-5 rounded-2xl border border-muted/50 hover:border-primary/30 transition-all duration-300 space-y-4"
                        >
                          {/* SI (Condición) Header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">SI (Condición)</span>
                          </div>

                          {/* Primary Condition */}
                          {renderConditionInputs(rule, (field, val) => updateRule({ [field]: val }))}

                          {/* Secondary Conditions */}
                          {((rule.conditions && rule.conditions.length > 0) || (rule.or_conditions && rule.or_conditions.length > 0)) && (
                            <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                              {rule.conditions?.map((secCond, cIdx) => (
                                <div key={cIdx} className="flex flex-col gap-2 w-full pt-1 relative">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1.5 tracking-wider">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> Y (AND)
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-md"
                                      onClick={() => {
                                        const newSecConditions = [...(rule.conditions || [])];
                                        newSecConditions.splice(cIdx, 1);
                                        updateRule({ conditions: newSecConditions });
                                      }}
                                      disabled={isReadOnly}
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

                              {rule.or_conditions?.map((orCond, cIdx) => (
                                <div key={cIdx} className="flex flex-col gap-2 w-full pt-1 relative">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1.5 tracking-wider">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> O (OR)
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-md"
                                      onClick={() => {
                                        const newOrConditions = [...(rule.or_conditions || [])];
                                        newOrConditions.splice(cIdx, 1);
                                        updateRule({ or_conditions: newOrConditions });
                                      }}
                                      disabled={isReadOnly}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {renderConditionInputs(orCond, (field, val) => {
                                    const newOrConditions = [...(rule.or_conditions || [])];
                                    newOrConditions[cIdx] = { ...newOrConditions[cIdx], [field]: val };
                                    updateRule({ or_conditions: newOrConditions });
                                  })}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Adding conditions buttons */}
                          <div className="flex gap-3 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 flex-1 text-[9px] font-bold uppercase tracking-wider border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground rounded-lg"
                              onClick={() => {
                                const newSecConditions = [...(rule.conditions || []), { field_id: '', operator: '=' as const, condition: '' }];
                                updateRule({ conditions: newSecConditions as any });
                              }}
                              disabled={isReadOnly}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Añadir Y (AND)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 flex-1 text-[9px] font-bold uppercase tracking-wider border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground rounded-lg"
                              onClick={() => {
                                const newOrConditions = [...(rule.or_conditions || []), { field_id: '', operator: '=' as const, condition: '' }];
                                updateRule({ or_conditions: newOrConditions as any });
                              }}
                              disabled={isReadOnly}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Añadir O (OR)
                            </Button>
                          </div>

                          <div className="h-px bg-muted/60 my-2" />

                          {/* ENTONCES (Asignar) Header & Action Block */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-3">
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded inline-block">ENTONCES (Asignar)</span>
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                {(() => {
                                  const currentCategories = rule.categories || (rule.category ? [rule.category] : []);
                                  return (
                                    <>
                                      {currentCategories.length === 0 ? (
                                        <span className="text-[10px] text-muted-foreground/60 italic py-1">Sin categorías estadísticas asignadas</span>
                                      ) : (
                                        <div className="flex flex-wrap gap-1.5 max-w-full">
                                          {currentCategories.map((cat) => (
                                            <Badge
                                              key={cat}
                                              variant="secondary"
                                              className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold py-0.5 pl-2.5 pr-1.5 rounded-lg flex items-center gap-0.5 shrink-0 max-w-full"
                                            >
                                              <span className="truncate max-w-[200px]">{cat}</span>
                                              <button
                                                type="button"
                                                onClick={isReadOnly ? undefined : () => {
                                                  const newCats = currentCategories.filter(c => c !== cat);
                                                  const newRules = (localTemplate.statistics_rules || []).map((r, i) =>
                                                    i === idx ? { ...r, categories: newCats, category: newCats[0] || null } : r
                                                  );
                                                  setLocalTemplate(p => ({ ...p, statistics_rules: newRules }));
                                                  setHasChanges(true);
                                                }}
                                                disabled={isReadOnly}
                                                className="p-0.5 rounded-full hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors shrink-0 disabled:opacity-50"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            </Badge>
                                          ))}
                                        </div>
                                      )}

                                      <SearchableCategorySelector
                                        value="none"
                                        onSelect={(val) => {
                                          if (val !== 'none') {
                                            if (!currentCategories.includes(val)) {
                                              const newCats = [...currentCategories, val];
                                              const newRules = (localTemplate.statistics_rules || []).map((r, i) =>
                                                i === idx ? { ...r, categories: newCats, category: newCats[0] || null } : r
                                              );
                                              setLocalTemplate(p => ({ ...p, statistics_rules: newRules }));
                                              setHasChanges(true);
                                            }
                                          }
                                        }}
                                        disabled={isReadOnly}
                                        className="h-8 py-1 px-3 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-500 font-bold rounded-lg text-xs w-auto shrink-0"
                                        placeholder="Añadir..."
                                        customTrigger={
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-500 font-black uppercase tracking-wider rounded-lg shrink-0 animate-pulse"
                                            disabled={isReadOnly}
                                          >
                                            <Plus className="h-3 w-3 mr-1" /> Añadir
                                          </Button>
                                        }
                                      />
                                    </>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Duplicate / Delete Buttons */}
                            <div className="flex items-center justify-end gap-2 shrink-0 sm:pt-6">
                              <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-xl border border-muted/50 h-8 mr-2 shadow-sm animate-in fade-in duration-300">
                                <Label htmlFor={`disable-rule-apoyo-${idx}`} className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 cursor-pointer">
                                  Omitir por Apoyo
                                </Label>
                                <Switch
                                  id={`disable-rule-apoyo-${idx}`}
                                  checked={!!rule.disable_on_apoyo}
                                  onCheckedChange={(checked) => {
                                    const newRules = (localTemplate.statistics_rules || []).map((r, i) =>
                                      i === idx ? { ...r, disable_on_apoyo: checked } : r
                                    );
                                    setLocalTemplate(p => ({ ...p, statistics_rules: newRules }));
                                    setHasChanges(true);
                                  }}
                                  disabled={isReadOnly}
                                  className="scale-75 data-[state=checked]:bg-orange-500"
                                />
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] gap-1.5 text-muted-foreground hover:text-foreground hover:bg-background/80 px-2.5 rounded-lg border border-muted/50 shadow-sm"
                                onClick={() => {
                                  const ruleToDuplicate = JSON.parse(JSON.stringify(localTemplate.statistics_rules![idx]));
                                  const newRules = [...(localTemplate.statistics_rules || [])];
                                  newRules.splice(idx + 1, 0, ruleToDuplicate);
                                  setLocalTemplate(p => ({ ...p, statistics_rules: newRules }));
                                  setHasChanges(true);
                                  toast.success("Regla duplicada");
                                }}
                                disabled={isReadOnly}
                              >
                                <Copy className="h-3.5 w-3.5" /> Duplicar
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2.5 rounded-lg border border-destructive/20 shadow-sm"
                                onClick={() => {
                                  const newRules = (localTemplate.statistics_rules || []).filter((_, i) => i !== idx);
                                  setLocalTemplate(p => ({ ...p, statistics_rules: newRules }));
                                  setHasChanges(true);
                                }}
                                disabled={isReadOnly}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
