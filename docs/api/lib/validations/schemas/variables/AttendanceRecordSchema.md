[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / AttendanceRecordSchema

# Variable: AttendanceRecordSchema

> `const` **AttendanceRecordSchema**: `ZodObject`\<\{ `id`: `ZodString`; `personnelId`: `ZodString`; `guardId`: `ZodOptional`\<`ZodString`\>; `date`: `ZodString`; `status`: `ZodEnum`\<\[`"present"`, `"absent"`, `"late"`, `"excused"`, `"on-leave"`\]\>; `checkIn`: `ZodOptional`\<`ZodString`\>; `checkOut`: `ZodOptional`\<`ZodString`\>; `notes`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `personnelId`: `string`; `guardId?`: `string`; `date`: `string`; `status`: `"present"` \| `"absent"` \| `"late"` \| `"excused"` \| `"on-leave"`; `checkIn?`: `string`; `checkOut?`: `string`; `notes?`: `string`; \}, \{ `id`: `string`; `personnelId`: `string`; `guardId?`: `string`; `date`: `string`; `status`: `"present"` \| `"absent"` \| `"late"` \| `"excused"` \| `"on-leave"`; `checkIn?`: `string`; `checkOut?`: `string`; `notes?`: `string`; \}\>

Defined in: lib/validations/schemas.ts:138

Schema for AttendanceRecord
