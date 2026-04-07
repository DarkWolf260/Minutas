/**
 * Zod Validation Schemas for Minutas Project
 *
 * This file contains all the Zod schemas for validating data throughout the application.
 * Schemas match the TypeScript interfaces defined in src/types/index.ts
 */

import { z } from 'zod';
import type { FieldConfig, SectionConfig } from '@/lib/types';
import { PERSONNEL_STATUS } from '@/lib/constants/personnel';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for validating StaffMember / Personnel
 * Matches: types/index.ts → StaffMember
 */
export const StaffMemberSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    workspaceId: z.string().min(1, 'Workspace ID es requerido'),
    personnelId: z.string().optional(),
    name: z.string().min(1, 'Nombre es requerido').max(200, 'Nombre muy largo'),
    cedula: z.string().optional(),
    rank: z.string().optional(),
    roleId: z.string().optional(),
    status: z.enum(
        [
            PERSONNEL_STATUS.ACTIVO,
            PERSONNEL_STATUS.VACACIONES,
            PERSONNEL_STATUS.PERMISO,
            PERSONNEL_STATUS.REPOSO,
            PERSONNEL_STATUS.AUSENTE,
        ],
        { errorMap: () => ({ message: 'Estado de personal inválido' }) }
    ).optional(),
    department: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    observation: z.string().optional(),
    titulo: z.string().optional(),
    cargo: z.string().optional(),
});

export type ValidatedStaffMember = z.infer<typeof StaffMemberSchema>;

/**
 * Schema for Template
 */
export const TemplateSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    workspaceId: z.string().min(1, 'Workspace ID es requerido'),
    name: z.string().min(1, 'Nombre de plantilla es requerido').max(200, 'Nombre muy largo'),
    content: z.string().min(1, 'Contenido de plantilla es requerido'),
    type: z.enum(['normal', 'relevante'], {
        errorMap: () => ({ message: 'Tipo debe ser "normal" o "relevante"' }),
    }),
    isActive: z.boolean().default(true),
    statisticsCategory: z.string().optional(),
    statisticsRules: z
        .array(
            z.object({
                fieldId: z.string(), // ID del campo (ej: "{Tipo}")
                condition: z.string(), // Condición (ej: "Robo")
                category: z.string(), // Categoría de estadística
            })
        )
        .optional(),
});

export type ValidatedTemplate = z.infer<typeof TemplateSchema>;

/**
 * Schema for Report
 */
export const ReportSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    workspaceId: z.string().min(1, 'Workspace ID es requerido'),
    templateId: z.string().min(1, 'ID de plantilla es requerido'),
    title: z.string().min(1, 'Título es requerido').max(500, 'Título muy largo'),
    timestamp: z.string().datetime('Formato de fecha/hora inválido'),
    content: z.string(),
    isRelevant: z.boolean(),
    status: z.enum(['En proceso', 'Finalizado']).optional(),
    formData: z.record(z.unknown()).optional(), // Will be validated dynamically based on template
    sections: z
        .array(
            z.object({
                title: z.string(),
                content: z.string(),
                fields: z.record(z.unknown()),
            })
        )
        .optional(),
});

export type ValidatedReport = z.infer<typeof ReportSchema>;

/**
 * Schema for Department
 * Matches: types/index.ts → Department
 */
export const DepartmentSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    workspaceId: z.string().min(1, 'Workspace ID es requerido'),
    name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
    staff: z.record(z.array(StaffMemberSchema)).default({}),
});

export type ValidatedDepartment = z.infer<typeof DepartmentSchema>;

/**
 * Schema for Guard
 * Matches: types/index.ts → Guard
 */
export const GuardSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    workspaceId: z.string().min(1, 'Workspace ID es requerido'),
    staff: z.record(z.array(StaffMemberSchema)).default({}),
});

export type ValidatedGuard = z.infer<typeof GuardSchema>;

/**
 * Schema for Address
 * Matches: types/index.ts → Address
 */
export const AddressSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    workspaceId: z.string().min(1, 'Workspace ID es requerido'),
    name: z.string().min(1, 'Nombre de dirección es requerido').max(200, 'Nombre muy largo'),
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    municipality: z.string().min(1, 'Municipio es requerido'),
    parish: z.string().min(1, 'Parroquia es requerida'),
    sector: z.string().optional(),
    peaceQuadrant: z.string().min(1, 'Cuadrante de paz es requerido'),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    details: z.string().optional(),
});

export type ValidatedAddress = z.infer<typeof AddressSchema>;

/**
 * Schema for AppSettings
 * Matches: types/index.ts → AppSettings
 */
export const AppSettingsSchema = z.object({
    id: z.string().optional(),
    workspaceId: z.string().optional(),
    activeGuardId: z.string().optional(),
    guardShiftDuration: z.number().optional(),
    finalReportStaffSnapshot: z.record(z.array(StaffMemberSchema)).optional(),
    finalReportStartDate: z.string().optional(),
    finalReportEndDate: z.string().optional(),
    reportaRoleIds: z.array(z.string()).optional(),
});

export type ValidatedAppSettings = z.infer<typeof AppSettingsSchema>;

// ============================================================================
// FIELD CONFIG SCHEMAS
// ============================================================================

export const FieldTypeSchema = z.enum([
    'text',
    'textarea',
    'date',
    'time-hlv',
    'predefined',
    'multi-text',
    'dropdown',
    'semantic',
]);

