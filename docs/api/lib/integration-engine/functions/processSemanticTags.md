[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/integration-engine](../README.md) / processSemanticTags

# Function: processSemanticTags()

> **processSemanticTags**(`content`): `object`

Defined in: [lib/integration-engine.ts:112](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/integration-engine.ts#L112)

Procesa una cadena de texto buscando tags semánticos y reemplazándolos.
Ej: "La población actual es {poblacion_la_guaira:semantic}"

## Parameters

### content

`string`

## Returns

`object`

### rendered

> **rendered**: `string`

### audit

> **audit**: [`ResolutionResult`](../interfaces/ResolutionResult.md)[]
