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

import { useCallback } from 'react';
import type { AttendanceRecord, AttendanceStatus } from '@/types';
import { useLocalStorage } from './use-local-storage';

const ATTENDANCE_STORAGE_KEY = 'app-attendance';

export function useAttendance() {
    const [records, setRecords, isLoaded] = useLocalStorage<AttendanceRecord[]>(
        ATTENDANCE_STORAGE_KEY,
        [],
        {
            onError: (error, operation) => {
                console.error(`Failed to ${operation} attendance:`, error);
            }
        }
    );

    const markAttendance = useCallback((memberId: string, date: string, status: AttendanceStatus, checkInTime?: string, note?: string) => {
        setRecords(prev => {
            const newRecords = [...prev];
            const existingIndex = newRecords.findIndex(r => r.memberId === memberId && r.date === date);

            if (existingIndex > -1) {
                const existing = newRecords[existingIndex];
                if (existing) {
                    newRecords[existingIndex] = {
                        ...existing,
                        status,
                        checkInTime: checkInTime || existing.checkInTime,
                        note: note || existing.note,
                    };
                }
            } else {
                newRecords.push({
                    id: `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    memberId,
                    date,
                    status,
                    checkInTime,
                    note,
                    createdAt: new Date().toISOString(),
                });
            }

            return newRecords;
        });
    }, [setRecords]);

    const getRecordsByDate = useCallback((date: string) => {
        return records.filter(r => r.date === date);
    }, [records]);

    const saveRecords = useCallback((newRecords: AttendanceRecord[]) => {
        setRecords(newRecords);
    }, [setRecords]);

    return {
        records,
        isLoaded,
        markAttendance,
        getRecordsByDate,
        saveRecords
    };
}
