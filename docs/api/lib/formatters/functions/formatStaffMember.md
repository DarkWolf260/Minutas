[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/formatters](../README.md) / formatStaffMember

# Function: formatStaffMember()

> **formatStaffMember**(`member`, `showCedula`): `string`

Defined in: [lib/formatters.ts:62](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/formatters.ts#L62)

Formats a staff member for template rendering, optionally showing cedula in parentheses.

## Parameters

### member

[`StaffMember`](../../../types/interfaces/StaffMember.md)

Staff member object

### showCedula

`boolean` = `false`

Whether to show cédula in parentheses (default: false)

## Returns

`string`

Formatted string for template display

## Example

```typescript
const member = { id: '1', name: 'Juan Pérez', cedula: 'V-12345678' };
formatStaffMember(member);       // "Juan Pérez"
formatStaffMember(member, true); // "Juan Pérez (V-12345678)"
```
