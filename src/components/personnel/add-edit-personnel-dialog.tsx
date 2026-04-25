import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CedulaInput } from '@/components/ui/custom/cedula-input';
import type { StaffMember, PersonnelStatus, StaffRole, Department } from '@/lib/types';
import { RANK_OPTIONS, STATUS_OPTIONS, GENDER_OPTIONS } from '@/lib/constants/personnel';
import { toast } from 'sonner';
import { normalizeString } from '@/lib/utils';

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
  const [sex, setSex] = useState<'M' | 'F' | 'none'>('none');
  const [titulo, setTitulo] = useState('');

  // Initialize form with member data when editing
  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setCedula(member.cedula || '');
      // Resolve rank: the stored value might be lowercase or missing accents from CSV.
      const storedRank = member.rank || '';
      const matchedRank = RANK_OPTIONS.find(r => normalizeString(r.value) === normalizeString(storedRank));
      setRank(matchedRank?.value || 'OPC');

      // Resolve role: the stored value might be a role.name (from CSV) with different case or accents.
      // We sync roleId and cargo for better compatibility.
      const storedRole = member.roleId || member.cargo || '';
      const matchedRole = roles.find(r => normalizeString(r.name) === normalizeString(storedRole));
      setRoleId(matchedRole?.name || 'none');

      // Resolve department: the stored value might be a dept.id OR a dept.name
      // (CSV imports store the raw name). Look up the id from the departments list.
      const storedDept = member.department || '';
      const matchById = departments.find((d) => d.id === storedDept);
      const matchByName = departments.find(
        (d) => normalizeString(d.name) === normalizeString(storedDept)
      );
      setDepartment(matchById?.id || matchByName?.id || 'none');

      setStatus(member.status || 'activo');
      setSex(member.sex || 'none');
      setTitulo((member as StaffMember & { titulo?: string }).titulo || '');
    } else {
      setName('');
      setCedula('');
      setRank('OPC');
      setRoleId('none');
      setDepartment('none');
      setStatus('activo');
      setSex('none');
      setTitulo('');
    }
  }, [member, open, departments, roles]);

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
      cargo: roleId === 'none' ? undefined : roleId,
      department: department === 'none' ? undefined : department,
      status,
      sex: sex === 'none' ? undefined : sex as 'M' | 'F',
      titulo: titulo.trim() || undefined,
    };

    // Add ID if editing
    if (member) {
      data.id = member.id;
    }

    onSave(data);
  };

  const formContent = (
    <div className="space-y-4 py-2">
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

        {/* Sexo (Género) */}
        <div className="space-y-2">
          <Label htmlFor="sex">Sexo</Label>
          <Select value={sex} onValueChange={(v) => setSex(v as 'M' | 'F' | 'none')}>
            <SelectTrigger id="sex" name="sex">
              <SelectValue placeholder="Seleccionar sexo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No especificado</SelectItem>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cargo Formal */}
        <div className="space-y-2">
          <Label htmlFor="role">Cargo Institucional</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger id="role" name="role">
              <SelectValue placeholder="Seleccionar cargo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cargo asignado</SelectItem>
              {roles
                .filter((role) => !role.isStatus)
                .map((role) => (
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

        {/* Título (opcional, no visible en tabla) */}
        <div className="space-y-2">
          <Label htmlFor="titulo">Título Académico <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Input
            id="titulo"
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Lcdo., T.S.U., etc."
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );

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
      {formContent}
    </ResponsiveModal>
  );
}

/**
 * A helper component that renders a Sheet on mobile and a Dialog on desktop
 */
function ResponsiveModal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t-2 border-primary/20 p-6 pb-12 focus-visible:outline-none flex flex-col max-h-[92vh]">
          <SheetHeader className="text-left mb-4 shrink-0">
            <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
            <SheetDescription className="text-sm">{description}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto pr-1">
            <div className="py-2">
              {children}
            </div>
          </ScrollArea>
          <SheetFooter className="mt-6 flex flex-col gap-3 shrink-0">
            {footer}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 w-full" type="always">
          <div className="p-6 pt-4">
            {children}
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-0">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

