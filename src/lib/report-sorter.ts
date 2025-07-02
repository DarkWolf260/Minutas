
import type { Report } from '@/types';

/**
 * Extracts the time from a report's 'Hora' field in formData.
 * The time is returned as total minutes from midnight (0 to 1439).
 * @param report The report object.
 * @returns Total minutes from midnight, or null if not found/invalid.
 */
const getReportTimeInMinutes = (report: Report): number | null => {
    const horaString = report.formData?.['Hora'];
    if (typeof horaString !== 'string') {
        return null;
    }

    // Extracts the first HH:MM from the string
    const timeMatch = horaString.match(/(\d{2}):(\d{2})/);
    if (!timeMatch) {
        return null;
    }

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) {
        return null;
    }

    return hours * 60 + minutes;
}


/**
 * Sorts reports chronologically.
 * It primarily uses the 'Hora' field from the report's formData.
 * Reports without a valid time are placed after those with a time.
 * As a final fallback, it sorts by the report's creation timestamp (from its ID).
 * @param reports The array of reports to sort.
 * @param direction 'asc' for chronological, 'desc' for reverse chronological.
 * @returns A new, sorted array of reports.
 */
export function sortReports<T extends Report>(reports: T[], direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...reports].sort((a, b) => {
        const timeA = getReportTimeInMinutes(a);
        const timeB = getReportTimeInMinutes(b);
        const directionMultiplier = direction === 'asc' ? 1 : -1;

        // Both reports have a valid time
        if (timeA !== null && timeB !== null) {
            if (timeA !== timeB) {
                return (timeA - timeB) * directionMultiplier;
            }
            // If times are the same, fall through to ID sort
        }

        // One report has a time, the other doesn't
        if (timeA !== null && timeB === null) {
            return -1; // a comes first
        }
        if (timeA === null && timeB !== null) {
            return 1; // b comes first
        }

        // Neither has a valid time, or times are identical. Fallback to ID.
        const idA = parseInt(a.id.replace(/[^0-9]/g, ''), 10);
        const idB = parseInt(b.id.replace(/[^0-9]/g, ''), 10);

        if (isNaN(idA) || isNaN(idB)) return 0;
        
        return (idA - idB) * directionMultiplier;
    });
}
