/**
 * Hook for managing personnel/staff members with localStorage persistence.
 * 
 * Manages CRUD operations for personnel data with automatic migration support
 * for adding default status and specialties fields to existing records.
 * 
 * @returns Personnel state and operations
 * @property {StaffMember[]} personnel - List of all personnel members
 * @property {(member: Partial<StaffMember>) => void} addMember - Add a new member
 * @property {(id: string, updates: Partial<StaffMember>) => void} updateMember - Update existing member
 * @property {(id: string) => void} removeMember - Remove a member
 * @property {(newPersonnel: StaffMember[]) => void} savePersonnel - Batch update personnel
 * @property {boolean} isLoaded - Loading state indicator
 * 
 * @example
 * ```tsx
 * const { personnel, addMember, updateMember, isLoaded } = usePersonnel();
 * 
 * // Wait for data to load
 * if (!isLoaded) return <Loading />;
 * 
 * // Add new member
 * addMember({ name: 'Juan Pérez', cedula: 'V-12345678', rank: 'SGT' });
 * 
 * // Update member
 * updateMember('member-id', { status: 'vacaciones' });
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffMember } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';

export function usePersonnel() {
    const db = useDatabase();
    const [personnel, setPersonnel] = useState<StaffMember[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!db) return;

        const sub = db.personnel.find().$.subscribe(data => {
            setPersonnel(data.map(d => d.toJSON()) as StaffMember[]);
            setIsLoaded(true);
        });

        return () => sub.unsubscribe();
    }, [db]);

    const addMember = useCallback(async (member: Omit<StaffMember, 'id'>) => {
        if (!db) return null;

        // Prevent generic/empty cedula duplicates if provided
        if (member.cedula && personnel.some(p => p.cedula === member.cedula)) {
            return null;
        }

        const newMember: StaffMember = {
            ...member,
            id: `personnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        await db.personnel.insert(newMember);
        return newMember;
    }, [db, personnel]);

    const addMembers = useCallback(async (members: Omit<StaffMember, 'id'>[]) => {
        if (!db) return { added: [], skipped: 0 };

        const existingCedulas = new Set(personnel.filter(p => p.cedula).map(p => p.cedula));
        const newMembers: StaffMember[] = [];
        let skippedCount = 0;

        members.forEach(m => {
            if (m.cedula && existingCedulas.has(m.cedula)) {
                skippedCount++;
                return;
            }

            const id = `personnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;
            newMembers.push({ ...m, id });

            if (m.cedula) existingCedulas.add(m.cedula);
        });

        if (newMembers.length > 0) {
            await db.personnel.bulkInsert(newMembers);
        }

        return { added: newMembers, skipped: skippedCount };
    }, [db, personnel]);

    const updateMember = useCallback(async (id: string, updates: Partial<StaffMember>) => {
        if (!db) return;
        const doc = await db.personnel.findOne(id).exec();
        if (doc) {
            await doc.patch(updates);
        }
    }, [db]);

    const removeMember = useCallback(async (id: string) => {
        if (!db) return;
        const doc = await db.personnel.findOne(id).exec();
        if (doc) {
            await doc.remove();
        }
    }, [db]);

    const removeMembers = useCallback(async (ids: string[]) => {
        if (!db) return;
        const query = db.personnel.find({
            selector: {
                id: { $in: ids }
            }
        });
        await query.remove();
    }, [db]);

    const savePersonnel = useCallback(async (newPersonnel: StaffMember[]) => {
        if (!db) return;
        // In RxDB, "savePersonnel" (batch update everything) is less common, 
        // but we can implement it by removing all and inserting new ones if needed,
        // or better, just leave it as it's mostly used for imports or complex sync.
        // For compatibility with old API:
        const allDocs = await db.personnel.find().exec();
        await Promise.all(allDocs.map(d => d.remove()));
        if (newPersonnel.length > 0) {
            await db.personnel.bulkInsert(newPersonnel);
        }
    }, [db]);

    const isCedulaDuplicate = useCallback((cedula: string, excludeId?: string) => {
        if (!cedula) return false;
        return personnel.some(p => p.cedula === cedula && p.id !== excludeId);
    }, [personnel]);

    return {
        personnel,
        isLoaded,
        addMember,
        addMembers,
        updateMember,
        removeMember,
        removeMembers,
        savePersonnel,
        isCedulaDuplicate
    };
}
