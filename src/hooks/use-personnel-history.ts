'use client';

import { useCallback } from 'react';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { type HistoryItem } from '@/lib/db/db';
import type { PersonnelAssignment, Staff } from '@/types';
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
                        if (!member.personnelId && !member.id) return;

                        const pId = member.personnelId || member.id;
                        const assignment: PersonnelAssignment = {
                            id: `${pId}_${date}`,
                            workspaceId: currentWorkspace,
                            personnelId: pId,
                            date,
                            guardId,
                            roleName,
                            timestamp,
                        };

                        historyItems.push({
                            id: `${currentWorkspace}:assignment:${pId}:${date}`,
                            workspaceId: currentWorkspace,
                            type: 'assignment_history' as const,
                            date,
                            personnelId: pId,
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
                        workspaceId: currentWorkspace
                    });
                }
            } catch (error) {
                logger.error('Failed to record personnel assignments', error, {
                    feature: 'PersonnelHistory',
                    workspaceId: currentWorkspace,
                    metadata: { guardId, date },
                });
            }
        },
        [db, currentWorkspace]
    );

    /**
     * Fetches the assignment history for a specific personnel member.
     */
    const getHistory = useCallback(
        async (personnelId: string) => {
            if (!db || !currentWorkspace) return [];

            try {
                const docs = await db.history
                    .find({
                        selector: { 
                            type: 'assignment_history',
                            workspaceId: currentWorkspace,
                            personnelId 
                        },
                        sort: [{ date: 'desc' }],
                    })
                    .exec();

                return docs.map((d: any) => {
                    const json = d.toJSON();
                    return { ...(json.data as PersonnelAssignment), workspaceId: currentWorkspace };
                }) as PersonnelAssignment[];
            } catch (error) {
                logger.error('Failed to fetch personnel history', error, {
                    feature: 'PersonnelHistory',
                    workspaceId: currentWorkspace,
                    metadata: { personnelId },
                });
                return [];
            }
        },
        [db, currentWorkspace]
    );

    /**
     * Fetches the assignment for a specific personnel member on a specific date.
     */
    const getAssignmentForDate = useCallback(
        async (personnelId: string, date: string) => {
            if (!db || !currentWorkspace) return null;

            try {
                const doc = await db.history.findOne(`${currentWorkspace}:assignment:${personnelId}:${date}`).exec();
                if (doc) {
                    const json = doc.toJSON();
                    return { ...(json.data as PersonnelAssignment), workspaceId: currentWorkspace };
                }
                return null;
            } catch (error) {
                logger.error('Failed to fetch assignment for date', error, {
                    feature: 'PersonnelHistory',
                    workspaceId: currentWorkspace,
                    metadata: { personnelId, date },
                });
                return null;
            }
        },
        [db, currentWorkspace]
    );

    return {
        recordAssignments,
        getHistory,
        getAssignmentForDate,
    };
}
