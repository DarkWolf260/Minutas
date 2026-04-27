import { PERSONNEL_STATUS } from '@/lib/constants/personnel';

export type PersonnelStatus = (typeof PERSONNEL_STATUS)[keyof typeof PERSONNEL_STATUS];
export type AttendanceStatus = 'presente' | 'tarde' | 'ausente' | 'permiso';

/** Represents any value that can appear in a form data field */
export type FormDataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | StaffMember
  | StaffMember[]
  | FormDataValue[]
  | { [key: string]: FormDataValue };

/** Typed record for template form data (replaces Record<string, any>) */
export type FormDataRecord = Record<string, FormDataValue>;

export interface StaffMember {
  id: string;
  workspaceId: string;
  personnelId?: string; // Link to global personnel list
  name: string;
  cedula?: string;
  rank?: string; // Hierarchy / Rank
  cargo?: string; // Job title / Position
  titulo?: string; // Academic title (optional, not shown in table)
  roleId?: string;
  status?: PersonnelStatus;
  department?: string;
  specialties?: string[];
  sex?: 'M' | 'F';
  observation?: string; // For Orden del Día notations
  order?: number;
}

export interface ManualNovedad {
  id: string;
  date: string; // ISO format for serializability
  time: string;
  text: string;
}

export interface StaffRole {
  workspaceId?: string;
  name: string;
  isSingle: boolean; // True for roles that can only have one person
  departmentScope: string[]; // Array of department IDs, 'OPERATIONS' for guards. Empty array means global.
  isHidden?: boolean; // If true, this role won't appear in the default Orden del Día / Reports
  isStatus?: boolean; // If true, this is a personnel status (Reposo, Vacaciones) rather than a fixed position
  order?: number; // Para el Organigrama
  hierarchyOrder?: number; // Para la Jerarquía de Reporte
}

// Staff is a record mapping a role name to a list of personnel for that role.
export interface Staff {
  [roleName: string]: StaffMember[];
}

export interface Guard {
  id: string;
  workspaceId?: string;
  staff: Staff;
}

/** IDs of toggleable modules in the app navigation */
export type AppModuleId =
  | 'novedades'
  | 'orden-del-dia'
  | 'reporte-final'
  | 'personal'
  | 'estadisticas'
  | 'plantillas';

export interface AppSettings {
  id?: string;
  workspaceId?: string;
  // This is now managed via global field definitions
  activeGuardId?: string;
  isGuardOpen?: boolean;
  guardPeriod?: string;
  guardShiftDuration?: number;
  finalReportManualNovedades?: ManualNovedad[];
  finalReportStatistics?: string;
  reportaRoleIds?: string[];
  /** Modules explicitly disabled by the user. undefined = all enabled (backwards-compatible). */
  disabledModules?: AppModuleId[];
  ordenDelDiaDraft?: {
    staff: Staff;
    activities: ManualNovedad[];
    notes: { id: string; content: string }[];
    esJefeEncargado?: boolean;
    guardId: string;
    updatedAt: string;
  };
  finalReportStaffSnapshot?: Staff;
  finalReportGuardId?: string;
  finalReportStartDate?: string;
  finalReportEndDate?: string;
}

export interface Report {
  id: string;
  workspaceId: string;
  templateId: string;
  title: string;
  timestamp: string;
  content: string;
  isRelevant: boolean;
  status?: 'En proceso' | 'Finalizado';
  formData?: FormDataRecord;
  sections?: Array<{
    title: string;
    content: string;
    fields: Record<string, any>;
  }>;
}

export interface GuardReport {
  id: string;
  workspaceId: string;
  date: string; // Date of the report/guard (ISO string)
  generatedAt: string; // Timestamp of saving (ISO string)
  guardGroup?: string; // e.g. "Guardia A" or "Guardia B" based on active guard
  content: string; // The full text content of the report
  summary?: string; // Short summary or title, e.g. "Reporte de Cierre - [Date]"
  statistics?: Record<string, number>; // Persisted aggregated statistics
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'predefined'
  | 'time-hlv'
  | 'multi-text'
  | 'dropdown'
  | 'cedula'
  | 'semantic';

export type TextModifier = 'upper' | 'lower' | 'title';

export interface SnippetOption {
  id: string;
  label: string;
  value: string;
}

export interface FieldConfig {
  workspaceId?: string;
  type: FieldType;
  label: string;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  sectionId?: string;
  snippetOptions?: SnippetOption[];
  modifiers?: TextModifier[]; // Transformaciones de texto: upper, lower, title
  isFullWidth?: boolean;
}

export interface SectionConfig {
  id: string;
  parentId?: string;
  label: string;

  isRepeatable: boolean;
  fieldIds: string[];
  layout?: string[];
  repeatableItemLabel?: string; // This is the `sub` value
  pluralTitle?: string;
  singularTitle?: string;
  condition?: {
    fieldId: string;
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: string;
    /** 'hide' (default) = oculto hasta cumplirse | 'show' = siempre visible en formulario */
    conditionMode?: 'show' | 'hide';
  };
  statisticsCategory?: string; // New: Statistics category associated with this section
  originalContent?: string; // Used for re-parsing conditional blocks
  isSeparator?: boolean; // True if this section is just a visual separator
  isMapping?: boolean; // True if this is a mapping conditional [?{Field}] Key=Value [/]
  isSelfContained?: boolean; // True if this is a self-contained section ["Title" {field}]
  hasStaticContent?: boolean; // True if the section contains non-whitespace static text
}


export interface TemplateConfig {
  fields: Record<string, FieldConfig>;
  sections: SectionConfig[];
  layout: string[]; // Order of fields and section IDs
}

export type StatisticOperator = '=' | '!=' | 'filled' | 'empty' | 'not_empty' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'extract_value' | '>' | '<' | '>=' | '<=';

export interface StatisticRuleCondition {
  fieldId?: string | null;
  operator?: StatisticOperator | null;
  condition?: string | null;
}

export interface StatisticRule {
  fieldId?: string | null; // Primary condition field
  operator?: StatisticOperator | null; // Primary condition operator
  condition?: string | null; // Primary condition value
  category?: string | null;
  conditions?: StatisticRuleCondition[]; // Additional secondary conditions (AND)
  orConditions?: StatisticRuleCondition[]; // Additional secondary conditions (OR)
}

export interface Template {
  id: string;
  workspaceId: string;
  name: string;
  content: string;
  type: 'normal' | 'relevante';
  isActive?: boolean;
  statisticsCategory?: string | null;
  statisticsSubCategories?: string[] | null;
  statisticsRules?: StatisticRule[] | null;
}

export interface ReportDraft {
  id?: string;
  workspaceId: string;
  templateId: string;
  formData: FormDataRecord;
  lastSaved?: string;
}

export interface Department {
  id: string;
  workspaceId?: string;
  name: string;
  staff: Staff;
  order?: number;
}

export interface Address {
  id: string;
  workspaceId?: string;
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
  defaultValues: Map<string, string>;
  predefinedValues: Map<string, string>;
  errors: string[];
}
export interface PersonnelAssignment {
  id: string; // personnelId_date
  workspaceId: string;
  personnelId: string;
  date: string; // YYYY-MM-DD
  guardId: string; // e.g. "A", "B", "C", "D" or departmentId
  roleName: string;
  timestamp: string; // ISO format
}
