[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/evaluator](../README.md) / applyModifiers

# Function: applyModifiers()

> **applyModifiers**(`value`, `modifiers`): `string`

Defined in: lib/template/evaluator.ts:46

Applies text modifiers to a value

## Parameters

### value

`any`

The value to modify

### modifiers

Array of modifier names (upper, lower, title, etc.)

`string` | `string`[]

## Returns

`string`

Modified string value

## Example

```typescript
applyModifiers('hello world', ['upper']) // 'HELLO WORLD'
applyModifiers('HELLO WORLD', ['lower']) // 'hello world'
applyModifiers('hello world', ['title']) // 'Hello World'
```
