import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Componentes extraídos (SOLID) - DISEÑO PRESERVADO AL 100%
import { WorkspacesHeader } from './workspaces/components/workspaces-header';
import { WorkspaceItem } from './workspaces/components/workspace-item';
import { WorkspaceControls } from './workspaces/components/workspace-controls';

export default function WorkspacesPage() {
  const {
    currentWorkspace,
    workspaces,
    cloudWorkspaces,
    switchWorkspace,
    deleteWorkspace,
    createWorkspace,
    exportWorkspace,
    importWorkspace
  } = useWorkspaceManager();

  const handleDelete = (name: string) => {
    if (confirm('¿Estás seguro de eliminar esta área? Se perderán todos sus datos locales.')) {
      deleteWorkspace(name);
    }
  };

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-32 sm:pb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header section (SRP) */}
        <WorkspacesHeader />

        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Entornos Locales
            </CardTitle>
            <CardDescription>
              Cambia entre áreas de trabajo o crea nuevas para organizar distintos equipos o eventos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {workspaces.map((workspace: string) => {
                const cloudInfo = cloudWorkspaces?.find((cw: any) => cw.id === workspace);
                return (
                  <WorkspaceItem
                    key={workspace}
                    name={workspace}
                    isActive={currentWorkspace === workspace}
                    onSwitch={() => switchWorkspace(workspace)}
                    onExport={() => exportWorkspace(workspace)}
                    onDelete={() => handleDelete(workspace)}
                    cloudInfo={cloudInfo}
                  />
                );
              })}
            </div>

            {/* Controles de Acción (SRP) */}
            <WorkspaceControls 
              onCreate={createWorkspace} 
              onImport={importWorkspace} 
            />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
