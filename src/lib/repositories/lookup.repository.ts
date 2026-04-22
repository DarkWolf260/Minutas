/**
 * Lookup Repository — Encapsulates all operations on the `lookups` collection.
 *
 * The lookups collection stores roles, departments, and addresses.
 */

import type { MinutasDatabase } from '@/lib/db/db';
import type { StaffRole, Department, Address } from '@/lib/types';
import { DbKeys } from './keys';
import { safeWrite, silentWrite } from './base.repository';

export function createLookupRepository(db: MinutasDatabase, workspaceId: string) {
  const ws = workspaceId;

  // ─── Roles ────────────────────────────────────────────────────────────────

  const watchRoles = () =>
    db.lookups.find({
      selector: { type: 'role', workspaceId: ws },
      sort: [{ 'data.order': 'asc' }],
    }).$;

  const bulkInitRoles = async (roles: StaffRole[]) => {
    const existing = await db.lookups
      .find({ selector: { type: 'role', workspaceId: ws } })
      .exec();
    if (existing.length > 0) return;
    const docs = roles.map((role) => ({
      id: DbKeys.role(ws, role.name),
      workspaceId: ws,
      type: 'role' as const,
      name: role.name,
      data: role,
    }));
    return silentWrite(() => db.lookups.bulkInsert(docs), { feature: 'Roles' });
  };

  const saveRoles = async (roles: StaffRole[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'role', workspaceId: ws } })
          .exec();
        const newIds = new Set(roles.map((r) => DbKeys.role(ws, r.name)));
        const toDelete = allDocs.filter((d) => !newIds.has(d.primary));
        if (toDelete.length > 0)
          await db.lookups.bulkRemove(toDelete.map((d) => d.primary));

        const toUpsert = roles.map((role) => ({
          id: DbKeys.role(ws, role.name),
          workspaceId: ws,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspaceId: ws },
        }));
        await db.lookups.bulkUpsert(toUpsert as any);
      },
      { feature: 'Roles' }
    );

  const clearAllRoles = async (defaults: StaffRole[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'role', workspaceId: ws } })
          .exec();
        await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
        const toInsert = defaults.map((role) => ({
          id: DbKeys.role(ws, role.name),
          workspaceId: ws,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspaceId: ws },
        }));
        await db.lookups.bulkInsert(toInsert as any);
      },
      { feature: 'Roles' }
    );

  // ─── Departments ──────────────────────────────────────────────────────────

  const watchDepartments = () =>
    db.lookups.find({
      selector: { type: 'department', workspaceId: ws },
      sort: [{ 'data.order': 'asc' }],
    }).$;

  const bulkInitDepartments = async (depts: Department[]) => {
    const docs = depts.map((dept) => ({
      id: DbKeys.department(ws, dept.id),
      workspaceId: ws,
      type: 'department' as const,
      name: dept.name,
      data: { ...dept, workspaceId: ws },
    }));
    return silentWrite(() => db.lookups.bulkInsert(docs as any), {
      feature: 'Departments',
    });
  };

  const saveDepartments = async (depts: Department[]) =>
    silentWrite(
      async () => {
        const allDocs = await db.lookups
          .find({ selector: { type: 'department', workspaceId: ws } })
          .exec();
        const newIds = new Set(depts.map((d) => DbKeys.department(ws, d.id)));
        const toDelete = allDocs.filter((d) => !newIds.has(d.primary));
        if (toDelete.length > 0)
          await db.lookups.bulkRemove(toDelete.map((d) => d.primary));

        const toUpsert = depts.map((dept) => ({
          id: DbKeys.department(ws, dept.id),
          workspaceId: ws,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspaceId: ws },
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
          workspaceId: ws,
          type: 'department',
          name: dept.name,
          data: { ...dept, workspaceId: ws },
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
            data: { ...dept, workspaceId: ws },
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
          .find({ selector: { type: 'department', workspaceId: ws } })
          .exec();
        await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
        const toInsert = defaults.map((dept) => ({
          id: DbKeys.department(ws, dept.id),
          workspaceId: ws,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspaceId: ws },
        }));
        await db.lookups.bulkInsert(toInsert as any);
      },
      { feature: 'Departments' }
    );

  // ─── Addresses ────────────────────────────────────────────────────────────

  const watchAddresses = () =>
    db.lookups.find({
      selector: { type: 'address', workspaceId: ws },
    }).$;

  const bulkInitAddresses = async (addrs: Address[]) => {
    const docs = addrs.map((addr) => ({
      id: DbKeys.address(ws, addr.id),
      workspaceId: ws,
      type: 'address' as const,
      name: addr.name,
      data: { ...addr, workspaceId: ws },
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
          workspaceId: ws,
          type: 'address',
          name: addr.name,
          data: { ...addr, workspaceId: ws },
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
            data: { ...addr, workspaceId: ws },
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
          .find({ selector: { type: 'address', workspaceId: ws } })
          .exec();
        await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
      },
      { feature: 'Addresses' }
    );

  return {
    // Roles
    watchRoles,
    bulkInitRoles,
    saveRoles,
    clearAllRoles,
    // Departments
    watchDepartments,
    bulkInitDepartments,
    saveDepartments,
    addDepartment,
    updateDepartment,
    removeDepartment,
    clearAllDepartments,
    // Addresses
    watchAddresses,
    bulkInitAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    clearAllAddresses,
  };
}

export type LookupRepository = ReturnType<typeof createLookupRepository>;
