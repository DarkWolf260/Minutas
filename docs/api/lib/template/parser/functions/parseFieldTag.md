[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/parser](../README.md) / parseFieldTag

# Function: parseFieldTag()

> **parseFieldTag**(`tagContent`, `templateOptions`): `object`

Defined in: lib/template/parser.ts:32

Parses field tag content to extract configuration

Syntax: {FieldName:type:modifiers|textMod}
Examples:
- {Name} → text field
- {Fecha:date} → date field
- {Nombre:text:full:req|title} → required full-width text with title case
- {Tipo:dropdown(A=Val1|B=Val2)} → dropdown with inline options

## Parameters

### tagContent

`string`

Content inside the braces (without { })

### templateOptions

`Map`\<`string`, [`SnippetOption`](../../../../types/interfaces/SnippetOption.md)[]\>

Map to store dropdown options

## Returns

`object`

Field configuration

### fieldId

> **fieldId**: `string`

### fieldType

> **fieldType**: [`FieldType`](../../../../types/type-aliases/FieldType.md)

### modifiers

> **modifiers**: `string`[]

### isFullWidth

> **isFullWidth**: `boolean`

### isRequired

> **isRequired**: `boolean`
