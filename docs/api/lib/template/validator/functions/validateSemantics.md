[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/validator](../README.md) / validateSemantics

# Function: validateSemantics()

> **validateSemantics**(`sections`, `fieldNames`, `fieldTypes`, `templateOptions`): `string`[]

Defined in: lib/template/validator.ts:58

Validates semantic aspects of a parsed template

Checks for:
- Field references in conditionals that don't exist
- Invalid dropdown indices
- Other logical inconsistencies

## Parameters

### sections

[`SectionConfig`](../../../../types/interfaces/SectionConfig.md)[]

Parsed sections

### fieldNames

`Set`\<`string`\>

Set of all field names in template

### fieldTypes

`Map`\<`string`, [`FieldType`](../../../../types/type-aliases/FieldType.md)\>

Map of field types

### templateOptions

`Map`\<`string`, [`SnippetOption`](../../../../types/interfaces/SnippetOption.md)[]\>

Map of dropdown options

## Returns

`string`[]

Array of semantic error messages
