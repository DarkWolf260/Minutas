import { useRef } from 'react';
import { useActiveGuard } from '@/hooks/use-active-guard';

export function useOrdenDelDiaPagina() {
  const {
    guards: guardias,
    selectedGuardId: idGuardiaSeleccionada,
    setSelectedGuardId: setIdGuardiaSeleccionada,
    periodo,
    setPeriodo,
    activeGuard: guardiaSeleccionadaParaForm,
    isGuardOpen: guardiaAbierta,
    openGuard: abrirGuardia,
    isLoaded: estaCargado,
  } = useActiveGuard();

  const formRef = useRef<{ generateOrder: () => void }>(null);

  const manejarAbrirGuardia = () => {
    abrirGuardia();
  };

  const manejarGenerarOrden = () => {
    formRef.current?.generateOrder();
  };

  return {
    // Estado
    guardias,
    idGuardiaSeleccionada,
    setIdGuardiaSeleccionada,
    periodo,
    setPeriodo,
    guardiaSeleccionadaParaForm,
    guardiaAbierta,
    estaCargado,
    formRef,
    
    // Acciones
    manejarAbrirGuardia,
    manejarGenerarOrden,
  };
}
