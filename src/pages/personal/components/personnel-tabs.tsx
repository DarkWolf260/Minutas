import React from 'react';
import { User, LayoutGrid, ShieldCheck, Car, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PersonnelTable } from '@/components/personnel/personnel-table';
import { CsvImportButton } from '@/components/personnel/csv-import-button';
import { StructureManager } from '@/components/structure/structure-manager';
import { GuardAssignmentPanel } from '@/components/personnel/guard-assignment-panel';
import { UnitsManager } from '@/components/personnel/units-manager';

interface PersonnelTabsProps {
  hook: any;
}

export const PersonnelTabs = ({ hook }: PersonnelTabsProps) => {
  const { 
    tabActiva,
    setTabActiva,
    setIdsSeleccionados,
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
    guardarRoles,
    guardarDepartamentos,
    guardarPersonal,
    rolesCargados,
    departamentosCargados,
    guardarGuardias
  } = hook;

  return (
    <Tabs
      value={tabActiva}
      onValueChange={(value) => {
        setTabActiva(value);
        setIdsSeleccionados([]);
      }}
      className="flex flex-col gap-4 sm:gap-6 md:flex-1 md:min-h-0"
    >
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
    </Tabs>
  );
};
