import { Users } from 'lucide-react';
import { StructureManager } from '@/components/structure/structure-manager';
import type { StaffRole, Department } from '@/lib/types';
import { SetupStepLayout } from './layout';

export function PasoJerarquia({ 
  alSiguiente, 
  alAtras,
  roles,
  setRoles,
  departamentos,
  setDepartamentos
}: { 
  alSiguiente: () => void; 
  alAtras: () => void;
  roles: StaffRole[];
  setRoles: (r: StaffRole[]) => void;
  departamentos: Department[];
  setDepartamentos: (d: Department[]) => void;
}) {
  return (
    <SetupStepLayout
      alAtras={alAtras}
      alSiguiente={alSiguiente}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Jerarquía de Cargos</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Organiza la jerarquía de los cargos. Este será el orden que se utilizará por defecto al crear las guardias y en los reportes.
          </p>
        </div>

        <div className="min-h-[400px]">
          <StructureManager 
            compact={true}
            roles={roles}
            departments={departamentos}
            onRolesChange={setRoles}
            onDepartmentsChange={setDepartamentos}
            onSave={() => {}}
            rolesLoaded={true}
            deptsLoaded={true}
            initialTab="roles"
          />
        </div>
      </div>
    </SetupStepLayout>
  );
}
