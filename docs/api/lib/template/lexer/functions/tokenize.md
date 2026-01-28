[**nextn v0.1.0**](../../../../README.md)

***

[nextn](../../../../README.md) / [lib/template/lexer](../README.md) / tokenize

# Function: tokenize()

> **tokenize**(`template`): [`Token`](../../types/type-aliases/Token.md)[]

Defined in: lib/template/lexer.ts:34

Tokenizes a template string into a structured token stream

## Parameters

### template

`string`

The template string to tokenize

## Returns

[`Token`](../../types/type-aliases/Token.md)[]

Array of tokens representing the template structure

## Example

```typescript
const tokens = tokenize('Hello {Name}, today is {Fecha:date}');
// Returns: [
//   { type: 'text', content: 'Hello ', position: 0 },
//   { type: 'field', id: 'Name', raw: '{Name}', position: 6 },
//   { type: 'text', content: ', today is ', position: 12 },
//   { type: 'field', id: 'Fecha', raw: '{Fecha:date}', position: 24 }
// ]
```
