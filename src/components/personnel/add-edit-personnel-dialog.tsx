import React from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/custom/responsive-modal';
import type { StaffMember, StaffRole, Department } from '@/lib/types';

// Componentes y Hooks extraídos (SOLID)
import { usePersonnelForm } from './form/use-personnel-form';
import { PersonnelFormFields } from './form/personnel-form-fields';

interface AddEditPersonnelDialogProps {
  open: boolean;
  member: StaffMember | null;
  roles: StaffRole[];
  departments: Department[];
  onSave: (member: Partial<StaffMember>) => void;
  onCancel: () => void;
}

export function AddEditPersonnelDialog({
  open,
  member,
  roles,
  departments,
  onSave,
  onCancel,
}: AddEditPersonnelDialogProps) {
  const hook = usePersonnelForm({ member, roles, departments, onSave, open });
  const { handleSubmit, isEditMode } = hook;

  const footerActions = (
    <>
      <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
        Cancelar
      </Button>
      <Button onClick={handleSubmit} className="w-full sm:w-auto">
        {isEditMode ? 'Actualizar' : 'Añadir'}
      </Button>
    </>
  );

  return (
    <ResponsiveModal
      isOpen={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      title={isEditMode ? 'Editar Personal' : 'Añadir Personal'}
      description={isEditMode
        ? 'Actualiza la información del miembro del personal'
        : 'Completa el formulario para añadir un nuevo miembro'}
      footer={footerActions}
    >
      <PersonnelFormFields 
        hook={hook} 
        roles={roles} 
        departments={departments} 
      />
    </ResponsiveModal>
  );
}
