import { DEFAULT_STATISTICS_CATEGORIES } from '@/constants/statistics';
import { findValueInFormData } from '@/lib/report-sorter';
import type { Report, Template, TemplateConfig } from '@/types';

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
    configs: Record<string, TemplateConfig>,
    month: number,
    year: number
): MonthlyStats {
    const stats: MonthlyStats = new Map();

    // Initialize all default categories with empty maps
    DEFAULT_STATISTICS_CATEGORIES.forEach(cat => {
        stats.set(cat, new Map());
    });

    const parseDateSafe = (ts: string) => {
        if (!ts) return new Date(NaN);
        // Try native first
        let d = new Date(ts);
        if (!isNaN(d.getTime())) return d;

        // Try DD/MM/YYYY HH:MM (ES-VE style)
        const match = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{1,2}))?/);
        if (match) {
            const [_, day, month, year, hours, mins] = match;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours || '0'), parseInt(mins || '0'));
        }
        return new Date(NaN);
    };

    reports.forEach(report => {
        if (!report.timestamp) return;

        // Solo considerar reportes finalizados
        if (report.status !== 'Finalizado') return;

        const date = parseDateSafe(report.timestamp);
        if (isNaN(date.getTime())) return;

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

        // 3. Process Section-level Statistics
        const config = configs[report.templateId];
        if (config && config.sections) {
            config.sections.forEach((section, index) => {
                const rawCat = section.statisticsCategory;
                if (rawCat) {
                    // Normalize to match DEFAULT_STATISTICS_CATEGORIES (Code Label)
                    let cat = rawCat.trim().toUpperCase();

                    // Always try to find the standard key in DEFAULT_STATISTICS_CATEGORIES 
                    // to ensure it matches what the table expects exactly.
                    const standardKey = DEFAULT_STATISTICS_CATEGORIES.find(dk => {
                        const sdk = dk.toUpperCase();
                        // 1. Exact match
                        if (sdk === cat) return true;

                        // 2. Ignore dashes and extra spaces
                        const normalize = (s: string) => s.replace(/[-\s]/g, '').trim();
                        if (normalize(sdk) === normalize(cat)) return true;

                        // 3. Check if the code parts match (assuming "X.Y" format)
                        const codeMatch = cat.match(/^(\d+(\.\d+)*)/);
                        if (codeMatch && sdk.startsWith(codeMatch[1])) {
                            // If codes match, check if label is also present
                            const labelPart = cat.substring(codeMatch[0].length).replace(/[^A-Z]/g, '');
                            const sLabelPart = sdk.substring(sdk.match(/^(\d+(\.\d+)*)/)?.[0].length || 0).replace(/[^A-Z]/g, '');
                            if (labelPart && sLabelPart && (sLabelPart.includes(labelPart) || labelPart.includes(sLabelPart))) return true;
                        }

                        return false;
                    });

                    if (standardKey) {
                        cat = standardKey.toUpperCase();
                    }

                    if (!stats.has(cat)) {
                        stats.set(cat, new Map());
                    }
                    const dayMap = stats.get(cat)!;

                    // Lookup data with multiple fallbacks for maximum backward/transition compatibility
                    const sectionData = report.formData?.[section.id] ||
                        report.formData?.[`section_${index}`] ||
                        report.formData?.[`${section.id}_1`] ||
                        report.formData?.[`${section.id}_2`] ||
                        (() => {
                            if (!report.formData) return undefined;
                            const keys = Object.keys(report.formData);
                            const foundKey = keys.find(k => k.startsWith(section.id + '_'));
                            return foundKey ? report.formData[foundKey] : undefined;
                        })();

                    // If repeatable, count the number of items
                    if (section.isRepeatable) {
                        const items = sectionData;
                        if (Array.isArray(items) && items.length > 0) {
                            dayMap.set(day, (dayMap.get(day) || 0) + items.length);
                        }
                    } else {
                        // If not repeatable, count 1 if the section has data
                        if (sectionData && (Array.isArray(sectionData) ? sectionData.length > 0 : Object.keys(sectionData).length > 0)) {
                            dayMap.set(day, (dayMap.get(day) || 0) + 1);
                        }
                    }
                }
            });
        }
    });

    return stats;
}
