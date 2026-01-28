/**
 * Utility functions for CSV operations
 */

import { StaffMember } from '@/types';
import { PERSONNEL_STATUS } from '@/constants/personnel';

/**
 * Downloads a template CSV file for personnel import.
 * Creates a sample CSV with headers and an example row, includes UTF-8 BOM for Excel compatibility.
 * 
 * @example
 * ```typescript
 * // Trigger download in browser
 * downloadPersonnelTemplate();
 * // File "plantilla_personal.csv" will be downloaded with example data
 * ```
 * 
 * @remarks
 * - Includes BOM (\\uFEFF) for proper UTF-8 encoding in Excel
 * - Sample row shows expected format and field types
 * - Uses default "activo" status from constants
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
 * Parses CSV content string into an array of personnel objects.
 * 
 * **Features**:
 * - Auto-detects delimiter (comma or semicolon)
 * - Handles BOM character (\\uFEFF)
 * - Supports both LF and CRLF line endings
 * - Trims whitespace from all fields
 * - Validates status against allowed values
 * - Provides defaults for missing fields
 * - Skips empty lines and header row
 * 
 * @param content - Raw CSV string content
 * @returns Array of staff member objects (without id field)
 * 
 * @example
 * ```typescript
 * const csv = `Jerarquía,Nombre y Apellido,Cédula,Cargo,Departamento,Estatus
 * OPC,Juan Pérez,V-12345678,Técnico,Operaciones,activo
 * TTE,María Rodríguez,V-87654321,Analista,IT,activo`;
 * 
 * const members = parsePersonnelCSV(csv);
 * // [
 * //   { rank: 'OPC', name: 'Juan Pérez', cedula: 'V-12345678', ... },
 * //   { rank: 'TTE', name: 'María Rodríguez', cedula: 'V-87654321', ... }
 * // ]
 * ```
 * 
 * @remarks
 * **Field Mapping** (by column index):
 * - 0: Jerarquía (rank) - defaults to 'OPC'
 * - 1: Nombre y Apellido (name) - **required**
 * - 2: Cédula (cedula) - optional
 * - 3: Cargo (roleId) - optional
 * - 4: Departamento (department) - optional
 * - 5: Estatus (status) - defaults to 'activo', validated
 * 
 * **Validation**:
 * - Status must be one of PERSONNEL_STATUS values
 * - Invalid status defaults to 'activo'
 * - Rows without name (column 1) are skipped
 * - Trailing separators in status field are removed
 */
export const parsePersonnelCSV = (content: string): Omit<StaffMember, 'id'>[] => {
  // Handle BOM and split lines robustly
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim() !== '');

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
    const parts = trimmedLine.split(delimiter).map((p) => p.trim());

    if (parts.length >= 2 && parts[1]) {
      // Clean status from potential trailing separators (like Activo;;;;;;)
      let statusValue = (parts[5] || PERSONNEL_STATUS.ACTIVO).toLowerCase();
      statusValue = statusValue.replace(/[;,\s]+$/, '');

      // Validate status against allowed types
      const validStatuses = Object.values(PERSONNEL_STATUS);
      const status = validStatuses.includes(statusValue as any)
        ? (statusValue as any)
        : PERSONNEL_STATUS.ACTIVO;

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
