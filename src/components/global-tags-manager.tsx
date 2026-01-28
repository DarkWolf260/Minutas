'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useRoles } from '@/hooks/use-roles';
import type { FieldConfig } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnits } from '@/hooks/use-units';

export function GlobalTagsManager() {
  const {
    definitions,
    saveDefinitions,
    removeDefinition,
    isLoaded: definitionsLoaded,
  } = useFieldDefinitions();
  const { roles, isLoaded: rolesLoaded } = useRoles();
  const { units, isLoaded: unitsLoaded } = useUnits();
  const orderedFields = useMemo(() => Object.keys(definitions), [definitions]);

  // Unused handlers removed for cleanliness

  const handleUpdateDefinition = async (fieldName: string, newConfig: FieldConfig) => {
    const newDefinitions = { ...definitions, [fieldName]: newConfig };
    await saveDefinitions(newDefinitions);
  };

  const allDefaultFieldKeys = useMemo(() => ['Municipio', 'Estado', 'REDAN', 'ZOEDAN'], []);

  const generalFields = useMemo(() => {
    return orderedFields.filter((key) => definitions[key] && allDefaultFieldKeys.includes(key));
  }, [orderedFields, definitions, allDefaultFieldKeys]);

  if (!definitionsLoaded || !rolesLoaded || !unitsLoaded) {
    return (
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Gestor de Etiquetas Globales</CardTitle>
          <CardDescription>
            Define etiquetas predefinidas para toda la aplicación y consulta las etiquetas generadas
            por los cargos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Datos Generales</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Estos valores se usarán en todas las plantillas que incluyan la etiqueta
              correspondiente (ej. {`{Municipio}`}). Las etiquetas "Fecha" y "Hora" son fijas.
            </p>
            <div className="space-y-2">
              {generalFields.map((key) => {
                const config = definitions[key];
                if (!config) return null;
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-md border p-3 bg-card"
                  >
                    <Label htmlFor={key} className="sm:w-48 font-semibold shrink-0">
                      {config.label}
                    </Label>
                    <div className="flex-1">
                      <Input
                        id={key}
                        value={config.value || ''}
                        onChange={(e) =>
                          handleUpdateDefinition(key, { ...config, value: e.target.value })
                        }
                        className="bg-background w-full"
                        disabled={key === 'Hora' || key === 'Fecha'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Etiquetas de Cargos y Unidades</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Estas etiquetas se generan automáticamente a partir de los cargos y unidades definidos
              en{' '}
              <Link href="/settings" className="text-primary underline">
                Configuración
              </Link>
              . La etiqueta{' '}
              <code className="font-mono bg-muted px-1 py-0.5 rounded">{`{Unidad}`}</code> es
              especial: se convertirá automáticamente en un campo de selección para las unidades que
              hayas registrado.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {roles.map((role) => (
                <Badge key={role.name} variant="secondary">
                  {role.name}
                </Badge>
              ))}
              <Badge variant="outline">Unidad</Badge>
              {roles.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay cargos definidos.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
