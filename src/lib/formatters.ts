/**
 * Utility functions for formatting data across the application
 */

import type { StaffMember } from '@/types';

/**
 * Formats a staff member for display, showing just the name.
 * 
 * @param member - Staff member object or string name
 * @returns The staff member's name
 * 
 * @example
 * ```typescript
 * const member = { id: '1', name: 'Juan Pérez', cedula: 'V-12345678' };
 * formatStaffMemberForDisplay(member); // "Juan Pérez"
 * formatStaffMemberForDisplay('María García'); // "María García"
 * ```
 */
export function formatStaffMemberForDisplay(member: StaffMember | string): string {
  if (typeof member === 'string') {
    return member;
  }
  return member.name;
}

/**
 * Formats a staff member for autocomplete suggestions, optionally including cedula.
 * 
 * @param member - Staff member object
 * @param withCedula - Whether to include cédula in the format
 * @returns Formatted string for autocomplete display
 * 
 * @example
 * ```typescript
 * const member = { id: '1', name: 'Juan Pérez', cedula: 'V-12345678' };
 * formatStaffMemberForAutocomplete(member, true);  // "Juan Pérez V-12345678"
 * formatStaffMemberForAutocomplete(member, false); // "Juan Pérez"
 * ```
 */
export function formatStaffMemberForAutocomplete(member: StaffMember, withCedula: boolean): string {
  if (withCedula && member.cedula) {
    return `${member.name} ${member.cedula}`;
  }
  return member.name;
}

/**
 * Formats a staff member for template rendering, optionally showing cedula in parentheses.
 * 
 * @param member - Staff member object
 * @param showCedula - Whether to show cédula in parentheses (default: false)
 * @returns Formatted string for template display
 * 
 * @example
 * ```typescript
 * const member = { id: '1', name: 'Juan Pérez', cedula: 'V-12345678' };
 * formatStaffMember(member);       // "Juan Pérez"
 * formatStaffMember(member, true); // "Juan Pérez (V-12345678)"
 * ```
 */
export function formatStaffMember(member: StaffMember, showCedula: boolean = false): string {
  if (!member) return '';

  if (showCedula && member.cedula) {
    return `${member.name} (${member.cedula})`;
  }

  return member.name;
}
