[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/renderer](../README.md) / renderContentWithSections

# Function: renderContentWithSections()

> **renderContentWithSections**(`template`, `data`, `config`, `predefinedValues`, `dynamicPredefinedValues`): `string`

Defined in: lib/template/renderer.ts:428

Renders content with full section handling

Main rendering function with support for repeatable sections,
conditional sections, and complex nested structures

## Parameters

### template

`string`

### data

`Record`\<`string`, `any`\>

### config

`any`

### predefinedValues

`Record`\<`string`, `string`\>

### dynamicPredefinedValues

`Record`\<`string`, `string`\> = `{}`

## Returns

`string`
