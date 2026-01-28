[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/formatters](../README.md) / formatStaffMemberForAutocomplete

# Function: formatStaffMemberForAutocomplete()

> **formatStaffMemberForAutocomplete**(`member`, `withCedula`): `string`

Defined in: [lib/formatters.ts:41](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/formatters.ts#L41)

Formats a staff member for autocomplete suggestions, optionally including cedula.

## Parameters

### member

[`StaffMember`](../../../types/interfaces/StaffMember.md)

Staff member object

### withCedula

`boolean`

Whether to include cédula in the format

## Returns

`string`

Formatted string for autocomplete display

## Example

```typescript
const member = { id: '1', name: 'Juan Pérez', cedula: 'V-12345678' };
formatStaffMemberForAutocomplete(member, true);  // "Juan Pérez V-12345678"
formatStaffMemberForAutocomplete(member, false); // "Juan Pérez"
```
