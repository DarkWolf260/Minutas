
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffMember } from '@/types';

const PERSONNEL_STORAGE_KEY = 'app-personnel';

export function usePersonnel() {
    const [personnel, setPersonnel] = useState<StaffMember[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const storedPersonnel = localStorage.getItem(PERSONNEL_STORAGE_KEY);
            if (storedPersonnel) {
                setPersonnel(JSON.parse(storedPersonnel));
            }
        } catch (error) {
            console.error('Failed to load personnel from localStorage', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const savePersonnel = useCallback((newPersonnel: StaffMember[]) => {
        setPersonnel(newPersonnel);
        try {
            localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(newPersonnel));
        } catch (error) {
            console.error('Failed to save personnel to localStorage', error);
        }
    }, []);

    const addMember = useCallback((member: Omit<StaffMember, 'id'>) => {
        const newMember: StaffMember = {
            ...member,
            id: `personnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        const updated = [...personnel, newMember];
        savePersonnel(updated);
        return newMember;
    }, [personnel, savePersonnel]);

    const updateMember = useCallback((id: string, updates: Partial<StaffMember>) => {
        const updated = personnel.map(m => m.id === id ? { ...m, ...updates } : m);
        savePersonnel(updated);
    }, [personnel, savePersonnel]);

    const removeMember = useCallback((id: string) => {
        const updated = personnel.filter(m => m.id !== id);
        savePersonnel(updated);
    }, [personnel, savePersonnel]);

    return {
        personnel,
        isLoaded,
        addMember,
        updateMember,
        removeMember,
        savePersonnel
    };
}
