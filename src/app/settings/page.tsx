'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { GlobalTagsManager } from '@/components/global-tags-manager';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useSettings } from '@/hooks/use-settings';
import { useUnits } from '@/hooks/use-units';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { 
  Zap, 
  Database, 
  Plus, 
  Trash2, 
  Layers,
  FileText, 
  ChevronRight,
  AlertTriangle,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SettingsPage() {
  const { isLoaded: unitsLoaded } = useUnits();
  const { isLoaded: rolesLoaded } = useRoles();
  const { isLoaded: deptsLoaded } = useDepartments();
  const { isLoaded: settingsLoaded } = useSettings();
  const { currentWorkspace, workspaces, switchWorkspace, deleteWorkspace, createWorkspace } = useWorkspaceManager();
  
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const isLoaded = unitsLoaded && rolesLoaded && deptsLoaded && settingsLoaded;

  if (!isLoaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
        <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
        <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Seccion Áreas de Trabajo (ex Otros ajustes) */}
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Áreas de Trabajo
          </CardTitle>
          <CardDescription>
            Gestiona entornos independientes para tus reportes. Cada área tiene su propia base de datos local.
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
              <Button 
                variant="outline" 
                className="w-full border-dashed" 
                onClick={() => setIsCreatingWorkspace(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Área de Trabajo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <GlobalTagsManager />

      {/* Tarjeta Consolidad: Otros Ajustes */}
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Otros ajustes
          </CardTitle>
          <CardDescription>
            Configuración de plantillas, sincronización y mantenimiento de datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            href="/plantillas"
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Plantillas de Reporte</p>
                <p className="text-xs text-muted-foreground">Crear, editar y gestionar plantillas</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/settings/p2p"
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Sincronización P2P</p>
                <p className="text-xs text-muted-foreground">Conectar varios dispositivos en tiempo real</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <Link
            href="/settings/borrar-datos"
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-destructive">Borrar datos de la app</p>
                <p className="text-xs text-muted-foreground">Acciones irreversibles y limpieza</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
          </Link>
        </CardContent>
      </Card>
    </div >
  );
}
