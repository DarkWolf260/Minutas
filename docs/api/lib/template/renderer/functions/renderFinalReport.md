[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/renderer](../README.md) / renderFinalReport

# Function: renderFinalReport()

> **renderFinalReport**(`template`, `data`, `config`, `predefinedValues`, `summaryOnly`, `dynamicPredefinedValues`, `parseTemplate`, `recordReportAudit`): `string`

Defined in: lib/template/renderer.ts:509

Renders the final report with full template processing

Main entry point for template rendering. Handles:
- Template parsing
- Configuration building
- Full content rendering
- Summary extraction
- Semantic concept resolution
- Audit recording

## Parameters

### template

`string`

Template string

### data

`Record`\<`string`, `any`\>

Data for rendering

### config

Field and section configuration

#### fields

`Record`\<`string`, `any`\>

#### sections

[`SectionConfig`](../../../../types/interfaces/SectionConfig.md)[]

#### layout

`string`[]

### predefinedValues

`Record`\<`string`, `string`\>

Predefined values (e.g., global tags)

### summaryOnly

`boolean` = `false`

If true, only extract summary markers

### dynamicPredefinedValues

`Record`\<`string`, `string`\> = `{}`

Runtime predefined values

### parseTemplate

(`template`) => `any`

### recordReportAudit

(`reportId`, `audit`) => `void`

## Returns

`string`

Rendered report string
