[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / FieldConfigSchema

# Variable: FieldConfigSchema

> `const` **FieldConfigSchema**: `ZodObject`\<\{ `type`: `ZodEnum`\<\[`"text"`, `"textarea"`, `"date"`, `"time-hlv"`, `"predefined"`, `"multi-text"`, `"dropdown"`, `"number"`\]\>; `label`: `ZodOptional`\<`ZodString`\>; `required`: `ZodDefault`\<`ZodBoolean`\>; `fullWidth`: `ZodDefault`\<`ZodBoolean`\>; `placeholder`: `ZodOptional`\<`ZodString`\>; `defaultValue`: `ZodOptional`\<`ZodString`\>; `options`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `label`: `ZodString`; `value`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `label`: `string`; `value`: `string`; \}, \{ `label`: `string`; `value`: `string`; \}\>, `"many"`\>\>; `validation`: `ZodOptional`\<`ZodObject`\<\{ `min`: `ZodOptional`\<`ZodNumber`\>; `max`: `ZodOptional`\<`ZodNumber`\>; `pattern`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `min?`: `number`; `max?`: `number`; `pattern?`: `string`; \}, \{ `min?`: `number`; `max?`: `number`; `pattern?`: `string`; \}\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `type`: `"number"` \| `"text"` \| `"textarea"` \| `"date"` \| `"predefined"` \| `"time-hlv"` \| `"multi-text"` \| `"dropdown"`; `label?`: `string`; `required`: `boolean`; `fullWidth`: `boolean`; `placeholder?`: `string`; `defaultValue?`: `string`; `options?`: `object`[]; `validation?`: \{ `min?`: `number`; `max?`: `number`; `pattern?`: `string`; \}; \}, \{ `type`: `"number"` \| `"text"` \| `"textarea"` \| `"date"` \| `"predefined"` \| `"time-hlv"` \| `"multi-text"` \| `"dropdown"`; `label?`: `string`; `required?`: `boolean`; `fullWidth?`: `boolean`; `placeholder?`: `string`; `defaultValue?`: `string`; `options?`: `object`[]; `validation?`: \{ `min?`: `number`; `max?`: `number`; `pattern?`: `string`; \}; \}\>

Defined in: lib/validations/schemas.ts:187
