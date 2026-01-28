'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  LayoutGrid,
  ShieldCheck,
  CalendarCheck,
  Download,
  Upload,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { useGuards } from '@/hooks/use-guards';
import { useAttendance } from '@/hooks/use-attendance';
import { useReports } from '@/hooks/use-reports';
import type { StaffMember } from '@/types';
import { StructureManager } from '@/components/structure-manager';
import { logger } from '@/lib/logger';
import { DataTableSkeleton } from '@/components/ui/loading-skeleton';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

// Extracted components
import { PersonnelTable } from './components/personnel-table';
import { AddEditPersonnelDialog } from './components/add-edit-personnel-dialog';
import { AttendanceManager } from './components/attendance-manager';
import { GuardAssignmentPanel } from './components/guard-assignment-panel';
import { PersonnelHistoryDialog } from './components/personnel-history-dialog';
import { downloadPersonnelTemplate, parsePersonnelCSV } from '@/lib/csv-utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2 } from 'lucide-react';

function PersonnelPageContent() {
  // Hooks
  const {
    personnel,
    addMember,
    addMembers,
    updateMember,
    removeMember,
    removeMembers,
    isLoaded: personnelLoaded,
    savePersonnel,
    isCedulaDuplicate,
  } = usePersonnel();
  const { roles, saveRoles, isLoaded: rolesLoaded } = useRoles();
  const { departments, saveDepartments, isLoaded: deptsLoaded } = useDepartments();
  const { guards, saveGuards, isLoaded: guardsLoaded } = useGuards();
  const { records, markAttendance, isLoaded: attendanceLoaded } = useAttendance();
  const { reports } = useReports();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [viewHistoryMember, setViewHistoryMember] = useState<StaffMember | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date());

  // Loading state
  const isLoading =
    !personnelLoaded || !rolesLoaded || !deptsLoaded || !guardsLoaded || !attendanceLoaded;

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Personal</h1>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
        <DataTableSkeleton rows={10} columns={5} />
      </div>
    );
  }

  // Handlers
  const handleEdit = (member: StaffMember) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setIsDialogOpen(true);
  };

  const handleSave = async (data: Partial<StaffMember>) => {
    // Validation: Cédula duplicate
    if (data.cedula && isCedulaDuplicate(data.cedula, editingMember?.id)) {
      toast.error('Ya existe una persona registrada con esta cédula');
      return;
    }

    if (editingMember) {
      // Update existing
      await updateMember(editingMember.id, data);
      toast.success('Cambios guardados');
    } else {
      // Add new - ensure name is provided
      if (data.name) {
        const newMemberData: Omit<StaffMember, 'id'> = {
          name: data.name,
          cedula: data.cedula || '',
          rank: data.rank || '',
          department: data.department || '',
        };
        await addMember(newMemberData);
        toast.success('Personal añadido');
      }
    }
    setIsDialogOpen(false);
    setEditingMember(null);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
  };

  const handleDelete = (id: string) => {
    removeMember(id);
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    toast.success('Personal eliminado');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    removeMembers(selectedIds);
    setSelectedIds([]);
    setIsBulkDeleteConfirmOpen(false);
    toast.success(`${selectedIds.length} personas eliminadas`);
  };

  const handleViewHistory = (member: StaffMember) => {
    setViewHistoryMember(member);
    setIsHistoryDialogOpen(true);
  };

  // CSV Export
  const downloadTemplate = () => {
    downloadPersonnelTemplate();
  };

  // CSV Import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        const importedMembers = parsePersonnelCSV(content);
        const { added, skipped } = await addMembers(importedMembers);

        if (skipped > 0 && added.length > 0) {
          toast.success(
            `${added.length} personas importadas, ${skipped} omitidas por ser duplicadas.`
          );
        } else if (skipped > 0 && added.length === 0) {
          toast.warning(`No se importaron datos. Todas las personas (${skipped}) ya existen.`);
        } else {
          toast.success(`${added.length} personas importadas correctamente.`);
        }
      } catch (error) {
        toast.error('Error al importar el archivo CSV');
        logger.error('Failed to import personnel CSV', error, { feature: 'Personnel' });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Personal</h1>
          <p className="text-muted-foreground">
            Administra el personal, sus cargos y la conformación de las guardias.
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteConfirmOpen(true)}
            className="shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Borrar seleccionados ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="personnel" className="space-y-6">
        <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-4 sm:max-w-2xl">
            <TabsTrigger value="personnel" className="flex items-center gap-1.5 px-3">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Funcionarios</span>
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-1.5 px-3">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Estructura</span>
            </TabsTrigger>
            <TabsTrigger value="guards" className="flex items-center gap-1.5 px-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Guardias</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-1.5 px-3">
              <CalendarCheck className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Asistencia</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Personnel Tab */}
        <TabsContent value="personnel" className="space-y-6 mt-0">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="h-8 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Plantilla</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="relative overflow-hidden cursor-pointer h-8 text-xs"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Importar CSV</span>
                <span className="sm:hidden">Importar</span>
                <input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
              </Button>
            </div>
            <Button size="sm" onClick={handleAddNew} className="h-8 text-xs shadow-sm">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Personal
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <PersonnelTable
                personnel={personnel}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure">
          <StructureManager
            roles={roles}
            departments={departments}
            onRolesChange={saveRoles}
            onDepartmentsChange={saveDepartments}
            onAddDepartment={() => { }}
            onRemoveDepartment={() => { }}
            onAddRole={() => { }}
            onRemoveRole={() => { }}
            onSave={() => { }}
          />
        </TabsContent>

        {/* Guards Tab */}
        <TabsContent value="guards">
          <GuardAssignmentPanel
            guards={guards}
            personnel={personnel}
            roles={roles}
            onGuardUpdate={saveGuards}
          />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <AttendanceManager
            personnel={personnel}
            date={attendanceDate}
            onDateChange={setAttendanceDate}
            attendanceRecords={records}
            onMarkAttendance={markAttendance}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <AddEditPersonnelDialog
        open={isDialogOpen}
        member={editingMember}
        roles={roles}
        departments={departments}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <ConfirmDialog
        open={isBulkDeleteConfirmOpen}
        onOpenChange={setIsBulkDeleteConfirmOpen}
        title="¿Eliminar personal seleccionado?"
        message={`Estás a punto de eliminar a ${selectedIds.length} personas. Esta acción no se puede deshacer.`}
        onConfirm={handleBulkDelete}
        variant="destructive"
      />
      <PersonnelHistoryDialog
        member={viewHistoryMember}
        isOpen={isHistoryDialogOpen}
        onClose={() => {
          setIsHistoryDialogOpen(false);
          setViewHistoryMember(null);
        }}
      />
    </div>
  );
}

export default function PersonnelPage() {
  return (
    <FeatureErrorBoundary featureName="Personal">
      <PersonnelPageContent />
    </FeatureErrorBoundary>
  );
}
