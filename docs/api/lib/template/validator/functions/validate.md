[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/validator](../README.md) / validate

# Function: validate()

> **validate**(`parseResult`, `originalTemplate?`): [`ValidationResult`](../../types/interfaces/ValidationResult.md)

Defined in: lib/template/validator.ts:116

Validates a parsed template for all types of errors

## Parameters

### parseResult

[`ParseResult`](../../types/interfaces/ParseResult.md)

The parsed template to validate

### originalTemplate?

`string`

Original template string for syntax validation

## Returns

[`ValidationResult`](../../types/interfaces/ValidationResult.md)

Validation result with errors and warnings

## Example

```typescript
const result = parse(tokens);
const validation = validate(result, template);
if (!validation.isValid) {
  console.error('Template errors:', validation.errors);
}
```
