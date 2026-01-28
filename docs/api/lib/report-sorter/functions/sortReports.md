[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/report-sorter](../README.md) / sortReports

# Function: sortReports()

> **sortReports**\<`T`\>(`reports`, `direction`): `T`[]

Defined in: [lib/report-sorter.ts:148](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/report-sorter.ts#L148)

Sorts reports chronologically by date and time extracted from formData.

**Sorting Logic**:
1. Uses 'Fecha' and 'Hora' fields from report.formData
2. Reports with valid date/time are sorted chronologically
3. Reports without date/time are placed at the end
4. Final fallback: sorts by report ID (creation timestamp)

## Type Parameters

### T

`T` *extends* [`Report`](../../../types/interfaces/Report.md)

## Parameters

### reports

`T`[]

Array of reports to sort

### direction

Sort direction: 'asc' for chronological, 'desc' for reverse (default: 'asc')

`"desc"` | `"asc"`

## Returns

`T`[]

New sorted array (original array is not mutated)

## Example

```typescript
const reports = [
  { id: '3', formData: { Fecha: '27/01/2026', Hora: '14:00' } },
  { id: '1', formData: { Fecha: '27/01/2026', Hora: '09:30' } },
  { id: '2', formData: { Fecha: '26/01/2026', Hora: '18:00' } }
];

const sorted = sortReports(reports); // Chronological
// [
//   { id: '2', ... },  // 26/01 18:00
//   { id: '1', ... },  // 27/01 09:30
//   { id: '3', ... }   // 27/01 14:00
// ]

const reversed = sortReports(reports, 'desc'); // Reverse chronological
```

## Remarks

- Creates a new array (does not mutate input)
- Date formats supported: DD/MM/YYYY, YYYY-MM-DD
- Time format: HH:MM (24-hour)
- Invalid dates sorted after valid ones
- Stable sort (preserves relative order for equal elements)
