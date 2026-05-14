/**
 * Utility functions for formatting data across the application
 */

import type { StaffMember } from '@/lib/types';

/**
 * Helper to build a full name with rank and title
 */
function buildFullStaffName(member: StaffMember): string {
  const parts: string[] = [];
  
  if (member.rank && member.rank !== 'Sin jerarquía') parts.push(member.rank);
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
  member: StaffMember | string, 
  showCedula: boolean = false,
  showObservation: boolean = false
): string {
  if (!member) return '';

  if (typeof member === 'string') return member;

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
export function formatStaffReporta(member: StaffMember | string): string {
  if (!member) return '';
  if (typeof member === 'string') return member;
  
  const parts: string[] = [];
  
  if (member.cargo) parts.push(member.cargo);
  if (member.rank && member.rank !== 'Sin jerarquía') parts.push(member.rank);
  parts.push(member.name);
  if (member.cedula) parts.push(member.cedula);
  
  return parts.filter(Boolean).join(' ');
}

/**
 * Formats a date into the standard period string: "DD/MM/YYYY AL DD/MM/YYYY"
 * where the second date is the next day.
 * 
 * @param date - The start date
 * @returns Formatted period string
 */
export function formatDateToPeriod(date: Date): string {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `${fmt(date)} AL ${fmt(tomorrow)}`;
}

/**
 * Extracts the first date from a period string and returns it in "YYYY-MM-DD" format.
 * If invalid, returns today in "YYYY-MM-DD" format.
 * 
 * @param period - The period string (e.g., "DD/MM/YYYY AL DD/MM/YYYY")
 * @returns Date string in "YYYY-MM-DD" format
 */
export function parsePeriodToDate(period: string): string {
  if (!period) return new Date().toISOString().split('T')[0]!;
  
  const match = period.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [_, d, m, y] = match;
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().split('T')[0]!;
}
