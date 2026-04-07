import { DEFAULT_STATISTICS_CATEGORIES } from '@/lib/constants/statistics';
import { findValueInFormData } from '@/lib/report-sorter';
import type { Report, Template, TemplateConfig } from '@/lib/types';

/**
 * Determines the statistical category for a given report based on its template configuration.
 * 
 * **Priority Order**:
 * 1. Conditional Rules (if field values match)
 * 2. Default Category (template.statisticsCategory)
 * 3. null (if no category defined)
 * 
 * @param report - The report to categorize
 * @param template - The template associated with the report
 * @returns The statistical category string (uppercase, trimmed) or null if no category applies
 * 
 * @example
 * ```typescript
 * // With conditional rule
 * const template = {
 *   statisticsCategory: '1.0 DEFAULT',
 *   statisticsRules: [
 *     { fieldId: 'Tipo', condition: 'robo', category: '1.3 ROBOS' }
 *   ]
 * };
 * const report = { formData: { Tipo: 'robo' } };
 * getReportCategory(report, template); // "1.3 ROBOS"
 * 
 * // Fallback to default
 * const report2 = { formData: { Tipo: 'accidente' } };
 * getReportCategory(report2, template); // "1.0 DEFAULT"
 * ```
 * 
 * @remarks
 * - Field matching is case-insensitive and whitespace-trimmed
 * - Returns normalized category (uppercase, trimmed)
 * - First matching rule wins (rules order matters)
 */
export function getReportCategory(report: Report, template?: Template): string | null {
  if (!template) return null;

  // 1. Evaluate Conditional Rules
  if (template.statisticsRules && template.statisticsRules.length > 0) {
    for (const rule of template.statisticsRules) {
      // Get value from report data using the field ID (Label)
      const rawValue = findValueInFormData(report.formData, rule.fieldId);
      const val = String(rawValue || '')
        .trim()
        .toLowerCase();
      const targetVal = rule.condition.trim().toLowerCase();

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
 * Structure for the monthly grid: Category → Day (1-31) → Count
 * 
 * @example
 * ```typescript
 * const stats: MonthlyStats = new Map();
 * stats.set('1.3 ROBOS', new Map([[15, 3], [16, 1]])); // 3 robberies on day 15, 1 on day 16
 * ```
 */
export type MonthlyStats = Map<string, Map<number, number>>;

/**
 * Aggregates reports into a monthly statistics grid, counting occurrences by day and category.
 * 
 * **Processing Steps**:
 * 1. Filters reports by specified month/year
 * 2. Only counts reports with status "Finalizado"
 * 3. Categorizes each report using template rules
 * 4. Handles repeatable sections (counts array items)
 * 5. Returns Map of categories → days → counts
 * 
 * @param reports - All reports to process (will be filtered by month/year)
 * @param templates - Available templates for category resolution
 * @param configs - Template configurations for section handling
 * @param month - Month index (0-11, where 0=January, 11=December)
 * @param year - Full year (e.g., 2026)
 * @returns Map of statistical categories to daily counts
 * 
 * @example
 * ```typescript
 * const stats = calculateMonthlyStats(allReports, templates, configs, 0, 2026);
 * 
 * // Get count for specific category and day
 * const robberyCount = stats.get('1.3 ROBOS')?.get(15) ?? 0;
 * 
 * // Iterate over all categories
 * stats.forEach((dailyCounts, category) => {
 *   console.log(`${category}:`, Array.from(dailyCounts.values()).reduce((a, b) => a + b, 0));
 * });
 * ```
 * 
 * @remarks
 * - Supports both ISO timestamps and DD/MM/YYYY format
 * - Repeatable sections count each array item separately
 * - Non-repeatable sections count as 1 if present
 * - Empty sections are not counted
 * - Invalid timestamps are skipped
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
  DEFAULT_STATISTICS_CATEGORIES.forEach((cat) => {
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
      const dStr = match[1];
      const mStr = match[2];
      const yStr = match[3];
      const hStr = match[4];
      const minStr = match[5];

      if (dStr && mStr && yStr) {
        return new Date(
          parseInt(yStr),
          parseInt(mStr) - 1,
          parseInt(dStr),
          parseInt(hStr || '0'),
          parseInt(minStr || '0')
        );
      }
    }
    return new Date(NaN);
  };

  reports.forEach((report) => {
    if (!report.timestamp) return;

    // Solo considerar reportes finalizados
    if (report.status !== 'Finalizado') return;

    const date = parseDateSafe(report.timestamp);
    if (isNaN(date.getTime())) return;

    if (date.getMonth() !== month || date.getFullYear() !== year) return;

    const day = date.getDate();
    const template = templates.find((t) => t.id === report.templateId);
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
          const standardKey = DEFAULT_STATISTICS_CATEGORIES.find((dk) => {
            const sdk = dk.toUpperCase();
            // 1. Exact match
            if (sdk === cat) return true;

            // 2. Ignore dashes and extra spaces
            const normalize = (s: string) => s.replace(/[-\s]/g, '').trim();
            if (normalize(sdk) === normalize(cat)) return true;

            // 3. Check if the code parts match (assuming "X.Y" format)
            const codeMatch = cat.match(/^(\d+(\.\d+)*)/);
            const catCode = codeMatch?.[1];
            if (codeMatch && catCode && sdk.startsWith(catCode)) {
              // If codes match, check if label is also present
              const labelPart = cat.substring(codeMatch[0].length).replace(/[^A-Z]/g, '');
              const sdkMatch = sdk.match(/^(\d+(\.\d+)*)/);
              const sLabelPart = sdk.substring(sdkMatch?.[0].length || 0).replace(/[^A-Z]/g, '');
              if (
                labelPart &&
                sLabelPart &&
                (sLabelPart.includes(labelPart) || labelPart.includes(sLabelPart))
              )
                return true;
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
          const sectionData =
            report.formData?.[section.id] ||
            report.formData?.[`section_${index}`] ||
            report.formData?.[`${section.id}_1`] ||
            report.formData?.[`${section.id}_2`] ||
            (() => {
              if (!report.formData) return undefined;
              const keys = Object.keys(report.formData);
              const foundKey = keys.find((k) => k.startsWith(section.id + '_'));
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
            if (
              sectionData &&
              (Array.isArray(sectionData)
                ? sectionData.length > 0
                : Object.keys(sectionData).length > 0)
            ) {
              dayMap.set(day, (dayMap.get(day) || 0) + 1);
            }
          }
        }
      });
    }
  });

  return stats;
}
