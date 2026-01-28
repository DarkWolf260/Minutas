[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-reports](../README.md) / useReports

# Function: useReports()

> **useReports**(): `object`

Defined in: [hooks/use-reports.ts:36](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-reports.ts#L36)

## Returns

`object`

### reports

> **reports**: [`Report`](../../../types/interfaces/Report.md)[]

### addReport()

> **addReport**: (`newReport`) => `Promise`\<`void`\>

#### Parameters

##### newReport

[`Report`](../../../types/interfaces/Report.md)

#### Returns

`Promise`\<`void`\>

### updateReport()

> **updateReport**: (`updatedReport`) => `Promise`\<`void`\>

#### Parameters

##### updatedReport

[`Report`](../../../types/interfaces/Report.md)

#### Returns

`Promise`\<`void`\>

### removeReport()

> **removeReport**: (`reportId`) => `Promise`\<`void`\>

#### Parameters

##### reportId

`string`

#### Returns

`Promise`\<`void`\>

### clearAllReports()

> **clearAllReports**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### isLoaded

> **isLoaded**: `boolean`

### getLatestReports()

> **getLatestReports**: () => `Promise`\<[`Report`](../../../types/interfaces/Report.md)[]\>

#### Returns

`Promise`\<[`Report`](../../../types/interfaces/Report.md)[]\>
