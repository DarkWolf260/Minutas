import { PERSONNEL_STATUS } from '@/lib/constants/personnel';

export type PersonnelStatus = (typeof PERSONNEL_STATUS)[keyof typeof PERSONNEL_STATUS];
export type AttendanceStatus = 'presente' | 'tarde' | 'ausente' | 'permiso';

/** Represents any value that can appear in a form data field */
export type form_dataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | StaffMember
  | StaffMember[]
  | form_dataValue[]
  | { [key: string]: form_dataValue };

/** Typed record for template form data (replaces Record<string, any>) */
export type form_dataRecord = Record<string, form_dataValue>;

export interface StaffMember {
  id: string;
  workspace_id: string;
  personnel_id?: string; // Link to global personnel list
  name: string;
  cedula?: string;
  rank?: string; // Hierarchy / Rank
  cargo?: string; // Job title / Position
  titulo?: string; // Academic title (optional, not shown in table)
  role_id?: string;
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
  workspace_id?: string;
  name: string;
  is_single: boolean; // True for roles that can only have one person
  department_scope: string[]; // Array of department IDs, 'OPERATIONS' for guards. Empty array means global.
  is_hidden?: boolean; // If true, this role won't appear in the default Orden del Día / Reports
  is_status?: boolean; // If true, this is a personnel status (Reposo, Vacaciones) rather than a fixed position
  order?: number; // Para el Organigrama
  hierarchy_order?: number; // Para la Jerarquía de Reporte
}

// Staff is a record mapping a role name to a list of personnel for that role.
export interface Staff {
  [roleName: string]: StaffMember[];
}

export interface Guard {
  id: string;
  workspace_id?: string;
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
    workspace_id?: string;
    active_guard_id?: string;
    is_guard_open?: boolean;
    guard_period?: string;
    guard_shift_duration?: number;
    final_report_manual_novedades?: ManualNovedad[];
    final_report_statistics?: string;
    reportarole_ids?: string[];
    /** Modules explicitly disabled by the user. undefined = all enabled (backwards-compatible). */
    disabled_modules?: AppModuleId[];
    whatsapp_default_chat_ids?: string[];
    whatsapp_local_url?: string;
  orden_del_dia_draft?: {
    staff: Staff;
    activities: ManualNovedad[];
    notes: { id: string; content: string }[];
    es_jefe_encargado?: boolean;
    guard_id: string;
    updated_at: string;
  };
  final_report_staff_snapshot?: Staff;
  final_report_guard_id?: string;
  final_report_start_date?: string;
  final_report_end_date?: string;
}

export interface Report {
  id: string;
  workspace_id: string;
  template_id: string;
  title: string;
  timestamp: string;
  content: string;
  is_relevant: boolean;
  status?: 'En proceso' | 'Finalizado';
  form_data?: form_dataRecord;
  sections?: Array<{
    title: string;
    content: string;
    fields: Record<string, any>;
  }>;
}

export interface GuardReport {
  id: string;
  workspace_id: string;
  date: string; // Date of the report/guard (ISO string)
  generated_at: string; // Timestamp of saving (ISO string)
  guard_group?: string; // e.g. "Guardia A" or "Guardia B" based on active guard
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
  workspace_id?: string;
  type: FieldType;
  label: string;
  required?: boolean;
  value?: string;
  default_value?: string;
  section_id?: string;
  snippet_options?: SnippetOption[];
  modifiers?: TextModifier[]; // Transformaciones de texto: upper, lower, title
  is_full_width?: boolean;
}

export interface SectionConfig {
  id: string;
  parent_id?: string;
  label: string;

  is_repeatable: boolean;
  field_ids: string[];
  layout?: string[];
  repeatable_item_label?: string; // This is the `sub` value
  plural_title?: string;
  singular_title?: string;
  condition?: {
    field_id: string;
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=';
    value: string;
    /** 'hide' (default) = oculto hasta cumplirse | 'show' = siempre visible en formulario */
    condition_mode?: 'show' | 'hide';
  };
  statistics_category?: string; // New: Statistics category associated with this section
  original_content?: string; // Used for re-parsing conditional blocks
  full_raw?: string; // The entire raw text of the section including delimiters [ ... ]
  is_separator?: boolean; // True if this section is just a visual separator
  is_mapping?: boolean; // True if this is a mapping conditional [?{Field}] Key=Value [/]
  is_self_contained?: boolean; // True if this is a self-contained section ["Title" {field}]
  has_static_content?: boolean; // True if the section contains non-whitespace static text
  is_virtual?: boolean; // True if this is a virtual section created from {field}*
}


export interface TemplateConfig {
  fields: Record<string, FieldConfig>;
  sections: SectionConfig[];
  layout: string[]; // Order of fields and section IDs
}

export type StatisticOperator = '=' | '!=' | 'filled' | 'empty' | 'not_empty' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'extract_value' | '>' | '<' | '>=' | '<=';

export interface StatisticRuleCondition {
  field_id?: string | null;
  operator?: StatisticOperator | null;
  condition?: string | null;
}

export interface StatisticRule {
  field_id?: string | null; // Primary condition field
  operator?: StatisticOperator | null; // Primary condition operator
  condition?: string | null; // Primary condition value
  category?: string | null;
  categories?: string[] | null;
  conditions?: StatisticRuleCondition[] | null; // Additional secondary conditions (AND)
  or_conditions?: StatisticRuleCondition[] | null; // Additional secondary conditions (OR)
  disable_on_apoyo?: boolean;
}

export interface Template {
  id: string;
  workspace_id: string | null;
  name: string;
  description?: string | null;
  content: string;
  type: 'normal' | 'relevante';
  is_active?: boolean;
  statistics_category?: string | null;
  statistics_sub_categories?: string[] | null;
  statistics_rules?: StatisticRule[] | null;
  disable_main_stat_on_apoyo?: boolean | null;
  disabled_sub_categories_on_apoyo?: string[] | null;
}

export interface ReportDraft {
  id?: string;
  workspace_id: string;
  template_id: string;
  form_data: form_dataRecord;
  lastSaved?: string;
}

export interface Department {
  id: string;
  workspace_id?: string;
  name: string;
  staff: Staff;
  order?: number;
}

export interface Address {
  id: string;
  workspace_id?: string;
  name: string;
  locationType?: string;
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
  id: string; // personnel_id_date
  workspace_id: string;
  personnel_id: string;
  date: string; // YYYY-MM-DD
  guard_id: string; // e.g. "A", "B", "C", "D" or departmentId
  role_name: string;
  timestamp: string; // ISO format
}



