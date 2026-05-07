import { useState, useEffect } from 'react';
import type { StaffMember, PersonnelStatus, StaffRole, Department } from '@/lib/types';
import { RANK_OPTIONS } from '@/lib/constants/personnel';
import { normalizeString } from '@/lib/utils';
import { toast } from 'sonner';

interface UsePersonnelFormProps {
  member: StaffMember | null;
  roles: StaffRole[];
  departments: Department[];
  onSave: (member: Partial<StaffMember>) => void;
  open: boolean;
}

export function usePersonnelForm({ member, roles, departments, onSave, open }: UsePersonnelFormProps) {
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [rank, setRank] = useState('OPC');
  const [role_id, setrole_id] = useState('none');
  const [department, setDepartment] = useState('none');
  const [status, setStatus] = useState<PersonnelStatus>('activo');
  const [sex, setSex] = useState<'M' | 'F' | 'none'>('none');
  const [titulo, setTitulo] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setCedula(member.cedula || '');
      
      const storedRank = member.rank || '';
      const matchedRank = RANK_OPTIONS.find(r => normalizeString(r.value) === normalizeString(storedRank));
      setRank(matchedRank?.value || 'OPC');

      const storedRole = member.role_id || member.cargo || '';
      const matchedRole = roles.find(r => normalizeString(r.name) === normalizeString(storedRole));
      setrole_id(matchedRole?.name || 'none');

      const storedDept = member.department || '';
      const matchById = departments.find((d) => d.id === storedDept);
      const matchByName = departments.find(
        (d) => normalizeString(d.name) === normalizeString(storedDept)
      );
      setDepartment(matchById?.id || matchByName?.id || 'none');

      setStatus(member.status || 'activo');
      setSex(member.sex || 'none');
      setTitulo((member as any).titulo || '');
    } else {
      setName('');
      setCedula('');
      setRank('OPC');
      setrole_id('none');
      setDepartment('none');
      setStatus('activo');
      setSex('none');
      setTitulo('');
    }
  }, [member, open, departments, roles]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const data: Partial<StaffMember> & { titulo?: string } = {
      name: name.trim(),
      cedula: cedula || undefined,
      rank,
      role_id: role_id === 'none' ? undefined : role_id,
      cargo: role_id === 'none' ? undefined : role_id,
      department: department === 'none' ? undefined : department,
      status,
      sex: sex === 'none' ? undefined : sex as 'M' | 'F',
      titulo: titulo.trim() || undefined,
    };

    if (member) {
      data.id = member.id;
    }

    onSave(data);
  };

  return {
    name, setName,
    cedula, setCedula,
    rank, setRank,
    role_id, setrole_id,
    department, setDepartment,
    status, setStatus,
    sex, setSex,
    titulo, setTitulo,
    handleSubmit,
    isEditMode: member !== null
  };
}

