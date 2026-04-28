import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface UnitFormProps {
  newUnitName: string;
  setNewUnitName: (name: string) => void;
  onAdd: () => void;
}

export const UnitForm = ({ newUnitName, setNewUnitName, onAdd }: UnitFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Añadir Nueva Unidad
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ej: Alpha 3, Moto 12..."
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            className="h-10 bg-muted/5 focus:bg-background transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdd();
              }
            }}
          />
          <Button
            type="button"
            onClick={onAdd}
            className="h-10 px-4 gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Añadir</span>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 px-1">
          Presiona Enter para registrar la unidad en el borrador.
        </p>
      </div>
    </div>
  );
};
