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
 * @returns Formatted string: "Analista de Sala de Monitoreo OPC I Rubén Rojas V-28.702.206"
 */
export function formatStaffReporta(member: StaffMember | string): string {
  if (!member) return '';
  if (typeof member === 'string') return member;
  
  const parts: string[] = [];
  
  const cargoOrRole = (member.role_id && member.role_id !== 'none') ? member.role_id : member.cargo;
  if (cargoOrRole) parts.push(cargoOrRole);
  if (member.rank && member.rank !== 'Sin jerarquía') parts.push(member.rank);
  parts.push(member.name);
  if (member.cedula) parts.push(member.cedula);
  
  return parts.filter(Boolean).join(' ');
}

/**
 * Formats a date into the standard period string: "DD/MM/YYYY AL DD/MM/YYYY"
 * where the second date is computed based on durationDays (default 1 day = 24h, 2 days = 48h).
 * 
 * @param date - The start date
 * @param durationDays - Number of days the period spans (1 = 24h, 2 = 48h)
 * @returns Formatted period string
 */
export function formatDateToPeriod(date: Date, durationDays: number = 1): string {
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + durationDays);
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `${fmt(date)} AL ${fmt(endDate)}`;
}

/**
 * Calculates the duration in hours (24 or 48) based on a period string: "DD/MM/YYYY AL DD/MM/YYYY".
 * 
 * @param period - The period string
 * @param fallbackHours - Fallback if period cannot be parsed (default: 24)
 * @returns Duration in hours (24 or 48)
 */
export function getPeriodDurationHours(period: string, fallbackHours: number = 24): number {
  if (!period) return fallbackHours;
  const matches = period.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
  if (!matches || matches.length < 2) return fallbackHours;
  const [d1, m1, y1] = matches[0]!.split('/').map(Number);
  const [d2, m2, y2] = matches[1]!.split('/').map(Number);
  const start = new Date(y1!, m1! - 1, d1!);
  const end = new Date(y2!, m2! - 1, d2!);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 2 ? 48 : 24;
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

