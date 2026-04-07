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
import type { StaffMember, StaffRole, Department } from '@/lib/types';
import { validatePersonnel } from '@/lib/validations/personnel';
import { generateId } from '@/lib/utils/id';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { RANK_OPTIONS, STATUS_OPTIONS } from '@/lib/constants/personnel';

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
  const { currentWorkspace } = useWorkspaceManager();
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplate = () => {
    const headers = ['Jerarquía', 'Nombre y Apellido', 'Cédula', 'Cargo', 'Departamento', 'Estatus'];
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
        const firstLine = lines[0];
        const startIdx = firstLine && firstLine.toLowerCase().includes('nombre') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const rawLine = lines[i];
          if (!rawLine) continue;
          const line = rawLine.trim();
          if (!line) continue;

          const [rank, name, cedula, cargo, departmentName, statusLabel] = line.split(',').map((s) => s.trim());

          // Find department ID by name
          const dept = departments.find(d => d.name.toLowerCase() === (departmentName || '').toLowerCase());
          
          // Find status value by label
          const statusValue = STATUS_OPTIONS.find(s => s.label.toLowerCase() === (statusLabel || '').toLowerCase())?.value || 'activo';

          // Validate using Zod
          const validation = validatePersonnel({
            name,
            cedula,
            rank,
            roleId: cargo, // Map CSV "Cargo" to roleId
            department: dept?.id || departmentName,
          });

          if (!validation.success) {
            errors.push(`Fila ${i + 1}: ${validation.error}`);
            continue;
          }

          newMembers.push({
            id: generateId('personnel'),
            workspaceId: currentWorkspace || '',
            ...validation.data,
            status: statusValue as any,
          } as StaffMember);
        }

        if (errors.length > 0) {
          toast.error(`Errores encontrados:\n${errors.slice(0, 3).join('\n')}`);
        } else if (newMembers.length > 0) {
          onImport(newMembers);
          toast.success(`${newMembers.length} funcionarios importados`);
        }
      } catch {
        toast.error('Error al procesar el archivo CSV');
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleExport = () => {
    const headers = ['Jerarquía', 'Nombre y Apellido', 'Cédula', 'Cargo', 'Departamento', 'Estatus'];
    
    const deptMap = new Map(departments.map(d => [d.id, d.name]));
    const statusMap = new Map(STATUS_OPTIONS.map(s => [s.value, s.label]));

    const rows = personnel.map((p) => [
      p.rank || '',
      p.name,
      p.cedula || '',
      p.roleId || p.cargo || '', // Mapping institutional role to Cargo column
      deptMap.get(p.department || '') || p.department || '',
      statusMap.get(p.status || 'activo') || 'Activo',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

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
