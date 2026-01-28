[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / GuardSchema

# Variable: GuardSchema

> `const` **GuardSchema**: `ZodObject`\<\{ `id`: `ZodString`; `name`: `ZodString`; `description`: `ZodOptional`\<`ZodString`\>; `staff`: `ZodDefault`\<`ZodArray`\<`ZodObject`\<\{ `id`: `ZodString`; `personnelId`: `ZodString`; `name`: `ZodString`; `cedula`: `ZodOptional`\<`ZodString`\>; `rank`: `ZodOptional`\<`ZodString`\>; `unit`: `ZodOptional`\<`ZodString`\>; `position`: `ZodOptional`\<`ZodString`\>; `phone`: `ZodOptional`\<`ZodString`\>; `email`: `ZodOptional`\<`ZodString`\>; `isActive`: `ZodDefault`\<`ZodBoolean`\>; `notes`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `personnelId`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `unit?`: `string`; `position?`: `string`; `phone?`: `string`; `email?`: `string`; `isActive`: `boolean`; `notes?`: `string`; \}, \{ `id`: `string`; `personnelId`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `unit?`: `string`; `position?`: `string`; `phone?`: `string`; `email?`: `string`; `isActive?`: `boolean`; `notes?`: `string`; \}\>, `"many"`\>\>; `schedule`: `ZodOptional`\<`ZodObject`\<\{ `start`: `ZodString`; `end`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `start`: `string`; `end`: `string`; \}, \{ `start`: `string`; `end`: `string`; \}\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `name`: `string`; `description?`: `string`; `staff`: `object`[]; `schedule?`: \{ `start`: `string`; `end`: `string`; \}; \}, \{ `id`: `string`; `name`: `string`; `description?`: `string`; `staff?`: `object`[]; `schedule?`: \{ `start`: `string`; `end`: `string`; \}; \}\>

Defined in: lib/validations/schemas.ts:101

Schema for Guard
