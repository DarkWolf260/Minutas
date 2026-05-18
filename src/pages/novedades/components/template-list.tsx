import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getTemplateIcon } from '@/lib/utils';
import type { Template } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TemplateListProps {
  templates: Template[];
  onSelect: (id: string) => void;
  onNavigateToTemplates: () => void;
}

export const TemplateList = ({ templates, onSelect, onNavigateToTemplates }: TemplateListProps) => {
  const [search, setSearch] = useState('');
  
  const activas = React.useMemo(() => templates.filter(t => t.is_active), [templates]);
  
  const filteredTemplates = React.useMemo(() => 
    activas.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
    [activas, search]
  );
  
  if (activas.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No hay plantillas activas.</p>
        <Button variant="link" onClick={onNavigateToTemplates}>Ir a Plantillas</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar plantilla..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <p>No se encontraron plantillas que coincidan con "{search}".</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map((template) => {
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
        </div>
      )}
    </div>
  );
};
