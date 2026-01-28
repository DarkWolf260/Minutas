[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/csv-utils](../README.md) / parsePersonnelCSV

# Function: parsePersonnelCSV()

> **parsePersonnelCSV**(`content`): `Omit`\<[`StaffMember`](../../../types/interfaces/StaffMember.md), `"id"`\>[]

Defined in: [lib/csv-utils.ts:79](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/csv-utils.ts#L79)

Parses CSV content string into an array of personnel objects.

**Features**:
- Auto-detects delimiter (comma or semicolon)
- Handles BOM character (\\uFEFF)
- Supports both LF and CRLF line endings
- Trims whitespace from all fields
- Validates status against allowed values
- Provides defaults for missing fields
- Skips empty lines and header row

## Parameters

### content

`string`

Raw CSV string content

## Returns

`Omit`\<[`StaffMember`](../../../types/interfaces/StaffMember.md), `"id"`\>[]

Array of staff member objects (without id field)

## Example

```typescript
const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo
TTE,María Rodríguez,V-87654321,Analista,IT,activo`;

const members = parsePersonnelCSV(csv);
// [
//   { rank: 'OPC', name: 'Juan Pérez', cedula: 'V-12345678', ... },
//   { rank: 'TTE', name: 'María Rodríguez', cedula: 'V-87654321', ... }
// ]
```

## Remarks

**Field Mapping** (by column index):
- 0: Jerarquía (rank) - defaults to 'OPC'
- 1: Nombre y Apellido (name) - **required**
- 2: Cédula (cedula) - optional
- 3: Cargo (roleId) - optional
- 4: Departamento (department) - optional
- 5: Estatus (status) - defaults to 'activo', validated

**Validation**:
- Status must be one of PERSONNEL_STATUS values
- Invalid status defaults to 'activo'
- Rows without name (column 1) are skipped
- Trailing separators in status field are removed
