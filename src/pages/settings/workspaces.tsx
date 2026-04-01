import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { Database, Plus, Trash2, Layers, ChevronLeft, Download, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WorkspacesPage() {
  const { 
    currentWorkspace, 
    workspaces, 
    switchWorkspace, 
    deleteWorkspace, 
    createWorkspace,
    exportWorkspace,
    importWorkspace
  } = useWorkspaceManager();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-32 sm:pb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section with back button */}
      <div className="flex items-center gap-4">
        <Link to="/settings" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Áreas de Trabajo</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona entornos independientes para tus reportes. Cada área tiene su propia base de datos local.
          </p>
        </div>
      </div>

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
            {workspaces.map((workspace: string) => (
              <div
                key={workspace}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  currentWorkspace === workspace 
                    ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                    : "bg-muted/10 hover:bg-muted/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    currentWorkspace === workspace ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {workspace.replace(/-/g, ' ')}
                      {workspace === 'minutasdb' && <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wider">Default</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentWorkspace === workspace ? 'Área activa' : 'Área local offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentWorkspace !== workspace && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => switchWorkspace(workspace)}
                    >
                      Cambiar
                    </Button>
                  )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => exportWorkspace(workspace)}
                      title="Descargar respaldo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  {workspace !== 'minutasdb' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar esta área? Se perderán todos sus datos locales.')) {
                          deleteWorkspace(workspace);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            {isCreatingWorkspace ? (
              <div className="flex items-center gap-2">
                <Input
                  id="new-workspace-name"
                  name="new-workspace-name"
                  placeholder="Nombre de la nueva área..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="h-9"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      createWorkspace(newWorkspaceName);
                      setNewWorkspaceName('');
                      setIsCreatingWorkspace(false);
                    } else if (e.key === 'Escape') {
                      setIsCreatingWorkspace(false);
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={() => {
                    createWorkspace(newWorkspaceName);
                    setNewWorkspaceName('');
                    setIsCreatingWorkspace(false);
                  }}
                >
                  Crear
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsCreatingWorkspace(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-dashed h-12" 
                  onClick={() => setIsCreatingWorkspace(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Área
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1 border-dashed h-12" 
                  onClick={() => document.getElementById('import-workspace-input')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Área
                </Button>
                
                <input
                  id="import-workspace-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importWorkspace(file);
                    e.target.value = ''; // Reset input
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </ScrollArea>
  );
}
