[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/csv-utils](../README.md) / downloadPersonnelTemplate

# Function: downloadPersonnelTemplate()

> **downloadPersonnelTemplate**(): `void`

Defined in: [lib/csv-utils.ts:24](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/csv-utils.ts#L24)

Downloads a template CSV file for personnel import.
Creates a sample CSV with headers and an example row, includes UTF-8 BOM for Excel compatibility.

## Returns

`void`

## Example

```typescript
// Trigger download in browser
downloadPersonnelTemplate();
// File "plantilla_personal.csv" will be downloaded with example data
```

## Remarks

- Includes BOM (\\uFEFF) for proper UTF-8 encoding in Excel
- Sample row shows expected format and field types
- Uses default "activo" status from constants
