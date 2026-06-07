/**
 * Centralized document key factory for RxDB.
 *
 * All composite document IDs are defined here as a single source of truth.
 * Use these functions instead of hardcoding strings like `${ws}:settings:app`.
 */

export const DbKeys = {
  // ─── Config collection ──────────────────────────────────────────────────
  settings: (ws: string) => `${ws}:settings:app`,
  ordenDelDia: (ws: string) => `${ws}:orden_del_dia:active-draft`,
  draft: (ws: string) => `${ws}:draft:active-draft`,
  profile: (ws: string) => `${ws}:profile:user`,
  fieldDefinition: (ws: string, fieldName: string) => `${ws}:field_definition:${fieldName}`,
  guard: (ws: string, guardId: string) => `${ws}:guard:${guardId}`,
  unit: (ws: string, unitId: string) => `${ws}:unit:${unitId}`,
  scheduledMessage: (ws: string, id: string) => `${ws}:scheduled_message:${id}`,
  pendingActivity: (ws: string, id: string) => `${ws}:pending_activity:${id}`,

  // ─── Lookups collection ──────────────────────────────────────────────────
  role: (ws: string, roleName: string) => `${ws}:role:${roleName}`,
  department: (ws: string, deptId: string) => `${ws}:dept:${deptId}`,
  address: (ws: string, addrId: string) => `${ws}:addr:${addrId}`,

  // ─── History collection ──────────────────────────────────────────────────
  guardHistory: (ws: string, reportId: string) => `${ws}:ghistory:${reportId}`,
} as const;

