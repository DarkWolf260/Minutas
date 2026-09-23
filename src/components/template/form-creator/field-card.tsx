'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Type,
  AlignLeft,
  Calendar,
  Clock,
  ListFilter,
  Fingerprint,
  Lock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  CircleDot,
  Settings2,
  Columns,
} from 'lucide-react';
import type { FormCreatorField } from './template-compiler';
import type { FieldType } from '@/lib/types';

export const QUESTION_TYPES: {
  type: FieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { type: 'text', label: 'Respuesta corta', icon: Type, description: 'Una sola línea de texto' },
  { type: 'textarea', label: 'Párrafo', icon: AlignLeft, description: 'Texto libre de varias líneas' },
  { type: 'dropdown', label: 'Desplegable de opciones', icon: ListFilter, description: 'Menú con opciones a elegir' },
  { type: 'date', label: 'Fecha', icon: Calendar, description: 'Selector de día, mes y año' },
  { type: 'time-hlv', label: 'Hora', icon: Clock, description: 'Formato de hora militar / 24 horas' },
  { type: 'cedula', label: 'Cédula / Identificación', icon: Fingerprint, description: 'Número de documento de identidad' },
  { type: 'predefined', label: 'Dato del sistema', icon: Lock, description: 'Valor automático prellenado' },
];

