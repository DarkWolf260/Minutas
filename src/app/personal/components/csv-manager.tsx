/**
 * Example CSV Manager Component
 * Extracted from personal/page.tsx for better organization
 * 
 * NOTE: This is a demonstration component showing the refactoring approach.
 * The original personal/page.tsx still contains the full implementation.
 * To use this, you would replace the CSV section in personal/page.tsx with:
 * <CSVManager personnel={personnel} roles={roles} departments={departments} onImport={handleImport} />
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { StaffMember, StaffRole, Department } from '@/types';
import { validatePersonnel } from '@/lib/validations/personnel';
import { RANK_OPTIONS } from '@/constants/personnel';

interface CSVManagerProps {
    personnel: StaffMember[];
    roles: StaffRole[];
    departments: Department[];
    onImport: (members: StaffMember[]) => void;
}

/**
 * CSV Manager for importing and exporting personnel data
 */
export function CSVManager({ personnel, roles, departments, onImport }: CSVManagerProps) {
    const [isImporting, setIsImporting] = useState(false);

    const downloadTemplate = () => {
        const headers = ['Jerarquía', 'Nombre', 'Cédula', 'Cargo', 'Departamento'];
        const csvContent = headers.join(',') + '\n';
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'plantilla_personal.csv';
        link.click();
        toast.success('Plantilla descargada');
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const lines = content.split('\n');
                const newMembers: StaffMember[] = [];
                const errors: string[] = [];

                // Skip header
                const startIdx = lines[0].toLowerCase().includes('nombre') ? 1 : 0;

                for (let i = startIdx; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const [rank, name, cedula, role, department] = line.split(',').map(s => s.trim());

                    // Validate using Zod
                    const validation = validatePersonnel({
                        name,
                        cedula,
                        rank,
                        role,
                        department,
                    });

                    if (!validation.success) {
                        errors.push(`Fila ${i + 1}: ${validation.error}`);
                        continue;
                    }

                    // Check role exists
                    if (role && !roles.find(r => r.name.toLowerCase() === role.toLowerCase())) {
                        errors.push(`Fila ${i + 1}: Cargo "${role}" no existe.`);
                        continue;
                    }

                    // Check department exists
                    if (department && !departments.find(d => d.name.toLowerCase() === department.toLowerCase())) {
                        errors.push(`Fila ${i + 1}: Departamento "${department}" no existe.`);
                        continue;
                    }

                    newMembers.push({
                        id: `personnel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`,
                        ...validation.data,
                        status: 'activo',
                    });
                }

                if (errors.length > 0) {
                    toast.error(`Errores encontrados:\n${errors.slice(0, 3).join('\n')}`);
                } else if (newMembers.length > 0) {
                    onImport(newMembers);
                    toast.success(`${newMembers.length} funcionarios importados`);
                }
            } catch (error) {
                toast.error('Error al procesar el archivo CSV');
            } finally {
                setIsImporting(false);
                event.target.value = '';
            }
        };

        reader.readAsText(file, 'UTF-8');
    };

    const handleExport = () => {
        const headers = ['Jerarquía', 'Nombre', 'Cédula', 'Cargo', 'Departamento'];
        const rows = personnel.map(p => [
            p.rank || '',
            p.name,
            p.cedula || '',
            '', // Role would need to be looked up
            p.department || '',
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `personal_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Datos exportados');
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Plantilla
            </Button>
            <label>
                <Button variant="outline" size="sm" disabled={isImporting} asChild>
                    <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {isImporting ? 'Importando...' : 'Importar CSV'}
                    </span>
                </Button>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isImporting}
                />
            </label>
            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
            </Button>
        </div>
    );
}
