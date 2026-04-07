'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  LayoutGrid,
  ShieldCheck,
  PlusCircle,
  Trash2,
  AlertTriangle,
  Download,
  Pencil,
  ChevronLeft,
  Car,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersonnel } from '@/hooks/use-personnel';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { useGuards } from '@/hooks/use-guards';
import { useUnits } from '@/hooks/use-units';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useReports } from '@/hooks/use-reports';
import type { StaffMember } from '@/lib/types';
import { StructureManager } from '@/components/structure-manager';
import { DataTableSkeleton } from '@/components/ui/loading-skeleton';
import { FeatureErrorBoundary } from '@/components/error-boundary-feature';

// Extracted components
import { PersonnelTable } from '@/components/personnel/personnel-table';
import { AddEditPersonnelDialog } from '@/components/personnel/add-edit-personnel-dialog';

import { GuardAssignmentPanel } from '@/components/personnel/guard-assignment-panel';
import { PersonnelHistoryDialog } from '@/components/personnel/personnel-history-dialog';
import { CsvImportButton } from '@/components/personnel/csv-import-button';

import { UnitsManager } from '@/components/personnel/units-manager';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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

  // Hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'personnel';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
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
    <div className="flex-col w-full md:flex-1 md:flex md:min-h-0 md:overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-28 sm:pb-6 flex flex-col md:flex-1 md:min-h-0">
        <div className="flex flex-col gap-4 mb-6 shrink-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Administración de funcionarios, cargos y jerarquías de la institución.
              </p>
            </div>
          </div>
          {activeTab === 'personnel' && (
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto shrink-0 animate-in fade-in slide-in-from-right-4 duration-300">
              <CsvImportButton onImport={addMembers} personnel={personnel} />
               <Button onClick={handleAddNew} size="sm" className="gap-1.5 shadow-sm font-bold">
                <PlusCircle className="h-4 w-4" />
                Añadir Personal
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="w-full flex flex-col gap-6 md:flex-1 md:min-h-0">

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-4 duration-300 shrink-0">
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
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex flex-col sm:gap-6 md:flex-1 md:min-h-0"
          >
            <div className="shrink-0">
              <div className="shrink-0 -mx-4 sm:mx-0">
                <ScrollArea className="w-full pb-1 border-b px-4 sm:px-0" type="always">
                  <TabsList className="flex w-max sm:grid sm:w-full sm:grid-cols-4 sm:max-w-xl bg-transparent p-0 gap-6 sm:gap-8 h-10">
                    <TabsTrigger value="personnel" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 sm:px-2 transition-all whitespace-nowrap">
                      <User className="h-4 w-4" />
                      <span className="font-semibold text-xs sm:text-sm">Funcionarios</span>
                    </TabsTrigger>
                    <TabsTrigger value="structure" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 sm:px-2 transition-all whitespace-nowrap">
                      <LayoutGrid className="h-4 w-4" />
                      <span className="font-semibold text-xs sm:text-sm">Estructura</span>
                    </TabsTrigger>
                    <TabsTrigger value="guards" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 sm:px-2 transition-all whitespace-nowrap">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-semibold text-xs sm:text-sm">Guardias</span>
                    </TabsTrigger>
                    <TabsTrigger value="units" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 sm:px-2 transition-all whitespace-nowrap">
                      <Car className="h-4 w-4" />
                      <span className="font-semibold text-xs sm:text-sm">Unidades</span>
                    </TabsTrigger>
                  </TabsList>
                </ScrollArea>
              </div>
            </div>

            <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-transparent">
              <TabsContent value="personnel" className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in duration-300">
                <Card className="border-none shadow-xl shadow-foreground/5 bg-card md:overflow-hidden md:flex-1 md:flex md:flex-col md:min-h-0">
                  <CardContent className="p-4 sm:p-6 flex flex-col md:flex-1 md:min-h-0 md:overflow-hidden">
                    <ScrollArea className="md:flex-1 pr-4 -mr-4" type="always">
                      <PersonnelTable
                        personnel={personnel}
                        departments={departments}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewHistory={handleViewHistory}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent 
                value="structure" 
                className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in duration-300"
              >
                <div className="flex flex-col bg-transparent md:flex-1 md:min-h-0 md:overflow-hidden">
                  <StructureManager
                    roles={roles}
                    departments={departments}
                    personnel={personnel}
                    onRolesChange={saveRoles}
                    onDepartmentsChange={saveDepartments}
                    onSave={() => { }}
                    rolesLoaded={rolesLoaded}
                    deptsLoaded={deptsLoaded}
                  />
                </div>
              </TabsContent>

              <TabsContent value="guards" className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-1 md:min-h-0 md:overflow-hidden">
                  <GuardAssignmentPanel
                    guards={guards}
                    personnel={personnel}
                    roles={roles}
                    onGuardUpdate={saveGuards}
                  />
                </div>
              </TabsContent>

              <TabsContent value="units" className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-1 md:h-full md:min-h-0">
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
