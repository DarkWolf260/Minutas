'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { OrdenDelDiaForm } from '@/components/orden-del-dia';

export default function OrdenDelDiaPage() {
  const { guards, isLoaded: guardsLoaded } = useGuards();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { roles, isLoaded: rolesLoaded } = useRoles();

  const [selectedGuardId, setSelectedGuardId] = useState<string>('');

  // Sync selectedGuardId with the active guard from settings
  useEffect(() => {
    if (
      settingsLoaded &&
      settings.activeGuardId &&
      guardsLoaded &&
      guards.some((g) => g.id === settings.activeGuardId)
    ) {
      setSelectedGuardId(settings.activeGuardId);
    }
  }, [settings, settingsLoaded, guards, guardsLoaded]);

  const handleActiveGuardChange = (guardId: string) => {
    if (!guardId) return;
    setSelectedGuardId(guardId);
    saveSettings({ ...settings, activeGuardId: guardId });
  };

  const selectedGuardForForm = guards.find((g) => g.id === selectedGuardId);
  const isLoaded = guardsLoaded && rolesLoaded && settingsLoaded;

  if (!isLoaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-full max-w-sm mx-auto mb-4" />
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orden del Día</h1>
        <p className="text-muted-foreground">
          Genera el reporte diario de operaciones para la guardia activa.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Generar Orden del Día</CardTitle>
          <CardDescription>
            Selecciona una guardia para generar su reporte. Esta selección definirá la guardia
            activa para el reporte de cierre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label
                htmlFor="guard-select"
                className="text-xs uppercase font-bold text-muted-foreground"
              >
                Guardia Activa Actual
              </Label>
              <Select value={selectedGuardId} onValueChange={handleActiveGuardChange}>
                <SelectTrigger id="guard-select" className="h-10">
                  <SelectValue placeholder="Selecciona una guardia..." />
                </SelectTrigger>
                <SelectContent>
                  {guards.map((guard) => (
                    <SelectItem key={guard.id} value={guard.id}>
                      Guardia "{guard.id}"
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGuardId ? (
              <OrdenDelDiaForm
                selectedGuard={selectedGuardId}
                initialData={selectedGuardForForm?.staff}
              />
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  Por favor, selecciona una guardia para empezar.
                </p>
                {guards.length === 0 && (
                  <p className="text-xs mt-2">
                    No hay guardias definidas. Ve a{' '}
                    <Link href="/personal" className="text-primary font-bold hover:underline">
                      Gestión de Personal
                    </Link>{' '}
                    para crearlas.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
