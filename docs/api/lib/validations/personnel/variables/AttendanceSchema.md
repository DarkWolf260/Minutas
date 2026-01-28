[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/personnel](../README.md) / AttendanceSchema

# Variable: AttendanceSchema

> `const` **AttendanceSchema**: `ZodObject`\<\{ `memberId`: `ZodString`; `status`: `ZodEnum`\<\[`"presente"`, `"tarde"`, `"permiso"`, `"ausente"`\]\>; `checkInTime`: `ZodOptional`\<`ZodString`\>; `note`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `memberId`: `string`; `status`: `"presente"` \| `"tarde"` \| `"permiso"` \| `"ausente"`; `checkInTime?`: `string`; `note?`: `string`; \}, \{ `memberId`: `string`; `status`: `"presente"` \| `"tarde"` \| `"permiso"` \| `"ausente"`; `checkInTime?`: `string`; `note?`: `string`; \}\>

Defined in: [lib/validations/personnel.ts:70](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/validations/personnel.ts#L70)

Attendance record validation schema
