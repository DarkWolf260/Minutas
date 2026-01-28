[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-departments](../README.md) / useDepartments

# Function: useDepartments()

> **useDepartments**(): `object`

Defined in: [hooks/use-departments.ts:38](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-departments.ts#L38)

## Returns

`object`

### departments

> **departments**: [`Department`](../../../types/interfaces/Department.md)[]

### addDepartment()

> **addDepartment**: (`newDepartment`) => `Promise`\<`void`\>

#### Parameters

##### newDepartment

[`Department`](../../../types/interfaces/Department.md)

#### Returns

`Promise`\<`void`\>

### removeDepartment()

> **removeDepartment**: (`departmentId`) => `Promise`\<`void`\>

#### Parameters

##### departmentId

`string`

#### Returns

`Promise`\<`void`\>

### updateDepartment()

> **updateDepartment**: (`updatedDepartment`) => `Promise`\<`void`\>

#### Parameters

##### updatedDepartment

[`Department`](../../../types/interfaces/Department.md)

#### Returns

`Promise`\<`void`\>

### isLoaded

> **isLoaded**: `boolean`

### clearAllDepartments()

> **clearAllDepartments**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### saveDepartments()

> **saveDepartments**: (`newDepartments`) => `Promise`\<`void`\>

#### Parameters

##### newDepartments

[`Department`](../../../types/interfaces/Department.md)[]

#### Returns

`Promise`\<`void`\>
