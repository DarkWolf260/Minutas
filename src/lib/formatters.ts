/**
 * Utility functions for formatting data across the application
 */

import type { StaffMember } from '@/types';

/**
 * Formats a staff member for display, showing just the name
 */
export function formatStaffMemberForDisplay(member: StaffMember | string): string {
    if (typeof member === 'string') {
        return member;
    }
    return member.name;
}

/**
 * Formats a staff member for autocomplete, optionally including cedula
 */
export function formatStaffMemberForAutocomplete(member: StaffMember, withCedula: boolean): string {
    if (withCedula && member.cedula) {
        return `${member.name} ${member.cedula}`;
    }
    return member.name;
}

/**
 * Formats a staff member for template rendering, optionally showing cedula
 */
export function formatStaffMember(member: StaffMember, showCedula: boolean = false): string {
    if (!member) return '';

    if (showCedula && member.cedula) {
        return `${member.name} (${member.cedula})`;
    }

    return member.name;
}
