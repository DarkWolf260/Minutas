[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/validators](../README.md) / isValidJson

# Function: isValidJson()

> **isValidJson**(`str`): `boolean`

Defined in: [lib/validators.ts:18](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/validators.ts#L18)

Validates if a string is valid JSON.

## Parameters

### str

`string`

String to validate

## Returns

`boolean`

True if the string is valid JSON, false otherwise

## Example

```typescript
isValidJson('{"name": "Juan"}');  // true
isValidJson('{invalid}');         // false
isValidJson('');                  // false
```
