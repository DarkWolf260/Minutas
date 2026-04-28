'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Car } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';

// Componentes y Hooks extraídos (SOLID)
import { useUnitsManager } from './units/use-units-manager';
import { UnitForm } from './units/unit-form';
import { UnitList } from './units/unit-list';

export function UnitsManager() {
  const hook = useUnitsManager();
  const {
    localUnits,
    newUnitName,
    setNewUnitName,
    isSaving,
    confirmDeleteUnit,
    setConfirmDeleteUnit,
    handleAddUnit,
    handleRemoveUnit,
    handleSave,
    isLoaded,
    isModified
  } = hook;

  if (!isLoaded) {
    return (
      <div className="md:flex-1 md:flex md:flex-col md:min-h-0 md:h-full animate-in fade-in duration-300">
        <Card className="border bg-card md:flex-1 md:flex md:flex-col shadow-sm">
          <CardHeader className="p-4 sm:px-6 sm:py-5 bg-muted/5 border-b">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-60" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="md:flex-1 md:flex md:flex-col md:min-h-0 md:h-full animate-in fade-in duration-300">
      <Card className="border bg-card md:overflow-hidden md:flex-1 md:flex md:flex-col md:min-h-0 md:h-full shadow-sm">
        <CardHeader className="p-4 sm:px-6 sm:py-5 bg-muted/5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Car className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold">Gestión de Unidades</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Administra la flota de vehículos operativos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:flex-1 md:min-h-0 md:flex md:flex-col md:overflow-hidden">
          <ScrollArea className="md:flex-1" type="always">
            <div className="p-4 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start">
                {/* Formulario (SRP) */}
                <UnitForm 
                  newUnitName={newUnitName} 
                  setNewUnitName={setNewUnitName} 
                  onAdd={handleAddUnit} 
                />

                {/* Listado (SRP) */}
                <UnitList 
                  units={localUnits} 
                  onDeleteRequest={setConfirmDeleteUnit} 
                />
              </div>
            </div>
          </ScrollArea>

          {/* Acciones de Guardado */}
          <div className="flex justify-end p-6 border-t bg-muted/5">
            <Button
              onClick={handleSave}
              disabled={isSaving || !isModified}
              className="gap-2 shadow-lg shadow-primary/20 h-11 px-6 font-bold"
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

      <ConfirmDialog
        open={!!confirmDeleteUnit}
        onOpenChange={(open) => !open && setConfirmDeleteUnit(null)}
        title="Eliminar Unidad"
        message={`¿Estás seguro de que deseas eliminar la unidad "${confirmDeleteUnit}"?`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteUnit) {
            handleRemoveUnit(confirmDeleteUnit);
            setConfirmDeleteUnit(null);
          }
        }}
      />
    </div>
  );
}
