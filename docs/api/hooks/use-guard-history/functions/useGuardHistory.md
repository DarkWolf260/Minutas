[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-guard-history](../README.md) / useGuardHistory

# Function: useGuardHistory()

> **useGuardHistory**(): `object`

Defined in: [hooks/use-guard-history.ts:8](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-guard-history.ts#L8)

## Returns

`object`

### reports

> **reports**: [`GuardReport`](../../../types/interfaces/GuardReport.md)[]

### isLoaded

> **isLoaded**: `boolean`

### saveGuardReport()

> **saveGuardReport**: (`report`) => `Promise`\<`void`\>

#### Parameters

##### report

[`GuardReport`](../../../types/interfaces/GuardReport.md)

#### Returns

`Promise`\<`void`\>

### deleteGuardReport()

> **deleteGuardReport**: (`id`) => `Promise`\<`void`\>

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

### getGuardReportById()

> **getGuardReportById**: (`id`) => [`GuardReport`](../../../types/interfaces/GuardReport.md) \| `undefined`

#### Parameters

##### id

`string`

#### Returns

[`GuardReport`](../../../types/interfaces/GuardReport.md) \| `undefined`
