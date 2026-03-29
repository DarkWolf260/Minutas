'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, PlusCircle, Save, Car } from 'lucide-react';
import { useUnits } from '@/hooks/use-units';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function UnitsManager() {
  const { units, saveUnits, isLoaded } = useUnits();
  const [localUnits, setLocalUnits] = useState<string[]>([]);
  const [newUnitName, setNewUnitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setLocalUnits([...units].sort());
    }
  }, [units, isLoaded]);

  const handleAddUnit = () => {
    const trimmed = newUnitName.trim();
    if (trimmed && !localUnits.includes(trimmed)) {
      setLocalUnits(prev => [...prev, trimmed].sort());
      setNewUnitName('');
    } else if (localUnits.includes(trimmed)) {
      toast.error('Esta unidad ya existe');
    }
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    setLocalUnits(prev => prev.filter(u => u !== unitToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveUnits([...localUnits].sort());
      toast.success('Unidades actualizadas correctamente');
    } catch (error) {
      toast.error('Error al guardar las unidades');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <Card className="border-none shadow-xl shadow-foreground/5 bg-card overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Gestión de Unidades</CardTitle>
            <CardDescription>
              Administra la flota de vehículos operativos disponibles para las guardias.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Form Side */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
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
                      handleAddUnit();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={handleAddUnit}
                  className="h-10 px-4 gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Añadir</span>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-1 italic">
                Presiona Enter o el botón para registrar la unidad en el borrador.
              </p>
            </div>
          </div>

          {/* List Side */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex justify-between items-center">
              <span>Unidades Registradas</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {localUnits.length} total
              </span>
            </Label>
            
            <div className="h-[400px] border rounded-xl overflow-hidden bg-muted/5">
              <ScrollArea className="h-full w-full" type="always">
                <div className="p-3 space-y-2">
                  {localUnits.length > 0 ? (
                    localUnits.map((unit) => (
                      <div
                        key={unit}
                        className="flex items-center justify-between rounded-lg px-4 py-3 bg-card border border-transparent hover:border-primary/20 hover:bg-muted/10 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                          <span className="text-sm font-medium">{unit}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          onClick={() => handleRemoveUnit(unit)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                      <Car className="h-8 w-8 mb-4 opacity-20" />
                      <p className="text-xs font-medium">No hay unidades configuradas</p>
                      <p className="text-[10px] mt-1">Empieza añadiendo una unidad a la izquierda</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || units.join(',') === localUnits.join(',')}
            className="gap-2 shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando...
              </span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
