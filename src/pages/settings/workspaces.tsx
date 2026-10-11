import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Componentes extraídos (SOLID) - DISEÑO PRESERVADO AL 100%
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
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Header fijo centrado */}
      <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Áreas de Trabajo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gestiona entornos independientes locales o remotos para tus reportes.
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          <Card className="shadow-xs border-muted/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Entornos Disponibles
              </CardTitle>
              <CardDescription>
                Cambia entre áreas de trabajo o crea nuevas para organizar distintos equipos o bases operativas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
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

              {/* Controles de Creación e Importación */}
              <WorkspaceControls 
                onCreate={createWorkspace} 
                onImport={importWorkspace} 
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
