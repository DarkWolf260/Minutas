import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CedulaInput } from '@/components/ui/custom/cedula-input';
import { RANK_OPTIONS, STATUS_OPTIONS, GENDER_OPTIONS } from '@/lib/constants/personnel';
import type { StaffRole, Department, PersonnelStatus } from '@/lib/types';

interface PersonnelFormFieldsProps {
  hook: any;
  roles: StaffRole[];
  departments: Department[];
}

export const PersonnelFormFields = ({ hook, roles, departments }: PersonnelFormFieldsProps) => {
  const {
    name, setName,
    cedula, setCedula,
    rank, setRank,
    role_id, setrole_id,
    department, setDepartment,
    status, setStatus,
    sex, setSex,
    titulo, setTitulo,
  } = hook;

  return (
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

        {/* Sexo */}
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
          <Select value={role_id} onValueChange={setrole_id}>
            <SelectTrigger id="role" name="role">
              <SelectValue placeholder="Seleccionar cargo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cargo asignado</SelectItem>
              {roles
                .filter((role) => !role.is_status)
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

        {/* Título */}
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
};


