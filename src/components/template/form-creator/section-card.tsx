'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  ChevronRight,
  FolderPlus,
  Settings2,
} from 'lucide-react';
import { FieldCard } from './field-card';
import type { FormCreatorSection, FormCreatorField } from './template-compiler';
import { sanitizeFieldId } from './template-compiler';

interface SectionCardProps {
  section: FormCreatorSection;
  index: number;
  totalSections: number;
  onChange: (updated: FormCreatorSection) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SectionCard({
  section,
  index,
  totalSections,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNamingConfig, setShowNamingConfig] = useState(false);

  // Field operations inside this section
  const handleAddField = (type: FormCreatorField['type'] = 'text', defaultLabel?: string) => {
    const base = defaultLabel || (type === 'dropdown' ? 'Selección' : type === 'date' ? 'Fecha' : type === 'textarea' ? 'Descripción' : 'Campo');
    const existingLabels = new Set(section.fields.map((f) => f.label.toLowerCase().trim()));
    let finalLabel = base;
    let counter = 1;
    while (existingLabels.has(finalLabel.toLowerCase().trim())) {
      counter++;
      finalLabel = `${base} ${counter}`;
    }

    const newField: FormCreatorField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: finalLabel,
      type,
      required: false,
      isFullWidth: false,
      modifier: 'none',
      options: type === 'dropdown' ? ['Opción 1', 'Opción 2'] : undefined,
    };
    onChange({
      ...section,
      fields: [...section.fields, newField],
    });
  };

  const handleFieldChange = (fieldIndex: number, updatedField: FormCreatorField) => {
    const newFields = [...section.fields];
    newFields[fieldIndex] = updatedField;
    onChange({ ...section, fields: newFields });
  };

  const handleFieldDelete = (fieldIndex: number) => {
    const newFields = section.fields.filter((_, i) => i !== fieldIndex);
    onChange({ ...section, fields: newFields });
  };

  const handleFieldDuplicate = (fieldIndex: number) => {
    const source = section.fields[fieldIndex];
    if (!source) return;
    const duplicated: FormCreatorField = {
      ...source,
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: `${source.label} (Copia)`,
      options: source.options ? [...source.options] : undefined,
    };
    const newFields = [...section.fields];
    newFields.splice(fieldIndex + 1, 0, duplicated);
    onChange({ ...section, fields: newFields });
  };

  const handleFieldMove = (fieldIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (targetIndex < 0 || targetIndex >= section.fields.length) return;
    const newFields = [...section.fields];
    const [moved] = newFields.splice(fieldIndex, 1);
    if (!moved) return;
    newFields.splice(targetIndex, 0, moved);
    onChange({ ...section, fields: newFields });
  };

  // Sync section title to engine identifiers cleanly
  const handleTitleChange = (val: string) => {
    const clean = sanitizeFieldId(val).toUpperCase();
    const isPlural = clean.endsWith('S') && clean.length > 3;
    const singular = isPlural ? clean.slice(0, -1) : clean;
    const plural = isPlural ? clean : (clean ? `${clean}S` : 'ITEMS');
    onChange({
      ...section,
      title: val,
      singularTitle: singular || 'ITEM',
      pluralTitle: plural || 'ITEMS',
      subLabel: singular || 'ITEM',
    });
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header Card */}
      <Card className="rounded-2xl border-2 border-primary/30 bg-card/80 shadow-sm overflow-hidden">
        {/* Decorative top strip */}
        <div className="h-2 bg-gradient-to-r from-primary/60 via-primary to-primary/80" />

        <CardHeader className="p-5 pb-4 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-md gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Sección #{index + 1} (Grupo repetible)
              </Badge>
              <span className="text-xs text-muted-foreground">
                {section.fields.length} {section.fields.length === 1 ? 'pregunta' : 'preguntas'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Contraer sección' : 'Expandir sección'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                disabled={index === 0}
                onClick={onMoveUp}
                title="Mover sección arriba"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                disabled={index === totalSections - 1}
                onClick={onMoveDown}
                title="Mover sección abajo"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onDuplicate}
                title="Duplicar sección completa"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${showNamingConfig ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setShowNamingConfig(!showNamingConfig)}
                title="Configurar nombres en reporte"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={onDelete}
                title="Eliminar sección"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Input
              value={section.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título de la sección (ej. Datos de los Acompañantes, Vehículos)..."
              className="text-lg font-bold border-0 border-b border-border/60 rounded-none px-1 py-1 focus-visible:ring-0 focus-visible:border-primary bg-transparent placeholder:text-muted-foreground/50"
            />
            <p className="text-xs text-muted-foreground px-1">
              Las preguntas de esta sección se podrán duplicar tantas veces como sea necesario al responder el formulario.
            </p>

            {showNamingConfig && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-background/80 p-3 rounded-xl border border-border/60 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Nombre singular:</span>
                  <Input
                    value={section.singularTitle}
                    onChange={(e) =>
                      onChange({
                        ...section,
                        singularTitle: e.target.value.toUpperCase(),
                        subLabel: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej. VEHICULO"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Nombre plural:</span>
                  <Input
                    value={section.pluralTitle}
                    onChange={(e) =>
                      onChange({
                        ...section,
                        pluralTitle: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej. VEHICULOS"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium">Prefijo en reporte:</span>
                  <Input
                    value={section.subLabel}
                    onChange={(e) =>
                      onChange({
                        ...section,
                        subLabel: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej. VEHICULO"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="p-4 sm:p-5 space-y-4 bg-muted/10">
            {/* List of questions inside section */}
            <div className="space-y-3">
              {section.fields.length === 0 ? (
                <div className="p-8 border border-dashed rounded-xl text-center space-y-2 bg-background/50">
                  <FolderPlus className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Esta sección no tiene preguntas todavía.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddField('text', 'Nombre')}
                    className="gap-1.5 text-xs rounded-xl"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Añadir primera pregunta
                  </Button>
                </div>
              ) : (
                section.fields.map((field, fieldIdx) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    index={fieldIdx}
                    totalFields={section.fields.length}
                    onChange={(updated) => handleFieldChange(fieldIdx, updated)}
                    onDelete={() => handleFieldDelete(fieldIdx)}
                    onDuplicate={() => handleFieldDuplicate(fieldIdx)}
                    onMoveUp={() => handleFieldMove(fieldIdx, 'up')}
                    onMoveDown={() => handleFieldMove(fieldIdx, 'down')}
                  />
                ))
              )}
            </div>

            {/* Quick Add inside Section */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddField('text', 'Texto')}
                className="gap-1.5 text-xs rounded-xl bg-background hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Respuesta corta
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddField('dropdown', 'Selección')}
                className="gap-1.5 text-xs rounded-xl bg-background hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Desplegable
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddField('date', 'Fecha')}
                className="gap-1.5 text-xs rounded-xl bg-background hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Fecha
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddField('textarea', 'Descripción')}
                className="gap-1.5 text-xs rounded-xl bg-background hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Párrafo
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
