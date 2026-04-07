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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, FileEdit, Trash2, Activity, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { StaffMember, PersonnelStatus, Department } from '@/lib/types';
import { cn, normalizeString } from '@/lib/utils';

interface PersonnelTableProps {
  personnel: StaffMember[];
  departments: Department[];
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
  departments,
  onEdit,
  onDelete,
  onViewHistory,
  selectedIds,
  onSelectionChange,
}: PersonnelTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof StaffMember>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Map dept id → name for display
  const deptNameById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments]
  );

  const getDeptName = (deptId?: string) => {
    if (!deptId || deptId === 'none') return null;
    // If the stored value is already a name (not found as id), show it as-is
    return deptNameById.get(deptId) ?? deptId;
  };

  const toggleSort = (key: keyof StaffMember) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof StaffMember }) => {
    if (sortKey !== field) return <ChevronsUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="ml-1 h-3 w-3 inline" />
      : <ChevronDown className="ml-1 h-3 w-3 inline" />;
  };

  // Filter and sort personnel
  const filteredPersonnel = useMemo(() => {
    const query = normalizeString(searchQuery);
    let result = query
      ? personnel.filter(
        (p) =>
          normalizeString(p.name).includes(query) ||
          normalizeString(p.cedula || '').includes(query) ||
          normalizeString(p.rank || '').includes(query)
      )
      : [...personnel];

    result.sort((a, b) => {
      const aVal = String(a[sortKey] ?? '').toLowerCase();
      const bVal = String(b[sortKey] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [personnel, searchQuery, sortKey, sortDir]);

  // Get status badge variant
  const getStatusVariant = (
    status?: PersonnelStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'activo':
        return 'default';
      case 'vacaciones':
        return 'secondary';
      case 'reposo':
      case 'permiso':
      case 'ausente':
        return 'outline';
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
          id="personnel-search"
          name="personnel-search"
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
      <ScrollArea className="rounded-md border w-full hidden md:block" type="always">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    filteredPersonnel.length > 0 && selectedIds.length === filteredPersonnel.length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange(filteredPersonnel.map((p) => p.id));
                    } else {
                      onSelectionChange([]);
                    }
                  }}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('rank')}>
                Jerarquía<SortIcon field="rank" />
              </TableHead>
              <TableHead className="min-w-[150px] cursor-pointer select-none" onClick={() => toggleSort('name')}>
                Nombre<SortIcon field="name" />
              </TableHead>
              <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort('cedula')}>
                Cédula<SortIcon field="cedula" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">Cargo</TableHead>
              <TableHead className="hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort('department')}>
                Departamento<SortIcon field="department" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                Estado<SortIcon field="status" />
              </TableHead>
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
                <TableRow
                  key={member.id}
                  className={cn(selectedIds.includes(member.id) && 'bg-muted/50')}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectionChange([...selectedIds, member.id]);
                        } else {
                          onSelectionChange(selectedIds.filter((id) => id !== member.id));
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
                    {member.roleId && member.roleId !== 'none' ? (
                      member.roleId
                    ) : member.cargo ? (
                      member.cargo
                    ) : (
                      <span className="text-muted-foreground">Sin cargo</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {(() => {
                      const deptName = getDeptName(member.department);
                      return deptName
                        ? deptName
                        : <span className="text-muted-foreground italic">N/A</span>;
                    })()}
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
      </ScrollArea>

      <div className="flex flex-col gap-3 md:hidden">
        {filteredPersonnel.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 border rounded-xl border-dashed bg-muted/20">
            {searchQuery ? 'No se encontraron resultados' : 'No hay personal registrado'}
          </div>
        ) : (
          filteredPersonnel.map((member) => (
            <div
              key={member.id}
              className={cn(
                'flex flex-col border rounded-xl overflow-hidden transition-all duration-200 shadow-sm',
                selectedIds.includes(member.id) 
                  ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                  : 'bg-card border-border/60 hover:border-border'
              )}
            >
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-3">
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectionChange([...selectedIds, member.id]);
                        } else {
                          onSelectionChange(selectedIds.filter((id) => id !== member.id));
                        }
                      }}
                      className="mt-0.5"
                      aria-label={`Seleccionar ${member.name}`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-base text-card-foreground leading-tight truncate">
                        {member.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium mt-0.5 opacity-80 uppercase tracking-tight">
                        C.I. {member.cedula || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={getStatusVariant(member.status)}
                    className="text-[10px] font-bold uppercase px-2 h-5 shrink-0"
                  >
                    {getStatusLabel(member.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Jerarquía</span>
                    <span className="text-sm font-semibold truncate">
                      {member.rank || <span className="text-muted-foreground/50 font-normal">-</span>}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Cargo</span>
                    <span className="text-sm font-semibold truncate">
                      {member.roleId && member.roleId !== 'none' ? (
                        member.roleId
                      ) : member.cargo ? (
                        member.cargo
                      ) : (
                        <span className="text-muted-foreground/50 font-normal">Sin cargo</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-card border-t px-4 py-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                  Acciones
                </span>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => onViewHistory(member)}
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => onEdit(member)}
                  >
                    <FileEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
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
