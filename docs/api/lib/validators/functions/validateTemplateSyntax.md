[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/validators](../README.md) / validateTemplateSyntax

# Function: validateTemplateSyntax()

> **validateTemplateSyntax**(`content`): `object`

Defined in: [lib/validators.ts:50](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/validators.ts#L50)

Performs basic syntax validation on template content.
Checks for balanced braces, brackets, and conditional markers.

## Parameters

### content

`string`

Template content to validate

## Returns

`object`

Validation result with status and optional error message

### valid

> **valid**: `boolean`

### error?

> `optional` **error**: `string`

## Example

```typescript
const template = '{Fecha} {Hora} [?{Status}=activo] Content [/]';
const result = validateTemplateSyntax(template);
if (!result.valid) {
  console.error('Template error:', result.error);
}
```

## Remarks

Validates:
- Balanced braces `{}` for fields
- Balanced brackets `[]` for sections and conditionals
- Matching conditional markers `[?{...}]` with `[/]`
