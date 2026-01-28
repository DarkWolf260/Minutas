[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-personnel](../README.md) / usePersonnel

# Function: usePersonnel()

> **usePersonnel**(): `object`

Defined in: [hooks/use-personnel.ts:39](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-personnel.ts#L39)

## Returns

`object`

### personnel

> **personnel**: [`StaffMember`](../../../types/interfaces/StaffMember.md)[]

### isLoaded

> **isLoaded**: `boolean`

### addMember()

> **addMember**: (`newMember`) => `Promise`\<`void`\>

#### Parameters

##### newMember

`Omit`\<[`StaffMember`](../../../types/interfaces/StaffMember.md), `"id"`\>

#### Returns

`Promise`\<`void`\>

### addMembers()

> **addMembers**: (`members`) => `Promise`\<\{ `added`: [`StaffMember`](../../../types/interfaces/StaffMember.md)[]; `skipped`: `number`; \}\>

#### Parameters

##### members

`Omit`\<[`StaffMember`](../../../types/interfaces/StaffMember.md), `"id"`\>[]

#### Returns

`Promise`\<\{ `added`: [`StaffMember`](../../../types/interfaces/StaffMember.md)[]; `skipped`: `number`; \}\>

### updateMember()

> **updateMember**: (`id`, `updates`) => `Promise`\<`void`\>

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`StaffMember`](../../../types/interfaces/StaffMember.md)\>

#### Returns

`Promise`\<`void`\>

### removeMember()

> **removeMember**: (`id`) => `Promise`\<`void`\>

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

### removeMembers()

> **removeMembers**: (`ids`) => `Promise`\<`void`\>

#### Parameters

##### ids

`string`[]

#### Returns

`Promise`\<`void`\>

### savePersonnel()

> **savePersonnel**: (`newPersonnel`) => `Promise`\<`void`\>

#### Parameters

##### newPersonnel

[`StaffMember`](../../../types/interfaces/StaffMember.md)[]

#### Returns

`Promise`\<`void`\>

### isCedulaDuplicate()

> **isCedulaDuplicate**: (`cedula`, `excludeId?`) => `boolean`

#### Parameters

##### cedula

`string`

##### excludeId?

`string`

#### Returns

`boolean`
