[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/formatters](../README.md) / formatStaffMemberForDisplay

# Function: formatStaffMemberForDisplay()

> **formatStaffMemberForDisplay**(`member`): `string`

Defined in: [lib/formatters.ts:20](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/formatters.ts#L20)

Formats a staff member for display, showing just the name.

## Parameters

### member

Staff member object or string name

`string` | [`StaffMember`](../../../types/interfaces/StaffMember.md)

## Returns

`string`

The staff member's name

## Example

```typescript
const member = { id: '1', name: 'Juan Pérez', cedula: 'V-12345678' };
formatStaffMemberForDisplay(member); // "Juan Pérez"
formatStaffMemberForDisplay('María García'); // "María García"
```
