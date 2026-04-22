/**
 * Centralized document key factory for RxDB.
 *
 * All composite document IDs are defined here as a single source of truth.
 * Use these functions instead of hardcoding strings like `${ws}:settings:app`.
 */

export const DbKeys = {
  // ─── Config collection ──────────────────────────────────────────────────
  settings: (ws: string) => `${ws}:settings:app`,
  draft: (ws: string) => `${ws}:draft:active-draft`,
  profile: (ws: string) => `${ws}:profile:user`,
  fieldDefinition: (ws: string, fieldName: string) => `${ws}:field_definition:${fieldName}`,
  guard: (ws: string, guardId: string) => `${ws}:guard:${guardId}`,
  unit: (ws: string, unitId: string) => `${ws}:unit:${unitId}`,
  templateConfig: (templateId: string) => `template_config:${templateId}`,

  // ─── Lookups collection ──────────────────────────────────────────────────
  role: (ws: string, roleName: string) => `${ws}:role:${roleName}`,
  department: (ws: string, deptId: string) => `${ws}:dept:${deptId}`,
  address: (ws: string, addrId: string) => `${ws}:addr:${addrId}`,

  // ─── History collection ──────────────────────────────────────────────────
  guardHistory: (ws: string, reportId: string) => `${ws}:ghistory:${reportId}`,
} as const;
