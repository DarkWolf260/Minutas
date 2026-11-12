/**
 * Role-related constants for the Minutas application
 */

export const LEADER_ROLES = {
  DIRECTOR: 'Director',
  JEFE_OPERACIONES: 'Jefe de Operaciones',
  JEFE_DEPARTAMENTO: 'Jefe de Departamento',
  JEFE_SERVICIOS: 'Jefe de los Servicios',
} as const;

export const OPERATIONAL_ROLES = {
  OPERADOR_RADIO: 'Operador de radio',
  TECNICO: 'Técnico',
  AUXILIAR: 'Auxiliar',
  CONDUCTOR: 'Conductor',
} as const;

export const SPECIAL_ROLES = {
  JEFE_SALA_MONITOREO: 'Jefe de Sala de Monitoreo',
  ANALISTA_SALA_MONITOREO: 'Analista de Sala de Monitoreo',
  AUXILIAR_SALA_MONITOREO: 'Auxiliar de Sala de Monitoreo',
  JEFE_EDUCACION: 'Jefe de Educación',
  JEFE_RIESGOS: 'Jefe de Gestión de Riesgos',
  JEFE_INFORMATICA: 'Jefe de Informática',
  JEFE_LOGISTICA: 'Jefe de Logística',
} as const;

export const STATUS_ROLES = {
  REPOSO: 'Reposo',
  PERMISO: 'Permiso',
  VACACIONES: 'Vacaciones',
  AUSENTE: 'Ausente',
  APOYO: 'Apoyo',
} as const;

import type { StaffMember, StaffRole, Staff } from '@/lib/types';
import { normalizeString } from '@/lib/utils';

/**
 * Finds a leader member (Director, Jefe de Operaciones, etc.) from the personnel list.
 * Matches by role_id or cargo, giving priority to active personnel and handling common variations.
 */
export function findLeaderInPersonnel(
  personnelList: StaffMember[],
  targetRole: string
): StaffMember | undefined {
  if (!personnelList || personnelList.length === 0) return undefined;

  const normTarget = normalizeString(targetRole);

  const isMatch = (p: StaffMember) => {
    const roleIdNorm = p.role_id ? normalizeString(p.role_id) : '';
    const cargoNorm = p.cargo ? normalizeString(p.cargo) : '';

    if (roleIdNorm === normTarget || cargoNorm === normTarget) return true;

    // Matching for Director / Directora
    if (normTarget.includes('director')) {
      if (
        roleIdNorm === 'director' ||
        roleIdNorm === 'directora' ||
        cargoNorm === 'director' ||
        cargoNorm === 'directora' ||
        roleIdNorm.includes('director') ||
        cargoNorm.includes('director')
      ) {
        return true;
      }
    }

    // Matching for Jefe de Operaciones
    if (normTarget.includes('operacion') || normTarget.includes('operaciones')) {
      if (
        roleIdNorm.includes('jefe de operacion') ||
        roleIdNorm.includes('jefa de operacion') ||
        cargoNorm.includes('jefe de operacion') ||
        cargoNorm.includes('jefa de operacion') ||
        roleIdNorm.includes('operacion') ||
        cargoNorm.includes('operacion')
      ) {
        return true;
      }
    }

    return false;
  };

  // 1. Prefer active member
  const activeMatch = personnelList.find((p) => (!p.status || p.status === 'activo') && isMatch(p));
  if (activeMatch) return activeMatch;

  // 2. Fallback to any member
  return personnelList.find(isMatch);
}

/**
 * Gets the exact key name configured in the roles list for a leader type.
 */
export function getLeaderRoleKey(
  rolesList: StaffRole[] | undefined,
  leaderType: 'DIRECTOR' | 'JEFE_OPERACIONES'
): string {
  if (!rolesList || rolesList.length === 0) {
    return leaderType === 'DIRECTOR' ? LEADER_ROLES.DIRECTOR : LEADER_ROLES.JEFE_OPERACIONES;
  }
  if (leaderType === 'DIRECTOR') {
    const found = rolesList.find((r) => normalizeString(r.name).includes('director'));
    return found ? found.name : LEADER_ROLES.DIRECTOR;
  } else {
    const found = rolesList.find((r) => {
      const n = normalizeString(r.name);
      return n.includes('operacion') || n.includes('operaciones');
    });
    return found ? found.name : LEADER_ROLES.JEFE_OPERACIONES;
  }
}

