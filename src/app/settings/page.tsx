'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlobalTagsManager } from '@/components/global-tags-manager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { useP2P } from '@/lib/db/p2p-provider';
import { useSettings } from '@/hooks/use-settings';
import { useUnits } from '@/hooks/use-units';
import { useRoles } from '@/hooks/use-roles';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useGuards } from '@/hooks/use-guards';
import { useDrafts } from '@/hooks/use-drafts';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { AppSettings, StaffMember, Address } from '@/types';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  Copy, 
  Check, 
  Database, 
  Plus, 
  Trash2, 
  ExternalLink,
  Info,
  Layers,
  Monitor,
  PlusCircle, 
  AlertTriangle, 
  FileText, 
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useDepartments } from '@/hooks/use-departments';
import { logger } from '@/lib/logger';

export default function SettingsPage() {
  const { units, saveUnits, isLoaded: unitsLoaded, clearAllUnits } = useUnits();
  const { roles: initialRoles, isLoaded: rolesLoaded, clearAllRoles } = useRoles();
  const { isLoaded: deptsLoaded, clearAllDepartments } = useDepartments();
  const { settings, saveSettings, isLoaded: settingsLoaded, clearAllSettings } = useSettings();
  const { clearAllReports } = useReports();
  const { clearAllTemplates } = useTemplates();
  const { clearAllGuards } = useGuards();
  const { clearAllDefinitions } = useFieldDefinitions();
  const { clearDraft } = useDrafts();

  const db = useDatabase();
  const { currentWorkspace, workspaces, switchWorkspace, deleteWorkspace, createWorkspace } = useWorkspaceManager();
  const { 
    isSyncing, 
    peerCount, 
    roomId: activeRoomId, 
    peers, 
    localAlias,
    peerAliases,
    startSync, 
    stopSync, 
    updateLocalAlias,
    wipeLocalData 
  } = useP2P();
  
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetPassword, setTargetPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<string | null>(null);
  const [newUnit, setNewUnit] = useState('');
  const hasInitialized = useRef(false);

  // Reset initialization flag when workspace changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [currentWorkspace]);

  // Update targetRoomId when settings load - ONLY ONCE
  useEffect(() => {
    if (!settingsLoaded || hasInitialized.current) return;
    
    if (settings?.p2pRoomId) {
      setTargetRoomId(settings.p2pRoomId);
    }
    if (settings?.p2pPassword) {
      setTargetPassword(settings.p2pPassword);
    }
    
    // Migration: If we find p2pUsername in synced settings (old version), 
    // move it to localAlias if localAlias is empty, then remove it from DB.
    const syncedUsername = (settings as any).p2pUsername;
    if (syncedUsername) {
      if (!localAlias) {
        updateLocalAlias(syncedUsername);
      }
      // Remove it from the synchronized database to ensure it's unique per device from now on
      const { p2pUsername, ...cleanSettings } = settings as any;
      saveSettings(cleanSettings);
    }

    hasInitialized.current = true;
  }, [settings, settingsLoaded, localAlias, updateLocalAlias, saveSettings]);

  const handleStartSync = async (strategy: 'merge' | 'host-only' | 'new-workspace') => {
    if (!targetRoomId || !db) return;
    
    setIsStrategyOpen(false);
    
    try {
      const activeWorkspace = strategy === 'new-workspace' 
        ? `sync-${targetRoomId.slice(0, 4)}-${Date.now().toString().slice(-4)}`
        : currentWorkspace;

      if (strategy === 'new-workspace') {
        await createWorkspace(activeWorkspace);
      } else if (strategy === 'host-only') {
        await wipeLocalData();
      }
      
      // Wait a bit for the DB to be ready for the new workspace if needed
      if (strategy === 'new-workspace') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Fetch existing settings for the target workspace to avoid wiping them
      let currentSettings = {};
      try {
        if (db) {
          const doc = await db.configs.findOne(`${activeWorkspace}:settings:app`).exec();
          if (doc) {
            currentSettings = doc.toJSON().data || {};
          }
        }
      } catch (e) {
        logger.error('Error fetching existing settings for sync', e);
      }

      // We use db directly to save to ensure it goes to the right workspace
      if (db) {
        await db.configs.upsert({
          id: `${activeWorkspace}:settings:app`,
          workspaceId: activeWorkspace,
          type: 'settings',
          data: { 
            ...currentSettings,
            p2pRoomId: targetRoomId,
            p2pPassword: targetPassword,
            workspaceId: activeWorkspace
          }
        });
      }
      
      toast.success(
        strategy === 'new-workspace' 
          ? `Nueva zona de trabajo "${targetRoomId}" creada y conectada.` 
          : `Conectado a la sala "${targetRoomId}" con éxito.`
      );
    } catch (error) {
      logger.error('Error starting P2P Sync', error);
      toast.error('Ocurrió un error al configurar la sala');
    }
  };

  const handleStopSync = async () => {
    await saveSettings({ 
      p2pRoomId: '',
      p2pPassword: targetPassword
    });
    await stopSync();
    toast.info('Sincronización detenida');
  };

  const isLoaded = unitsLoaded && rolesLoaded && deptsLoaded && settingsLoaded;

  const handleAddUnit = async () => {
    if (newUnit && !units.includes(newUnit)) {
      await saveUnits([...units, newUnit].sort());
      setNewUnit('');
    }
  };

  const handleRemoveUnit = async (unitToRemove: string) => {
    await saveUnits(units.filter((u) => u !== unitToRemove));
  };

  const handleConfirmReset = async () => {
    if (!actionToConfirm) return;

    switch (actionToConfirm) {
      case 'reports':
        await clearAllReports();
        break;
      case 'templates':
        await clearAllTemplates();
        break;
      case 'staff':
        await clearAllRoles();
        await clearAllDepartments();
        await clearAllGuards();
        await clearAllUnits();
        break;
      case 'definitions':
        await clearAllDefinitions();
        break;
      case 'all':
        await Promise.all([
          clearAllReports(),
          clearAllTemplates(),
          clearAllRoles(),
          clearAllDepartments(),
          clearAllGuards(),
          clearAllUnits(),
          clearAllDefinitions(),
          clearAllSettings(),
          clearDraft(),
        ]);
        localStorage.removeItem('report-app-welcome-seen');
        window.location.reload();
        break;
    }

    setActionToConfirm(null);
  };

  /* REPORTING ROLES LOGIC */
  const handleAddReportRole = async (roleName: string) => {
    if (roleName && !settings.reportaRoleIds?.includes(roleName)) {
      await saveSettings({
        ...settings,
        reportaRoleIds: [...(settings.reportaRoleIds || []), roleName],
      });
    }
  };

  const handleRemoveReportRole = async (roleName: string) => {
    await saveSettings({
      ...settings,
      reportaRoleIds: (settings.reportaRoleIds || []).filter((r) => r !== roleName),
    });
  };

  const handleMoveReportRole = async (index: number, direction: 'up' | 'down') => {
    if (!settings.reportaRoleIds) return;
    const newRoles = [...settings.reportaRoleIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newRoles.length) {
      const temp = newRoles[index];
      const target = newRoles[targetIndex];
      if (temp !== undefined && target !== undefined) {
        newRoles[index] = target;
        newRoles[targetIndex] = temp;
        await saveSettings({ ...settings, reportaRoleIds: newRoles });
      }
    }
  };

  const resetOptions: {
    [key: string]: { title: string; description: string; buttonLabel: string };
  } = {
    reports: {
      title: '¿Limpiar todos los reportes?',
      description:
        'Esta acción es irreversible. Se eliminarán permanentemente todos los reportes de novedades que has guardado.',
      buttonLabel: 'Limpiar Reportes',
    },
    templates: {
      title: '¿Limpiar todas las plantillas?',
      description:
        'Esta acción es irreversible. Se eliminarán permanentemente todas las plantillas y sus configuraciones asociadas.',
      buttonLabel: 'Limpiar Plantillas',
    },
    staff: {
      title: '¿Restablecer personal, guardias y unidades?',
      description:
        'Se eliminarán todas las guardias, departamentos, cargos personalizados y unidades, volviendo a la configuración por defecto. El personal y las unidades asignadas se perderán.',
      buttonLabel: 'Restablecer Personal y Unidades',
    },
    definitions: {
      title: '¿Restablecer etiquetas globales?',
      description:
        'Se eliminarán todas las etiquetas globales personalizadas, volviendo a la configuración por defecto.',
      buttonLabel: 'Restablecer Etiquetas',
    },
    all: {
      title: '¿Restablecer toda la aplicación?',
      description:
        '¡ADVERTENCIA! Esta acción es irreversible. Se eliminará TODA la información guardada (reportes, plantillas, configuraciones, personal) y se restaurará la aplicación a su estado inicial. Es como abrirla por primera vez.',
      buttonLabel: 'Restablecer Toda la Aplicación',
    },
  };

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
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Quick access to Templates */}
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Plantillas</CardTitle>
            <CardDescription>
              Gestiona las plantillas usadas para generar los reportes de novedades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/plantillas"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <div>
                  <p className="font-medium">Ir a Plantillas</p>
                  <p className="text-xs text-muted-foreground">Crear, editar y gestionar plantillas de reportes</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </CardContent>
        </Card>

        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Configuración de Personal que Reporta</CardTitle>
            <CardDescription>
              Gestiona los cargos que se usarán para rellenar la etiqueta [Reporta].
              El orden en la lista determina la prioridad al mostrar el personal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2 max-w-sm">
              <Label>Añadir Cargo a Reporta</Label>
              <Select onValueChange={handleAddReportRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cargo para añadir..." />
                </SelectTrigger>
                <SelectContent>
                  {initialRoles
                    .filter((role) => !settings.reportaRoleIds?.includes(role.name))
                    .map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cargos Seleccionados (Prioridad de arriba a abajo)</Label>
              <div className="space-y-2 rounded-md border p-2">
                {settings.reportaRoleIds && settings.reportaRoleIds.length > 0 ? (
                  settings.reportaRoleIds.map((roleName, index) => (
                    <div
                      key={roleName}
                      className="flex items-center justify-between rounded-md p-3 bg-muted/30 hover:bg-muted/50 transition-colors border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="font-medium">{roleName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveReportRole(index, 'up')}
                          disabled={index === 0}
                          title="Subir prioridad"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveReportRole(index, 'down')}
                          disabled={index === (settings.reportaRoleIds?.length || 0) - 1}
                          title="Bajar prioridad"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </Button>
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveReportRole(roleName)}
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-md bg-muted/5">
                    No has seleccionado ningún cargo para el reporte.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Gestión de Unidades</CardTitle>
            <CardDescription>
              Añade o elimina unidades de la lista de vehículos operativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Añadir Nueva Unidad</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:max-w-sm">
                <Input
                  id="new-unit"
                  name="new-unit"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="Ej: Alpha 3"
                  className="flex-1"
                />
                <Button onClick={handleAddUnit} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unidades Existentes</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto rounded-md border p-2">
                {units.length > 0 ? (
                  units.map((unit) => (
                    <div
                      key={unit}
                      className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
                    >
                      <span>{unit}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveUnit(unit)}
                        aria-label={`Eliminar Unidad ${unit}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">No hay unidades.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seccion de Areas de Trabajo (Workspaces) */}
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

        {/* P2P Synchronization */}
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Sincronización en Tiempo Real (P2P)
            </CardTitle>
            <CardDescription>
              Conecta varios dispositivos para sincronizar reportes y personal de forma directa sin servidores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                  isSyncing ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                )}>
                  {isSyncing ? <Wifi className="h-5 w-5 animate-pulse" /> : <WifiOff className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-semibold">{isSyncing ? 'Sincronización Activa' : 'Sincronización Desconectada'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isSyncing 
                      ? `Conectado a la sala "${activeRoomId}". ${peerCount} pares encontrados.` 
                      : 'Ingresa un ID de sala para empezar a compartir datos.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-id">ID de Sala / Token Compartido</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:max-w-md">
                  <Input
                    id="room-id"
                    name="room-id"
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(e.target.value)}
                    placeholder="Ej: equipo-alfa-2026"
                    disabled={isSyncing}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="p2p-username">Tu Nombre / Alias (Local)</Label>
                    <Input
                      id="p2p-username"
                      name="p2p-username"
                      value={localAlias}
                      onChange={(e) => updateLocalAlias(e.target.value)}
                      placeholder="Ej: Supervisor Juan"
                      disabled={isSyncing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p2p-password">Contraseña de Sala</Label>
                    <Input
                      id="p2p-password"
                      name="p2p-password"
                      type="password"
                      value={targetPassword}
                      onChange={(e) => setTargetPassword(e.target.value)}
                      placeholder="Opcional para mayor seguridad"
                      disabled={isSyncing}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  {isSyncing ? (
                    <Button variant="destructive" onClick={handleStopSync} className="w-full sm:w-auto">
                      Detener
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setIsStrategyOpen(true)} 
                      disabled={!targetRoomId}
                      className="w-full sm:w-auto"
                    >
                      Iniciar Sincronización
                    </Button>
                  )}
                </div>
                {peers.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold">Peers Conectados:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {peers.map((peer, idx) => {
                         const displayName = peerAliases[peer.id] || peer.id;
                         return (
                           <div key={idx} className="flex items-center justify-between p-2 text-[11px] rounded bg-muted">
                             <span className="truncate max-w-[120px]" title={peer.id}>
                               {displayName}
                             </span>
                             <Badge variant={peer.isMaster ? "default" : "outline"} className="h-4 text-[9px]">
                               {peer.isMaster ? 'Anfitrión' : 'Seguidor'}
                             </Badge>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  * Todos los dispositivos con el mismo ID de sala compartirán datos de la área actual (<strong>{currentWorkspace}</strong>).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <GlobalTagsManager />

        <Card className="max-w-4xl mx-auto shadow-lg border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle />
              Zona de Peligro
            </CardTitle>
            <CardDescription>
              Las siguientes acciones son destructivas y no se pueden deshacer. Úsalas con
              precaución.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(resetOptions).map(([key, option]) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 rounded-md border border-dashed border-destructive/50"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-destructive">{option.buttonLabel}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description.split('.')[0]}.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setActionToConfirm(key)}
                  className="w-full sm:w-auto shrink-0 shadow-sm"
                >
                  {option.buttonLabel}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div >

      <AlertDialog
        open={!!actionToConfirm}
        onOpenChange={(open) => !open && setActionToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionToConfirm && resetOptions[actionToConfirm]?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionToConfirm && resetOptions[actionToConfirm]?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionToConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset}>Sí, continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Estrategia de Sincronización */}
      <Dialog open={isStrategyOpen} onOpenChange={setIsStrategyOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-yellow-500" />
              Estrategia de Sincronización
            </DialogTitle>
            <DialogDescription>
              ¿Cómo quieres manejar tus datos locales al unirte a la sala <strong>{targetRoomId}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <button
              onClick={() => handleStartSync('merge')}
              className="flex items-start gap-4 p-4 rounded-xl border text-left hover:bg-muted/50 transition-all group"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Escenario 1: Conservar y Combinar</p>
                <p className="text-xs text-muted-foreground">
                  Mezcla el trabajo de ambas áreas. No se elimina ningún reporte; los datos se complementan.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleStartSync('host-only')}
              className="flex items-start gap-4 p-4 rounded-xl border text-left hover:bg-muted/50 transition-all group border-amber-500/20"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Escenario 2: Información del Anfitrión</p>
                <p className="text-xs text-muted-foreground text-amber-600/80">
                  <Info className="inline h-3 w-3 mr-1" />
                  <strong>Limpia tu área actual</strong> para trabajar exclusivamente con los datos del anfitrión.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleStartSync('new-workspace')}
              className="flex items-start gap-4 p-4 rounded-xl border text-left hover:bg-muted/50 transition-all group"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Escenario 3: Área Nueva Independiente</p>
                <p className="text-xs text-muted-foreground">
                  Crea un área limpia y separada para esta sesión. Tu información actual se conserva intacta en el área anterior.
                </p>
              </div>
            </button>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsStrategyOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
