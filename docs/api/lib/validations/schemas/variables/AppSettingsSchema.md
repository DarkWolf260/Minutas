[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / AppSettingsSchema

# Variable: AppSettingsSchema

> `const` **AppSettingsSchema**: `ZodObject`\<\{ `id`: `ZodLiteral`\<`"app-settings"`\>; `theme`: `ZodDefault`\<`ZodEnum`\<\[`"light"`, `"dark"`, `"system"`\]\>\>; `language`: `ZodDefault`\<`ZodEnum`\<\[`"es"`, `"en"`\]\>\>; `autoSaveDrafts`: `ZodDefault`\<`ZodBoolean`\>; `defaultTemplate`: `ZodOptional`\<`ZodString`\>; `notifications`: `ZodOptional`\<`ZodObject`\<\{ `enabled`: `ZodDefault`\<`ZodBoolean`\>; `sound`: `ZodDefault`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `enabled`: `boolean`; `sound`: `boolean`; \}, \{ `enabled?`: `boolean`; `sound?`: `boolean`; \}\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `"app-settings"`; `theme`: `"light"` \| `"dark"` \| `"system"`; `language`: `"es"` \| `"en"`; `autoSaveDrafts`: `boolean`; `defaultTemplate?`: `string`; `notifications?`: \{ `enabled`: `boolean`; `sound`: `boolean`; \}; \}, \{ `id`: `"app-settings"`; `theme?`: `"light"` \| `"dark"` \| `"system"`; `language?`: `"es"` \| `"en"`; `autoSaveDrafts?`: `boolean`; `defaultTemplate?`: `string`; `notifications?`: \{ `enabled?`: `boolean`; `sound?`: `boolean`; \}; \}\>

Defined in: lib/validations/schemas.ts:156

Schema for AppSettings