/**
 * Auto-fills Director and Jefe de Operaciones in a guard's staff dictionary
 * according to the personnel list if they are not already filled.
 */
export function autoFillGuardLeaders(
  staff: Staff,
  personnelList: StaffMember[],
  rolesList?: StaffRole[]
): { updatedStaff: Staff; changed: boolean } {
  const updatedStaff: Staff = { ...(staff || {}) };
  let changed = false;

  const directorKey = getLeaderRoleKey(rolesList, 'DIRECTOR');
  const jefeOpsKey = getLeaderRoleKey(rolesList, 'JEFE_OPERACIONES');

  // Auto-fill Director if empty
  if (!updatedStaff[directorKey] || updatedStaff[directorKey].length === 0) {
    const directorMember = findLeaderInPersonnel(personnelList, directorKey);
    if (directorMember) {
      updatedStaff[directorKey] = [directorMember];
      changed = true;
    }
  }

  // Auto-fill Jefe de Operaciones if empty
  if (!updatedStaff[jefeOpsKey] || updatedStaff[jefeOpsKey].length === 0) {
    const jefeOpsMember = findLeaderInPersonnel(personnelList, jefeOpsKey);
    if (jefeOpsMember) {
      updatedStaff[jefeOpsKey] = [jefeOpsMember];
      changed = true;
    }
  }

  return { updatedStaff, changed };
}

/**
 * Resolves the ordered list of personnel eligible to report ({Reporta}),
 * giving priority to configured settings (reportarole_ids) or standard reporting hierarchy,
 * sourcing primarily from the active Orden del Día staff and falling back to general personnel.
 */
