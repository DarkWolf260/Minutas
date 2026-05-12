'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FieldConfig, SnippetOption } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { generateId } from '@/lib/utils/id';

interface SnippetOptionEditorProps {
  config: FieldConfig;
  onUpdate: (newConfig: FieldConfig) => void;
}

export const SnippetOptionEditor = ({ config, onUpdate }: SnippetOptionEditorProps) => {
  const handleOptionChange = (optionId: string, part: 'label' | 'value', text: string) => {
    const newOptions = (config.snippet_options || []).map((opt) =>
      opt.id === optionId ? { ...opt, [part]: text } : opt
    );
    onUpdate({ ...config, snippet_options: newOptions });
  };

  const handleAddOption = () => {
    const newOption: SnippetOption = { id: generateId('opt'), label: '', value: '' };
    const newOptions = [...(config.snippet_options || []), newOption];
    onUpdate({ ...config, snippet_options: newOptions });
  };

  const handleRemoveOption = (optionId: string) => {
    const newOptions = (config.snippet_options || []).filter((opt) => opt.id !== optionId);
    onUpdate({ ...config, snippet_options: newOptions });
  };

  return (
    <div className="p-2 border rounded-md bg-muted/10 space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold flex items-center gap-2">
          <PlusCircle className="h-3 w-3 text-muted-foreground" />
          Opciones del Selector
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          className="h-6 text-[10px] px-2"
        >
          Añadir Opción
        </Button>
      </div>
      <div className="space-y-1.5 pt-1">
        {(config.snippet_options || []).map((option) => (
          <div
            key={option.id}
            className="p-2 bg-background rounded-md border flex flex-col gap-1.5 group relative"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nombre (ej: Vía Radio)"
                value={option.label}
                onChange={(e) => handleOptionChange(option.id, 'label', e.target.value)}
                className="h-7 text-[10px] flex-1"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveOption(option.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Textarea
              placeholder="Texto a insertar..."
              value={option.value}
              onChange={(e) => handleOptionChange(option.id, 'value', e.target.value)}
              className="text-[10px] min-h-[40px] p-1.5 resize-none"
              rows={2}
            />
          </div>
        ))}
      </div>
      {(!config.snippet_options || config.snippet_options.length === 0) && (
        <p className="text-[10px] text-muted-foreground italic text-center py-1">
          Sin opciones definidas.
        </p>
      )}
    </div>
  );
};
