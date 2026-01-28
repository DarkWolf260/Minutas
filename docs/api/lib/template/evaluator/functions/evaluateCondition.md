[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/evaluator](../README.md) / evaluateCondition

# Function: evaluateCondition()

> **evaluateCondition**(`fieldValue`, `operator`, `targetValue`): `boolean`

Defined in: lib/template/evaluator.ts:22

Evaluates a conditional expression

## Parameters

### fieldValue

`any`

The actual value of the field

### operator

`string`

The comparison operator (=, !=, >, <, >=, <=)

### targetValue

`string`

The value to compare against

## Returns

`boolean`

True if the condition is met

## Example

```typescript
evaluateCondition('Robo', '=', 'Robo') // true
evaluateCondition(5, '>', '3') // true
evaluateCondition('Active', '!=', 'Inactive') // true
```
