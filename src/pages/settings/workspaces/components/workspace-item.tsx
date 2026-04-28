import React from 'react';
import { Database, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkspaceItemProps {
  name: string;
  isActive: boolean;
  onSwitch: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function WorkspaceItem({ name, isActive, onSwitch, onExport, onDelete }: WorkspaceItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        isActive
          ? "bg-primary/5 border-primary ring-1 ring-primary/20"
          : "bg-muted/10 hover:bg-muted/20"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Database className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium capitalize">
            {name.replace(/-/g, ' ')}
            {name === 'minutasdb' && <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wider">Default</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {isActive ? 'Área activa' : 'Área local offline'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitch}
          >
            Cambiar
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={onExport}
          title="Descargar respaldo"
        >
          <Download className="h-4 w-4" />
        </Button>
        {name !== 'minutasdb' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
