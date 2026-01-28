'use client';

import { useCallback } from 'react';
import { useDatabase } from '@/lib/db/db-provider';
import type { PersonnelAssignment, Staff } from '@/types';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';

/**
 * Hook for managing personnel assignment history.
 * Tracks which guard and role staff members were assigned to on specific dates.
 */
export function usePersonnelHistory() {
    const db = useDatabase();

    /**
     * Records assignments for a given guard/department on a specific date.
     * Creates or updates history entries for all staff members in the provided staff object.
     */
    const recordAssignments = useCallback(
        async (guardId: string, staff: Staff, date: string) => {
            if (!db) return;

            try {
                const timestamp = new Date().toISOString();
                const assignments: PersonnelAssignment[] = [];

                Object.entries(staff).forEach(([roleName, staffList]) => {
                    staffList.forEach((member) => {
                        if (!member.personnelId && !member.id) return;

                        const pId = member.personnelId || member.id;
                        assignments.push({
                            id: `${pId}_${date}`,
                            personnelId: pId,
                            date,
                            guardId,
                            roleName,
                            timestamp,
                        });
                    });
                });

                if (assignments.length > 0) {
                    await db.personnel_assignment_history.bulkUpsert(assignments);
                    logger.info('Recorded personnel assignments', {
                        guardId,
                        date,
                        count: assignments.length,
                    });
                }
            } catch (error) {
                logger.error('Failed to record personnel assignments', error, {
                    feature: 'PersonnelHistory',
                    metadata: { guardId, date },
                });
            }
        },
        [db]
    );

    /**
     * Fetches the assignment history for a specific personnel member.
     */
    const getHistory = useCallback(
        async (personnelId: string) => {
            if (!db) return [];

            try {
                const docs = await db.personnel_assignment_history
                    .find({
                        selector: { personnelId },
                        sort: [{ date: 'desc' }],
                    })
                    .exec();

                return docs.map((d) => d.toJSON()) as PersonnelAssignment[];
            } catch (error) {
                logger.error('Failed to fetch personnel history', error, {
                    feature: 'PersonnelHistory',
                    metadata: { personnelId },
                });
                return [];
            }
        },
        [db]
    );

    /**
     * Fetches the assignment for a specific personnel member on a specific date.
     */
    const getAssignmentForDate = useCallback(
        async (personnelId: string, date: string) => {
            if (!db) return null;

            try {
                const doc = await db.personnel_assignment_history.findOne(`${personnelId}_${date}`).exec();
                return doc ? (doc.toJSON() as PersonnelAssignment) : null;
            } catch (error) {
                logger.error('Failed to fetch assignment for date', error, {
                    feature: 'PersonnelHistory',
                    metadata: { personnelId, date },
                });
                return null;
            }
        },
        [db]
    );

    return {
        recordAssignments,
        getHistory,
        getAssignmentForDate,
    };
}
