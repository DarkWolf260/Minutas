import React from 'react';
import { AddEditPersonnelDialog } from '@/components/personnel/add-edit-personnel-dialog';
import { PersonnelHistoryDialog } from '@/components/personnel/personnel-history-dialog';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import type { UsePersonalReturn } from '@/hooks/personal';

export interface PersonnelModalsProps {
  hook: Pick<
    UsePersonalReturn,
    | 'esDialogOpen'
    | 'miembroEditando'
    | 'roles'
    | 'departamentos'
    | 'manejarGuardar'
    | 'manejarCancelar'
    | 'esDialogOpenConfirmarEliminarMasivo'
    | 'setEsDialogOpenConfirmarEliminarMasivo'
    | 'idsSeleccionados'
    | 'manejarEliminacionMasiva'
    | 'esDialogOpenHistorial'
    | 'setEsDialogOpenHistorial'
    | 'miembroVerHistorial'
  >;
}

export const PersonnelModals = ({ hook }: PersonnelModalsProps) => {
  const { 
    esDialogOpen, 
    miembroEditando, 
    roles, 
    departamentos, 
    manejarGuardar, 
    manejarCancelar,
    esDialogOpenConfirmarEliminarMasivo,
    setEsDialogOpenConfirmarEliminarMasivo,
    idsSeleccionados,
    manejarEliminacionMasiva,
    esDialogOpenHistorial,
    setEsDialogOpenHistorial,
    miembroVerHistorial
  } = hook;

  return (
    <>
      <AddEditPersonnelDialog
        open={esDialogOpen}
        member={miembroEditando}
        roles={roles}
        departments={departamentos}
        onSave={manejarGuardar}
        onCancel={manejarCancelar}
      />

      <PersonnelHistoryDialog
        member={miembroVerHistorial}
        isOpen={esDialogOpenHistorial}
        onClose={() => setEsDialogOpenHistorial(false)}
      />

      <ConfirmDialog
        open={esDialogOpenConfirmarEliminarMasivo}
        onOpenChange={setEsDialogOpenConfirmarEliminarMasivo}
        title="¿Eliminar personal seleccionado?"
        message={`Estás a punto de eliminar a ${idsSeleccionados.length} personas. Esta acción no se puede deshacer.`}
        onConfirm={manejarEliminacionMasiva}
        variant="destructive"
      />
    </>
  );
};
