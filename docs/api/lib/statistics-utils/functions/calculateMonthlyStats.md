[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/statistics-utils](../README.md) / calculateMonthlyStats

# Function: calculateMonthlyStats()

> **calculateMonthlyStats**(`reports`, `templates`, `configs`, `month`, `year`): [`MonthlyStats`](../type-aliases/MonthlyStats.md)

Defined in: [lib/statistics-utils.ts:115](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/statistics-utils.ts#L115)

Aggregates reports into a monthly statistics grid, counting occurrences by day and category.

**Processing Steps**:
1. Filters reports by specified month/year
2. Only counts reports with status "Finalizado"
3. Categorizes each report using template rules
4. Handles repeatable sections (counts array items)
5. Returns Map of categories → days → counts

## Parameters

### reports

[`Report`](../../../types/interfaces/Report.md)[]

All reports to process (will be filtered by month/year)

### templates

[`Template`](../../../types/interfaces/Template.md)[]

Available templates for category resolution

### configs

`Record`\<`string`, [`TemplateConfig`](../../../types/interfaces/TemplateConfig.md)\>

Template configurations for section handling

### month

`number`

Month index (0-11, where 0=January, 11=December)

### year

`number`

Full year (e.g., 2026)

## Returns

[`MonthlyStats`](../type-aliases/MonthlyStats.md)

Map of statistical categories to daily counts

## Example

```typescript
const stats = calculateMonthlyStats(allReports, templates, configs, 0, 2026);

// Get count for specific category and day
const robberyCount = stats.get('1.3 ROBOS')?.get(15) ?? 0;

// Iterate over all categories
stats.forEach((dailyCounts, category) => {
  console.log(`${category}:`, Array.from(dailyCounts.values()).reduce((a, b) => a + b, 0));
});
```

## Remarks

- Supports both ISO timestamps and DD/MM/YYYY format
- Repeatable sections count each array item separately
- Non-repeatable sections count as 1 if present
- Empty sections are not counted
- Invalid timestamps are skipped
