[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/validator](../README.md) / validateSyntax

# Function: validateSyntax()

> **validateSyntax**(`template`): `string`[]

Defined in: lib/template/validator.ts:21

Validates a template string for syntax errors

Checks for:
- Balanced braces { }
- Balanced brackets [ ]
- Properly closed conditionals [? ... [/]

## Parameters

### template

`string`

The template string to validate

## Returns

`string`[]

Array of syntax error messages
