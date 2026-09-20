'use client';

import { useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { type HistoryItem } from '@/lib/db/db';
import type { PersonnelAssignment, Staff } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Hook for managing personnel assignment history.
 * Tracks which guard and role staff members were assigned to on specific dates.
 */
export function usePersonnelHistory() {
    const db = useDatabase();
    const { currentWorkspace } = useWorkspaceManager();

    /**
     * Records assignments for a given guard/department on a specific date.
     * Creates or updates history entries for all staff members in the provided staff object.
     */
    const recordAssignments = useCallback(
        async (guardId: string, staff: Staff, date: string) => {
            if (!db || !currentWorkspace) return;

            try {
                const timestamp = new Date().toISOString();
                const historyItems: HistoryItem[] = [];

                Object.entries(staff).forEach(([roleName, staffList]) => {
                    staffList.forEach((member) => {
                        if (!member.personnel_id && !member.id) return;

                        const pId = member.personnel_id || member.id;
                        const assignment: PersonnelAssignment = {
                            id: `${pId}_${date}`,
                            workspace_id: currentWorkspace,
                            personnel_id: pId,
                            date,
                            guard_id: guardId,
                            role_name: roleName,
                            timestamp,
                        };

                        historyItems.push({
                            id: `${currentWorkspace}:assignment:${pId}:${date}`,
                            workspace_id: currentWorkspace,
                            type: 'assignment_history' as const,
                            date,
                            personnel_id: pId,
                            data: assignment
                        });
                    });
                });

                if (historyItems.length > 0) {
                    await db.history.bulkUpsert(historyItems);
                    logger.info('Recorded personnel assignments', {
                        guardId,
                        date,
                        count: historyItems.length,
                    });
                }
            } catch (error) {
                logger.error('Failed to record personnel assignments', error, {
                    guardId,
                    date,
                });
            }
        },
        [db, currentWorkspace]
    );

    /**
     * Retrieves the historical assignments for a specific personnel member.
     */
    const getPersonnelHistory = useCallback(
        async (personnelId: string): Promise<PersonnelAssignment[]> => {
            if (!db || !currentWorkspace) return [];

            try {
                const docs = await db.history
                    .find({
                        selector: {
                            workspace_id: currentWorkspace,
                            type: 'assignment_history',
                            personnel_id: personnelId,
                        },
                        sort: [{ date: 'desc' }],
                    })
                    .exec();

                return docs.map((doc) => doc.data as PersonnelAssignment);
            } catch (error) {
                logger.error('Failed to fetch personnel history', error, {
                    personnelId,
                });
                return [];
            }
        },
        [db, currentWorkspace]
    );

    /**
     * Retrieves all assignments recorded for a specific date.
     */
    const getAssignmentsByDate = useCallback(
        async (date: string): Promise<PersonnelAssignment[]> => {
            if (!db || !currentWorkspace) return [];

            try {
                const docs = await db.history
                    .find({
                        selector: {
                            workspace_id: currentWorkspace,
                            type: 'assignment_history',
                            date,
                        },
                    })
                    .exec();

                return docs.map((doc) => doc.data as PersonnelAssignment);
            } catch (error) {
                logger.error('Failed to fetch assignments by date', error, { date });
                return [];
            }
        },
        [db, currentWorkspace]
    );

    /**
     * Deletes all history records for the current workspace.
     */
    const clearAllHistory = useCallback(async () => {
        if (!db || !currentWorkspace) return;

        try {
            const docs = await db.history
                .find({
                    selector: {
                        workspace_id: currentWorkspace,
                    },
                })
                .exec();

            await db.history.bulkRemove(docs.map((d) => d.id));
            logger.info('Cleared all personnel history for workspace', {
                workspace_id: currentWorkspace,
            });
        } catch (error) {
            logger.error('Failed to clear personnel history', error);
        }
    }, [db, currentWorkspace]);

    return {
        recordAssignments,
        getPersonnelHistory,
        getHistory: getPersonnelHistory,
        getAssignmentsByDate,
        clearAllHistory,
        clearAllPersonnelHistory: clearAllHistory,
    };
}
