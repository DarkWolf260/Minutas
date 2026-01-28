[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/error-handler](../README.md) / logError

# Function: logError()

> **logError**(`error`, `severity`, `context?`): `void`

Defined in: [lib/error-handler.ts:33](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/error-handler.ts#L33)

Log an error with context

## Parameters

### error

`unknown`

The error to log

### severity

`ErrorSeverity` = `'error'`

Error severity level

### context?

`ErrorContext`

Additional context about the error

## Returns

`void`

## Example

```ts
logError(new Error('Failed to save'), 'error', {
  feature: 'Personnel',
  action: 'save',
  metadata: { personnelId: '123' }
});
```