interface FieldCardProps {
  field: FormCreatorField;
  index: number;
  totalFields: number;
  isActive?: boolean;
  onSelect?: () => void;
  onChange: (updated: FormCreatorField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function FieldCard({
  field,
  index,
  totalFields,
  isActive = false,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: FieldCardProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Helper to change question type
  const handleTypeChange = (newType: FieldType) => {
    let nextOptions = field.options;
    if (newType === 'dropdown' && (!nextOptions || nextOptions.length === 0)) {
      nextOptions = ['Opción 1', 'Opción 2'];
    }
    onChange({
      ...field,
      type: newType,
      options: nextOptions,
    });
  };

  // Option handlers for dropdowns
  const handleAddOption = () => {
    const current = field.options || [];
    const nextNum = current.length + 1;
    onChange({
      ...field,
      options: [...current, `Opción ${nextNum}`],
    });
  };

  const handleUpdateOption = (optIndex: number, val: string) => {
    const current = [...(field.options || [])];
    current[optIndex] = val;
    onChange({
      ...field,
      options: current,
    });
  };

  const handleRemoveOption = (optIndex: number) => {
    const current = [...(field.options || [])];
    current.splice(optIndex, 1);
    onChange({
      ...field,
      options: current.length > 0 ? current : ['Opción 1'],
    });
  };

  return (
    <Card
      onClick={onSelect}
      className={`relative transition-all duration-200 bg-card rounded-2xl border shadow-sm hover:shadow-md ${
        isActive
          ? 'ring-2 ring-primary/40 border-primary shadow-md'
          : 'border-border/70 hover:border-border'
      }`}
    >
      {/* Left colored bar indicator when active (Google Forms style) */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full transition-all ${
          isActive ? 'bg-primary' : 'bg-transparent'
        }`}
      />

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Top: Question Title Input & Type Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0 select-none">
                #{index + 1}
              </span>
              <Input
                value={field.label}
                onChange={(e) => onChange({ ...field, label: e.target.value })}
                placeholder="Escribe el título de la pregunta..."
                className="text-base sm:text-lg font-medium border-0 border-b border-border/60 rounded-none px-1 py-1.5 focus-visible:ring-0 focus-visible:border-primary bg-transparent placeholder:text-muted-foreground/50 transition-colors"
              />
            </div>
          </div>

          <div className="w-full sm:w-auto min-w-[210px] shrink-0">
            <Select
              value={field.type}
              onValueChange={(val) => handleTypeChange(val as FieldType)}
            >
              <SelectTrigger className="h-10 text-sm rounded-xl border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <SelectValue placeholder="Tipo de pregunta" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {QUESTION_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.type} value={t.type} className="text-sm py-2">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Middle: Visual representation of the question preview */}
        <div className="pt-1">
          {field.type === 'text' && (
            <div className="border-b border-dashed border-muted-foreground/40 py-2 max-w-sm">
              <span className="text-sm text-muted-foreground/60 italic select-none">
                Texto de respuesta corta
              </span>
            </div>
          )}

          {field.type === 'textarea' && (
            <div className="border-b border-dashed border-muted-foreground/40 py-4 max-w-lg">
              <span className="text-sm text-muted-foreground/60 italic select-none">
                Texto de respuesta larga (párrafo)
              </span>
            </div>
          )}

          {field.type === 'date' && (
            <div className="flex items-center gap-2 border-b border-dashed border-muted-foreground/40 py-2 max-w-xs">
              <Calendar className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground/60 italic select-none">
                dd / mm / aaaa
              </span>
            </div>
          )}

          {field.type === 'time-hlv' && (
            <div className="flex items-center gap-2 border-b border-dashed border-muted-foreground/40 py-2 max-w-xs">
              <Clock className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground/60 italic select-none">
                Hora (ej. 14:30)
              </span>
            </div>
          )}

          {field.type === 'cedula' && (
            <div className="flex items-center gap-2 border-b border-dashed border-muted-foreground/40 py-2 max-w-xs">
              <Fingerprint className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground/60 italic select-none">
                V- / E- Número de cédula
              </span>
            </div>
          )}

          {field.type === 'predefined' && (
            <div className="flex items-center gap-2 border-b border-dashed border-muted-foreground/40 py-2 max-w-xs">
              <Lock className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-sm text-muted-foreground/60 italic select-none">
                Se completará automáticamente con los datos del sistema
              </span>
            </div>
          )}

          {/* Dropdown Options Builder */}
          {field.type === 'dropdown' && (
            <div className="space-y-2.5 max-w-md">
              {(field.options || ['Opción 1', 'Opción 2']).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2.5 group">
                  <CircleDot className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <Input
                    value={opt}
                    onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                    placeholder={`Opción ${optIdx + 1}`}
                    className="h-8 text-sm border-0 border-b border-border/50 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent px-1 py-0"
                  />
                  {(field.options || []).length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={() => handleRemoveOption(optIdx)}
                      title="Eliminar opción"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
                className="text-xs text-primary hover:text-primary gap-1.5 h-8 px-2 mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir opción
              </Button>
            </div>
          )}
        </div>

        {/* Collapsible Advanced Formats */}
        {showAdvanced && (
          <div className="pt-3 pb-1 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-xl">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Formato de texto</Label>
              <Select
                value={field.modifier || 'none'}
                onValueChange={(val: any) => onChange({ ...field, modifier: val })}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Normal (tal como se escribe)</SelectItem>
                  <SelectItem value="upper">TODO EN MAYÚSCULAS</SelectItem>
                  <SelectItem value="title">Primera Letra En Mayúscula</SelectItem>
                  <SelectItem value="lower">todo en minúsculas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-background border">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                  Ocupar ancho completo
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Extiende el campo a lo largo de todo el formulario
                </p>
              </div>
              <Switch
                checked={!!field.isFullWidth}
                onCheckedChange={(checked) => onChange({ ...field, isFullWidth: checked })}
              />
            </div>
          </div>
        )}

        {/* Bottom Toolbar: Reorder, Actions & Required Switch */}
        <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-muted-foreground">
          {/* Reordering */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={index === 0}
              onClick={onMoveUp}
              title="Mover pregunta arriba"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={index === totalFields - 1}
              onClick={onMoveDown}
              title="Mover pregunta abajo"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showAdvanced ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
              title="Opciones avanzadas de formato"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Right actions: Duplicate, Delete, Required Switch */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onDuplicate}
                title="Duplicar pregunta"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                onClick={onDelete}
                title="Eliminar pregunta"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-5 w-px bg-border" />

            <div className="flex items-center gap-2">
              <Label htmlFor={`req-${field.id}`} className="text-xs font-medium cursor-pointer">
                Obligatorio
              </Label>
              <Switch
                id={`req-${field.id}`}
                checked={!!field.required}
                onCheckedChange={(checked) => onChange({ ...field, required: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
