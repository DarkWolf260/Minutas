/**
 * Zod Validation Schemas for Minutas Project
 * 
 * This file contains all the Zod schemas for validating data throughout the application.
 * Schemas match the TypeScript interfaces defined in src/types/index.ts
 */

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for validating StaffMember / Personnel
 */
export const StaffMemberSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    personnelId: z.string().min(1, 'ID de personal es requerido'),
    name: z.string().min(1, 'Nombre es requerido').max(200, 'Nombre muy largo'),
    cedula: z
        .string()
        .regex(/^\d{1,2}-\d{4}-\d{4}$/, 'Formato de cédula inválido (Ej: 1-1234-5678)')
        .optional(),
    rank: z.string().optional(),
    unit: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
    isActive: z.boolean().default(true),
    notes: z.string().optional(),
});

export type ValidatedStaffMember = z.infer<typeof StaffMemberSchema>;

/**
 * Schema for Template
 */
export const TemplateSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
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
    templateId: z.string().min(1, 'ID de plantilla es requerido'),
    title: z.string().min(1, 'Título es requerido').max(500, 'Título muy largo'),
    timestamp: z.string().datetime('Formato de fecha/hora inválido'),
    content: z.string().min(1, 'Contenido es requerido'),
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
 */
export const DepartmentSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
    code: z.string().max(20, 'Código muy largo').optional(),
    description: z.string().max(500, 'Descripción muy larga').optional(),
});

export type ValidatedDepartment = z.infer<typeof DepartmentSchema>;

/**
 * Schema for Guard
 */
export const GuardSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    name: z.string().min(1, 'Nombre de guardia es requerido').max(100, 'Nombre muy largo'),
    description: z.string().max(500, 'Descripción muy larga').optional(),
    staff: z.array(StaffMemberSchema).default([]),
    schedule: z
        .object({
            start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
            end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
        })
        .optional(),
});

export type ValidatedGuard = z.infer<typeof GuardSchema>;

/**
 * Schema for Address
 */
export const AddressSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    name: z.string().min(1, 'Nombre de dirección es requerido').max(200, 'Nombre muy largo'),
    fullAddress: z.string().min(1, 'Dirección completa es requerida').max(500, 'Dirección muy larga'),
    coordinates: z
        .object({
            lat: z.number().min(-90).max(90, 'Latitud debe estar entre -90 y 90'),
            lng: z.number().min(-180).max(180, 'Longitud debe estar entre -180 y 180'),
        })
        .optional(),
    category: z.string().max(50, 'Categoría muy larga').optional(),
    notes: z.string().max(1000, 'Notas muy largas').optional(),
});

export type ValidatedAddress = z.infer<typeof AddressSchema>;

/**
 * Schema for AttendanceRecord
 */
export const AttendanceRecordSchema = z.object({
    id: z.string().min(1, 'ID es requerido'),
    personnelId: z.string().min(1, 'ID de personal es requerido'),
    guardId: z.string().optional(),
    date: z.string().date('Formato de fecha inválido (YYYY-MM-DD)'),
    status: z.enum(['present', 'absent', 'late', 'excused', 'on-leave'], {
        errorMap: () => ({ message: 'Estado de asistencia inválido' }),
    }),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    notes: z.string().max(500, 'Notas muy largas').optional(),
});

export type ValidatedAttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

/**
 * Schema for AppSettings
 */
export const AppSettingsSchema = z.object({
    id: z.literal('app-settings'),
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    language: z.enum(['es', 'en']).default('es'),
    autoSaveDrafts: z.boolean().default(true),
    defaultTemplate: z.string().uuid().optional(),
    notifications: z
        .object({
            enabled: z.boolean().default(true),
            sound: z.boolean().default(false),
        })
        .optional(),
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
    'number',
]);

export const FieldConfigSchema = z.object({
    type: FieldTypeSchema,
    label: z.string().optional(),
    required: z.boolean().default(false),
    fullWidth: z.boolean().default(false),
    placeholder: z.string().optional(),
    defaultValue: z.string().optional(),
    options: z
        .array(
            z.object({
                label: z.string(),
                value: z.string(),
            })
        )
        .optional(),
    validation: z
        .object({
            min: z.number().optional(),
            max: z.number().optional(),
            pattern: z.string().optional(),
        })
        .optional(),
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
function createFieldZodSchema(fieldId: string, config: any) {
    let fieldSchema: z.ZodTypeAny;

    const lowerId = (fieldId || '').toLowerCase();
    const type = config.type || 'text';

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
            fieldSchema = z.array(z.string());
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

    // Apply required if flag is set
    if (config.required) {
        if (config.type === 'multi-text') {
            fieldSchema = (fieldSchema as z.ZodArray<any>).min(1, `El campo "${config.label || fieldId}" es requerido`);
        } else {
            fieldSchema = (fieldSchema as z.ZodString).min(1, `El campo "${config.label || fieldId}" es requerido`);
        }
    } else {
        // If not required, allow optional/empty
        if (config.type !== 'multi-text') {
            fieldSchema = fieldSchema.optional().or(z.literal(''));
        } else {
            fieldSchema = fieldSchema.optional();
        }
    }

    return fieldSchema;
}

/**
 * Generates a dynamic Zod schema for report form data based on template configuration.
 * Handles top-level fields, nested sections, and repeatable blocks.
 */
export function generateFormDataSchema(config: { fields: Record<string, any>; sections?: any[]; layout?: string[] }) {
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

        const sectionSchema = z.object(sectionShape).passthrough();
        if (section.isRepeatable) {
            shape[section.id] = z.array(sectionSchema);
        } else {
            shape[section.id] = sectionSchema;
        }
    });

    return z.object(shape).passthrough();
}
