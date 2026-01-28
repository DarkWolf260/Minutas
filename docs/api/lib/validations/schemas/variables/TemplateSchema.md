[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / TemplateSchema

# Variable: TemplateSchema

> `const` **TemplateSchema**: `ZodObject`\<\{ `id`: `ZodString`; `name`: `ZodString`; `content`: `ZodString`; `type`: `ZodEnum`\<\[`"normal"`, `"relevante"`\]\>; `isActive`: `ZodDefault`\<`ZodBoolean`\>; `statisticsCategory`: `ZodOptional`\<`ZodString`\>; `statisticsRules`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `fieldId`: `ZodString`; `condition`: `ZodString`; `category`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `fieldId`: `string`; `condition`: `string`; `category`: `string`; \}, \{ `fieldId`: `string`; `condition`: `string`; `category`: `string`; \}\>, `"many"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `name`: `string`; `content`: `string`; `type`: `"normal"` \| `"relevante"`; `isActive`: `boolean`; `statisticsCategory?`: `string`; `statisticsRules?`: `object`[]; \}, \{ `id`: `string`; `name`: `string`; `content`: `string`; `type`: `"normal"` \| `"relevante"`; `isActive?`: `boolean`; `statisticsCategory?`: `string`; `statisticsRules?`: `object`[]; \}\>

Defined in: lib/validations/schemas.ts:39

Schema for Template
