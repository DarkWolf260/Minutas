/**
 * Hook for managing personnel attendance records with RxDB persistence.
 *
 * Tracks daily attendance using RxDB. Provides date-based filtering and operations.
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
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { generateId } from '@/lib/utils/id';

export function useAttendance() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.history.find({
      selector: { 
        type: 'attendance',
        workspaceId: currentWorkspace
      }
    }).$.subscribe((data) => {
      setRecords(data.map((d) => {
        const json = d.toJSON();
        return { ...(json.data as AttendanceRecord), workspaceId: currentWorkspace };
      }) as AttendanceRecord[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const markAttendance = useCallback(
    async (
      memberId: string,
      date: string,
      status: AttendanceStatus,
      checkInTime?: string,
      note?: string
    ) => {
      if (!db) return;

      const id = `${currentWorkspace}:attendance:${memberId}:${date}`;
      const existingDoc = await db.history.findOne(id).exec();

      if (existingDoc) {
        const currentData = existingDoc.toJSON().data;
        await existingDoc.patch({
          data: {
            ...currentData,
            status,
            checkInTime: checkInTime || currentData.checkInTime,
            note: note || currentData.note,
            workspaceId: currentWorkspace,
          }
        });
      } else {
        await db.history.insert({
          id,
          workspaceId: currentWorkspace,
          type: 'attendance' as const,
          date,
          personnelId: memberId,
          data: {
            id: generateId('attendance'),
            workspaceId: currentWorkspace,
            memberId,
            date,
            status,
            checkInTime,
            note,
            createdAt: new Date().toISOString(),
          }
        });
      }
    },
    [db, currentWorkspace]
  );

  const getRecordsByDate = useCallback(
    (date: string) => {
      return records.filter((r) => r.date === date);
    },
    [records]
  );

  const saveRecords = useCallback(
    async (newRecords: AttendanceRecord[]) => {
      if (!db || !currentWorkspace) return;
      const allDocs = await db.history.find({
        selector: { 
          type: 'attendance',
          workspaceId: currentWorkspace
        }
      }).exec();
      await Promise.all(allDocs.map((d) => d.remove()));
      
      if (newRecords.length > 0) {
        const docs = newRecords.map(r => ({
          id: `${currentWorkspace}:attendance:${r.memberId}:${r.date}`,
          workspaceId: currentWorkspace,
          type: 'attendance' as const,
          date: r.date,
          personnelId: r.memberId,
          data: { ...r, workspaceId: currentWorkspace }
        }));
        await db.history.bulkInsert(docs);
      }
    },
    [db, currentWorkspace]
  );

  return {
    records,
    isLoaded,
    markAttendance,
    getRecordsByDate,
    saveRecords,
  };
}
