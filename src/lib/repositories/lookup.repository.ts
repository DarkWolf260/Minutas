import type { MinutasDatabase } from '@/lib/db/db';
import type { StaffRole, Department, Address } from '@/lib/types';
import { DbKeys } from './keys';
import { silentWrite } from './base.repository';
import { createSupabaseWatchAll, supabaseRepoUtils } from './supabase.repository';
import { map } from 'rxjs/operators';
import { supabase } from '@/lib/supabase';

export function createLookupRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'lookups';

  if (isCloud) {
    return {
      // Roles
      watchRoles: () => createSupabaseWatchAll<any>(TABLE, ws, { 
        filter: (q) => q.eq('type', 'role'),
        orderCol: 'data->>order',
        ascending: true
      }),
      bulkInitRoles: async (roles: StaffRole[]) => {
        const { data } = await supabase.from(TABLE).select('id').eq('type', 'role').eq('workspace_id', ws).limit(1);
        if (data && data.length > 0) return;
        const docs = roles.map((role) => ({
          id: DbKeys.role(ws, role.name),
          workspace_id: ws,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspace_id: ws },
        }));
        return supabaseRepoUtils.bulkAdd(TABLE, docs);
      },
      saveRoles: async (roles: StaffRole[]) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'role');
        const toUpsert = roles.map((role) => ({
          id: DbKeys.role(ws, role.name),
          workspace_id: ws,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspace_id: ws },
        }));
        await supabaseRepoUtils.bulkAdd(TABLE, toUpsert);
      },
      clearAllRoles: async (defaults: StaffRole[]) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'role');
        const toInsert = defaults.map((role) => ({
          id: DbKeys.role(ws, role.name),
          workspace_id: ws,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspace_id: ws },
        }));
        await supabaseRepoUtils.bulkAdd(TABLE, toInsert);
      },

      // Departments
      watchDepartments: () => createSupabaseWatchAll<any>(TABLE, ws, { 
        filter: (q) => q.eq('type', 'department'),
        orderCol: 'data->>order',
        ascending: true
      }),
      bulkInitDepartments: (depts: Department[]) => {
        const docs = depts.map((dept) => ({
          id: DbKeys.department(ws, dept.id),
          workspace_id: ws,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }));
        return supabaseRepoUtils.bulkAdd(TABLE, docs);
      },
      saveDepartments: async (depts: Department[]) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'department');
        const toUpsert = depts.map((dept) => ({
          id: DbKeys.department(ws, dept.id),
          workspace_id: ws,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }));
        await supabaseRepoUtils.bulkAdd(TABLE, toUpsert);
      },
      addDepartment: (dept: Department) =>
        supabaseRepoUtils.add(TABLE, {
          id: DbKeys.department(ws, dept.id),
          workspace_id: ws,
          type: 'department',
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }),
      updateDepartment: (dept: Department) =>
        supabaseRepoUtils.update(TABLE, DbKeys.department(ws, dept.id), {
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }),
      removeDepartment: (deptId: string) => supabaseRepoUtils.remove(TABLE, DbKeys.department(ws, deptId)),
      clearAllDepartments: async (defaults: Department[]) => {
        await supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'department');
        const toInsert = defaults.map((dept) => ({
          id: DbKeys.department(ws, dept.id),
          workspace_id: ws,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }));
        await supabaseRepoUtils.bulkAdd(TABLE, toInsert);
      },

      // Addresses
      watchAddresses: () => createSupabaseWatchAll<any>(TABLE, ws, { filter: (q) => q.eq('type', 'address') }),
      bulkInitAddresses: (addrs: Address[]) => {
        const docs = addrs.map((addr) => ({
          id: DbKeys.address(ws, addr.id),
          workspace_id: ws,
          type: 'address' as const,
          name: addr.name,
          data: { ...addr, workspace_id: ws },
        }));
        return supabaseRepoUtils.bulkAdd(TABLE, docs);
      },
      addAddress: (addr: Address) =>
        supabaseRepoUtils.add(TABLE, {
          id: DbKeys.address(ws, addr.id),
          workspace_id: ws,
          type: 'address',
          name: addr.name,
          data: { ...addr, workspace_id: ws },
        }),
      updateAddress: (addr: Address) =>
        supabaseRepoUtils.update(TABLE, DbKeys.address(ws, addr.id), {
          name: addr.name,
          data: { ...addr, workspace_id: ws },
        }),
      removeAddress: (addrId: string) => supabaseRepoUtils.remove(TABLE, DbKeys.address(ws, addrId)),
      clearAllAddresses: () => supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'address')
    };
  }

  // RxDB Implementation
  if (!db) throw new Error('Database not initialized');

  const watchRoles = () =>
    db.lookups.find({
      selector: { type: 'role', workspace_id: ws },
      sort: [{ 'data.order': 'asc' }],
    }).$.pipe(
      map(docs => docs.map(d => d.toJSON()))
    );

  const bulkInitRoles = async (roles: StaffRole[]) => {
    const existing = await db.lookups
      .find({ selector: { type: 'role', workspace_id: ws } })
      .exec();
    if (existing.length > 0) return;
    const docs = roles.map((role) => ({
      id: DbKeys.role(ws, role.name),
      workspace_id: ws,
      type: 'role' as const,
      name: role.name,
      data: { ...role, workspace_id: ws },
    }));
    return silentWrite(() => db.lookups.bulkInsert(docs as any), { feature: 'Roles' });
  };

  const saveRoles = async (roles: StaffRole[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'role', workspace_id: ws } })
          .exec();
        const newIds = new Set(roles.map((r) => DbKeys.role(ws, r.name)));
        const toDelete = allDocs.filter((d) => !newIds.has(d.primary));
        if (toDelete.length > 0)
          await db.lookups.bulkRemove(toDelete.map((d) => d.primary));

        const toUpsert = roles.map((role) => ({
          id: DbKeys.role(ws, role.name),
          workspace_id: ws,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspace_id: ws },
        }));
        await db.lookups.bulkUpsert(toUpsert as any);
      },
      { feature: 'Roles' }
    );

  const clearAllRoles = async (defaults: StaffRole[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'role', workspace_id: ws } })
          .exec();
        await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
        const toInsert = defaults.map((role) => ({
          id: DbKeys.role(ws, role.name),
          workspace_id: ws,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspace_id: ws },
        }));
        await db.lookups.bulkInsert(toInsert as any);
      },
      { feature: 'Roles' }
    );

  const watchDepartments = () =>
    db.lookups.find({
      selector: { type: 'department', workspace_id: ws },
      sort: [{ 'data.order': 'asc' }],
    }).$.pipe(
      map(docs => docs.map(d => d.toJSON()))
    );

  const bulkInitDepartments = async (depts: Department[]) => {
    const docs = depts.map((dept) => ({
      id: DbKeys.department(ws, dept.id),
      workspace_id: ws,
      type: 'department' as const,
      name: dept.name,
      data: { ...dept, workspace_id: ws },
    }));
    return silentWrite(() => db.lookups.bulkInsert(docs as any), {
      feature: 'Departments',
    });
  };

  const saveDepartments = async (depts: Department[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'department', workspace_id: ws } })
          .exec();
        const newIds = new Set(depts.map((d) => DbKeys.department(ws, d.id)));
        const toDelete = allDocs.filter((d) => !newIds.has(d.primary));
        if (toDelete.length > 0)
          await db.lookups.bulkRemove(toDelete.map((d) => d.primary));

        const toUpsert = depts.map((dept) => ({
          id: DbKeys.department(ws, dept.id),
          workspace_id: ws,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }));
        await db.lookups.bulkUpsert(toUpsert as any);
      },
      { feature: 'Departments' }
    );

  const addDepartment = async (dept: Department) =>
    silentWrite(
      () =>
        db.lookups.insert({
          id: DbKeys.department(ws, dept.id),
          workspace_id: ws,
          type: 'department',
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }),
      { feature: 'Departments' }
    );

  const updateDepartment = async (dept: Department) =>
    silentWrite(
      async () => {
        const doc = await db.lookups
          .findOne(DbKeys.department(ws, dept.id))
          .exec();
        if (doc)
          await doc.patch({
            name: dept.name,
            data: { ...dept, workspace_id: ws },
          });
      },
      { feature: 'Departments' }
    );

  const removeDepartment = async (deptId: string) =>
    silentWrite(
      async () => {
        const doc = await db.lookups
          .findOne(DbKeys.department(ws, deptId))
          .exec();
        if (doc) await doc.remove();
      },
      { feature: 'Departments' }
    );

  const clearAllDepartments = async (defaults: Department[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'department', workspace_id: ws } })
          .exec();
        await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
        const toInsert = defaults.map((dept) => ({
          id: DbKeys.department(ws, dept.id),
          workspace_id: ws,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspace_id: ws },
        }));
        await db.lookups.bulkInsert(toInsert as any);
      },
      { feature: 'Departments' }
    );

  const watchAddresses = () =>
    db.lookups.find({
      selector: { type: 'address', workspace_id: ws },
    }).$.pipe(
      map(docs => docs.map(d => d.toJSON()))
    );

  const bulkInitAddresses = async (addrs: Address[]) => {
    const docs = addrs.map((addr) => ({
      id: DbKeys.address(ws, addr.id),
      workspace_id: ws,
      type: 'address' as const,
      name: addr.name,
      data: { ...addr, workspace_id: ws },
    }));
    return silentWrite(() => db.lookups.bulkInsert(docs as any), {
      feature: 'Addresses',
    });
  };

  const addAddress = async (addr: Address) =>
    silentWrite(
      () =>
        db.lookups.insert({
          id: DbKeys.address(ws, addr.id),
          workspace_id: ws,
          type: 'address',
          name: addr.name,
          data: { ...addr, workspace_id: ws },
        }),
      { feature: 'Addresses' }
    );

  const updateAddress = async (addr: Address) =>
    silentWrite(
      async () => {
        const doc = await db.lookups.findOne(DbKeys.address(ws, addr.id)).exec();
        if (doc)
          await doc.patch({
            name: addr.name,
            data: { ...addr, workspace_id: ws },
          });
      },
      { feature: 'Addresses' }
    );

  const removeAddress = async (addrId: string) =>
    silentWrite(
      async () => {
        const doc = await db.lookups.findOne(DbKeys.address(ws, addrId)).exec();
        if (doc) await doc.remove();
      },
      { feature: 'Addresses' }
    );

  const clearAllAddresses = async () =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'address', workspace_id: ws } })
          .exec();
        await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
      },
      { feature: 'Addresses' }
    );

  return {
    watchRoles,
    bulkInitRoles,
    saveRoles,
    clearAllRoles,
    watchDepartments,
    bulkInitDepartments,
    saveDepartments,
    addDepartment,
    updateDepartment,
    removeDepartment,
    clearAllDepartments,
    watchAddresses,
    bulkInitAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    clearAllAddresses,
  };
}

export type LookupRepository = ReturnType<typeof createLookupRepository>;



