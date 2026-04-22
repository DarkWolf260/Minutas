'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle2,
  X,
  Send,
  Inbox,
  Zap,
  LogIn,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSyncManager } from '@/hooks/use-sync';
import { useAuth } from '@/hooks/use-auth';
import { LoginDialog } from '@/components/auth/login-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SyncPage() {
  const { isAuthenticated, user } = useAuth();
  const {
    syncConfig,
    inboxReports,
    isSyncing,
    isPrimary,
    isSecondary,
    isConfigured,
    setupAsPrimary,
    setupAsSecondary,
    sendReport: _sendReport,
    importFromInbox,
    discardFromInbox,
    resetSync,
    setImportMode,
  } = useSyncManager();

  const [deviceName, setDeviceName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'primary' | 'secondary'>('primary');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // ── Setup handlers ──────────────────────────────────────────────

  const handleSetup = async () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    if (!deviceName.trim()) {
      toast.error('Ingresa un nombre para este dispositivo.');
      return;
    }
    if (mode === 'primary') {
      await setupAsPrimary(deviceName.trim());
    } else {
      if (!joinCode.trim()) {
        toast.error('Ingresa el código del dispositivo principal.');
        return;
      }
      await setupAsSecondary(deviceName.trim(), joinCode.trim());
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncConfig.channelCode ?? '');
    toast.success('Código copiado al portapapeles.');
  };

  // ── Setup screen (not yet configured) ──────────────────────────

  if (!isConfigured) {
    return (
      <div className="flex flex-col h-full bg-background overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Sincronización</h1>
              <p className="text-sm text-muted-foreground">
                Conecta dispositivos para compartir reportes en tiempo real.
              </p>
            </div>
          </div>

          {/* Auth warning */}
          {!isAuthenticated && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex items-center gap-4 p-4">
                <LogIn className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Inicio de sesión requerido</p>
                  <p className="text-xs text-muted-foreground">
                    Necesitas una cuenta para usar la sincronización.
                  </p>
                </div>
                <Button size="sm" onClick={() => setLoginOpen(true)}>
                  Iniciar sesión
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('primary')}
              className={cn(
                'rounded-xl border-2 p-5 text-left transition-all hover:bg-accent/50',
                mode === 'primary'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border'
              )}
            >
              <Monitor className={cn('h-7 w-7 mb-3', mode === 'primary' ? 'text-primary' : 'text-muted-foreground')} />
              <p className="font-bold text-sm">Principal</p>
              <p className="text-xs text-muted-foreground mt-1">
                Este dispositivo recibe los reportes de los demás.
              </p>
            </button>

            <button
              onClick={() => setMode('secondary')}
              className={cn(
                'rounded-xl border-2 p-5 text-left transition-all hover:bg-accent/50',
                mode === 'secondary'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border'
              )}
            >
              <Smartphone className={cn('h-7 w-7 mb-3', mode === 'secondary' ? 'text-primary' : 'text-muted-foreground')} />
              <p className="font-bold text-sm">Secundario</p>
              <p className="text-xs text-muted-foreground mt-1">
                Este dispositivo envía reportes al principal.
              </p>
            </button>
          </div>

          {/* Form */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="device-name">Nombre de este dispositivo</Label>
                <Input
                  id="device-name"
                  placeholder='Ej. "PC Principal", "Móvil de Pedro"'
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              {mode === 'secondary' && (
                <div className="space-y-2">
                  <Label htmlFor="join-code">Código del dispositivo principal</Label>
                  <Input
                    id="join-code"
                    placeholder="Ej. K7X2M9"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono tracking-widest text-center text-lg uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Encuentra este código en la pantalla de Sincronización del dispositivo principal.
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSetup}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4 mr-2" />
                )}
                {mode === 'primary' ? 'Crear canal' : 'Conectarme al canal'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </div>
    );
  }

  // ── Configured screen ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">Sincronización</h1>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Badge variant={isPrimary ? 'default' : 'secondary'} className="shrink-0">
              {isPrimary ? (
                <><Monitor className="h-3 w-3 mr-1" />Principal</>
              ) : (
                <><Smartphone className="h-3 w-3 mr-1" />Secundario</>
              )}
            </Badge>
          </div>

          {/* Status card */}
          <Card className={cn(
            'border-2',
            isPrimary ? 'border-green-500/30 bg-green-500/5' : 'border-blue-500/30 bg-blue-500/5'
          )}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-2.5 w-2.5 rounded-full animate-pulse',
                  isPrimary ? 'bg-green-500' : 'bg-blue-500'
                )} />
                <span className="font-semibold text-sm">
                  {isPrimary ? 'Escuchando reportes entrantes' : 'Listo para enviar reportes'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPrimary
                  ? `Canal: ${syncConfig.channelCode} · Modo: ${syncConfig.importMode === 'auto' ? 'Automático' : 'Bandeja de entrada'}`
                  : `Conectado al canal: ${syncConfig.channelCode}`}
              </p>
            </CardContent>
          </Card>

          {/* Primary: channel code */}
          {isPrimary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Código del Canal</CardTitle>
                <CardDescription>
                  Comparte este código con los dispositivos secundarios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-lg py-3 px-5 flex items-center justify-center">
                    <span className="font-mono text-3xl font-bold tracking-[0.3em] text-primary select-all">
                      {syncConfig.channelCode}
                    </span>
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Import mode toggle */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium">Importación automática</p>
                    <p className="text-xs text-muted-foreground">
                      {syncConfig.importMode === 'auto'
                        ? 'Los reportes entran directamente a Novedades.'
                        : 'Los reportes van a la bandeja para aprobación manual.'}
                    </p>
                  </div>
                  <Switch
                    checked={syncConfig.importMode === 'auto'}
                    onCheckedChange={(v) => setImportMode(v ? 'auto' : 'inbox')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primary: inbox */}
          {isPrimary && syncConfig.importMode === 'inbox' && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Bandeja de Entrada
                    {inboxReports.length > 0 && (
                      <Badge variant="destructive" className="ml-1 text-[10px] h-5">
                        {inboxReports.length}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                <CardDescription>Reportes pendientes de importación.</CardDescription>
              </CardHeader>
              <CardContent>
                {inboxReports.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Inbox className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    No hay reportes pendientes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inboxReports.map((sr) => (
                      <div
                        key={sr.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{sr.reportData.title}</p>
                          <p className="text-xs text-muted-foreground">
                            De: {sr.sourceDevice} ·{' '}
                            {format(new Date(sr.sentAt), "d MMM, HH:mm", { locale: es })}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => discardFromInbox(sr)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:bg-green-500/10"
                            onClick={() => importFromInbox(sr)}
                            disabled={isSyncing}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Secondary: instructions */}
          {isSecondary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Cómo enviar reportes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Al guardar un reporte en Novedades verás un botón adicional:</p>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2 font-medium text-foreground">
                  <Send className="h-4 w-4 text-primary" />
                  Enviar al Principal
                </div>
                <p>
                  Al pulsarlo, el reporte se guardará localmente y también se enviará al dispositivo principal.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Danger zone */}
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive">Zona de Peligro</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setResetConfirmOpen(true)}
                className="w-full sm:w-auto"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                {isPrimary ? 'Eliminar canal y desactivar sync' : 'Desconectarme del canal'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Reset confirm */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar sincronización?</AlertDialogTitle>
            <AlertDialogDescription>
              {isPrimary
                ? 'Se eliminará el canal y todos los reportes pendientes en Supabase. Los reportes ya importados no se verán afectados.'
                : 'Este dispositivo se desconectará del canal. Podrás volverte a conectar con el código del principal.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { resetSync(); setResetConfirmOpen(false); }}
            >
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
