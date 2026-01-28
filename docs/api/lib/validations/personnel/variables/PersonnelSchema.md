[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/personnel](../README.md) / PersonnelSchema

# Variable: PersonnelSchema

> `const` **PersonnelSchema**: `ZodObject`\<\{ `id`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `cedula`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `rank`: `ZodOptional`\<`ZodString`\>; `role`: `ZodOptional`\<`ZodString`\>; `department`: `ZodOptional`\<`ZodString`\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"activo"`, `"vacaciones"`, `"permiso"`, `"reposo"`, `"apoyo"`\]\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `id?`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `role?`: `string`; `department?`: `string`; `status?`: `"permiso"` \| `"activo"` \| `"vacaciones"` \| `"reposo"` \| `"apoyo"`; \}, \{ `id?`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `role?`: `string`; `department?`: `string`; `status?`: `"permiso"` \| `"activo"` \| `"vacaciones"` \| `"reposo"` \| `"apoyo"`; \}\>

Defined in: [lib/validations/personnel.ts:21](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/validations/personnel.ts#L21)

Personnel/Staff Member validation schema
