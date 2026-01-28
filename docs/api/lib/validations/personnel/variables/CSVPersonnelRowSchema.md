[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/personnel](../README.md) / CSVPersonnelRowSchema

# Variable: CSVPersonnelRowSchema

> `const` **CSVPersonnelRowSchema**: `ZodObject`\<\{ `rank`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `cedula`: `ZodOptional`\<`ZodString`\>; `role`: `ZodOptional`\<`ZodString`\>; `department`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `rank?`: `string`; `name`: `string`; `cedula?`: `string`; `role?`: `string`; `department?`: `string`; \}, \{ `rank?`: `string`; `name`: `string`; `cedula?`: `string`; `role?`: `string`; `department?`: `string`; \}\>

Defined in: [lib/validations/personnel.ts:95](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/validations/personnel.ts#L95)

CSV Import Row validation (for bulk personnel import)
