import { DEFAULT_STATISTICS_CATEGORIES } from '@/constants/statistics';
import { findValueInFormData } from '@/lib/report-sorter';
import type { Report, Template } from '@/types';

/**
 * Determines the statistical category for a given report based on its template configuration.
 * Prioritizes Conditional Rules first, then falls back to the Default Category.
 */
export function getReportCategory(report: Report, template?: Template): string | null {
    if (!template) return null;

    // 1. Evaluate Conditional Rules
    if (template.statisticsRules && template.statisticsRules.length > 0) {
        for (const rule of template.statisticsRules) {
            // Get value from report data using the field ID (Label)
            const rawValue = findValueInFormData(report.formData, rule.fieldId);
            const val = String(rawValue || '').trim().toLowerCase();
            const targetVal = rule.value.trim().toLowerCase();

            // Simple "equals" check for now, can extend to "contains" if needed based on rule.condition
            if (val === targetVal) {
                return rule.category.toUpperCase().trim();
            }
        }
    }

    // 2. Fallback to Default Category
    if (template.statisticsCategory) {
        return template.statisticsCategory.toUpperCase().trim();
    }

    return null;
}

/**
 * Structure for the monthly grid: Category -> Day (1-31) -> Count
 */
export type MonthlyStats = Map<string, Map<number, number>>;

/**
 * Aggregates reports into a monthly statistics grid.
 * @param reports The list of all reports (will be filtered by month/year internally or pre-filtered)
 * @param templates List of available templates to resolve categories
 * @param month Month index (0-11)
 * @param year Year (e.g. 2026)
 */
export function calculateMonthlyStats(
    reports: Report[],
    templates: Template[],
    month: number,
    year: number
): MonthlyStats {
    const stats: MonthlyStats = new Map();

    // Initialize all default categories with empty maps
    DEFAULT_STATISTICS_CATEGORIES.forEach(cat => {
        stats.set(cat, new Map());
    });

    reports.forEach(report => {
        if (!report.timestamp) return;

        const date = new Date(report.timestamp);
        if (date.getMonth() !== month || date.getFullYear() !== year) return;

        const day = date.getDate();
        const template = templates.find(t => t.id === report.templateId);
        const category = getReportCategory(report, template);

        if (category) {
            if (!stats.has(category)) {
                stats.set(category, new Map());
            }

            const dayMap = stats.get(category)!;
            dayMap.set(day, (dayMap.get(day) || 0) + 1);
        }
    });

    return stats;
}
