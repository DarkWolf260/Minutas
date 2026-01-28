/**
 * Validation schemas for personnel management
 * Using Zod for runtime type-safe validation
 */

import { z } from 'zod';
import { PERSONNEL_STATUS } from '@/constants/personnel';
import { ATTENDANCE_STATUS } from '@/constants/attendance';

export const PERSONNEL_VALIDATION = {
  MAX_NAME_LENGTH: 100,
  MAX_NOTE_LENGTH: 500,
} as const;

// Cedula validation regex (Venezuelan ID format)
const cedulaRegex = /^[VE]-?\d{6,8}$/i;

/**
 * Personnel/Staff Member validation schema
 */
export const PersonnelSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(PERSONNEL_VALIDATION.MAX_NAME_LENGTH, 'El nombre es demasiado largo')
    .trim(),
  cedula: z
    .string()
    .regex(cedulaRegex, 'Formato de cédula inválido (ej: V-12345678)')
    .optional()
    .or(z.literal('')),
  rank: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  status: z
    .enum(
      [
        PERSONNEL_STATUS.ACTIVO,
        PERSONNEL_STATUS.VACACIONES,
        PERSONNEL_STATUS.PERMISO,
        PERSONNEL_STATUS.REPOSO,
        PERSONNEL_STATUS.APOYO,
      ],
      {
        errorMap: () => ({ message: 'Estado inválido' }),
      }
    )
    .optional(),
});

export type PersonnelFormData = z.infer<typeof PersonnelSchema>;

/**
 * Guard validation schema
 */
export const GuardSchema = z.object({
  id: z
    .string()
    .min(1, 'El identificador es obligatorio')
    .max(10, 'El identificador es demasiado largo')
    .trim(),
});

export type GuardFormData = z.infer<typeof GuardSchema>;

/**
 * Attendance record validation schema
 */
export const AttendanceSchema = z.object({
  memberId: z.string().min(1, 'ID de miembro requerido'),
  status: z.enum(
    [
      ATTENDANCE_STATUS.PRESENTE,
      ATTENDANCE_STATUS.TARDE,
      ATTENDANCE_STATUS.PERMISO,
      ATTENDANCE_STATUS.AUSENTE,
    ],
    {
      errorMap: () => ({ message: 'Estado de asistencia inválido' }),
    }
  ),
  checkInTime: z.string().optional(),
  note: z
    .string()
    .max(PERSONNEL_VALIDATION.MAX_NOTE_LENGTH, 'La nota es demasiado larga')
    .optional(),
});

export type AttendanceFormData = z.infer<typeof AttendanceSchema>;

/**
 * CSV Import Row validation (for bulk personnel import)
 */
export const CSVPersonnelRowSchema = z.object({
  rank: z.string().optional(),
  name: z.string().min(1, 'Nombre requerido'),
  cedula: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
});

export type CSVPersonnelRow = z.infer<typeof CSVPersonnelRowSchema>;

/**
 * Helper function to format Zod errors for user display
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0];
  return firstError?.message || 'Datos inválidos';
}

/**
 * Helper function to validate and return typed data or error
 */
export function validatePersonnel(
  data: unknown
): { success: true; data: PersonnelFormData } | { success: false; error: string } {
  const result = PersonnelSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: formatZodError(result.error) };
}

export function validateGuard(
  data: unknown
): { success: true; data: GuardFormData } | { success: false; error: string } {
  const result = GuardSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: formatZodError(result.error) };
}
