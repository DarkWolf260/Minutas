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

import { useCallback } from 'react';
import type { StaffMember } from '@/types';
import { useLocalStorage } from './use-local-storage';

const PERSONNEL_STORAGE_KEY = 'app-personnel';

export function usePersonnel() {
    const [personnel, setPersonnel, isLoaded] = useLocalStorage<StaffMember[]>(
        PERSONNEL_STORAGE_KEY,
        [],
        {
            migrate: (parsed: any[]) => {
                // Migration: Ensure all members have a status if missing and specialties array
                return parsed.map((m: any) => ({
                    ...m,
                    status: m.status || 'activo',
                    specialties: m.specialties || [],
                }));
            },
            onError: (error, operation) => {
                console.error(`Failed to ${operation} personnel:`, error);
            }
        }
    );

    const addMember = useCallback((member: Omit<StaffMember, 'id'>) => {
        // Prevent generic/empty cedula duplicates if provided
        if (member.cedula && personnel.some(p => p.cedula === member.cedula)) {
            return null;
        }

        const newMember: StaffMember = {
            ...member,
            id: `personnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        setPersonnel(prev => [...prev, newMember]);
        return newMember;
    }, [setPersonnel, personnel]);

    const addMembers = useCallback((members: Omit<StaffMember, 'id'>[]) => {
        const existingCedulas = new Set(personnel.filter(p => p.cedula).map(p => p.cedula));

        const newMembers: StaffMember[] = [];
        const skippedCount = { duplicates: 0 };

        members.forEach(m => {
            if (m.cedula && existingCedulas.has(m.cedula)) {
                skippedCount.duplicates++;
                return;
            }

            newMembers.push({
                ...m,
                id: `personnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`,
            });

            if (m.cedula) existingCedulas.add(m.cedula);
        });

        if (newMembers.length > 0) {
            setPersonnel(prev => [...prev, ...newMembers]);
        }

        return { added: newMembers, skipped: skippedCount.duplicates };
    }, [setPersonnel, personnel]);

    const updateMember = useCallback((id: string, updates: Partial<StaffMember>) => {
        setPersonnel(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }, [setPersonnel]);

    const removeMember = useCallback((id: string) => {
        setPersonnel(prev => prev.filter(m => m.id !== id));
    }, [setPersonnel]);

    const removeMembers = useCallback((ids: string[]) => {
        setPersonnel(prev => prev.filter(m => !ids.includes(m.id)));
    }, [setPersonnel]);

    const savePersonnel = useCallback((newPersonnel: StaffMember[]) => {
        setPersonnel(newPersonnel);
    }, [setPersonnel]);

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
