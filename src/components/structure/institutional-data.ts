
import { Department, StaffRole } from '@/lib/types';
import { DEFAULT_DEPARTMENTS, DEFAULT_ROLES } from '@/lib/constants/structure';

/**
 * Provides the source of truth for the institutional structure.
 * This is now backed by centralized constants in src/lib/constants/structure.ts
 */
export function getInstitutionalData() {
    // We return copies of our constants to avoid accidental mutation
    const newDepts: Department[] = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
    const newRoles: StaffRole[] = JSON.parse(JSON.stringify(DEFAULT_ROLES));

    return { newDepts, newRoles };
}
