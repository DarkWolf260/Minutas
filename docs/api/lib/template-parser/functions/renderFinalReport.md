[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/template-parser](../README.md) / renderFinalReport

# Function: renderFinalReport()

> **renderFinalReport**(`template`, `data`, `config`, `predefinedValues`, `summaryOnly`, `dynamicPredefinedValues`): `string`

Defined in: [lib/template-parser.ts:346](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/template-parser.ts#L346)

Renderiza el reporte final completo

## Parameters

### template

`string`

### data

`Record`\<`string`, `any`\>

### config

#### fields

`Record`\<`string`, `any`\>

#### sections

[`SectionConfig`](../../../types/interfaces/SectionConfig.md)[]

#### layout

`string`[]

### predefinedValues

`Record`\<`string`, `string`\>

### summaryOnly

`boolean` = `false`

### dynamicPredefinedValues

`Record`\<`string`, `string`\> = `{}`

## Returns

`string`
