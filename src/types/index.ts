
'use client';

export interface StaffMember {
  id: string;
  name: string;
  cedula?: string;
}

export interface StaffRole {
  name: string;
  isSingle: boolean; // True for roles that can only have one person
  departmentScope: string[]; // Array of department IDs, 'OPERATIONS' for guards. Empty array means global.
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
  id:string;
  templateId: string;
  title: string;
  timestamp: string;
  content: string;
  isRelevant: boolean;
  status?: 'En proceso' | 'Finalizado';
  formData?: Record<string, any>;
}

export type FieldType = 'text' | 'textarea' | 'date' | 'predefined' | 'time-hlv' | 'multi-text' | 'dropdown';

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
        value: string;
    };
    originalContent?: string; // Used for re-parsing conditional blocks
}

export interface TemplateConfig {
    fields: Record<string, FieldConfig>;
    sections: SectionConfig[];
    layout: string[]; // Order of fields and section IDs
}

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'normal' | 'relevante';
  isActive?: boolean;
}

export interface ReportDraft {
  templateId: string;
  formData: Record<string, any>;
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
