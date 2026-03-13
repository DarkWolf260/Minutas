/**
 * Utility functions for formatting data across the application
 */

import type { StaffMember } from '@/types';

/**
 * Helper to build a full name with rank and title
 */
function buildFullStaffName(member: StaffMember): string {
  const parts: string[] = [];
  
  if (member.rank) parts.push(member.rank);
  if (member.titulo) parts.push(member.titulo);
  parts.push(member.name);
  
  return parts.filter(Boolean).join(' ');
}

/**
 * Formats a staff member for display, showing rank, title and name.
 * 
 * @param member - Staff member object or string name
 * @returns The staff member's formatted string
 */
export function formatStaffMemberForDisplay(member: StaffMember | string): string {
  if (typeof member === 'string') {
    return member;
  }
  return buildFullStaffName(member);
}

/**
 * Formats a staff member for autocomplete suggestions, including rank, title, name, and optionally cedula.
 * 
 * @param member - Staff member object
 * @param withCedula - Whether to include cédula in the format
 * @returns Formatted string for autocomplete display
 */
export function formatStaffMemberForAutocomplete(member: StaffMember, withCedula: boolean): string {
  const fullName = buildFullStaffName(member);
  if (withCedula && member.cedula) {
    return `${fullName} ${member.cedula}`;
  }
  return fullName;
}

/**
 * Formats a staff member for template rendering, optionally showing cedula in parentheses.
 * 
 * @param member - Staff member object
 * @param showCedula - Whether to show cédula in parentheses (default: false)
 * @returns Formatted string for template display
 */
export function formatStaffMember(
  member: StaffMember, 
  showCedula: boolean = false,
  showObservation: boolean = false
): string {
  if (!member) return '';

  const fullName = buildFullStaffName(member);

  let result = fullName;

  if (showCedula && member.cedula) {
    result += ` (${member.cedula})`;
  }

  if (showObservation && member.observation) {
    result += ` (${member.observation})`;
  }

  return result;
}

/**
 * Formats a staff member specifically for the "Reporta" field.
 * Format: [Cargo] [Hierarchy] [Name] [Cédula]
 * 
 * @param member - Staff member object
 * @returns Formatted string: "Analista de CEMUPRAD OPC I Rubén Rojas V-28.702.206"
 */
export function formatStaffReporta(member: StaffMember): string {
  if (!member) return '';
  
  const parts: string[] = [];
  
  if (member.cargo) parts.push(member.cargo);
  if (member.rank) parts.push(member.rank);
  parts.push(member.name);
  if (member.cedula) parts.push(member.cedula);
  
  return parts.filter(Boolean).join(' ');
}
