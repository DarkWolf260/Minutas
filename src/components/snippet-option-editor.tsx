'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FieldConfig, SnippetOption } from '@/types';
import { PlusCircle, Trash2 } from 'lucide-react';

interface SnippetOptionEditorProps {
    config: FieldConfig;
    onUpdate: (newConfig: FieldConfig) => void;
}

export const SnippetOptionEditor = ({ config, onUpdate }: SnippetOptionEditorProps) => {
    const handleOptionChange = (optionId: string, part: 'label' | 'value', text: string) => {
        const newOptions = (config.snippetOptions || []).map(opt =>
            opt.id === optionId ? { ...opt, [part]: text } : opt
        );
        onUpdate({ ...config, snippetOptions: newOptions });
    };

    const handleAddOption = () => {
        const newOption: SnippetOption = { id: `opt_${Date.now()}`, label: '', value: '' };
        const newOptions = [...(config.snippetOptions || []), newOption];
        onUpdate({ ...config, snippetOptions: newOptions });
    };

    const handleRemoveOption = (optionId: string) => {
        const newOptions = (config.snippetOptions || []).filter(opt => opt.id !== optionId);
        onUpdate({ ...config, snippetOptions: newOptions });
    };

    return (
        <div className="p-3 pl-10 border-l-2 ml-4 mt-2 border-dashed bg-muted/30 rounded-r-md space-y-4">
            <div className="space-y-2">
                <Label className="font-semibold">Opciones del Selector</Label>
                <p className="text-xs text-muted-foreground">Define las opciones que aparecerán en la lista desplegable y el texto que insertarán.</p>
                <div className="space-y-3 pt-2">
                    {(config.snippetOptions || []).map(option => (
                        <div key={option.id} className="p-3 bg-background rounded-md border space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-medium">Opción</Label>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveOption(option.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Input
                                placeholder="Nombre de la opción (ej: Vía Radio)"
                                value={option.label}
                                onChange={e => handleOptionChange(option.id, 'label', e.target.value)}
                            />
                            <Textarea
                                placeholder="Texto a insertar"
                                value={option.value}
                                onChange={e => handleOptionChange(option.id, 'value', e.target.value)}
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={handleAddOption} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Opción
                </Button>
            </div>
        </div>
    );
};
