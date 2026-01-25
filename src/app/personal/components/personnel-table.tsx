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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, FileEdit, Trash2, Activity } from 'lucide-react';
import type { StaffMember, PersonnelStatus } from '@/types';
import { cn } from '@/lib/utils';

interface PersonnelTableProps {
    personnel: StaffMember[];
    onEdit: (member: StaffMember) => void;
    onDelete: (id: string) => void;
    onViewHistory: (member: StaffMember) => void;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

/**
 * Personnel table component with search and filtering
 * 
 * Displays all personnel with actions for edit, delete, and view history.
 * Includes built-in search functionality and multi-selection support.
 */
export function PersonnelTable({
    personnel,
    onEdit,
    onDelete,
    onViewHistory,
    selectedIds,
    onSelectionChange
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

            {/* Personnel Table - Desktop */}
            <div className="rounded-md border overflow-x-auto hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={filteredPersonnel.length > 0 && selectedIds.length === filteredPersonnel.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            onSelectionChange(filteredPersonnel.map(p => p.id));
                                        } else {
                                            onSelectionChange([]);
                                        }
                                    }}
                                    aria-label="Seleccionar todos"
                                />
                            </TableHead>
                            <TableHead className="w-[120px]">Jerarquía</TableHead>
                            <TableHead className="min-w-[150px]">Nombre</TableHead>
                            <TableHead className="hidden md:table-cell">Cédula</TableHead>
                            <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                            <TableHead className="hidden lg:table-cell">Departamento</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPersonnel.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    {searchQuery ? 'No se encontraron resultados' : 'No hay personal registrado'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPersonnel.map((member) => (
                                <TableRow key={member.id} className={cn(selectedIds.includes(member.id) && "bg-muted/50")}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(member.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    onSelectionChange([...selectedIds, member.id]);
                                                } else {
                                                    onSelectionChange(selectedIds.filter(id => id !== member.id));
                                                }
                                            }}
                                            aria-label={`Seleccionar ${member.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>{member.rank || '-'}</TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span>{member.name}</span>
                                            <span className="text-xs text-muted-foreground md:hidden font-mono mt-0.5">
                                                C.I. {member.cedula || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell font-mono text-sm">
                                        {member.cedula || '-'}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        {member.roleId && member.roleId !== 'none' ? member.roleId : <span className="text-muted-foreground">Sin cargo</span>}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        {member.department && member.department !== 'none' ? member.department : <span className="text-muted-foreground italic">N/A</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(member.status)}>
                                            {getStatusLabel(member.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onViewHistory(member)}
                                                title={`Ver historial de ${member.name}`}
                                            >
                                                <Activity className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onEdit(member)}
                                                title={`Editar ${member.name}`}
                                            >
                                                <FileEdit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (window.confirm(`¿Eliminar a ${member.name}?`)) {
                                                        onDelete(member.id);
                                                    }
                                                }}
                                                title={`Eliminar ${member.name}`}
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

            {/* Personnel Cards - Mobile */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredPersonnel.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                        {searchQuery ? 'No se encontraron resultados' : 'No hay personal registrado'}
                    </div>
                ) : (
                    filteredPersonnel.map((member) => (
                        <div key={member.id} className={cn("flex flex-col border rounded-lg p-4 space-y-3 transition-colors", selectedIds.includes(member.id) ? "bg-muted/50 border-primary/50" : "bg-card")}>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <Checkbox
                                        checked={selectedIds.includes(member.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                onSelectionChange([...selectedIds, member.id]);
                                            } else {
                                                onSelectionChange(selectedIds.filter(id => id !== member.id));
                                            }
                                        }}
                                        aria-label={`Seleccionar ${member.name}`}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-card-foreground leading-tight">{member.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">C.I. {member.cedula || 'N/A'}</span>
                                    </div>
                                </div>
                                <Badge variant={getStatusVariant(member.status)} className="text-[10px] uppercase px-1.5 h-5">
                                    {getStatusLabel(member.status)}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3">
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Jerarquía</span>
                                    <span className="font-medium">{member.rank || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-0.5">Cargo</span>
                                    <span className="font-medium truncate block">
                                        {member.roleId && member.roleId !== 'none' ? member.roleId : 'Sin cargo'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-muted/30 -mx-4 -mb-4 p-2 px-4 border-t rounded-b-lg">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Acciones</span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onViewHistory(member)}
                                    >
                                        <Activity className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onEdit(member)}
                                    >
                                        <FileEdit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            if (window.confirm(`¿Eliminar a ${member.name}?`)) {
                                                onDelete(member.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
