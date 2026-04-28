import React from 'react';
import { AddEditPersonnelDialog } from '@/components/personnel/add-edit-personnel-dialog';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';

interface PersonnelModalsProps {
  hook: any;
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
    manejarEliminacionMasiva
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
