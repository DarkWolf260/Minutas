[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / ReportSchema

# Variable: ReportSchema

> `const` **ReportSchema**: `ZodObject`\<\{ `id`: `ZodString`; `templateId`: `ZodString`; `title`: `ZodString`; `timestamp`: `ZodString`; `content`: `ZodString`; `isRelevant`: `ZodBoolean`; `status`: `ZodOptional`\<`ZodEnum`\<\[`"En proceso"`, `"Finalizado"`\]\>\>; `formData`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `sections`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `title`: `ZodString`; `content`: `ZodString`; `fields`: `ZodRecord`\<`ZodString`, `ZodUnknown`\>; \}, `"strip"`, `ZodTypeAny`, \{ `title`: `string`; `content`: `string`; `fields`: `Record`\<`string`, `unknown`\>; \}, \{ `title`: `string`; `content`: `string`; `fields`: `Record`\<`string`, `unknown`\>; \}\>, `"many"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `templateId`: `string`; `title`: `string`; `timestamp`: `string`; `content`: `string`; `isRelevant`: `boolean`; `status?`: `"En proceso"` \| `"Finalizado"`; `formData?`: `Record`\<`string`, `unknown`\>; `sections?`: `object`[]; \}, \{ `id`: `string`; `templateId`: `string`; `title`: `string`; `timestamp`: `string`; `content`: `string`; `isRelevant`: `boolean`; `status?`: `"En proceso"` \| `"Finalizado"`; `formData?`: `Record`\<`string`, `unknown`\>; `sections?`: `object`[]; \}\>

Defined in: lib/validations/schemas.ts:64

Schema for Report
