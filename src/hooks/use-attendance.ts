/**
 * Hook for managing personnel attendance records with localStorage persistence.
 * 
 * Tracks daily attendance with status (presente, tarde, ausente, permiso),
 * check-in times, and notes. Provides date-based filtering and bulk operations.
 * 
 * @returns Attendance state and operations
 * @property {AttendanceRecord[]} records - All attendance records
 * @property {(record: Partial<AttendanceRecord>) => void} markAttendance - Record attendance
 * @property {(date: string) => AttendanceRecord[]} getRecordsByDate - Get records for specific date
 * @property {(id: string) => void} deleteRecord - Delete attendance record
 * @property {() => void} clearAllRecords - Delete all records
 * @property {boolean} isLoaded - Loading state
 * 
 * @example
 * ```tsx
 * const { markAttendance, getRecordsByDate } = useAttendance();
 * 
 * // Mark attendance
 * markAttendance({
 *   memberId: 'person-1',
 *   date: '2024-01-15',
 *   status: 'presente',
 *   checkInTime: '08:30'
 * });
 * 
 * // Get today's records
 * const todayRecords = getRecordsByDate('2024-01-15');
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord, AttendanceStatus } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';

export function useAttendance() {
    const db = useDatabase();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!db) return;

        const sub = db.attendance.find().$.subscribe(data => {
            setRecords(data.map(d => d.toJSON()) as AttendanceRecord[]);
            setIsLoaded(true);
        });

        return () => sub.unsubscribe();
    }, [db]);

    const markAttendance = useCallback(async (memberId: string, date: string, status: AttendanceStatus, checkInTime?: string, note?: string) => {
        if (!db) return;

        const existingDoc = await db.attendance.findOne({
            selector: { memberId, date }
        }).exec();

        if (existingDoc) {
            await existingDoc.patch({
                status,
                checkInTime: checkInTime || existingDoc.toJSON().checkInTime,
                note: note || existingDoc.toJSON().note,
            });
        } else {
            await db.attendance.insert({
                id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                memberId,
                date,
                status,
                checkInTime,
                note,
                createdAt: new Date().toISOString(),
            });
        }
    }, [db]);

    const getRecordsByDate = useCallback((date: string) => {
        return records.filter(r => r.date === date);
    }, [records]);

    const saveRecords = useCallback(async (newRecords: AttendanceRecord[]) => {
        if (!db) return;
        const allDocs = await db.attendance.find().exec();
        await Promise.all(allDocs.map(d => d.remove()));
        if (newRecords.length > 0) {
            await db.attendance.bulkInsert(newRecords);
        }
    }, [db]);

    return {
        records,
        isLoaded,
        markAttendance,
        getRecordsByDate,
        saveRecords
    };
}
