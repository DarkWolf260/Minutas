[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/statistics-utils](../README.md) / getReportCategory

# Function: getReportCategory()

> **getReportCategory**(`report`, `template?`): `string` \| `null`

Defined in: [lib/statistics-utils.ts:39](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/statistics-utils.ts#L39)

Determines the statistical category for a given report based on its template configuration.

**Priority Order**:
1. Conditional Rules (if field values match)
2. Default Category (template.statisticsCategory)
3. null (if no category defined)

## Parameters

### report

[`Report`](../../../types/interfaces/Report.md)

The report to categorize

### template?

[`Template`](../../../types/interfaces/Template.md)

The template associated with the report

## Returns

`string` \| `null`

The statistical category string (uppercase, trimmed) or null if no category applies

## Example

```typescript
// With conditional rule
const template = {
  statisticsCategory: '1.0 DEFAULT',
  statisticsRules: [
    { fieldId: 'Tipo', condition: 'robo', category: '1.3 ROBOS' }
  ]
};
const report = { formData: { Tipo: 'robo' } };
getReportCategory(report, template); // "1.3 ROBOS"

// Fallback to default
const report2 = { formData: { Tipo: 'accidente' } };
getReportCategory(report2, template); // "1.0 DEFAULT"
```

## Remarks

- Field matching is case-insensitive and whitespace-trimmed
- Returns normalized category (uppercase, trimmed)
- First matching rule wins (rules order matters)
