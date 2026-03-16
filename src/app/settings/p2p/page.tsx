'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { useP2P } from '@/lib/db/p2p-provider';
import { useSettings } from '@/hooks/use-settings';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  Info,
  Layers,
  Monitor,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function P2PPage() {
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const isMobile = useIsMobile();
  const db = useDatabase();
  const { currentWorkspace, createWorkspace } = useWorkspaceManager();
  
  const { 
    isSyncing, 
    peerCount, 
    roomId: activeRoomId, 
    peers, 
    localAlias,
    peerAliases,
    connectionStatus,
    startSync, 
    stopSync, 
    updateLocalAlias,
    localRole,
    wipeLocalData,
    roomId,
    targetPassword: contextPassword,
    targetSignalingUrl: contextSignalingUrl
  } = useP2P();
  
  const [targetRoomId, setTargetRoomId] = useState('');
  const [targetPassword, setTargetPassword] = useState('');
  const [targetSignalingUrl, setTargetSignalingUrl] = useState('');
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [selectedLocalRole, setSelectedLocalRole] = useState<'host' | 'follower' | 'undetermined'>('undetermined');
  const hasInitialized = useRef(false);

  // Update targetRoomId when settings load - ONLY ONCE
  useEffect(() => {
    if (!settingsLoaded || hasInitialized.current) return;
    
    if (roomId) {
      setTargetRoomId(roomId);
    }
    if (contextPassword) {
      setTargetPassword(contextPassword);
    }
    if (contextSignalingUrl) {
      setTargetSignalingUrl(contextSignalingUrl);
    }
    if (localRole !== 'undetermined') {
      setSelectedLocalRole(localRole);
    }
    
    // Migration: If we find p2pUsername in synced settings (old version), 
    // move it to localAlias if localAlias is empty, then remove it from DB.
    const syncedUsername = (settings as any).p2pUsername;
    if (syncedUsername) {
      if (!localAlias) {
        updateLocalAlias(syncedUsername);
      }
      const { p2pUsername, ...cleanSettings } = settings as any;
      saveSettings(cleanSettings);
    }

    hasInitialized.current = true;
  }, [settings, settingsLoaded, localAlias, updateLocalAlias, saveSettings, roomId, contextPassword, contextSignalingUrl, localRole]);

  const handleStartSync = async (
    strategy: 'merge' | 'host-only' | 'new-workspace',
    roleArg?: 'host' | 'follower' | 'undetermined'
  ) => {
    if (!targetRoomId || !db) return;
    
    const finalRole = roleArg || selectedLocalRole;
    
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
      
      if (strategy === 'new-workspace') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await startSync(targetRoomId, localAlias, targetPassword, targetSignalingUrl, finalRole);
      
      toast.success(
        strategy === 'new-workspace' 
          ? `Nueva zona de trabajo "${activeWorkspace}" creada y conectada.` 
          : `Conectado a la sala "${targetRoomId}" con éxito.`
      );
    } catch (error) {
      logger.error('Error starting P2P Sync', error);
      toast.error('Ocurrió un error al configurar la sala');
    }
  };

  const handleStopSync = async () => {
    await stopSync();
    toast.info('Sincronización detenida');
  };

  if (!settingsLoaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-4xl mx-auto flex items-center gap-4 mb-2">
         <Link href="/settings">
           <Button variant="ghost" size="icon" className="h-9 w-9">
              <ChevronLeft className="h-5 w-5" />
           </Button>
         </Link>
         <h1 className="text-2xl font-bold tracking-tight">Sincronización P2P</h1>
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Sincronización en Tiempo Real
          </CardTitle>
          <CardDescription>
            Conecta varios dispositivos para sincronizar reportes y personal de forma directa sin servidores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full shrink-0 transition-colors",
                connectionStatus === 'connected' ? "bg-green-500/10 text-green-500" : 
                connectionStatus === 'connecting' ? "bg-yellow-500/10 text-yellow-500" :
                connectionStatus === 'error' ? "bg-destructive/10 text-destructive shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]" :
                "bg-muted text-muted-foreground"
              )}>
                {connectionStatus === 'connected' && <Wifi className="h-5 w-5" />}
                {connectionStatus === 'connecting' && <Zap className="h-5 w-5 animate-pulse" />}
                {connectionStatus === 'error' && <AlertTriangle className="h-5 w-5 animate-bounce" />}
                {connectionStatus === 'idle' && <WifiOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-semibold">
                  {connectionStatus === 'connected' && 'Sincronización Activa'}
                  {connectionStatus === 'connecting' && 'Buscando pares...'}
                  {connectionStatus === 'error' && 'Error de Conexión'}
                  {connectionStatus === 'idle' && 'Sincronización Desconectada'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected' && `Conectado a "${activeRoomId}". ${peerCount} pares.`}
                  {connectionStatus === 'connecting' && 'Intentando establecer conexión P2P...'}
                  {connectionStatus === 'error' && 'No se pudo establecer la conexión P2P.'}
                  {connectionStatus === 'idle' && 'Ingresa un ID de sala para empezar a compartir datos.'}
                </p>
              </div>
            </div>

            {connectionStatus === 'error' && (
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-destructive">
                  <Info className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wider">Guía de Solución de Problemas</p>
                </div>
                <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                  <li>Verifica que <strong>ambos dispositivos</strong> usen el mismo <strong>ID de Sala</strong> y <strong>Contraseña</strong>.</li>
                  <li>Asegúrate de que el ID de Sala sea <strong>único</strong> (ej: <code>minutas-p2p-7281</code>) para evitar colisiones.</li>
                  <li>Prueba a conectar ambos dispositivos a la <strong>misma red WiFi</strong> si están en redes diferentes.</li>
                  <li>Si usas un Firewall o Antivirus, asegúrate de que no bloqueen las conexiones WebRTC.</li>
                  <li>Reinicia la sincronización en ambos dispositivos simultáneamente.</li>
                </ul>
              </div>
            )}

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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="p2p-signaling">Servidor de Señalización (Avanzado)</Label>
                  <Badge variant="outline" className="text-[10px] h-4">Avanzado</Badge>
                </div>
                <Input
                  id="p2p-signaling"
                  name="p2p-signaling"
                  value={targetSignalingUrl}
                  onChange={(e) => setTargetSignalingUrl(e.target.value)}
                  placeholder="Predeterminado: wss://signaling.rxdb.info/"
                  disabled={isSyncing}
                />
                {!targetSignalingUrl && (
                  <p className="text-[10px] text-muted-foreground">
                    * Usando el servidor público de RxDB (puede ser inestable en producción).
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {isSyncing ? (
                  <Button 
                    variant={connectionStatus === 'error' ? "default" : "destructive"} 
                    onClick={connectionStatus === 'error' ? () => handleStartSync('merge') : handleStopSync} 
                    className="w-full sm:w-auto"
                  >
                    {connectionStatus === 'error' ? 'Reintentar' : 'Detener'}
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

      {/* Modal de Estrategia de Sincronización - Responsive */}
      {isMobile ? (
        <Sheet open={isStrategyOpen} onOpenChange={setIsStrategyOpen}>
          <SheetContent side="bottom" className="rounded-t-xl p-6">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-yellow-500" />
                Estrategia de Sincronización
              </SheetTitle>
              <SheetDescription>
                ¿Cómo quieres manejar tus datos locales al unirte a la sala <strong>{targetRoomId}</strong>?
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 py-6">
              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">1. Rol de este Dispositivo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedLocalRole('host');
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all",
                      selectedLocalRole === 'host' ? "bg-primary/5 border-primary ring-1 ring-primary" : "hover:bg-muted"
                    )}
                  >
                    <Monitor className={cn("h-6 w-6", selectedLocalRole === 'host' ? "text-primary" : "text-muted-foreground")} />
                    <div className="space-y-1">
                      <span className="font-bold text-xs uppercase">Anfitrión (Host)</span>
                      <p className="text-[10px] text-muted-foreground leading-tight">Es la fuente de la verdad.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedLocalRole('follower');
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all",
                      selectedLocalRole === 'follower' ? "bg-primary/5 border-primary ring-1 ring-primary" : "hover:bg-muted"
                    )}
                  >
                    <Zap className={cn("h-6 w-6", selectedLocalRole === 'follower' ? "text-primary" : "text-muted-foreground")} />
                    <div className="space-y-1">
                      <span className="font-bold text-xs uppercase">Seguidor (Follower)</span>
                      <p className="text-[10px] text-muted-foreground leading-tight">Recibe datos del anfitrión.</p>
                    </div>
                  </button>
                </div>
              </div>


              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">2. Escenario de Datos</Label>
                <div className="grid gap-3">
                  <button
                    onClick={() => handleStartSync('merge', selectedLocalRole)}
                    className="flex items-start gap-4 p-4 rounded-xl border text-left hover:bg-muted/50 transition-all group active:scale-[0.98]"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Escenario 1: Conservar y Combinar</p>
                      <p className="text-xs text-muted-foreground">
                        Mezcla el trabajo de ambas áreas. No se elimina ningún reporte; los datos se complementan.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleStartSync('host-only', selectedLocalRole)}
                    className="flex items-start gap-4 p-4 rounded-xl border text-left hover:bg-muted/50 transition-all group border-amber-500/20 active:scale-[0.98]"
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
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isStrategyOpen} onOpenChange={setIsStrategyOpen}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-yellow-500 text-white shrink-0">
               <div className="flex items-center gap-3">
                 <Zap className="h-8 w-8 text-yellow-100" />
                 <div>
                   <DialogTitle className="text-xl font-bold">Estrategia de Sincronización</DialogTitle>
                   <DialogDescription className="text-yellow-50/90">
                     Selecciona cómo quieres conectarte a la sala <strong>{targetRoomId}</strong>
                   </DialogDescription>
                 </div>
               </div>
            </DialogHeader>

            <div className="p-6 space-y-8 bg-background">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">1. Rol de este Dispositivo</Label>
                    <Badge variant="secondary" className="text-[10px]">{selectedLocalRole === 'host' ? 'Anfitrión' : selectedLocalRole === 'follower' ? 'Seguidor' : 'Sin asignar'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedLocalRole('host')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                        selectedLocalRole === 'host' ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <Monitor className={cn("h-8 w-8", selectedLocalRole === 'host' ? "text-primary" : "text-muted-foreground")} />
                      <div className="text-center">
                        <span className="font-bold text-xs uppercase block">Anfitrión</span>
                        <p className="text-[10px] text-muted-foreground mt-1">Fuente oficial de datos</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedLocalRole('follower')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                        selectedLocalRole === 'follower' ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <Zap className={cn("h-8 w-8", selectedLocalRole === 'follower' ? "text-primary" : "text-muted-foreground")} />
                      <div className="text-center">
                        <span className="font-bold text-xs uppercase block">Seguidor</span>
                        <p className="text-[10px] text-muted-foreground mt-1">Recibe actualizaciones</p>
                      </div>
                    </button>
                  </div>
               </div>

               <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">2. Escenario de Datos</Label>
                  <div className="grid gap-3">
                    <button
                      disabled={selectedLocalRole === 'undetermined'}
                      onClick={() => handleStartSync('merge', selectedLocalRole)}
                      className="flex items-start gap-4 p-4 rounded-xl border text-left hover:bg-muted/50 transition-all group disabled:opacity-50"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">Combinar Datos (Recomendado)</p>
                        <p className="text-xs text-muted-foreground">
                          Mezcla el trabajo de ambas áreas sin eliminar nada.
                        </p>
                      </div>
                    </button>

                    <button
                      disabled={selectedLocalRole === 'undetermined'}
                      onClick={() => handleStartSync('host-only', selectedLocalRole)}
                      className="flex items-start gap-4 p-4 rounded-xl border text-left hover:bg-muted/50 transition-all group border-amber-200"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Monitor className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-amber-700">Usar solo datos del Anfitrión</p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Limpia tu área actual</strong> para usar los datos del equipo.
                        </p>
                      </div>
                    </button>
                  </div>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
