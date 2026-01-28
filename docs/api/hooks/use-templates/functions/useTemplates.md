[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-templates](../README.md) / useTemplates

# Function: useTemplates()

> **useTemplates**(): `object`

Defined in: [hooks/use-templates.ts:44](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-templates.ts#L44)

## Returns

`object`

### templates

> **templates**: [`Template`](../../../types/interfaces/Template.md)[]

### configs

> **configs**: `Record`\<`string`, [`TemplateConfig`](../../../types/interfaces/TemplateConfig.md)\>

### addTemplate()

> **addTemplate**: (`newTemplate`) => `Promise`\<`void`\>

#### Parameters

##### newTemplate

[`Template`](../../../types/interfaces/Template.md)

#### Returns

`Promise`\<`void`\>

### removeTemplate()

> **removeTemplate**: (`templateId`) => `Promise`\<`void`\>

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`void`\>

### updateTemplate()

> **updateTemplate**: (`updatedTemplate`) => `Promise`\<`void`\>

#### Parameters

##### updatedTemplate

[`Template`](../../../types/interfaces/Template.md)

#### Returns

`Promise`\<`void`\>

### updateTemplateConfig()

> **updateTemplateConfig**: (`templateId`, `config`) => `Promise`\<`void`\>

#### Parameters

##### templateId

`string`

##### config

[`TemplateConfig`](../../../types/interfaces/TemplateConfig.md)

#### Returns

`Promise`\<`void`\>

### toggleTemplateActive()

> **toggleTemplateActive**: (`templateId`) => `Promise`\<`void`\>

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`void`\>

### clearAllTemplates()

> **clearAllTemplates**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### isLoaded

> **isLoaded**: `boolean`
