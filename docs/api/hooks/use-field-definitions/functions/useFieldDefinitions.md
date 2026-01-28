[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-field-definitions](../README.md) / useFieldDefinitions

# Function: useFieldDefinitions()

> **useFieldDefinitions**(): `object`

Defined in: [hooks/use-field-definitions.ts:33](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-field-definitions.ts#L33)

## Returns

`object`

### definitions

> **definitions**: `Record`\<`string`, [`FieldConfig`](../../../types/interfaces/FieldConfig.md)\>

### updateDefinition()

> **updateDefinition**: (`fieldName`, `newConfig`) => `Promise`\<`void`\>

#### Parameters

##### fieldName

`string`

##### newConfig

[`FieldConfig`](../../../types/interfaces/FieldConfig.md)

#### Returns

`Promise`\<`void`\>

### removeDefinition()

> **removeDefinition**: (`fieldName`) => `Promise`\<`void`\>

#### Parameters

##### fieldName

`string`

#### Returns

`Promise`\<`void`\>

### saveDefinitions()

> **saveDefinitions**: (`newDefinitions`) => `Promise`\<`void`\>

#### Parameters

##### newDefinitions

`Record`\<`string`, [`FieldConfig`](../../../types/interfaces/FieldConfig.md)\>

#### Returns

`Promise`\<`void`\>

### isLoaded

> **isLoaded**: `boolean`

### clearAllDefinitions()

> **clearAllDefinitions**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>
