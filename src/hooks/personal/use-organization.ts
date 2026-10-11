/**
 * Deep module for Organization, Personnel and Roster Management.
 *
 * Unifies Personnel, Roles, Departments, and Guards into a single
 * cohesive domain aggregate with atomic loading state, cross-entity
 * queries, and decoupled data operations.
 *
 * Designed according to codebase-design principles:
 * - High depth: encapsulates multiple RxDB collections and lookups behind a clean interface.
 * - High locality: updates, validation and lookups concentrate in one place.
 * - Testable: pure results, no UI toast side-effects in data layer.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { useGuards } from '@/hooks/guardias';
import { createPersonnelRepository, createLookupRepository } from '@/lib/repositories';
import { StaffMemberSchema } from '@/lib/validations/schemas';
import { DEFAULT_ROLES, DEFAULT_DEPARTMENTS } from '@/lib/constants/structure';
import { generateId } from '@/lib/utils/id';
import { logger } from '@/lib/logger';
import type { StaffMember, StaffRole, Department, Guard } from '@/lib/types';

export interface UseOrganizationReturn {
  // Aggregate data
  personnel: StaffMember[];
  roles: StaffRole[];
  departments: Department[];
  guards: Guard[];
  isLoaded: boolean;
  personnelLoaded: boolean;
  rolesLoaded: boolean;
  departmentsLoaded: boolean;
  guardsLoaded: boolean;

  // Domain Queries & Helpers
  isCedulaDuplicate: (cedula: string, excludeId?: string) => boolean;
  getRoleByName: (name: string) => StaffRole | undefined;
  getRoleName: (name?: string) => string;
  getDepartmentById: (id: string) => Department | undefined;
  getDepartmentName: (id?: string) => string;
  getMembersByGuard: (guardId: string) => StaffMember[];
  getMembersByDepartment: (deptName: string) => StaffMember[];
  getMembersByRole: (roleName: string) => StaffMember[];

  // Personnel Mutations
  addMember: (member: Omit<StaffMember, 'id'>) => Promise<void>;
  addMembers: (members: Omit<StaffMember, 'id'>[]) => Promise<{ added: StaffMember[]; skipped: number }>;
  updateMember: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  removeMembers: (ids: string[]) => Promise<void>;
  savePersonnel: (members: StaffMember[]) => Promise<void>;
  clearAllPersonnel: () => Promise<void>;

  // Structure Mutations
  saveRoles: (roles: StaffRole[]) => Promise<void>;
  clearAllRoles: () => Promise<void>;
  saveDepartments: (departments: Department[]) => Promise<void>;
  addDepartment: (department: Department) => Promise<void>;
  removeDepartment: (departmentId: string) => Promise<void>;
  updateDepartment: (department: Department) => Promise<void>;
  clearAllDepartments: () => Promise<void>;
  saveGuards: (guards: Guard[]) => Promise<void>;
}

export function useOrganization(): UseOrganizationReturn {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const { guards, isLoaded: guardsLoaded, saveGuards } = useGuards();

  // State
  const [personnel, setPersonnel] = useState<StaffMember[]>([]);
  const [personnelLoaded, setPersonnelLoaded] = useState(false);

  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);

  // 1. Subscribe to Personnel
  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createPersonnelRepository(db, currentWorkspace);
    const sub = repo.watchAll().subscribe({
      next: (data) => {
        setPersonnel(data);
        setPersonnelLoaded(true);
      },
      error: (err) => {
        logger.error('Error watching personnel', err);
        setPersonnelLoaded(true);
      },
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  // 2. Subscribe to Roles
  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initialized = false;

    const repo = createLookupRepository(db, currentWorkspace, isCloud);
    const sub = repo.watchRoles().subscribe({
      next: (data) => {
        if (data.length > 0) {
          setRoles(
            data.map((item: any) => {
              const raw = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
              return { ...(raw as StaffRole), workspace_id: currentWorkspace };
            }) as StaffRole[]
          );
          initialized = true;
          setRolesLoaded(true);
        } else if (!initialized && data.length === 0) {
          initialized = true;
          setRoles(DEFAULT_ROLES as StaffRole[]);
          setRolesLoaded(true);
        } else if (!isCloud) {
          setRoles([]);
          setRolesLoaded(true);
        }
      },
      error: (err) => {
        logger.error('Error watching roles', err);
        setRolesLoaded(true);
      },
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  // 3. Subscribe to Departments
  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initialized = false;

    const repo = createLookupRepository(db, currentWorkspace, isCloud);
    const sub = repo.watchDepartments().subscribe({
      next: async (data) => {
        if (data.length > 0) {
          setDepartments(
            data.map((item: any) => {
              const raw = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
              return { ...(raw as Department), workspace_id: currentWorkspace };
            }) as Department[]
          );
          initialized = true;
          setDepartmentsLoaded(true);
        } else if (!initialized && data.length === 0) {
          initialized = true;
          try {
            await repo.bulkInitDepartments(DEFAULT_DEPARTMENTS);
          } catch (err) {
            logger.error('Failed to auto-seed default departments', err);
          }
          setDepartmentsLoaded(true);
        } else if (!isCloud) {
          setDepartments([]);
          setDepartmentsLoaded(true);
        }
      },
      error: (err) => {
        logger.error('Error watching departments', err);
        setDepartmentsLoaded(true);
      },
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  // Fallback timer for cloud loading
  useEffect(() => {
    if (isCloud) {
      const timer = setTimeout(() => {
        if (!rolesLoaded) setRolesLoaded(true);
        if (!departmentsLoaded) setDepartmentsLoaded(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCloud, rolesLoaded, departmentsLoaded]);

  const isLoaded = personnelLoaded && rolesLoaded && departmentsLoaded && guardsLoaded;

  // Domain Lookups
  const rolesMap = useMemo(() => {
    const map = new Map<string, StaffRole>();
    roles.forEach((r) => map.set(r.name, r));
    return map;
  }, [roles]);

  const departmentsMap = useMemo(() => {
    const map = new Map<string, Department>();
    departments.forEach((d) => map.set(d.id, d));
    return map;
  }, [departments]);

  const getRoleByName = useCallback((name: string) => rolesMap.get(name), [rolesMap]);

  const getRoleName = useCallback(
    (name?: string) => {
      if (!name) return '';
      return rolesMap.get(name)?.name || name;
    },
    [rolesMap]
  );

  const getDepartmentById = useCallback((id: string) => departmentsMap.get(id), [departmentsMap]);

  const getDepartmentName = useCallback(
    (id?: string) => {
      if (!id) return '';
      return departmentsMap.get(id)?.name || id;
    },
    [departmentsMap]
  );

  const getMembersByGuard = useCallback(
    (guardId: string) => {
      const targetGuard = guards.find((g) => g.id === guardId);
      if (!targetGuard || !targetGuard.staff) return [];
      return Object.values(targetGuard.staff).flat();
    },
    [guards]
  );

  const getMembersByDepartment = useCallback(
    (deptName: string) => {
      return personnel.filter((m) => m.department === deptName);
    },
    [personnel]
  );

  const getMembersByRole = useCallback(
    (roleName: string) => {
      return personnel.filter((m) => m.role_id === roleName);
    },
    [personnel]
  );

  const isCedulaDuplicate = useCallback(
    (cedula: string, excludeId?: string) => {
      if (!cedula) return false;
      return personnel.some((p) => p.cedula === cedula && p.id !== excludeId);
    },
    [personnel]
  );

  // Personnel Mutations
  const addMember = useCallback(
    async (newMember: Omit<StaffMember, 'id'>) => {
      if (!db || !currentWorkspace) return;
      const memberWithId: StaffMember = {
        ...newMember,
        id: generateId('personnel'),
        workspace_id: currentWorkspace,
      } as any;

      const validated = StaffMemberSchema.parse(memberWithId) as StaffMember;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.add(validated);
      logger.info('Personnel added', { id: validated.id, name: validated.name });
    },
    [db, currentWorkspace]
  );

  const addMembers = useCallback(
    async (members: Omit<StaffMember, 'id'>[]) => {
      if (!db || !currentWorkspace) return { added: [], skipped: 0 };
      const existingCedulas = new Set(personnel.filter((p) => p.cedula).map((p) => p.cedula));
      const newMembers: StaffMember[] = [];
      let skippedCount = 0;

      members.forEach((m) => {
        if (m.cedula && existingCedulas.has(m.cedula)) {
          skippedCount++;
          return;
        }
        const id = generateId('personnel');
        newMembers.push({ ...m, id, workspace_id: currentWorkspace } as any);
        if (m.cedula) existingCedulas.add(m.cedula);
      });

      if (newMembers.length > 0) {
        const repo = createPersonnelRepository(db, currentWorkspace);
        await repo.bulkAdd(newMembers);
      }

      return { added: newMembers, skipped: skippedCount };
    },
    [db, currentWorkspace, personnel]
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<StaffMember>) => {
      if (!db || !currentWorkspace) return;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.update(id, updates);
      logger.info('Personnel updated', { id, updates });
    },
    [db, currentWorkspace]
  );

  const removeMember = useCallback(
    async (id: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.remove(id);
    },
    [db, currentWorkspace]
  );

  const removeMembers = useCallback(
    async (ids: string[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.bulkRemove(ids);
    },
    [db, currentWorkspace]
  );

  const savePersonnel = useCallback(
    async (newPersonnel: StaffMember[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.syncAll(newPersonnel);
    },
    [db, currentWorkspace]
  );

  const clearAllPersonnel = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createPersonnelRepository(db, currentWorkspace);
    await repo.clearAll();
  }, [db, currentWorkspace]);

  // Structure Mutations
  const saveRoles = useCallback(
    async (newRoles: StaffRole[]) => {
      if (!db || !currentWorkspace) return;
      setRoles(newRoles);
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.saveRoles(newRoles);
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllRoles = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace, isCloud);
    await repo.clearAllRoles(DEFAULT_ROLES);
  }, [db, currentWorkspace, isCloud]);

  const saveDepartments = useCallback(
    async (newDepartments: Department[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.saveDepartments(newDepartments);
    },
    [db, currentWorkspace, isCloud]
  );

  const addDepartment = useCallback(
    async (newDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.addDepartment(newDepartment);
    },
    [db, currentWorkspace, isCloud]
  );

  const removeDepartment = useCallback(
    async (departmentId: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.removeDepartment(departmentId);
    },
    [db, currentWorkspace, isCloud]
  );

  const updateDepartment = useCallback(
    async (updatedDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.updateDepartment(updatedDepartment);
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllDepartments = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace, isCloud);
    await repo.clearAllDepartments(DEFAULT_DEPARTMENTS);
  }, [db, currentWorkspace, isCloud]);

  return {
    personnel,
    roles,
    departments,
    guards,
    isLoaded,
    personnelLoaded,
    rolesLoaded,
    departmentsLoaded,
    guardsLoaded,

    isCedulaDuplicate,
    getRoleByName,
    getRoleName,
    getDepartmentById,
    getDepartmentName,
    getMembersByGuard,
    getMembersByDepartment,
    getMembersByRole,

    addMember,
    addMembers,
    updateMember,
    removeMember,
    removeMembers,
    savePersonnel,
    clearAllPersonnel,

    saveRoles,
    clearAllRoles,
    saveDepartments,
    addDepartment,
    removeDepartment,
    updateDepartment,
    clearAllDepartments,
    saveGuards,
  };
}

// ─── Projections for seamless backward compatibility ──────────────────────────

export function usePersonnel() {
  const org = useOrganization();
  return {
    personnel: org.personnel,
    isLoaded: org.personnelLoaded,
    addMember: org.addMember,
    addMembers: org.addMembers,
    updateMember: org.updateMember,
    removeMember: org.removeMember,
    removeMembers: org.removeMembers,
    savePersonnel: org.savePersonnel,
    isCedulaDuplicate: org.isCedulaDuplicate,
    clearAllPersonnel: org.clearAllPersonnel,
  };
}

export function useRoles() {
  const org = useOrganization();
  return {
    roles: org.roles,
    isLoaded: org.rolesLoaded,
    saveRoles: org.saveRoles,
    clearAllRoles: org.clearAllRoles,
  };
}

export function useDepartments() {
  const org = useOrganization();
  return {
    departments: org.departments,
    isLoaded: org.departmentsLoaded,
    saveDepartments: org.saveDepartments,
    addDepartment: org.addDepartment,
    removeDepartment: org.removeDepartment,
    updateDepartment: org.updateDepartment,
    clearAllDepartments: org.clearAllDepartments,
  };
}
