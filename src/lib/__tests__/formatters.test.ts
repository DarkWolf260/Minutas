/**
 * formatters.test.ts
 * 
 * Unit tests for data formatting utility functions
 */

import { describe, it, expect } from 'vitest';
import {
    formatStaffMemberForDisplay,
    formatStaffMemberForAutocomplete,
    formatStaffMember,
} from '../formatters';
import type { StaffMember } from '@/types';

// Mock data factory
function createMockStaffMember(overrides: Partial<StaffMember> = {}): StaffMember {
    return {
        id: 'staff-1',
        workspaceId: 'workspace-1',
        name: 'Juan Pérez',
        cedula: '12345678',
        rank: undefined, // Default to no rank to keep existing name-only tests working
        roleId: 'officer',
        status: 'activo',
        department: 'operations',
        specialties: [],
        ...overrides,
    };
}

describe('formatters', () => {
    describe('formatStaffMemberForDisplay', () => {
        it('should return staff member name when passed a StaffMember object', () => {
            const member = createMockStaffMember({ name: 'Carlos García' });
            const result = formatStaffMemberForDisplay(member);
            expect(result).toBe('Carlos García');
        });

        it('should return the same string when passed a string', () => {
            const result = formatStaffMemberForDisplay('John Doe');
            expect(result).toBe('John Doe');
        });

        it('should handle staff member with no cedula', () => {
            const member = createMockStaffMember({ name: 'Ana López', cedula: undefined });
            const result = formatStaffMemberForDisplay(member);
            expect(result).toBe('Ana López');
        });

        it('should handle staff member with only name', () => {
            const member = createMockStaffMember({
                name: 'Maria Rodriguez',
                rank: undefined,
                cedula: undefined,
            });
            const result = formatStaffMemberForDisplay(member);
            expect(result).toBe('Maria Rodriguez');
        });

        it('should handle empty string input', () => {
            const result = formatStaffMemberForDisplay('');
            expect(result).toBe('');
        });
    });

    describe('formatStaffMemberForAutocomplete', () => {
        it('should return only name when withCedula is false', () => {
            const member = createMockStaffMember({ name: 'Pedro Sánchez', cedula: '98765432' });
            const result = formatStaffMemberForAutocomplete(member, false);
            expect(result).toBe('Pedro Sánchez');
        });

        it('should include cedula when withCedula is true and cedula exists', () => {
            const member = createMockStaffMember({ name: 'Luis Martínez', cedula: '11111111' });
            const result = formatStaffMemberForAutocomplete(member, true);
            expect(result).toBe('Luis Martínez 11111111');
        });

        it('should return only name when withCedula is true but cedula is missing', () => {
            const member = createMockStaffMember({ name: 'Sofia Torres', cedula: undefined });
            const result = formatStaffMemberForAutocomplete(member, true);
            expect(result).toBe('Sofia Torres');
        });

        it('should return only name when withCedula is true but cedula is empty string', () => {
            const member = createMockStaffMember({ name: 'Diego Ramirez', cedula: '' });
            const result = formatStaffMemberForAutocomplete(member, true);
            expect(result).toBe('Diego Ramirez');
        });

        it('should handle name with special characters', () => {
            const member = createMockStaffMember({
                name: 'José María Ñ-Úñez',
                cedula: '22222222',
                rank: 'Teniente'
            });
            const result = formatStaffMemberForAutocomplete(member, true);
            expect(result).toBe('Teniente José María Ñ-Úñez 22222222');
        });

        it('should handle very long names', () => {
            const member = createMockStaffMember({
                name: 'Juan Carlos Alberto Francisco de la Cruz López García',
                cedula: '33333333'
            });
            const result = formatStaffMemberForAutocomplete(member, true);
            expect(result).toBe('Juan Carlos Alberto Francisco de la Cruz López García 33333333');
        });
    });

    describe('formatStaffMember', () => {
        it('should return only name when showCedula is false', () => {
            const member = createMockStaffMember({ name: 'Roberto Silva', cedula: '44444444' });
            const result = formatStaffMember(member, false);
            expect(result).toBe('Roberto Silva');
        });

        it('should return name with cedula in parentheses when showCedula is true', () => {
            const member = createMockStaffMember({ name: 'Andrea Morales', cedula: '55555555' });
            const result = formatStaffMember(member, true);
            expect(result).toBe('Andrea Morales (55555555)');
        });

        it('should use default showCedula=false when not provided', () => {
            const member = createMockStaffMember({ name: 'Miguel Ángel', cedula: '66666666' });
            const result = formatStaffMember(member);
            expect(result).toBe('Miguel Ángel');
        });

        it('should return only name when showCedula is true but cedula is missing', () => {
            const member = createMockStaffMember({ name: 'Valentina Cruz', cedula: undefined });
            const result = formatStaffMember(member, true);
            expect(result).toBe('Valentina Cruz');
        });

        it('should return only name when showCedula is true but cedula is empty string', () => {
            const member = createMockStaffMember({ name: 'Sebastián Díaz', cedula: '' });
            const result = formatStaffMember(member, true);
            expect(result).toBe('Sebastián Díaz');
        });

        it('should return empty string when member is null', () => {
            const result = formatStaffMember(null as any);
            expect(result).toBe('');
        });

        it('should return empty string when member is undefined', () => {
            const result = formatStaffMember(undefined as any);
            expect(result).toBe('');
        });

        it('should handle cedula with dashes and special formatting', () => {
            const member = createMockStaffMember({
                name: 'Carolina Vega',
                cedula: '1-2345-6789'
            });
            const result = formatStaffMember(member, true);
            expect(result).toBe('Carolina Vega (1-2345-6789)');
        });

        it('should handle all fields populated correctly', () => {
            const member = createMockStaffMember({
                name: 'Fernando Ruiz',
                cedula: '77777777',
                rank: 'Capitán',
                roleId: 'commander',
            });
            const result = formatStaffMember(member, true);
            expect(result).toBe('Capitán Fernando Ruiz (77777777)');
        });
    });

    describe('Edge Cases', () => {
        it('formatStaffMemberForDisplay should handle object with extra properties', () => {
            const member = createMockStaffMember({
                name: 'Test User',
                // @ts-expect-error - Testing runtime behavior with extra properties
                extraProp: 'should be ignored'
            });
            const result = formatStaffMemberForDisplay(member);
            expect(result).toBe('Test User');
        });

        it('formatStaffMemberForAutocomplete should handle whitespace in cedula', () => {
            const member = createMockStaffMember({
                name: 'Test User',
                cedula: '  88888888  '
            });
            const result = formatStaffMemberForAutocomplete(member, true);
            expect(result).toBe('Test User   88888888  ');
        });

        it('formatStaffMember should handle numeric-looking name', () => {
            const member = createMockStaffMember({
                name: '12345',
                cedula: '99999999'
            });
            const result = formatStaffMember(member, true);
            expect(result).toBe('12345 (99999999)');
        });
    });

    describe('Integration Scenarios', () => {
        it('all formatters should work consistently for same member', () => {
            const member = createMockStaffMember({
                name: 'Integration Test',
                cedula: '00000000'
            });

            const display = formatStaffMemberForDisplay(member);
            const autocomplete = formatStaffMemberForAutocomplete(member, false);
            const formatted = formatStaffMember(member, false);

            // All should return just the name when not showing cedula
            expect(display).toBe('Integration Test');
            expect(autocomplete).toBe('Integration Test');
            expect(formatted).toBe('Integration Test');
        });

        it('cedula formats should be different between autocomplete and standard', () => {
            const member = createMockStaffMember({
                name: 'Format Test',
                cedula: '12121212'
            });

            const autocomplete = formatStaffMemberForAutocomplete(member, true);
            const formatted = formatStaffMember(member, true);

            // Autocomplete: "Name cedula" vs Standard: "Name (cedula)"
            expect(autocomplete).toBe('Format Test 12121212');
            expect(formatted).toBe('Format Test (12121212)');
        });
    });
});