export function getReportingPersonnelOptions(
  activeStaff?: Staff | StaffMember[] | null,
  reportaroleIds?: string[] | null,
  allRoles?: StaffRole[],
  personnelList?: StaffMember[]
): StaffMember[] {
  const result: StaffMember[] = [];
  const addedIds = new Set<string>();

  const rehydrate = (member: StaffMember, roleName: string): StaffMember => {
    const latest = personnelList?.find((p) => p.id === member.id);
    const base = latest ? { ...latest } : { ...member };
    return {
      ...base,
      role_id: roleName || base.role_id,
    };
  };

  const isLeaderOrStatus = (roleName?: string) => {
    if (!roleName) return false;
    const norm = normalizeString(roleName);
    return (
      norm.includes('director') ||
      norm.includes('jefe de operacion') ||
      norm.includes('jefa de operacion') ||
      norm === 'reposo' ||
      norm === 'permiso' ||
      norm === 'vacaciones' ||
      norm === 'ausente'
    );
  };

  // Convert activeStaff to a uniform map of roleName -> StaffMember[]
  const staffByRole = new Map<string, StaffMember[]>();

  if (activeStaff) {
    if (Array.isArray(activeStaff)) {
      activeStaff.forEach((m) => {
        const r = m.role_id || m.cargo || 'Personal';
        const list = staffByRole.get(r) || [];
        list.push(m);
        staffByRole.set(r, list);
      });
    } else if (typeof activeStaff === 'object') {
      Object.entries(activeStaff).forEach(([roleName, members]) => {
        if (Array.isArray(members)) {
          staffByRole.set(roleName, members.filter(Boolean));
        }
      });
    }
  }

  // 1. Determine role priority
  const hasConfiguredRoles = Array.isArray(reportaroleIds) && reportaroleIds.length > 0;
  let targetRoles: string[] = [];

  if (hasConfiguredRoles) {
    targetRoles = reportaroleIds.map((r) => r.trim()).filter(Boolean);
  } else {
    // Default hierarchy of reporting roles: Analista -> Operador -> Jefe de los Servicios -> other operational roles
    const orderedAllRoles = allRoles
      ? [...allRoles].sort((a, b) => (a.hierarchy_order ?? a.order ?? 0) - (b.hierarchy_order ?? b.order ?? 0))
      : [];

    const defaultRolePriority: string[] = [];
    // Prioritize roles matching "analista"
    orderedAllRoles.forEach((r) => {
      const n = normalizeString(r.name);
      if (n.includes('analista') && !defaultRolePriority.includes(r.name)) {
        defaultRolePriority.push(r.name);
      }
    });
    // Then "operador"
    orderedAllRoles.forEach((r) => {
      const n = normalizeString(r.name);
      if (n.includes('operador') && !defaultRolePriority.includes(r.name)) {
        defaultRolePriority.push(r.name);
      }
    });
    // Then "jefe de los servicios"
    orderedAllRoles.forEach((r) => {
      const n = normalizeString(r.name);
      if ((n.includes('jefe de los servicios') || n.includes('jefe de servicio')) && !defaultRolePriority.includes(r.name)) {
        defaultRolePriority.push(r.name);
      }
    });
    // Then any other non-leader, non-status role
    orderedAllRoles.forEach((r) => {
      if (!isLeaderOrStatus(r.name) && !defaultRolePriority.includes(r.name)) {
        defaultRolePriority.push(r.name);
      }
    });

    // Also include any roles present in staffByRole that match "analista", "operador" or "servicios"
    for (const roleKey of staffByRole.keys()) {
      const n = normalizeString(roleKey);
      if (
        (n.includes('analista') || n.includes('operador') || n.includes('servicio')) &&
        !defaultRolePriority.some((dr) => normalizeString(dr) === n)
      ) {
        defaultRolePriority.push(roleKey);
      }
    }

    targetRoles = defaultRolePriority;
  }

  // 2. Extract personnel from staffByRole in order of targetRoles
  for (const roleName of targetRoles) {
    const normRole = normalizeString(roleName);
    for (const [actualRole, members] of staffByRole.entries()) {
      if (normalizeString(actualRole) === normRole) {
        for (const member of members) {
          if (member && (member.id || (typeof member === 'object' && member.name))) {
            const memberId = member.id || member.name;
            if (!addedIds.has(memberId)) {
              addedIds.add(memberId);
              result.push(rehydrate(member, actualRole));
            }
          }
        }
      }
    }
  }

  // 2b. If activeStaff has members in non-leader roles not matched yet (and result is still empty or non-configured)
  if (result.length === 0) {
    for (const [actualRole, members] of staffByRole.entries()) {
      if (!isLeaderOrStatus(actualRole)) {
        for (const member of members) {
          if (member && (member.id || (typeof member === 'object' && member.name))) {
            const memberId = member.id || member.name;
            if (!addedIds.has(memberId)) {
              addedIds.add(memberId);
              result.push(rehydrate(member, actualRole));
            }
          }
        }
      }
    }
  }

  // 2c. If still empty, allow any member in activeStaff (even leader if that's literally all there is)
  if (result.length === 0) {
    for (const [actualRole, members] of staffByRole.entries()) {
      for (const member of members) {
        if (member && (member.id || (typeof member === 'object' && member.name))) {
          const memberId = member.id || member.name;
          if (!addedIds.has(memberId)) {
            addedIds.add(memberId);
            result.push(rehydrate(member, actualRole));
          }
        }
      }
    }
  }

  // 3. Fallback to personnelList if activeStaff yielded no results
  if (result.length === 0 && personnelList && personnelList.length > 0) {
    for (const roleName of targetRoles) {
      const normRole = normalizeString(roleName);
      const matches = personnelList.filter((p) => {
        const pRole = p.role_id ? normalizeString(p.role_id) : '';
        const pCargo = p.cargo ? normalizeString(p.cargo) : '';
        return pRole === normRole || pCargo === normRole;
      });

      const activeMatches = matches.filter((p) => !p.status || p.status === 'activo');
      const candidates = activeMatches.length > 0 ? activeMatches : matches;

      for (const m of candidates) {
        if (!addedIds.has(m.id)) {
          addedIds.add(m.id);
          result.push(rehydrate(m, roleName));
        }
      }
    }
  }

  return result;
}

/**
 * Returns the first person eligible to report ({Reporta}) from Orden del Día,
 * or undefined if none available.
 */
export function getFirstReportingPerson(
  activeStaff?: Staff | StaffMember[] | null,
  reportaroleIds?: string[] | null,
  allRoles?: StaffRole[],
  personnelList?: StaffMember[]
): StaffMember | undefined {
  const options = getReportingPersonnelOptions(activeStaff, reportaroleIds, allRoles, personnelList);
  return options.length > 0 ? options[0] : undefined;
}
