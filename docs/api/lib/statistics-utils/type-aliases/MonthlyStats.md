[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [lib/statistics-utils](../README.md) / MonthlyStats

# Type Alias: MonthlyStats

> **MonthlyStats** = `Map`\<`string`, `Map`\<`number`, `number`\>\>

Defined in: [lib/statistics-utils.ts:76](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/lib/statistics-utils.ts#L76)

Structure for the monthly grid: Category → Day (1-31) → Count

## Example

```typescript
const stats: MonthlyStats = new Map();
stats.set('1.3 ROBOS', new Map([[15, 3], [16, 1]])); // 3 robberies on day 15, 1 on day 16
```
