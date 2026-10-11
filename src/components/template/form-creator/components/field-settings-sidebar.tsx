import React, { useRef, useLayoutEffect } from 'react';
import {
  Layers,
  Folder,
  Copy,
  Plus,
  X,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { FormCreatorField } from '../template-compiler';
import { sanitizeFieldId } from '../template-compiler';

interface FieldSettingsSidebarProps {
  canvasView?: 'visual' | 'text';
  allCurrentFields?: FormCreatorField[];
  templateText?: string;
  onSwitchToVisual?: () => void;
  selectedField: FormCreatorField | null;
  questionNumberMap: Map<string, string>;
  onUpdateSelectedField: (updates: Partial<FormCreatorField>) => void;
  onDeleteSelectedField: () => void;
  onDuplicateSection: (sectionId: string) => void;
}

/**
 * Textarea autoajustable que expande o reduce su altura automáticamente
 * según la cantidad de contenido y líneas escritas.
 */
function AutoResizeTextarea({
  id,
  value,
  onChange,
  placeholder,
  className,
  minHeight = 36,
}: {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }, [value, minHeight]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={cn(
        'w-full rounded-xl border border-border/80 bg-card text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring p-2.5 leading-relaxed resize-none overflow-hidden transition-[height] duration-75',
        className
      )}
    />
  );
}

