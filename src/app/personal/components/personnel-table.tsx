'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, FileEdit, Trash2, Activity } from 'lucide-react';
import type { StaffMember, PersonnelStatus } from '@/types';
import { cn } from '@/lib/utils';

interface PersonnelTableProps {
    personnel: StaffMember[];
    onEdit: (member: StaffMember) => void;
    onDelete: (id: string) => void;
    onViewHistory: (member: StaffMember) => void;
}

/**
 * Personnel table component with search and filtering
 * 
 * Displays all personnel with actions for edit, delete, and view history.
 * Includes built-in search functionality.
 */
export function PersonnelTable({
    personnel,
    onEdit,
    onDelete,
    onViewHistory
}: PersonnelTableProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter personnel based on search query
    const filteredPersonnel = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return personnel;

        return personnel.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.cedula && p.cedula.toLowerCase().includes(query)) ||
            (p.rank && p.rank.toLowerCase().includes(query))
        );
    }, [personnel, searchQuery]);

    // Get status badge variant
    const getStatusVariant = (status?: PersonnelStatus): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'activo':
                return 'default';
            case 'vacaciones':
                return 'secondary';
            case 'reposo':
            case 'permiso':
                return 'outline';
            case 'apoyo':
                return 'secondary';
            default:
                return 'default';
        }
    };

    // Get status label
    const getStatusLabel = (status?: PersonnelStatus): string => {
        return status || 'activo';
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre, cédula o jerarquía..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Mostrando {filteredPersonnel.length} de {personnel.length} personas
                </p>
            </div>

            {/* Personnel Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Cédula</TableHead>
                            <TableHead>Jerarquía</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPersonnel.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    {searchQuery ? 'No se encontraron resultados' : 'No hay personal registrado'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPersonnel.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {member.cedula || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{member.rank || '-'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(member.status)}>
                                            {getStatusLabel(member.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onViewHistory(member)}
                                                aria-label={`Ver historial de ${member.name}`}
                                            >
                                                <Activity className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(member)}
                                                aria-label={`Editar ${member.name}`}
                                            >
                                                <FileEdit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (window.confirm(`¿Eliminar a ${member.name}?`)) {
                                                        onDelete(member.id);
                                                    }
                                                }}
                                                className="text-destructive hover:text-destructive"
                                                aria-label={`Eliminar ${member.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
