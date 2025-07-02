







export interface StaffRole {
  name: string;
  isSingle: boolean; // True for roles that can only have one person
  departmentScope: string[]; // Array of department IDs, 'OPERATIONS' for guards. Empty array means global.
}

// Staff is a record mapping a role name to a list of personnel for that role.
export interface Staff {
  [roleName: string]: string[];
}

export interface Guard {
  id: string;
  staff: Staff;
}

export interface AppSettings {
  // This is now managed via global field definitions
  activeGuardId?: string;
  guardShiftDuration?: number;
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

export type FieldType = 'text' | 'textarea' | 'date' | 'predefined' | 'time-hlv' | 'multi-text';

export interface FieldConfig {
    type: FieldType;
    label: string;
    required?: boolean;
    value?: string;
    sectionId?: string;
}

export interface SectionConfig {
    id: string;
    label: string;
    isRepeatable: boolean;
    fieldIds: string[];
    repeatableItemLabel?: string; // This is the `sub` value
    pluralTitle?: string;
    singularTitle?: string;
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

export interface DefinitionSection {
  id: string;
  name: string;
}
