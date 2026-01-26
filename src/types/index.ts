
'use client';

import { PERSONNEL_STATUS } from '@/constants/personnel';
import { ATTENDANCE_STATUS } from '@/constants/attendance';

export type PersonnelStatus = typeof PERSONNEL_STATUS[keyof typeof PERSONNEL_STATUS];
export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // ISO format: YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;
  note?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  personnelId?: string; // Link to global personnel list
  name: string;
  cedula?: string;
  rank?: string; // Hierarchy / Rank
  roleId?: string;
  status?: PersonnelStatus;
  department?: string;
  specialties?: string[];
}

export interface StaffRole {
  name: string;
  isSingle: boolean; // True for roles that can only have one person
  departmentScope: string[]; // Array of department IDs, 'OPERATIONS' for guards. Empty array means global.
  isHidden?: boolean; // If true, this role won't appear in the default Orden del Día / Reports
}

// Staff is a record mapping a role name to a list of personnel for that role.
export interface Staff {
  [roleName: string]: StaffMember[];
}

export interface Guard {
  id: string;
  staff: Staff;
}

export interface AppSettings {
  id?: string;
  // This is now managed via global field definitions
  activeGuardId?: string;
  guardShiftDuration?: number;
  finalReportStaffSnapshot?: Staff;
  finalReportStartDate?: string;
  finalReportEndDate?: string;
  reportaRoleId?: string;
  analistaRoleId?: string;
}

export interface Report {
  id: string;
  templateId: string;
  title: string;
  timestamp: string;
  content: string;
  isRelevant: boolean;
  status?: 'En proceso' | 'Finalizado';
  formData?: Record<string, any>;
}

export interface GuardReport {
  id: string;
  date: string; // Date of the report/guard (ISO string)
  generatedAt: string; // Timestamp of saving (ISO string)
  guardGroup?: string; // e.g. "Guardia A" or "Guardia B" based on active guard
  content: string; // The full text content of the report
  summary?: string; // Short summary or title, e.g. "Reporte de Cierre - [Date]"
}

export type FieldType = 'text' | 'textarea' | 'date' | 'predefined' | 'time-hlv' | 'multi-text' | 'dropdown';

export type TextModifier = 'upper' | 'lower' | 'title';

export interface SnippetOption {
  id: string;
  label: string;
  value: string;
}

export interface FieldConfig {
  type: FieldType;
  label: string;
  required?: boolean;
  value?: string;
  sectionId?: string;
  targetField?: string;
  snippetOptions?: SnippetOption[];
  modifiers?: TextModifier[]; // Transformaciones de texto: upper, lower, title
  isFullWidth?: boolean;
}

export interface SectionConfig {
  id: string;
  label: string;
  isRepeatable: boolean;
  fieldIds: string[];
  layout?: string[]; // Order of fields and section IDs within this section
  repeatableItemLabel?: string; // This is the `sub` value
  pluralTitle?: string;
  singularTitle?: string;
  condition?: {
    fieldId: string;
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: string;
  };
  statisticsCategory?: string; // New: Statistics category associated with this section
  originalContent?: string; // Used for re-parsing conditional blocks
}

export interface TemplateConfig {
  fields: Record<string, FieldConfig>;
  sections: SectionConfig[];
  layout: string[]; // Order of fields and section IDs
}

export interface StatisticRule {
  fieldId: string;
  condition: 'equals' | 'contains';
  value: string;
  category: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'normal' | 'relevante';
  isActive?: boolean;
  statisticsCategory?: string;
  statisticsRules?: StatisticRule[];
}

export interface ReportDraft {
  id?: string;
  templateId: string;
  formData: Record<string, any>;
  lastSaved?: string;
}

export interface Department {
  id: string;
  name: string;
  staff: Staff;
}

export interface Address {
  id: string;
  name: string;
  street?: string;
  houseNumber?: string;
  municipality: string;
  parish: string;
  sector?: string;
  peaceQuadrant: string;
  latitude?: string;
  longitude?: string;
  details?: string;
}

export interface DefinitionSection {
  id: string;
  name: string;
}

export interface TemplateParserResult {
  sections: SectionConfig[];
  layout: string[];
  fieldNames: Set<string>;
  fieldTypes: Map<string, FieldType>;
  templateOptions: Map<string, SnippetOption[]>;
  fieldModifiers: Map<string, string[]>;
  fieldWidths: Map<string, boolean>;
  requiredFields: Map<string, boolean>;
  errors: string[];
}

