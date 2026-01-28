[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/personnel](../README.md) / validatePersonnel

# Function: validatePersonnel()

> **validatePersonnel**(`data`): \{ `success`: `true`; `data`: \{ `id?`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `role?`: `string`; `department?`: `string`; `status?`: `"permiso"` \| `"activo"` \| `"vacaciones"` \| `"reposo"` \| `"apoyo"`; \}; \} \| \{ `success`: `false`; `error`: `string`; \}

Defined in: [lib/validations/personnel.ts:116](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/validations/personnel.ts#L116)

Helper function to validate and return typed data or error

## Parameters

### data

`unknown`

## Returns

\{ `success`: `true`; `data`: \{ `id?`: `string`; `name`: `string`; `cedula?`: `string`; `rank?`: `string`; `role?`: `string`; `department?`: `string`; `status?`: `"permiso"` \| `"activo"` \| `"vacaciones"` \| `"reposo"` \| `"apoyo"`; \}; \} \| \{ `success`: `false`; `error`: `string`; \}
