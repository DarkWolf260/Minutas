'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  LayoutGrid,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { useGuards } from '@/hooks/use-guards';
import { useUnits } from '@/hooks/use-units';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useReports } from '@/hooks/use-reports';
import type { StaffMember } from '@/types';
import { StructureManager } from '@/components/structure-manager';
import { DataTableSkeleton } from '@/components/ui/loading-skeleton';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

// Extracted components
import { PersonnelTable } from '@/components/personnel/personnel-table';
import { AddEditPersonnelDialog } from '@/components/personnel/add-edit-personnel-dialog';

import { GuardAssignmentPanel } from '@/components/personnel/guard-assignment-panel';
import { PersonnelHistoryDialog } from '@/components/personnel/personnel-history-dialog';
import { CsvImportButton } from '@/components/personnel/csv-import-button';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2, Car } from 'lucide-react';
import { UnitsManager } from '@/components/personnel/units-manager';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    isCedulaDuplicate,
  } = usePersonnel();
  const { roles, saveRoles, isLoaded: rolesLoaded } = useRoles();
  const { currentWorkspace } = useWorkspaceManager();
  const { departments, saveDepartments, isLoaded: deptsLoaded } = useDepartments();
  const { guards, saveGuards, isLoaded: guardsLoaded } = useGuards();
  const { units, isLoaded: unitsLoaded } = useUnits();

  useReports();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [viewHistoryMember, setViewHistoryMember] = useState<StaffMember | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);



  // Loading state
  const isLoading =
    !personnelLoaded || !rolesLoaded || !deptsLoaded || !guardsLoaded || !unitsLoaded;

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center py-20">
        <h1 className="text-3xl font-bold mb-2">Personal</h1>
        <p className="text-muted-foreground animate-pulse">Cargando datos del sistema...</p>
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
          workspaceId: currentWorkspace,
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



  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-background">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-6 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personal</h1>
            <p className="text-muted-foreground text-sm">
              Gestión centralizada de funcionarios, departamentos y asignación de guardias.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CsvImportButton onImport={addMembers} personnel={personnel} />
            <Button onClick={handleAddNew} className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              Añadir Personal
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full flex-1 flex flex-col min-h-0 gap-6">

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300 shrink-0">
              <span className="text-sm font-medium text-destructive-foreground">
                {selectedIds.length} funcionarios seleccionados
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="shadow-sm h-8"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Permanentes
              </Button>
            </div>
          )}

          {/* Tabbed Interface */}
          <Tabs defaultValue="personnel" className="flex-1 flex flex-col min-h-0 gap-6">
            <div className="shrink-0">
              <ScrollArea className="w-full pb-1 border-b" type="always">
                <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-4 sm:max-w-xl bg-transparent p-0 gap-8 h-10">
                  <TabsTrigger value="personnel" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 transition-all">
                    <User className="h-4 w-4" />
                    <span className="font-semibold">Funcionarios</span>
                  </TabsTrigger>
                  <TabsTrigger value="structure" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 transition-all">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="font-semibold">Estructura</span>
                  </TabsTrigger>
                  <TabsTrigger value="guards" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 transition-all">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-semibold">Guardias</span>
                  </TabsTrigger>
                  <TabsTrigger value="units" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 transition-all">
                    <Car className="h-4 w-4" />
                    <span className="font-semibold">Unidades</span>
                  </TabsTrigger>
                </TabsList>
              </ScrollArea>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden pr-2 -mr-2 flex flex-col">
              <TabsContent value="personnel" className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 h-full">
                <Card className="border-none shadow-xl shadow-foreground/5 bg-card overflow-hidden flex-1 flex flex-col min-h-0 h-full">
                  <CardContent className="p-0 sm:p-6 flex-1 min-h-0 overflow-auto">
                    <PersonnelTable
                      personnel={personnel}
                      departments={departments}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewHistory={handleViewHistory}
                      selectedIds={selectedIds}
                      onSelectionChange={setSelectedIds}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="structure" className="mt-0 focus-visible:outline-none data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 h-full">
                <div className="flex-1 flex flex-col h-full min-h-0">
                  <StructureManager
                    roles={roles}
                    departments={departments}
                    onRolesChange={saveRoles}
                    onDepartmentsChange={saveDepartments}
                    onSave={() => { }}
                    rolesLoaded={rolesLoaded}
                    deptsLoaded={deptsLoaded}
                  />
                </div>
              </TabsContent>

              <TabsContent value="guards" className="mt-0 focus-visible:outline-none data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 h-full">
                <div className="flex-1 flex flex-col h-full min-h-0">
                  <GuardAssignmentPanel
                    guards={guards}
                    personnel={personnel}
                    roles={roles}
                    onGuardUpdate={saveGuards}
                  />
                </div>
              </TabsContent>

              <TabsContent value="units" className="mt-0 focus-visible:outline-none data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col min-h-0 h-full">
                <div className="flex-1 flex flex-col h-full min-h-0">
                  <UnitsManager />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

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