const SnippetOptionSchema = z.object({
    id: z.string(),
    label: z.string(),
    value: z.string(),
});

export const FieldConfigSchema = z.object({
    type: FieldTypeSchema,
    label: z.string(),
    required: z.boolean().optional(),
    value: z.string().optional(),
    sectionId: z.string().optional(),
    targetField: z.string().optional(),
    snippetOptions: z.array(SnippetOptionSchema).optional(),
    modifiers: z.array(z.enum(['upper', 'lower', 'title'])).optional(),
    isFullWidth: z.boolean().optional(),
});

export type ValidatedFieldConfig = z.infer<typeof FieldConfigSchema>;

// ============================================================================
// HELPER VALIDATORS
// ============================================================================

/**
 * Validate a partial update (all fields optional)
 */
export function createPartialSchema<T extends z.ZodObject<any>>(schema: T) {
    return schema.partial();
}

/**
 * Validate an array of items
 */
export function createArraySchema<T extends z.ZodType>(schema: T) {
    return z.array(schema);
}

/**
 * Custom validator for cedula format
 */
export const cedulaValidator = z
    .string()
    .regex(/^[VE]-\d{1,2}(\.\d{3}){2}$/, 'Formato de cédula inválido (Ej: V-12.345.678)');

/**
 * Custom validator for time in HH:MM format
 */
export const timeValidator = z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)');

/**
 * Custom validator for date in YYYY-MM-DD format
 */
export const dateValidator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)');

/**
 * Generates a dynamic Zod schema for report form data based on template configuration
 */
/**
 * Helper to create a Zod schema for a single field
 */
function createFieldZodSchema(fieldId: string, config: FieldConfig) {
    let fieldSchema: z.ZodTypeAny;

    const lowerId = (fieldId || '').toLowerCase();
    const type: string = config.type || 'text';

    // Prioritize explicit type first
    switch (type) {
        case 'number':
            fieldSchema = z.union([
                z.number(),
                z.string().regex(/^\d*$/, 'Debe ser un número').transform((v) => (v === '' ? undefined : Number(v))),
            ]);
            break;
        case 'date':
            fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$|^$/, 'Formato de fecha inválido');
            break;
        case 'time-hlv':
            fieldSchema = z.string().regex(/^$|^[\d-]{2}:[\d-]{2} HLV( - [\d-]{2}:[\d-]{2} HLV)?$/, 'Formato de hora inválido');
            break;
        case 'multi-text':
            fieldSchema = z.array(z.any());
            break;
        default:
            // Generic text or custom types - apply smart defaults based on name
            if (lowerId === 'cédula' || lowerId === 'cedula') {
                fieldSchema = z.string().regex(/^$|^[VE]-[\d.]{3,12}$/, 'Formato de cédula inválido');
            } else if (lowerId === 'hora') {
                fieldSchema = z.string().regex(/^$|^[\d-]{2}:[\d-]{2} HLV( - [\d-]{2}:[\d-]{2} HLV)?$/, 'Formato de hora inválido');
            } else {
                fieldSchema = z.any();
            }
    }

    // For dynamic schema, we must be extremely permissive because fields might be 
    // conditionally hidden or contain complex rehydrated objects (like StaffMember).
    fieldSchema = (fieldSchema || z.any()).nullable().optional();

    return fieldSchema;
}

/**
 * Generates a dynamic Zod schema for report form data based on template configuration.
 * Handles top-level fields, nested sections, and repeatable blocks.
 */
export function generateFormDataSchema(config: { fields: Record<string, FieldConfig>; sections?: SectionConfig[]; layout?: string[] }) {
    const shape: Record<string, z.ZodTypeAny> = {};
    const fields = config.fields;
    const sections = config.sections || [];
    const layout = config.layout || [];

    // 1. Identify nested fields to avoid adding them at root
    const nestedFieldIds = new Set<string>();
    sections.forEach(s => {
        if (s.fieldIds) {
            s.fieldIds.forEach((id: string) => nestedFieldIds.add(id));
        }
    });

    // 2. Add top-level fields (in layout but not in any section)
    layout.forEach(id => {
        if (!id.startsWith('section_') && !id.startsWith('sec_') && !id.startsWith('cond_') && !nestedFieldIds.has(id)) {
            const fieldConfig = fields[id];
            if (fieldConfig) {
                shape[id] = createFieldZodSchema(id, fieldConfig);
            }
        }
    });

    // 3. Add sections
    sections.forEach(section => {
        const sectionShape: Record<string, z.ZodTypeAny> = {};
        if (section.fieldIds) {
            section.fieldIds.forEach((fieldId: string) => {
                const fieldConfig = fields[fieldId];
                if (fieldConfig) {
                    sectionShape[fieldId] = createFieldZodSchema(fieldId, fieldConfig);
                }
            });
        }

        const sectionSchema = z.object(sectionShape).passthrough().nullable().optional();

        if (section.isRepeatable) {
            shape[section.id] = z.array(sectionSchema.unwrap ? sectionSchema.unwrap().unwrap() : sectionSchema as any).nullable().optional();
            // Simplified for RxDB compatibility:
            shape[section.id] = z.array(z.any()).nullable().optional();
        } else {
            shape[section.id] = sectionSchema;
        }
    });

    return z.object(shape).passthrough();
}
