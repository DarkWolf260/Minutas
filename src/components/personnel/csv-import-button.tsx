'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceManager } from '@/lib/db/db-context';
import type { StaffMember } from '@/types';

interface CsvImportButtonProps {
    onImport: (members: Omit<StaffMember, 'id'>[]) => Promise<{ added: StaffMember[]; skipped: number } | undefined>;
    personnel: StaffMember[];
}

/** 
 * Parsea el estado del CSV a un valor válido de PersonnelStatus
 */
function parseStatus(raw: string): StaffMember['status'] {
    const s = raw.toLowerCase().trim();
    if (s === 'activo' || s === 'active') return 'activo';
    if (s === 'vacaciones' || s === 'vacation') return 'vacaciones';
    if (s === 'permiso' || s === 'leave') return 'permiso';
    if (s === 'reposo' || s === 'rest') return 'reposo';
    if (s === 'apoyo' || s === 'support') return 'activo';
    return 'activo'; // default
}

/**
 * Botón de importación / exportación de personal por CSV.
 *
 * Columnas esperadas (en cualquier orden de cabecera, insensible a case+acentos):
 *   Jerarquía | Nombre y Apellido | Cédula | Cargo | Departamento | Estatus
 */
export function CsvImportButton({ onImport, personnel }: CsvImportButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { currentWorkspace } = useWorkspaceManager();
    const [importing, setImporting] = useState(false);

    const normalizeValue = (s: string) =>
        s.trim().replace(/^["']|["']$/g, '').trim();

    // --- Normalize header key (remove quotes, accents, lowercase, spaces to underscore) ---
    const normalize = (s: string) =>
        s.trim()
            .replace(/^\ufeff/, '') // Remove BOM
            .replace(/^["']|["']$/g, '') // Remove quotes
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, '_');

    const COLUMN_MAP: Record<string, keyof Omit<StaffMember, 'id'>> = {
        jerarquia: 'rank',
        rank: 'rank',
        nombre_y_apellido: 'name',
        nombre_completo: 'name',
        nombre: 'name',
        apellido: 'name',
        cedula: 'cedula',
        id: 'cedula',
        cargo: 'cargo' as keyof Omit<StaffMember, 'id'>,
        rol: 'cargo' as keyof Omit<StaffMember, 'id'>,
        departamento: 'department',
        unidad: 'department',
        estatus: 'status',
        estado: 'status',
        titulo: 'titulo' as keyof Omit<StaffMember, 'id'>,
        titulo_academico: 'titulo' as keyof Omit<StaffMember, 'id'>,
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (ev) => {
            try {
                const raw = ev.target?.result as string;
                // Strip BOM if present
                const content = raw.startsWith('\uFEFF') ? raw.slice(1) : raw;
                const lines = content.split(/\r?\n/).filter((l) => l.trim());

                if (lines.length < 2) {
                    toast.error('El archivo CSV está vacío o no tiene datos.');
                    return;
                }

                // Detect delimiter (, or ;) based on frequency in header
                const firstLine = lines[0]!;
                const countCommas = (firstLine.match(/,/g) || []).length;
                const countSemicolons = (firstLine.match(/;/g) || []).length;
                const delimiter = countSemicolons > countCommas ? ';' : ',';

                // Parse header - strip quotes from each header
                const headers = firstLine.split(delimiter).map(h => normalize(h));
                const colIdx = (key: string) => headers.indexOf(normalize(key));

                // Build column indices from COLUMN_MAP
                const fieldIndices = new Map<keyof Omit<StaffMember, 'id'>, number>();
                headers.forEach((h, i) => {
                    const field = COLUMN_MAP[h];
                    if (field !== undefined && !fieldIndices.has(field)) {
                        fieldIndices.set(field, i);
                    }
                });

                if (!fieldIndices.has('name')) {
                    toast.error("El CSV debe tener una columna 'Nombre y Apellido' o 'Nombre'.");
                    return;
                }

                // Parse rows
                const members: Omit<StaffMember, 'id'>[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i]!.trim();
                    if (!line) continue;

                    // Improved split considering quotes, but simple enough for our needs
                    // If delimiter is a comma, we use a slightly more advanced split
                    let cols: string[] = [];
                    if (delimiter === ',') {
                        // Regex to split by comma NOT inside quotes
                        cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => normalizeValue(c));
                    } else {
                        cols = line.split(';').map(c => normalizeValue(c));
                    }

                    const getCol = (field: keyof Omit<StaffMember, 'id'>) => {
                        const idx = fieldIndices.get(field);
                        return idx !== undefined ? (cols[idx] ?? '') : '';
                    };

                    const name = getCol('name');
                    if (!name) continue; // skip empty rows

                    const rawStatus = getCol('status');
                    const rawCargo = getCol('cargo' as keyof Omit<StaffMember, 'id'>);
                    const rawTitulo = getCol('titulo' as keyof Omit<StaffMember, 'id'>);

                    members.push({
                        workspaceId: currentWorkspace || '',
                        name,
                        cedula: getCol('cedula') || undefined,
                        rank: getCol('rank') || undefined,
                        cargo: rawCargo || undefined,
                        titulo: rawTitulo || undefined,
                        department: getCol('department') || undefined,
                        status: rawStatus ? parseStatus(rawStatus) : 'activo',
                    } as Omit<StaffMember, 'id'>);
                }

                if (members.length === 0) {
                    toast.error('No se encontraron filas válidas en el CSV.');
                    return;
                }

                const result = await onImport(members);
                if (result) {
                    const { added, skipped } = result;
                    if (added.length > 0) {
                        toast.success(
                            `${added.length} funcionario${added.length > 1 ? 's' : ''} importado${added.length > 1 ? 's' : ''}` +
                            (skipped > 0 ? ` (${skipped} omitido${skipped > 1 ? 's' : ''} por cédula duplicada)` : '')
                        );
                    } else if (skipped > 0) {
                        toast.warning(`Todos los registros ya existen (${skipped} cédula${skipped > 1 ? 's' : ''} duplicada${skipped > 1 ? 's' : ''}).`);
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error('Error al procesar el archivo CSV.');
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsText(file, 'UTF-8');
    };

    const handleExport = () => {
        const headers = ['Jerarquía', 'Nombre y Apellido', 'Cédula', 'Cargo', 'Departamento', 'Estatus', 'Título Académico'];
        const rows = personnel.map((p) => [
            p.rank ?? '',
            p.name,
            p.cedula ?? '',
            p.cargo || p.roleId || '',
            p.department ?? '',
            p.status ?? 'activo',
            p.titulo ?? '',
        ]);
        const csv = [headers, ...rows]
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `personal_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Exportación lista');
    };

    return (
        <div className="flex gap-2">
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={importing}
            />
            <Button
                variant="outline"
                size="sm"
                className="shadow-sm gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
            >
                <Download className="h-4 w-4" />
                {importing ? 'Importando…' : 'Importar CSV'}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="shadow-sm gap-1.5"
                onClick={handleExport}
            >
                <Upload className="h-4 w-4" />
                Exportar CSV
            </Button>
        </div>
    );
}
