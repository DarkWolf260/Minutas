import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { useGuards } from '@/hooks/use-guards';
import { useUnits } from '@/hooks/use-units';
import { useWorkspaceManager } from '@/lib/db/db-context';
import type { StaffMember } from '@/lib/types';
import { toast } from 'sonner';

export function usePersonal() {
  const {
    personnel: personal,
    addMember: añadirMiembro,
    addMembers: añadirMiembros,
    updateMember: actualizarMiembro,
    removeMember: eliminarMiembro,
    removeMembers: eliminarMiembros,
    savePersonnel: guardarPersonal,
    isLoaded: personalCargado,
    isCedulaDuplicate: esCedulaDuplicada,
  } = usePersonnel();
  
  const { roles, saveRoles: guardarRoles, isLoaded: rolesCargados } = useRoles();
  const { departments: departamentos, saveDepartments: guardarDepartamentos, isLoaded: departamentosCargados } = useDepartments();
  const { guards: guardias, saveGuards: guardarGuardias, isLoaded: guardiasCargados } = useGuards();
  const { units: unidades, isLoaded: unidadesCargadas } = useUnits();
  const { currentWorkspace: workspaceActual } = useWorkspaceManager();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabActiva = searchParams.get('tab') || 'personnel';

  const setTabActiva = (tab: string) => {
    setSearchParams({ tab });
  };

  const [esDialogOpen, setEsDialogOpen] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState<StaffMember | null>(null);
  const [miembroVerHistorial, setMiembroVerHistorial] = useState<StaffMember | null>(null);
  const [esDialogOpenHistorial, setEsDialogOpenHistorial] = useState(false);
  const [idsSeleccionados, setIdsSeleccionados] = useState<string[]>([]);
  const [esDialogOpenConfirmarEliminarMasivo, setEsDialogOpenConfirmarEliminarMasivo] = useState(false);

  const estaCargando = !personalCargado || !rolesCargados || !departamentosCargados || !guardiasCargados || !unidadesCargadas;

  const manejarEditar = (miembro: StaffMember) => {
    setMiembroEditando(miembro);
    setEsDialogOpen(true);
  };

  const manejarAñadirNuevo = () => {
    setMiembroEditando(null);
    setEsDialogOpen(true);
  };

  const manejarGuardar = async (data: Partial<StaffMember>) => {
    if (data.cedula && esCedulaDuplicada(data.cedula, miembroEditando?.id)) {
      toast.error('Ya existe una persona registrada con esta cédula');
      return;
    }

    if (miembroEditando) {
      await actualizarMiembro(miembroEditando.id, data);
      toast.success('Cambios guardados');
    } else {
      if (data.name) {
        const nuevoMiembro: Omit<StaffMember, 'id'> = {
          workspaceId: workspaceActual,
          name: data.name,
          cedula: data.cedula || '',
          rank: data.rank || '',
          department: data.department || '',
          sex: data.sex,
          cargo: data.cargo,
          roleId: data.roleId,
          titulo: data.titulo,
        };
        await añadirMiembro(nuevoMiembro);
        toast.success('Personal añadido');
      }
    }
    setEsDialogOpen(false);
    setMiembroEditando(null);
  };

  const manejarCancelar = () => {
    setEsDialogOpen(false);
    setMiembroEditando(null);
  };

  const manejarEliminar = (id: string) => {
    eliminarMiembro(id);
    setIdsSeleccionados((prev) => prev.filter((idSeleccionado) => idSeleccionado !== id));
    toast.success('Personal eliminado');
  };

  const manejarEliminacionMasiva = () => {
    if (idsSeleccionados.length === 0) return;
    eliminarMiembros(idsSeleccionados);
    setIdsSeleccionados([]);
    setEsDialogOpenConfirmarEliminarMasivo(false);
    toast.success(`${idsSeleccionados.length} personas eliminadas`);
  };

  const manejarVerHistorial = (miembro: StaffMember) => {
    setMiembroVerHistorial(miembro);
    setEsDialogOpenHistorial(true);
  };

  return {
    // Estado
    personal,
    roles,
    departamentos,
    guardias,
    unidades,
    tabActiva,
    setTabActiva,
    esDialogOpen,
    setEsDialogOpen,
    miembroEditando,
    setMiembroEditando,
    miembroVerHistorial,
    setMiembroVerHistorial,
    esDialogOpenHistorial,
    setEsDialogOpenHistorial,
    idsSeleccionados,
    setIdsSeleccionados,
    esDialogOpenConfirmarEliminarMasivo,
    setEsDialogOpenConfirmarEliminarMasivo,
    estaCargando,
    rolesCargados,
    departamentosCargados,
    
    // Acciones
    manejarEditar,
    manejarAñadirNuevo,
    manejarGuardar,
    manejarCancelar,
    manejarEliminar,
    manejarEliminacionMasiva,
    manejarVerHistorial,
    añadirMiembros,
    guardarRoles,
    guardarDepartamentos,
    guardarPersonal,
    guardarGuardias,
  };
}
