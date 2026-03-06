/**
 * Centralized ID generation utility.
 * Uses crypto.randomUUID() for guaranteed uniqueness.
 *
 * @param prefix - Optional prefix for readability (e.g. 'report', 'personnel')
 * @returns A unique ID string, optionally prefixed
 *
 * @example
 * generateId()            // "a1b2c3d4-e5f6-..."
 * generateId('report')    // "report_a1b2c3d4-e5f6-..."
 * generateId('personnel') // "personnel_a1b2c3d4-e5f6-..."
 */
export function generateId(prefix?: string): string {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}_${uuid}` : uuid;
}
