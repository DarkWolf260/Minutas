
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const ATTENDANCE_STORAGE_KEY = 'app-attendance';

export function useAttendance() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedRecords = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
            if (storedRecords) {
                setRecords(JSON.parse(storedRecords));
            }
        } catch (error) {
            console.error('Failed to load attendance from localStorage', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveRecords = useCallback((newRecords: AttendanceRecord[]) => {
        setRecords(newRecords);
        try {
            localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(newRecords));
        } catch (error) {
            console.error('Failed to save attendance to localStorage', error);
        }
    }, []);

    const markAttendance = useCallback((memberId: string, date: string, status: AttendanceStatus, checkInTime?: string, note?: string) => {
        const newRecords = [...records];
        const existingIndex = newRecords.findIndex(r => r.memberId === memberId && r.date === date);

        if (existingIndex > -1) {
            newRecords[existingIndex] = {
                ...newRecords[existingIndex],
                status,
                checkInTime: checkInTime || newRecords[existingIndex].checkInTime,
                note: note || newRecords[existingIndex].note,
            };
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

        saveRecords(newRecords);
    }, [records, saveRecords]);

    const getRecordsByDate = useCallback((date: string) => {
        return records.filter(r => r.date === date);
    }, [records]);

    return {
        records,
        isLoaded,
        markAttendance,
        getRecordsByDate,
        saveRecords
    };
}
