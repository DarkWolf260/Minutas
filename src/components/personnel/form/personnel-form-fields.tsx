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

import { 
  Shield, 
  User, 
  Briefcase, 
  Building, 
  Activity, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
          <Label htmlFor="rank" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="h-3 w-3" />
            Jerarquía *
          </Label>
          <Select value={rank} onValueChange={setRank}>
            <SelectTrigger id="rank" name="rank" className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 transition-colors">
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
          <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="h-3 w-3" />
            Nombre y Apellido *
          </Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Juan Pérez"
            autoComplete="name"
            className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 transition-colors"
          />
        </div>

        {/* Cédula */}
        <div className="space-y-2">
          <Label htmlFor="cedula" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Cédula
          </Label>
          <CedulaInput 
            id="cedula" 
            name="cedula" 
            value={cedula} 
            onChange={setCedula}
            className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 transition-colors"
          />
        </div>

        {/* Sexo */}
        <div className="space-y-2">
          <Label htmlFor="sex" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="h-3 w-3" />
            Sexo
          </Label>
          <Select value={sex} onValueChange={(v) => setSex(v as 'M' | 'F' | 'none')}>
            <SelectTrigger id="sex" name="sex" className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Seleccionar sexo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground italic">No especificado</span>
              </SelectItem>
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
              <SelectItem value="none">
                <span className="text-muted-foreground italic">Sin cargo asignado</span>
              </SelectItem>
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
          <Label htmlFor="department" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Building className="h-3 w-3" />
            Departamento
          </Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department" name="department" className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Seleccionar departamento..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground italic">Sin departamento</span>
              </SelectItem>
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
          <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Estado
          </Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PersonnelStatus)}>
            <SelectTrigger id="status" name="status" className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 transition-colors">
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
          <Label htmlFor="titulo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Título Académico <span className="text-[10px] opacity-70">(opcional)</span>
          </Label>
          <Input
            id="titulo"
            name="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Lcdo., T.S.U., etc."
            autoComplete="off"
            className="bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};


