[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-addresses](../README.md) / useAddresses

# Function: useAddresses()

> **useAddresses**(): `object`

Defined in: [hooks/use-addresses.ts:8](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-addresses.ts#L8)

## Returns

`object`

### addresses

> **addresses**: [`Address`](../../../types/interfaces/Address.md)[]

### addAddress()

> **addAddress**: (`newAddress`) => `Promise`\<`void`\>

#### Parameters

##### newAddress

[`Address`](../../../types/interfaces/Address.md)

#### Returns

`Promise`\<`void`\>

### updateAddress()

> **updateAddress**: (`updatedAddress`) => `Promise`\<`void`\>

#### Parameters

##### updatedAddress

[`Address`](../../../types/interfaces/Address.md)

#### Returns

`Promise`\<`void`\>

### removeAddress()

> **removeAddress**: (`addressId`) => `Promise`\<`void`\>

#### Parameters

##### addressId

`string`

#### Returns

`Promise`\<`void`\>

### clearAllAddresses()

> **clearAllAddresses**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### isLoaded

> **isLoaded**: `boolean`
