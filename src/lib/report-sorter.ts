import type { Report, FormDataRecord, FormDataValue } from '@/lib/types';

/**
 * Finds a value in the report's formData, checking both top-level and nested section data.
 * Search is case-insensitive, making it resilient to field name variations.
 * 
 * **Search Order**:
 * 1. Top-level fields (e.g., `{Fecha: "27/01/2026"}`)
 * 2. Nested section fields (e.g., `{Detalles: {Hora: "14:00"}}`)
 * 
 * @param formData - The report's formData object  
 * @param keyToFind - The key to search for (case-insensitive, e.g., "Hora")
 * @returns The found value (any type), or null if not present
 * 
 * @example
 * ```typescript
 * const formData = {
 *   Fecha: "27/01/2026",
 *   Detalles: {
 *     Hora: "14:00",
 *     Lugar: "Oficina Principal"
 *   }
 * };
 * 
 * findValueInFormData(formData, 'Fecha');  // "27/01/2026"
 * findValueInFormData(formData, 'hora');   // "14:00" (case-insensitive)
 * findValueInFormData(formData, 'Lugar'); // "Oficina Principal" (nested)
 * findValueInFormData(formData, 'Missing'); // null
 * ```
 * 
 * @remarks
 * - Case-insensitive matching (`Hora` matches `hora`, `HORA`, etc.)
 * - Searches top-level first, then one level deep
 * - Does not search inside arrays (repeatable sections)
 * - Returns first match found
 */
export const findValueInFormData = (
  formData: FormDataRecord | undefined,
  keyToFind: string
): FormDataValue | null => {
  if (!formData) return null;

  const lowerKeyToFind = keyToFind.toLowerCase();

  // Check top-level fields first
  for (const key in formData) {
    if (key.toLowerCase() === lowerKeyToFind) {
      return formData[key];
    }
  }

  // Check nested section objects. A section object's keys are the section IDs.
  for (const key in formData) {
    const value = formData[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Now check the fields within that section object
      const sectionRecord = value as Record<string, FormDataValue>;
      for (const nestedKey in sectionRecord) {
        if (nestedKey.toLowerCase() === lowerKeyToFind) {
          return sectionRecord[nestedKey];
        }
      }
    }
  }

  return null;
};

/**
 * Exports the date and time from a report's formData and returns a Date object.
 * @param report The report object.
 * @returns A Date object representing the report's timestamp, or null if not found/invalid.
 */
export const getReportDateTime = (report: Report): Date | null => {
  const fechaString = findValueInFormData(report.formData, 'Fecha') as string | undefined;
  const horaString = findValueInFormData(report.formData, 'Hora') as string | undefined;

  if (typeof fechaString !== 'string' || typeof horaString !== 'string') {
    return null;
  }

  const timeMatch = horaString.match(/(\d{2}):(\d{2})/);
  if (!timeMatch) {
    return null;
  }

  const h = timeMatch[1];
  const m = timeMatch[2];

  if (h === undefined || m === undefined) {
    return null;
  }

  const hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);

  if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  // Support both YYYY-MM-DD and DD/MM/YYYY
  let date: Date;
  if (fechaString.includes('/')) {
    const parts = fechaString.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY -> YYYY-MM-DD
      date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
    } else {
      date = new Date(`${fechaString}T00:00:00`);
    }
  } else {
    date = new Date(`${fechaString}T00:00:00`);
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  date.setHours(hours, minutes);
  return date;
};

/**
 * Sorts reports chronologically by date and time extracted from formData.
 * 
 * **Sorting Logic**:
 * 1. Uses 'Fecha' and 'Hora' fields from report.formData
 * 2. Reports with valid date/time are sorted chronologically
 * 3. Reports without date/time are placed at the end
 * 4. Final fallback: sorts by report ID (creation timestamp)
 * 
 * @param reports - Array of reports to sort
 * @param direction - Sort direction: 'asc' for chronological, 'desc' for reverse (default: 'asc')
 * @returns New sorted array (original array is not mutated)
 * 
 * @example
 * ```typescript
 * const reports = [
 *   { id: '3', formData: { Fecha: '27/01/2026', Hora: '14:00' } },
 *   { id: '1', formData: { Fecha: '27/01/2026', Hora: '09:30' } },
 *   { id: '2', formData: { Fecha: '26/01/2026', Hora: '18:00' } }
 * ];
 * 
 * const sorted = sortReports(reports); // Chronological
 * // [
 * //   { id: '2', ... },  // 26/01 18:00
 * //   { id: '1', ... },  // 27/01 09:30
 * //   { id: '3', ... }   // 27/01 14:00
 * // ]
 * 
 * const reversed = sortReports(reports, 'desc'); // Reverse chronological
 * ```
 * 
 * @remarks
 * - Creates a new array (does not mutate input)
 * - Date formats supported: DD/MM/YYYY, YYYY-MM-DD
 * - Time format: HH:MM (24-hour)
 * - Invalid dates sorted after valid ones
 * - Stable sort (preserves relative order for equal elements)
 */
export function sortReports<T extends Report>(
  reports: T[],
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...reports].sort((a, b) => {
    const dateTimeA = getReportDateTime(a);
    const dateTimeB = getReportDateTime(b);
    const directionMultiplier = direction === 'asc' ? 1 : -1;

    // If both have valid dates, compare them
    if (dateTimeA && dateTimeB) {
      const timeDiff = dateTimeA.getTime() - dateTimeB.getTime();
      if (timeDiff !== 0) {
        return timeDiff * directionMultiplier;
      }
      // If times are equal, fall through to ID sort
    }

    // If only one is valid, it comes first (in asc mode)
    if (dateTimeA && !dateTimeB) return -1 * directionMultiplier;
    if (!dateTimeA && dateTimeB) return 1 * directionMultiplier;

    // Both are null/invalid OR times are equal: fallback to numeric ID comparison
    const idA = parseInt(a.id.replace(/[^0-9]/g, ''), 10);
    const idB = parseInt(b.id.replace(/[^0-9]/g, ''), 10);

    if (isNaN(idA) || isNaN(idB)) return 0;

    return (idA - idB) * directionMultiplier;
  });
}
