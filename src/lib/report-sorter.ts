
import type { Report } from '@/types';


/**
 * Finds a value in the report's formData, checking both top-level and nested section data.
 * The search is case-insensitive.
 * @param formData The report's formData object.
 * @param keyToFind The key to search for (e.g., "Hora").
 * @returns The found value, or null if not present.
 */
export const findValueInFormData = (formData: Record<string, any> | undefined, keyToFind: string): any | null => {
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
            for (const nestedKey in value) {
                if (nestedKey.toLowerCase() === lowerKeyToFind) {
                    return value[nestedKey];
                }
            }
        }
    }

    return null;
};


/**
 * Extracts the date and time from a report's formData and returns a Date object.
 * @param report The report object.
 * @returns A Date object representing the report's timestamp, or null if not found/invalid.
 */
const getReportDateTime = (report: Report): Date | null => {
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

    // `fechaString` is 'YYYY-MM-DD'. Appending 'T00:00:00' ensures it's parsed in the local timezone.
    const date = new Date(`${fechaString}T00:00:00`);
    if (isNaN(date.getTime())) {
        return null;
    }

    date.setHours(hours, minutes);
    return date;
}


/**
 * Sorts reports chronologically by date and then by time.
 * It uses 'Fecha' and 'Hora' fields from the report's formData.
 * Reports without a valid date/time are placed after those with one.
 * As a final fallback, it sorts by the report's creation timestamp (from its ID).
 * @param reports The array of reports to sort.
 * @param direction 'asc' for chronological, 'desc' for reverse chronological.
 * @returns A new, sorted array of reports.
 */
export function sortReports<T extends Report>(reports: T[], direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...reports].sort((a, b) => {
        const dateTimeA = getReportDateTime(a);
        const dateTimeB = getReportDateTime(b);
        const directionMultiplier = direction === 'asc' ? 1 : -1;

        // Both reports have a valid date and time
        if (dateTimeA && dateTimeB) {
            if (dateTimeA.getTime() !== dateTimeB.getTime()) {
                return (dateTimeA.getTime() - dateTimeB.getTime()) * directionMultiplier;
            }
            // If date/times are the same, fall through to ID sort
        }

        // One report has a date/time, the other doesn't
        if (dateTimeA && !dateTimeB) {
            return -1; // a comes first
        }
        if (!dateTimeA && dateTimeB) {
            return 1; // b comes first
        }

        // Neither has a valid date/time, or they are identical. Fallback to ID.
        const idA = parseInt(a.id.replace(/[^0-9]/g, ''), 10);
        const idB = parseInt(b.id.replace(/[^0-9]/g, ''), 10);

        if (isNaN(idA) || isNaN(idB)) return 0;

        return (idA - idB) * directionMultiplier;
    });
}
