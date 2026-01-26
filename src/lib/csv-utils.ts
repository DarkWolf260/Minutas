/**
 * Utility functions for CSV operations
 */

import { StaffMember } from '@/types';
import { PERSONNEL_STATUS } from '@/constants/personnel';

/**
 * Downloads a template CSV file for personnel import
 */
export const downloadPersonnelTemplate = () => {
    const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus\nOPC,Juan Pérez,V-12345678,Técnico,,${PERSONNEL_STATUS.ACTIVO}`;
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_personal.csv';
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Parses a CSV content string into personnel objects
 */
export const parsePersonnelCSV = (content: string): Omit<StaffMember, 'id'>[] => {
    // Handle BOM and split lines robustly
    const cleanContent = content.replace(/^\uFEFF/, '');
    const lines = cleanContent.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) return [];

    const header = lines[0];
    if (header === undefined) return [];

    // Auto-detect delimiter
    const delimiter = header.includes(';') ? ';' : ',';

    const startIdx = header.toLowerCase().includes('nombre') ? 1 : 0;
    const importedMembers: Omit<StaffMember, 'id'>[] = [];

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const trimmedLine = line.trim();
        const parts = trimmedLine.split(delimiter).map(p => p.trim());

        if (parts.length >= 2 && parts[1]) {
            // Clean status from potential trailing separators (like Activo;;;;;;)
            let statusValue = (parts[5] || PERSONNEL_STATUS.ACTIVO).toLowerCase();
            statusValue = statusValue.replace(/[;,\s]+$/, '');

            // Validate status against allowed types
            const validStatuses = Object.values(PERSONNEL_STATUS);
            const status = validStatuses.includes(statusValue as any) ? (statusValue as any) : PERSONNEL_STATUS.ACTIVO;

            importedMembers.push({
                rank: parts[0] || 'OPC',
                name: parts[1],
                cedula: parts[2] || undefined,
                roleId: parts[3] || undefined,
                department: parts[4] || undefined,
                status: status,
                specialties: [],
            });
        }
    }

    return importedMembers;
};
