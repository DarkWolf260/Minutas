[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / StaffMemberSchema

# Variable: StaffMemberSchema

> `const` **StaffMemberSchema**: `ZodObject`\<\{ `id`: `ZodString`; `personnelId`: `ZodString`; `name`: `ZodString`; `cedula`: `ZodOptional`\<`ZodString`\>; `rank`: `ZodOptional`\<`ZodString`\>; `unit`: `ZodOptional`\<`ZodString`\>; `position`: `ZodOptional`\<`ZodString`\>; `phone`: `ZodOptional`\<`ZodString`\>; `email`: `ZodOptional`\<`ZodString`\>; `isActive`: `ZodDefault`\<`ZodBoolean`\>; `notes`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `personnelId`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `unit?`: `string`; `position?`: `string`; `phone?`: `string`; `email?`: `string`; `isActive`: `boolean`; `notes?`: `string`; \}, \{ `id`: `string`; `personnelId`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `unit?`: `string`; `position?`: `string`; `phone?`: `string`; `email?`: `string`; `isActive?`: `boolean`; `notes?`: `string`; \}\>

Defined in: lib/validations/schemas.ts:17

Schema for validating StaffMember / Personnel
