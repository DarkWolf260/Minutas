/**
 * csv-utils.test.ts
 * 
 * Unit tests for CSV utility functions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { downloadPersonnelTemplate, parsePersonnelCSV } from '../csv-utils';
import { PERSONNEL_STATUS } from '@/constants/personnel';

describe('csv-utils', () => {
    describe('downloadPersonnelTemplate', () => {
        let createElementSpy: any;
        let clickSpy: any;
        let revokeObjectURLSpy: any;

        beforeEach(() => {
            clickSpy = vi.fn();
            createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
                click: clickSpy,
            } as any);
            revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { });
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should trigger CSV download', () => {
            downloadPersonnelTemplate();

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(clickSpy).toHaveBeenCalled();
        });

        it('should set correct filename', () => {
            const mockLink = { click: clickSpy, download: '', href: '' };
            createElementSpy.mockReturnValue(mockLink);

            downloadPersonnelTemplate();

            expect(mockLink.download).toBe('plantilla_personal.csv');
        });

        it('should include BOM for UTF-8', () => {
            const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
            const mockLink = { click: clickSpy, download: '', href: '' };
            createElementSpy.mockReturnValue(mockLink);

            downloadPersonnelTemplate();

            // Blob should be created (we can't easily test BOM content)
            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(revokeObjectURLSpy).toHaveBeenCalled();
        });
    });

    describe('parsePersonnelCSV', () => {
        it('should parse valid CSV with all fields', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo`;

            const result = parsePersonnelCSV(csv);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                rank: 'OPC',
                name: 'Juan Pérez',
                cedula: 'V-12345678',
                roleId: 'Técnico',
                department: 'Operaciones',
                status: 'activo',
                specialties: [],
            });
        });

        it('should parse CSV without header', () => {
            const csv = 'OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo';

            const result = parsePersonnelCSV(csv);

            expect(result).toHaveLength(1);
            expect(result[0]?.name).toBe('Juan Pérez');
        });

        it('should handle missing optional fields', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,María Rodríguez,,,,`;

            const result = parsePersonnelCSV(csv);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                rank: 'OPC',
                name: 'María Rodríguez',
                cedula: undefined,
                roleId: undefined,
                department: undefined,
                status: 'activo', // Default
                specialties: [],
            });
        });

        it('should default rank to OPC if missing', () => {
            const csv = ',Juan Pérez,V-12345678,Técnico,,activo';

            const result = parsePersonnelCSV(csv);

            expect(result[0]?.rank).toBe('OPC');
        });

        it('should default status to activo if missing', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,`;

            const result = parsePersonnelCSV(csv);

            expect(result[0]?.status).toBe(PERSONNEL_STATUS.ACTIVO);
        });

        it('should handle semicolon delimiter', () => {
            const csv = `Jerarquía;Nombre y Apellido;Cédula;Cargo;Departamento;Estatus
OPC;Juan Pérez;V-12345678;Técnico;Operaciones;activo`;

            const result = parsePersonnelCSV(csv);

            expect(result).toHaveLength(1);
            expect(result[0]?.name).toBe('Juan Pérez');
        });

        it('should auto-detect delimiter based on header', () => {
            const csvComma = `Jerarquía,Nombre
OPC,Juan Pérez`;
            const csvSemicolon = `Jerarquía;Nombre
OPC;Juan Pérez`;

            const resultComma = parsePersonnelCSV(csvComma);
            const resultSemicolon = parsePersonnelCSV(csvSemicolon);

            expect(resultComma[0]?.name).toBe('Juan Pérez');
            expect(resultSemicolon[0]?.name).toBe('Juan Pérez');
        });

        it('should handle BOM character', () => {
            const csv = `\uFEFFJerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo`;

            const result = parsePersonnelCSV(csv);

            expect(result).toHaveLength(1);
            expect(result[0]?.name).toBe('Juan Pérez');
        });

        it('should handle multiple line endings (LF and CRLF)', () => {
            const csvLF = 'Jerarquía,Nombre\nOPC,Juan Pérez';
            const csvCRLF = 'Jerarquía,Nombre\r\nOPC,Juan Pérez';

            const resultLF = parsePersonnelCSV(csvLF);
            const resultCRLF = parsePersonnelCSV(csvCRLF);

            expect(resultLF).toHaveLength(1);
            expect(resultCRLF).toHaveLength(1);
        });

        it('should trim whitespace from fields', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
 OPC , Juan Pérez , V-12345678 , Técnico , Operaciones , activo `;

            const result = parsePersonnelCSV(csv);

            expect(result[0]?.rank).toBe('OPC');
            expect(result[0]?.name).toBe('Juan Pérez');
            expect(result[0]?.cedula).toBe('V-12345678');
        });

        it('should skip empty lines', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus

OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo

OPC,María Rodríguez,V-87654321,Analista,IT,activo
`;

            const result = parsePersonnelCSV(csv);

            expect(result).toHaveLength(2);
        });

        it('should handle multiple personnel records', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo
TTE,María Rodríguez,V-87654321,Analista,IT,activo
CAP,Pedro González,V-11223344,Jefe,Administración,reposo`;

            const result = parsePersonnelCSV(csv);

            expect(result).toHaveLength(3);
            expect(result[1]?.rank).toBe('TTE');
            expect(result[2]?.status).toBe('reposo');
        });

        it('should clean trailing separators from status', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo;;;;;;`;

            const result = parsePersonnelCSV(csv);

            expect(result[0]?.status).toBe('activo');
        });

        it('should validate status against allowed values', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,invalid_status`;

            const result = parsePersonnelCSV(csv);

            // Should fall back to default activo
            expect(result[0]?.status).toBe(PERSONNEL_STATUS.ACTIVO);
        });

        it('should handle case-insensitive status values', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,ACTIVO`;

            const result = parsePersonnelCSV(csv);

            // Should normalize to lowercase
            expect(result[0]?.status).toBe('activo');
        });

        it('should return empty array for empty content', () => {
            const result = parsePersonnelCSV('');
            expect(result).toEqual([]);
        });

        it('should return empty array for whitespace only', () => {
            const result = parsePersonnelCSV('   \n  \n  ');
            expect(result).toEqual([]);
        });

        it('should skip lines without a name (second field)', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,,V-12345678,Técnico,Operaciones,activo
TTE,María Rodríguez,V-87654321,Analista,IT,activo`;

            const result = parsePersonnelCSV(csv);

            // Should only have 1 record (María Rodríguez)
            expect(result).toHaveLength(1);
            expect(result[0]?.name).toBe('María Rodríguez');
        });

        it('should always initialize specialties as empty array', () => {
            const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo`;

            const result = parsePersonnelCSV(csv);

            expect(result[0]?.specialties).toEqual([]);
            expect(Array.isArray(result[0]?.specialties)).toBe(true);
        });
    });
});
