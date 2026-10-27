import React from 'react';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Car } from 'lucide-react';

interface UnitListProps {
  units: string[];
  onDeleteRequest: (unit: string) => void;
}

export const UnitList = ({ units, onDeleteRequest }: UnitListProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex justify-between items-center">
        <span>Unidades Registradas</span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {units.length} total
        </span>
      </Label>

      <div className="h-[300px] sm:h-[400px] border rounded-xl overflow-hidden bg-muted/5 shadow-inner">
        <ScrollArea className="h-full w-full" type="always">
          <div className="p-3 space-y-2">
            {units.length > 0 ? (
              units.map((unit) => (
                <div
                  key={unit}
                  className="flex items-center justify-between rounded-lg px-4 py-3 bg-card border border-transparent hover:border-primary/20 hover:bg-muted/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                    <span className="text-sm font-medium">{unit}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => onDeleteRequest(unit)}
                    aria-label={`Eliminar unidad ${unit}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="empty-state-container py-8">
                <div className="empty-state-icon-box">
                  <Car className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="empty-state-title text-xs">Sin unidades</p>
                <p className="empty-state-desc text-[11px]">No hay unidades operativas configuradas.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
