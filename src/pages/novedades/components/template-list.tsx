import React from 'react';
import { Button } from '@/components/ui/button';
import { getTemplateIcon } from '@/lib/utils';
import type { Template } from '@/lib/types';

interface TemplateListProps {
  templates: Template[];
  onSelect: (id: string) => void;
  onNavigateToTemplates: () => void;
}

export const TemplateList = ({ templates, onSelect, onNavigateToTemplates }: TemplateListProps) => {
  const activas = templates.filter(t => t.is_active);
  
  if (activas.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No hay plantillas activas.</p>
        <Button variant="link" onClick={onNavigateToTemplates}>Ir a Plantillas</Button>
      </div>
    );
  }

  return (
    <>
      {activas.map((template) => {
        const Icon = getTemplateIcon(template.name);
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="w-full text-left p-4 rounded-2xl border bg-card hover:bg-muted transition-all flex items-center gap-4 active:scale-[0.98] shadow-sm border-muted/60"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">{template.name}</span>
          </button>
        );
      })}
    </>
  );
};
