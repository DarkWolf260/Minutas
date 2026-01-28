[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/report-sorter](../README.md) / findValueInFormData

# Function: findValueInFormData()

> **findValueInFormData**(`formData`, `keyToFind`): `any`

Defined in: [lib/report-sorter.ts:37](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/report-sorter.ts#L37)

Finds a value in the report's formData, checking both top-level and nested section data.
Search is case-insensitive, making it resilient to field name variations.

**Search Order**:
1. Top-level fields (e.g., `{Fecha: "27/01/2026"}`)
2. Nested section fields (e.g., `{Detalles: {Hora: "14:00"}}`)

## Parameters

### formData

The report's formData object

`Record`\<`string`, `any`\> | `undefined`

### keyToFind

`string`

The key to search for (case-insensitive, e.g., "Hora")

## Returns

`any`

The found value (any type), or null if not present

## Example

```typescript
const formData = {
  Fecha: "27/01/2026",
  Detalles: {
    Hora: "14:00",
    Lugar: "Oficina Principal"
  }
};

findValueInFormData(formData, 'Fecha');  // "27/01/2026"
findValueInFormData(formData, 'hora');   // "14:00" (case-insensitive)
findValueInFormData(formData, 'Lugar'); // "Oficina Principal" (nested)
findValueInFormData(formData, 'Missing'); // null
```

## Remarks

- Case-insensitive matching (`Hora` matches `hora`, `HORA`, etc.)
- Searches top-level first, then one level deep
- Does not search inside arrays (repeatable sections)
- Returns first match found
