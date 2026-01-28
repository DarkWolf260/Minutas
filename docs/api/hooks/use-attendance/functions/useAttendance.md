[**nextn v0.1.0**](../../../README.md)

***

[nextn](../../../README.md) / [hooks/use-attendance](../README.md) / useAttendance

# Function: useAttendance()

> **useAttendance**(): `object`

Defined in: [hooks/use-attendance.ts:37](https://github.com/DarkWolf260/Minutas/blob/5f481f001a4a8b7a9af9044f8c468cbe7ad30c70/src/hooks/use-attendance.ts#L37)

## Returns

`object`

### records

> **records**: [`AttendanceRecord`](../../../types/interfaces/AttendanceRecord.md)[]

### isLoaded

> **isLoaded**: `boolean`

### markAttendance()

> **markAttendance**: (`memberId`, `date`, `status`, `checkInTime?`, `note?`) => `Promise`\<`void`\>

#### Parameters

##### memberId

`string`

##### date

`string`

##### status

[`AttendanceStatus`](../../../types/type-aliases/AttendanceStatus.md)

##### checkInTime?

`string`

##### note?

`string`

#### Returns

`Promise`\<`void`\>

### getRecordsByDate()

> **getRecordsByDate**: (`date`) => [`AttendanceRecord`](../../../types/interfaces/AttendanceRecord.md)[]

#### Parameters

##### date

`string`

#### Returns

[`AttendanceRecord`](../../../types/interfaces/AttendanceRecord.md)[]

### saveRecords()

> **saveRecords**: (`newRecords`) => `Promise`\<`void`\>

#### Parameters

##### newRecords

[`AttendanceRecord`](../../../types/interfaces/AttendanceRecord.md)[]

#### Returns

`Promise`\<`void`\>
