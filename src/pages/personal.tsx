'use client';

import { usePersonal } from '@/hooks/use-personal';
import { FeatureErrorBoundary } from '@/components/common/error-boundary-feature';

// Componentes extraídos (SOLID)
import { PersonnelHeader } from './personal/components/personnel-header';
import { MassActionsBar } from './personal/components/mass-actions-bar';
import { PersonnelTabs } from './personal/components/personnel-tabs';
import { PersonnelModals } from './personal/components/personnel-modals';

function PersonnelPageContent() {
  const hook = usePersonal();
  const { estaCargando, idsSeleccionados, setEsDialogOpenConfirmarEliminarMasivo } = hook;

  if (estaCargando) {
    return (
      <div className="container mx-auto p-8 text-center py-20">
        <h1 className="text-3xl font-bold mb-2">Personal</h1>
        <p className="text-muted-foreground animate-pulse">Cargando datos del sistema...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full md:flex-1 md:flex md:min-h-0 md:overflow-hidden relative">
      {/* Barra de Acciones Masivas (DIP) */}
      <MassActionsBar 
        selectedCount={idsSeleccionados.length} 
        onDeleteRequest={() => setEsDialogOpenConfirmarEliminarMasivo(true)} 
      />

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-28 sm:pb-6 flex flex-col md:flex-1 md:min-h-0">
        {/* Cabecera (SRP) */}
        <PersonnelHeader />

        {/* Contenido de Pestañas (OCP) */}
        <div className="w-full flex flex-col gap-6 md:flex-1 md:min-h-0">
          <PersonnelTabs hook={hook} />
        </div>

        {/* Capa de Modales (SRP) */}
        <PersonnelModals hook={hook} />
      </div>
    </div>
  );
}

export default function PersonnelPage() {
  return (
    <FeatureErrorBoundary featureName="Personal">
      <PersonnelPageContent />
    </FeatureErrorBoundary>
  );
}
