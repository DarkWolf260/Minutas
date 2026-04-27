'use client';

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  LayoutGrid,
  ShieldCheck,
  PlusCircle,
  Trash2,
  ChevronLeft,
  Car,
} from 'lucide-react';
import { StructureManager } from '@/components/structure/structure-manager';
import { FeatureErrorBoundary } from '@/components/common/error-boundary-feature';

// Componentes extraídos
import { PersonnelTable } from '@/components/personnel/personnel-table';
import { AddEditPersonnelDialog } from '@/components/personnel/add-edit-personnel-dialog';
import { GuardAssignmentPanel } from '@/components/personnel/guard-assignment-panel';
import { CsvImportButton } from '@/components/personnel/csv-import-button';
import { UnitsManager } from '@/components/personnel/units-manager';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersonal } from '@/hooks/use-personal';

function PersonnelPageContent() {
  const hook = usePersonal();
  const { estaCargando, idsSeleccionados, tabActiva, setTabActiva, setIdsSeleccionados } = hook;

  if (estaCargando) {
    return (
      <div className="container mx-auto p-8 text-center py-20">
        <h1 className="text-3xl font-bold mb-2">Personal</h1>
        <p className="text-muted-foreground animate-pulse">Cargando datos del sistema...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full md:flex-1 md:flex md:min-h-0 md:overflow-hidden relative">
      <BarraAccionesMasivas hook={hook} />

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-28 sm:pb-6 flex flex-col md:flex-1 md:min-h-0">
        <CabeceraPersonal />

        <div className="w-full flex flex-col gap-6 md:flex-1 md:min-h-0">
          <Tabs
            value={tabActiva}
            onValueChange={(value) => {
              setTabActiva(value);
              setIdsSeleccionados([]);
            }}
            className="flex flex-col gap-4 sm:gap-6 md:flex-1 md:min-h-0"
          >
            <ContenidoTabs hook={hook} />
          </Tabs>
        </div>

        <ModalesPersonal hook={hook} />
      </div>
    </div>
  );
}

function CabeceraPersonal() {
  return (
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
    </div>
  );
}

function BarraAccionesMasivas({ hook }: { hook: any }) {
  const { idsSeleccionados, setEsDialogOpenConfirmarEliminarMasivo } = hook;
  
  if (idsSeleccionados.length === 0) return null;

  return (
    <div className="sticky top-2 md:top-28 h-0 overflow-visible z-[45] w-full px-4 animate-in slide-in-from-top-4 duration-300 pointer-events-none shrink-0">
      <div className="max-w-[1600px] mx-auto flex justify-center md:justify-end pointer-events-none">
        <div className="w-full md:w-auto min-w-[300px] flex items-center justify-between gap-4 p-3 px-5 bg-[#fff1f1] dark:bg-[#2a0a0a] border border-destructive/20 shadow-2xl rounded-2xl ring-1 ring-destructive/10 backdrop-blur-md select-none pointer-events-auto">
          <span className="text-sm font-bold text-destructive whitespace-nowrap">
            {idsSeleccionados.length} seleccionados
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setEsDialogOpenConfirmarEliminarMasivo(true)}
            className="shadow-md h-9 md:h-8 font-bold px-4 rounded-xl transition-all active:scale-95"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Eliminar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContenidoTabs({ hook }: { hook: any }) {
  const { 
    personal, 
    departamentos, 
    roles, 
    guardias, 
    añadirMiembros, 
    manejarAñadirNuevo, 
    manejarEditar, 
    manejarEliminar, 
    manejarVerHistorial, 
    idsSeleccionados, 
    setIdsSeleccionados,
    guardarRoles,
    guardarDepartamentos,
    guardarPersonal,
    rolesCargados,
    departamentosCargados,
    guardarGuardias
  } = hook;

  return (
    <>
      <div className="shrink-0">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:max-w-2xl bg-muted/20 p-1 h-auto gap-1 rounded-xl border ring-1 ring-border/5">
          <TabsTrigger value="personnel" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-2 transition-all">
            <User className="h-4 w-4 shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs uppercase tracking-tight">Funcionarios</span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-2 transition-all">
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs uppercase tracking-tight">Estructura</span>
          </TabsTrigger>
          <TabsTrigger value="guards" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-2 transition-all">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs uppercase tracking-tight">Guardias</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-2 transition-all">
            <Car className="h-4 w-4 shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs uppercase tracking-tight">Unidades</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-transparent">
        <TabsContent value="personnel" className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in duration-300">
          <Card className="border bg-card md:overflow-hidden md:flex-1 md:flex md:flex-col md:min-h-0 shadow-sm">
            <CardHeader className="p-4 sm:px-6 sm:py-5 border-b bg-muted/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Listado de Funcionarios</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Administra y organiza el personal activo.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <CsvImportButton onImport={añadirMiembros} personnel={personal} />
                <Button onClick={manejarAñadirNuevo} size="sm" className="gap-1.5 shadow-sm font-bold bg-primary hover:bg-primary/90 transition-all active:scale-95">
                  <PlusCircle className="h-4 w-4" />
                  Añadir Personal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col md:flex-1 md:min-h-0 md:overflow-hidden">
              <ScrollArea className="md:flex-1 w-full" type="always">
                <div className="p-4 sm:p-6">
                  <PersonnelTable
                    personnel={personal}
                    departments={departamentos}
                    onEdit={manejarEditar}
                    onDelete={manejarEliminar}
                    onViewHistory={manejarVerHistorial}
                    selectedIds={idsSeleccionados}
                    onSelectionChange={setIdsSeleccionados}
                  />
                </div>
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
              departments={departamentos}
              personnel={personal}
              onRolesChange={guardarRoles}
              onDepartmentsChange={guardarDepartamentos}
              onUpdatePersonnel={guardarPersonal}
              onSave={() => { }}
              rolesLoaded={rolesCargados}
              deptsLoaded={departamentosCargados}
            />
          </div>
        </TabsContent>

        <TabsContent value="guards" className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-1 md:min-h-0 md:overflow-hidden">
            <GuardAssignmentPanel
              guards={guardias}
              personnel={personal}
              roles={roles}
              onGuardUpdate={guardarGuardias}
            />
          </div>
        </TabsContent>

        <TabsContent value="units" className="mt-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-1 md:h-full md:min-h-0">
            <UnitsManager />
          </div>
        </TabsContent>
      </div>
    </>
  );
}

function ModalesPersonal({ hook }: { hook: any }) {
  const { 
    esDialogOpen, 
    miembroEditando, 
    roles, 
    departamentos, 
    manejarGuardar, 
    manejarCancelar,
    esDialogOpenConfirmarEliminarMasivo,
    setEsDialogOpenConfirmarEliminarMasivo,
    idsSeleccionados,
    manejarEliminacionMasiva
  } = hook;

  return (
    <>
      <AddEditPersonnelDialog
        open={esDialogOpen}
        member={miembroEditando}
        roles={roles}
        departments={departamentos}
        onSave={manejarGuardar}
        onCancel={manejarCancelar}
      />

      <ConfirmDialog
        open={esDialogOpenConfirmarEliminarMasivo}
        onOpenChange={setEsDialogOpenConfirmarEliminarMasivo}
        title="¿Eliminar personal seleccionado?"
        message={`Estás a punto de eliminar a ${idsSeleccionados.length} personas. Esta acción no se puede deshacer.`}
        onConfirm={manejarEliminacionMasiva}
        variant="destructive"
      />
    </>
  );
}

export default function PersonnelPage() {
  return (
    <FeatureErrorBoundary featureName="Personal">
      <PersonnelPageContent />
    </FeatureErrorBoundary>
  );
}
