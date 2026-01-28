[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/types](../README.md) / Token

# Type Alias: Token

> **Token** = \{ `type`: `"text"`; `content`: `string`; `position`: `number`; \} \| \{ `type`: `"field"`; `id`: `string`; `raw`: `string`; `position`: `number`; \} \| \{ `type`: `"section_start"`; `label?`: `string`; `condition?`: [`ConditionalExpression`](../interfaces/ConditionalExpression.md); `position`: `number`; \} \| \{ `type`: `"section_end"`; `position`: `number`; \}

Defined in: lib/template/types.ts:15

Token types for lexer
