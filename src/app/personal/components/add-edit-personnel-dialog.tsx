'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CedulaInput } from '@/components/cedula-input';
import { MultiInput } from '@/components/ui/multi-input';
import type { StaffMember, PersonnelStatus, StaffRole, Department } from '@/types';
import { RANK_OPTIONS, STATUS_OPTIONS } from '@/constants/personnel';
import { toast } from 'sonner';

interface AddEditPersonnelDialogProps {
  open: boolean;
  member: StaffMember | null; // null = add mode
  roles: StaffRole[];
  departments: Department[];
  onSave: (member: Partial<StaffMember>) => void;
  onCancel: () => void;
}

/**
 * Dialog for adding or editing personnel
 *
 * Handles form state, validation, and submission for personnel CRUD operations.
 */
export function AddEditPersonnelDialog({
  open,
  member,
  roles,
  departments,
  onSave,
  onCancel,
}: AddEditPersonnelDialogProps) {
  const isEditMode = member !== null;

  // Form state
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [rank, setRank] = useState('OPC');
  const [roleId, setRoleId] = useState('none');
  const [department, setDepartment] = useState('none');
  const [status, setStatus] = useState<PersonnelStatus>('activo');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [titulo, setTitulo] = useState('');

  // Initialize form with member data when editing
  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setCedula(member.cedula || '');
      setRank(member.rank || 'OPC');
      setRoleId(member.roleId || 'none');

      // Resolve department: the stored value might be a dept.id OR a dept.name
      // (CSV imports store the raw name). Look up the id from the departments list.
      const storedDept = member.department || '';
      const matchById = departments.find((d) => d.id === storedDept);
      const matchByName = departments.find(
        (d) => d.name.toLowerCase() === storedDept.toLowerCase()
      );
      setDepartment(matchById?.id || matchByName?.id || 'none');

      setStatus(member.status || 'activo');
      setSpecialties(member.specialties || []);
      setTitulo((member as StaffMember & { titulo?: string }).titulo || '');
    } else {
      setName('');
      setCedula('');
      setRank('OPC');
      setRoleId('none');
      setDepartment('none');
      setStatus('activo');
      setSpecialties([]);
      setTitulo('');
    }
  }, [member, open, departments]);

  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    // Prepare data
    const data: Partial<StaffMember> & { titulo?: string } = {
      name: name.trim(),
      cedula: cedula || undefined,
      rank,
      roleId: roleId === 'none' ? undefined : roleId,
      department: department === 'none' ? undefined : department,
      status,
      specialties: specialties.length > 0 ? specialties : undefined,
      titulo: titulo.trim() || undefined,
    };

    // Add ID if editing
    if (member) {
      data.id = member.id;
    }

    onSave(data);
  };

  const handleClose = () => {
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Personal' : 'Añadir Personal'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información del miembro del personal'
              : 'Completa el formulario para añadir un nuevo miembro'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jerarquía */}
            <div className="space-y-2">
              <Label htmlFor="rank">Jerarquía *</Label>
              <Select value={rank} onValueChange={setRank}>
                <SelectTrigger id="rank" name="rank">
                  <SelectValue placeholder="Seleccionar jerarquía..." />
                </SelectTrigger>
                <SelectContent>
                  {RANK_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre y Apellido *</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                autoComplete="name"
              />
            </div>

            {/* Cédula */}
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula</Label>
              <CedulaInput id="cedula" name="cedula" value={cedula} onChange={setCedula} />
            </div>

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="role">Cargo Predeterminado</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="role" name="role">
                  <SelectValue placeholder="Seleccionar cargo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cargo asignado</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department" name="department">
                  <SelectValue placeholder="Seleccionar departamento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin departamento</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PersonnelStatus)}>
                <SelectTrigger id="status" name="status">
                  <SelectValue placeholder="Seleccionar estado..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Especialidades */}
          <div className="space-y-2">
            <Label>Especialidades</Label>
            <MultiInput
              id="specialties"
              name="specialties"
              value={specialties}
              onChange={(vals) => setSpecialties(Array.isArray(vals) ? vals : [vals])}
              placeholder="Ej. Primeros Auxilios, Rescate..."
            />
          </div>

          {/* Título (opcional, no visible en tabla) */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título Académico <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="titulo"
              name="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Licenciado en Criminalística"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{isEditMode ? 'Actualizar' : 'Añadir'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
