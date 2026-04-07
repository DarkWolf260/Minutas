
import { Department, StaffRole } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { LEADER_ROLES } from '@/lib/constants/roles';

// Estructura institucional predefinida
const INSTITUTIONAL_STRUCTURE = `
CARGOS GLOBALES
- Director
- Jefe de operaciones
- Jefe de los servicios

GENERICO
- Auxiliar

ESTATUS Y ESPECIALES
- Reposo
- Permiso
- Vacaciones
- Ausente
- Apoyo
`;

export function getInstitutionalData() {
    const normalize = (s: string) =>
        s
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

    const lines = INSTITUTIONAL_STRUCTURE.split('\n');
    const newDepts: Department[] = [];
    const newRoles: StaffRole[] = [];

    let currentDeptId: string | 'global' | 'status' | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (!trimmed.startsWith('-')) {
            // Es un departamento
            if (normalize(trimmed) === 'cargos globales') {
                currentDeptId = 'global';
            } else if (normalize(trimmed) === 'estatus y especiales') {
                currentDeptId = 'status';
            } else if (normalize(trimmed) === 'generico') {
                currentDeptId = null; // Para todos
            } else {
                const id = generateId('dept');
                newDepts.push({
                    id,
                    name: trimmed,
                    staff: {},
                });
                currentDeptId = id;
            }
        } else {
            // Es un cargo
            const roleName = trimmed.substring(1).trim();

            // Check if role already exists in our new list
            const existingRoleIndex = newRoles.findIndex(
                (r) => normalize(r.name) === normalize(roleName)
            );

            if (existingRoleIndex >= 0) {
                // Update existing role scope
                const role = newRoles[existingRoleIndex]!;
                if (currentDeptId && currentDeptId !== 'global' && currentDeptId !== 'status') {
                    // Add dept to scope if not global or special
                    if (!role.departmentScope) role.departmentScope = [];
                    if (!role.departmentScope.includes(currentDeptId)) {
                        role.departmentScope.push(currentDeptId);
                    }
                }
                if (currentDeptId === 'status') {
                    role.isStatus = true;
                }
            } else {
                // Create new role
                const isLeader = Object.values(LEADER_ROLES).some((lr) => normalize(lr) === normalize(roleName));
                const role: StaffRole = {
                    name: roleName,
                    isSingle: isLeader,
                    departmentScope:
                        currentDeptId && currentDeptId !== 'global' && currentDeptId !== 'status' ? [currentDeptId] : [], // Empty = Global
                    isHidden: false,
                    isStatus: currentDeptId === 'status',
                    order: newRoles.length,
                };
                newRoles.push(role);
            }
        }
    }

    return { newDepts, newRoles };
}
