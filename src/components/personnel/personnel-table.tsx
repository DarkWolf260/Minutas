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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileEdit, Trash2, Activity, ChevronUp, ChevronDown, ChevronsUpDown, X, Filter } from 'lucide-react';
import { StaffMember, PersonnelStatus, Department } from '@/lib/types';
import { cn, normalizeString } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { STATUS_OPTIONS } from '@/lib/constants/personnel';

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
 * Includes built-in search functionality, faceted filters and multi-selection support.
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof StaffMember>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<StaffMember | null>(null);

  // Map dept id → name for display
  const deptNameById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments]
  );

  const getDeptName = (deptId?: string) => {
    if (!deptId || deptId === 'none') return null;
    return deptNameById.get(deptId) ?? deptId;
  };

  // Status counts for quick filter chips
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: personnel.length };
    personnel.forEach((p) => {
      const s = p.status || 'activo';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [personnel]);

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
    let result = personnel;

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((p) => (p.status || 'activo') === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      result = result.filter((p) => (p.department || '') === departmentFilter);
    }

    // Filter by text search
    if (query) {
      result = result.filter(
        (p) =>
          normalizeString(p.name).includes(query) ||
          normalizeString(p.cedula || '').includes(query) ||
          normalizeString(p.rank || '').includes(query)
      );
    }

    const sorted = [...result];
    sorted.sort((a, b) => {
      const aVal = String(a[sortKey] ?? '').toLowerCase();
      const bVal = String(b[sortKey] ?? '').toLowerCase();
      const cmp = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [personnel, searchQuery, statusFilter, departmentFilter, sortKey, sortDir]);

  const isFiltered = searchQuery.trim() !== '' || statusFilter !== 'all' || departmentFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
  };

  // Get status badge variant
  const getStatusVariant = (
    status?: PersonnelStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'activo':
        return 'default';
      case 'Vacaciones':
        return 'secondary';
      case 'Reposo':
      case 'Permiso':
      case 'Ausente':
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
      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="personnel-search"
              name="personnel-search"
              placeholder="Buscar por nombre, cédula o jerarquía..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Selector de Departamento */}
          {departments.length > 0 && (
            <div className="w-full sm:w-[220px]">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Botón Reset si hay filtros aplicados */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-10 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
              title="Restablecer todos los filtros"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Chips de Filtro Rápido por Estado */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Estado:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/80 hover:text-foreground'
            )}
          >
            <span>Todos</span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.2 rounded-full',
              statusFilter === 'all' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {statusCounts.all || 0}
            </span>
          </button>

          {STATUS_OPTIONS.map((opt) => {
            const count = statusCounts[opt.value] || 0;
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(isSelected ? 'all' : opt.value)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-xs font-bold'
                    : 'bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <span>{opt.label}</span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full',
                  isSelected ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count with aria-live */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground" aria-live="polite">
          Mostrando <span className="font-semibold text-foreground">{filteredPersonnel.length}</span> de <span className="font-semibold text-foreground">{personnel.length}</span> personas
          {isFiltered && ' (filtrado)'}
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
              <TableHead className="hidden md:table-cell">Sexo</TableHead>
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
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  {isFiltered ? 'No se encontraron funcionarios con los filtros aplicados' : 'No hay personal registrado'}
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
                  <TableCell className="hidden md:table-cell">
                    {member.sex === 'M' ? 'Masc.' : member.sex === 'F' ? 'Fem.' : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {member.role_id && member.role_id !== 'none' ? (
                      member.role_id
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
                        onClick={() => setConfirmDeleteMember(member)}
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
            {isFiltered ? 'No se encontraron funcionarios con los filtros aplicados' : 'No hay personal registrado'}
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground font-medium opacity-80 uppercase tracking-tight">
                          C.I. {member.cedula || 'N/A'}
                        </span>
                        {member.sex && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[11px] text-primary/70 font-bold uppercase tracking-widest">
                              {member.sex === 'M' ? 'M' : 'F'}
                            </span>
                          </>
                        )}
                      </div>
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
                      {member.role_id && member.role_id !== 'none' ? (
                        member.role_id
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
                    onClick={() => setConfirmDeleteMember(member)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteMember}
        onOpenChange={(open) => !open && setConfirmDeleteMember(null)}
        title="Eliminar Personal"
        message={`¿Estás seguro de que deseas eliminar a "${confirmDeleteMember?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteMember) {
            onDelete(confirmDeleteMember.id);
            setConfirmDeleteMember(null);
          }
        }}
      />
    </div>
  );
}


