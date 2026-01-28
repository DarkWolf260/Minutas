[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / createPartialSchema

# Function: createPartialSchema()

> **createPartialSchema**\<`T`\>(`schema`): `ZodObject`\<\{\[`key`: `string`\]: `ZodOptional`\<`any`\>; \}, `UnknownKeysParam`, `ZodTypeAny`, \{\[`key`: `string`\]: `any`; \}, \{\[`key`: `string`\]: `any`; \}\>

Defined in: lib/validations/schemas.ts:220

Validate a partial update (all fields optional)

## Type Parameters

### T

`T` *extends* `ZodObject`\<`any`, `UnknownKeysParam`, `ZodTypeAny`, \{\[`key`: `string`\]: `any`; \}, \{\[`key`: `string`\]: `any`; \}\>

## Parameters

### schema

`T`

## Returns

`ZodObject`\<\{\[`key`: `string`\]: `ZodOptional`\<`any`\>; \}, `UnknownKeysParam`, `ZodTypeAny`, \{\[`key`: `string`\]: `any`; \}, \{\[`key`: `string`\]: `any`; \}\>