export function FieldSettingsSidebar({
  selectedField,
  questionNumberMap,
  onUpdateSelectedField,
  onDeleteSelectedField,
  onDuplicateSection,
}: FieldSettingsSidebarProps) {
  const handleUpdateOption = (optIndex: number, newValue: string) => {
    if (!selectedField || !selectedField.options) return;
    const nextOptions = [...selectedField.options];
    nextOptions[optIndex] = newValue;
    onUpdateSelectedField({ options: nextOptions });
  };

  const handleRemoveOption = (optIndex: number) => {
    if (!selectedField || !selectedField.options) return;
    const nextOptions = selectedField.options.filter((_, idx) => idx !== optIndex);
    onUpdateSelectedField({ options: nextOptions });
  };

  const handleAddOption = () => {
    if (!selectedField) return;
    const current = selectedField.options || [];
    onUpdateSelectedField({
      options: [...current, `Opción ${current.length + 1}`],
    });
  };

  return (
    <div className="md:col-span-3 xl:col-span-3 flex flex-col min-h-0 overflow-y-auto space-y-3.5 pr-1">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>AJUSTES DEL CAMPO</span>
        </h3>
        {selectedField && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground border border-border/60">
            {selectedField.type === 'section'
              ? 'Sección'
              : selectedField.type === 'separator'
              ? 'Divisor'
              : `#${questionNumberMap.get(selectedField.id) || '1'}`}
          </span>
        )}
      </div>

      {!selectedField ? (
        <div className="p-8 border border-dashed rounded-2xl text-center space-y-2.5 bg-muted/10 my-1">
          <div className="h-10 w-10 mx-auto rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
            <SlidersHorizontal className="h-5 w-5 opacity-70" />
          </div>
          <p className="text-xs font-medium text-foreground/80">
            Ningún campo seleccionado
          </p>
          <p className="text-2xs text-muted-foreground leading-relaxed">
            Haz clic en una pregunta, sección o separador en el documento central para ajustar sus propiedades.
          </p>
        </div>
      ) : selectedField.type === 'section' ? (
        /* ================== AJUSTES DE SECCIÓN ================== */
        <div className="space-y-3.5">
          {/* Tarjeta de estado de sección */}
          <div
            className={cn(
              'rounded-xl p-3 border space-y-1',
              selectedField.isRepeatable !== false
                ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-200'
                : 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/50 text-blue-900 dark:text-blue-200'
            )}
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              {selectedField.isRepeatable !== false ? (
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <span>
                {selectedField.isRepeatable !== false ? 'Grupo Repetible' : 'Sección Simple'}
              </span>
            </div>
            <p className="text-2xs text-muted-foreground leading-tight">
              {selectedField.isRepeatable !== false
                ? 'Permite a los usuarios agregar múltiples ítems pulsando "+ Añadir otro".'
                : 'Agrupa preguntas bajo un mismo encabezado sin duplicación.'}
            </p>
          </div>

          {/* Nombre / Título */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Título de la sección
            </Label>
            <Input
              value={selectedField.label}
              onChange={(e) => {
                const val = e.target.value;
                if (selectedField.isRepeatable !== false) {
                  const clean = sanitizeFieldId(val).toUpperCase();
                  const isPlural = clean.endsWith('S') && clean.length > 3;
                  const singular = isPlural ? clean.slice(0, -1) : clean;
                  const plural = isPlural ? clean : clean ? `${clean}S` : 'ITEMS';
                  onUpdateSelectedField({
                    label: val,
                    singularTitle: singular || 'ITEM',
                    pluralTitle: plural || 'ITEMS',
                    subLabel: singular || 'ITEM',
                  });
                } else {
                  onUpdateSelectedField({ label: val });
                }
              }}
              placeholder="Ej: DATOS DEL VEHÍCULO"
              className="h-9 rounded-xl border-border/80 text-xs bg-card"
            />
          </div>

          {/* Toggle Repetible */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card">
            <div className="space-y-0.5 pr-2">
              <Label htmlFor="switch-repeatable" className="text-xs font-medium text-foreground cursor-pointer">
                Sección repetible
              </Label>
              <p className="text-2xs text-muted-foreground">Permite múltiples registros</p>
            </div>
            <Switch
              id="switch-repeatable"
              checked={selectedField.isRepeatable !== false}
              onCheckedChange={(checked) => {
                if (checked) {
                  const clean = sanitizeFieldId(selectedField.label).toUpperCase();
                  const isPlural = clean.endsWith('S') && clean.length > 3;
                  const singular = isPlural ? clean.slice(0, -1) : clean;
                  const plural = isPlural ? clean : clean ? `${clean}S` : 'ITEMS';
                  onUpdateSelectedField({
                    isRepeatable: true,
                    singularTitle: selectedField.singularTitle || singular || 'ITEM',
                    pluralTitle: selectedField.pluralTitle || plural || 'ITEMS',
                    subLabel: selectedField.subLabel || singular || 'ITEM',
                  });
                } else {
                  onUpdateSelectedField({ isRepeatable: false });
                }
              }}
            />
          </div>

          {/* Nombres singular, plural y sub-rótulo */}
          {selectedField.isRepeatable !== false && (
            <div className="space-y-2 p-2.5 rounded-xl border border-border/70 bg-muted/20">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">
                    Singular (1 ítem)
                  </Label>
                  <Input
                    value={selectedField.singularTitle || ''}
                    onChange={(e) => {
                      const oldSingular = selectedField.singularTitle || '';
                      const newSingular = e.target.value.toUpperCase();
                      const shouldUpdateSub = !selectedField.subLabel || selectedField.subLabel === oldSingular;
                      onUpdateSelectedField({
                        singularTitle: newSingular,
                        subLabel: shouldUpdateSub ? newSingular : selectedField.subLabel,
                      });
                    }}
                    placeholder="DATOS DEL PACIENTE"
                    className="h-8 rounded-lg text-xs uppercase bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">
                    Plural (+1 ítems)
                  </Label>
                  <Input
                    value={selectedField.pluralTitle || ''}
                    onChange={(e) =>
                      onUpdateSelectedField({
                        pluralTitle: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="DATOS DE LOS PACIENTES"
                    className="h-8 rounded-lg text-xs uppercase bg-card"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">
                  Sub-rótulo (#01, #02)
                </Label>
                <Input
                  value={selectedField.subLabel || ''}
                  onChange={(e) =>
                    onUpdateSelectedField({
                      subLabel: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="PACIENTE"
                  className="h-8 rounded-lg text-xs uppercase bg-card"
                />
              </div>
            </div>
          )}

          {/* Acciones de sección */}
          <div className="pt-2 space-y-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDuplicateSection(selectedField.id)}
              className="w-full text-xs rounded-xl gap-1.5 h-8.5"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicar sección</span>
            </Button>

            <button
              type="button"
              onClick={onDeleteSelectedField}
              className="w-full py-2 rounded-xl border border-destructive/25 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar sección</span>
            </button>
          </div>
        </div>
      ) : selectedField.type === 'separator' ? (
        /* ================== AJUSTES DE SEPARADOR ================== */
        <div className="space-y-3.5">
          <div className="rounded-xl p-3 border border-border/70 bg-card space-y-1">
            <span className="text-xs font-semibold text-foreground">Línea Divisoria</span>
            <p className="text-2xs text-muted-foreground leading-tight">
              Separa visualmente bloques de preguntas o añade un subtítulo en el reporte.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Título opcional
            </Label>
            <Input
              value={
                selectedField.label === 'Separador' || selectedField.label === 'Divisor'
                  ? ''
                  : selectedField.label
              }
              onChange={(e) =>
                onUpdateSelectedField({
                  label: e.target.value.trim() ? e.target.value : 'Separador',
                })
              }
              placeholder="Ej: DATOS OPERACIONALES (o vacío)"
              className="h-9 rounded-xl border-border/80 text-xs bg-card"
            />
          </div>

          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onDeleteSelectedField}
              className="w-full py-2 rounded-xl border border-destructive/25 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar divisor</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================== AJUSTES DE PREGUNTA / CAMPO ================== */
        <div className="space-y-3.5">
          {/* 1. Etiqueta / Nombre de la pregunta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Etiqueta de la pregunta
            </Label>
            <Input
              value={selectedField.label}
              onChange={(e) => onUpdateSelectedField({ label: e.target.value })}
              placeholder={`Pregunta ${questionNumberMap.get(selectedField.id) || 1}`}
              className="h-9 rounded-xl border-border/80 text-xs bg-card"
            />
            <span className="text-[10px] text-muted-foreground block font-mono">
              - *{selectedField.label ? selectedField.label.trim().toUpperCase() : 'CAMPO'}:*
            </span>
          </div>

          {/* 2. Texto por defecto con ajuste automático de altura */}
          {selectedField.type !== 'predefined' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="input-field-default-value" className="text-xs font-semibold text-foreground">
                  Texto por defecto
                </Label>
                {selectedField.defaultValue && (
                  <button
                    type="button"
                    onClick={() => onUpdateSelectedField({ defaultValue: undefined })}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors font-medium"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {selectedField.type === 'textarea' || selectedField.type === 'text' || selectedField.type === 'cedula' ? (
                <AutoResizeTextarea
                  id="input-field-default-value"
                  value={selectedField.defaultValue || ''}
                  onChange={(e) =>
                    onUpdateSelectedField({
                      defaultValue: e.target.value ? e.target.value : undefined,
                    })
                  }
                  placeholder={
                    selectedField.type === 'textarea'
                      ? 'Ej: Sin novedades que reportar durante la jornada de guardia...'
                      : selectedField.type === 'cedula'
                      ? 'Ej: V-12345678'
                      : 'Ej: Valor inicial sugerido'
                  }
                  minHeight={selectedField.type === 'textarea' ? 68 : 36}
                />
              ) : selectedField.type === 'dropdown' ? (
                <AutoResizeTextarea
                  id="input-field-default-value"
                  value={selectedField.defaultValue || ''}
                  onChange={(e) =>
                    onUpdateSelectedField({
                      defaultValue: e.target.value ? e.target.value : undefined,
                    })
                  }
                  placeholder="Opción predeterminada"
                  minHeight={36}
                />
              ) : (
                <Input
                  id="input-field-default-value"
                  value={selectedField.defaultValue || ''}
                  onChange={(e) =>
                    onUpdateSelectedField({
                      defaultValue: e.target.value ? e.target.value : undefined,
                    })
                  }
                  placeholder={
                    selectedField.type === 'date'
                      ? 'YYYY-MM-DD'
                      : selectedField.type === 'time-hlv'
                      ? 'HH:MM'
                      : 'Valor sugerido'
                  }
                  className="h-9 rounded-xl border-border/80 text-xs bg-card"
                />
              )}

              {/* Selector rápido para dropdown */}
              {selectedField.type === 'dropdown' && selectedField.options && selectedField.options.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium block">
                    Predeterminar opción:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedField.options.map((opt, idx) => {
                      const isSelected = selectedField.defaultValue === opt;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            onUpdateSelectedField({
                              defaultValue: isSelected ? undefined : opt,
                            })
                          }
                          className={cn(
                            'text-2xs px-2 py-0.5 rounded-md border transition-all',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                              : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60'
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Opciones para Dropdown */}
          {selectedField.type === 'dropdown' && (
            <div className="space-y-2 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Opciones de respuesta
                </Label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {(selectedField.options || []).length}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(selectedField.options || []).map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-1.5">
                    <Input
                      value={opt}
                      onChange={(e) => handleUpdateOption(oIdx, e.target.value)}
                      placeholder={`Opción ${oIdx + 1}`}
                      className="h-8 text-xs rounded-lg bg-card"
                    />
                    {(selectedField.options || []).length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(oIdx)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 rounded-md"
                        title="Eliminar opción"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full text-xs rounded-xl gap-1 text-primary border-primary/30 hover:bg-primary/10 h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Añadir opción</span>
              </Button>
            </div>
          )}

          {/* 4. Comportamiento y Reglas en tarjeta agrupada */}
          <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
            {/* Obligatorio / Requerido */}
            <div className="flex items-center justify-between p-2.5">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="field-required-toggle" className="text-xs font-medium text-foreground cursor-pointer">
                  Campo obligatorio
                </Label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Exige respuesta para guardar
                </p>
              </div>
              <Switch
                id="field-required-toggle"
                checked={!!selectedField.required}
                onCheckedChange={(checked) => onUpdateSelectedField({ required: checked })}
              />
            </div>

            {/* Ancho completo */}
            <div className="flex items-center justify-between p-2.5">
              <div className="space-y-0.5 pr-2">
                <Label htmlFor="field-fullwidth-toggle" className="text-xs font-medium text-foreground cursor-pointer">
                  Ancho completo
                </Label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Ocupa las 2 columnas del formulario
                </p>
              </div>
              <Switch
                id="field-fullwidth-toggle"
                checked={!!selectedField.isFullWidth}
                onCheckedChange={(checked) => onUpdateSelectedField({ isFullWidth: checked })}
              />
            </div>
          </div>

          {/* 5. Zona de eliminación */}
          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onDeleteSelectedField}
              className="w-full py-2 rounded-xl border border-destructive/25 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar pregunta</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
