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
        const newMember: StaffMember = {
            ...member,
            id: `personnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        setPersonnel(prev => [...prev, newMember]);
        return newMember;
    }, [setPersonnel]);

    const updateMember = useCallback((id: string, updates: Partial<StaffMember>) => {
        setPersonnel(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }, [setPersonnel]);

    const removeMember = useCallback((id: string) => {
        setPersonnel(prev => prev.filter(m => m.id !== id));
    }, [setPersonnel]);

    const savePersonnel = useCallback((newPersonnel: StaffMember[]) => {
        setPersonnel(newPersonnel);
    }, [setPersonnel]);

    return {
        personnel,
        isLoaded,
        addMember,
        updateMember,
        removeMember,
        savePersonnel
    };
}
