'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrdenDelDiaForm } from '@/components/orden-del-dia/index';
import { useOrdenDelDiaPagina } from '@/hooks/use-orden-del-dia-pagina';

// Componentes extraídos (SOLID)
import { OrdenHeader } from './orden-del-dia/components/orden-header';
import { GuardConfigCard } from './orden-del-dia/components/guard-config-card';
import { OrdenEmptyState } from './orden-del-dia/components/orden-empty-state';

export default function OrdenDelDiaPage() {
  const hook = useOrdenDelDiaPagina();
  const {
    estaCargado,
    idGuardiaSeleccionada,
    setIdGuardiaSeleccionada,
    formRef,
    manejarGenerarOrden,
    guardiaAbierta,
    guardias,
    periodo,
    setPeriodo,
    manejarAbrirGuardia,
    guardiaSeleccionadaParaForm
  } = hook;

  if (!estaCargado) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-full max-w-sm mx-auto mb-4" />
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen md:h-full bg-background overflow-y-auto md:overflow-hidden relative">
      <div className="flex-1 flex flex-col md:h-full md:overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1700px] mx-auto md:h-full flex flex-col gap-6 min-h-0 pb-32 sm:pb-0">
          {/* Cabecera (SRP) */}
          <OrdenHeader
            guardiaAbierta={guardiaAbierta}
            idGuardiaSeleccionada={idGuardiaSeleccionada}
            manejarGenerarOrden={manejarGenerarOrden}
          />

          {/* Configuración (OCP) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 shrink-0">
            <GuardConfigCard
              idGuardiaSeleccionada={idGuardiaSeleccionada}
              setIdGuardiaSeleccionada={setIdGuardiaSeleccionada}
              guardiaAbierta={guardiaAbierta}
              guardias={guardias}
              periodo={periodo}
              setPeriodo={setPeriodo}
              manejarAbrirGuardia={manejarAbrirGuardia}
            />
          </div>

          {/* Área Principal (Formulario o Estado Vacío) */}
          <div className="flex-1 min-h-0">
            {idGuardiaSeleccionada ? (
              <div className="h-full">
                <OrdenDelDiaForm
                  ref={formRef}
                  selectedGuard={idGuardiaSeleccionada}
                  initialData={guardiaSeleccionadaParaForm?.staff}
                  periodo={periodo}
                  isGuardOpen={guardiaAbierta}
                />
              </div>
            ) : (
              <OrdenEmptyState guardias={guardias} />
            )}
          </div>
        </div>
      </div>

      {/* Botón Flotante Móvil */}
      <div className="sm:hidden fixed bottom-24 right-6 z-50 animate-in fade-in zoom-in duration-300 ease-out">
        <Button
          onClick={manejarGenerarOrden}
          disabled={!idGuardiaSeleccionada}
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary-foreground/10 hover:scale-105 active:scale-95 transition-all duration-300"
          title="Generar Orden del Día"
        >
          <Eye className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
