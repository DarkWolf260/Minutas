[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/validations/schemas](../README.md) / AddressSchema

# Variable: AddressSchema

> `const` **AddressSchema**: `ZodObject`\<\{ `id`: `ZodString`; `name`: `ZodString`; `fullAddress`: `ZodString`; `coordinates`: `ZodOptional`\<`ZodObject`\<\{ `lat`: `ZodNumber`; `lng`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `lat`: `number`; `lng`: `number`; \}, \{ `lat`: `number`; `lng`: `number`; \}\>\>; `category`: `ZodOptional`\<`ZodString`\>; `notes`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id`: `string`; `name`: `string`; `fullAddress`: `string`; `coordinates?`: \{ `lat`: `number`; `lng`: `number`; \}; `category?`: `string`; `notes?`: `string`; \}, \{ `id`: `string`; `name`: `string`; `fullAddress`: `string`; `coordinates?`: \{ `lat`: `number`; `lng`: `number`; \}; `category?`: `string`; `notes?`: `string`; \}\>

Defined in: lib/validations/schemas.ts:119

Schema for Address
