'use client';

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
  LogIn,
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
import { LoginDialog } from '@/components/auth/login-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSyncPagina } from '@/hooks/use-sync-pagina';

export default function SyncPage() {
  const hook = useSyncPagina();
  const { estaConfigurado, esLoginOpen, setEsLoginOpen } = hook;

  if (!estaConfigurado) {
    return (
      <div className="flex flex-col h-full bg-background overflow-y-auto">
        <PantallaConfiguracionSync hook={hook} />
        <LoginDialog open={esLoginOpen} onOpenChange={setEsLoginOpen} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ScrollArea className="flex-1">
        <PantallaEstadoSync hook={hook} />
      </ScrollArea>
      <ConfirmarReinicioSync hook={hook} />
    </div>
  );
}

function CabeceraSync({ usuario, esPrincipal, esSecundario, modoSimple = false }: { usuario?: any; esPrincipal?: boolean; esSecundario?: boolean; modoSimple?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <Link to="/settings">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold">Sincronización</h1>
        {modoSimple ? (
          <p className="text-sm text-muted-foreground">
            Conecta dispositivos para compartir reportes en tiempo real.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground truncate">{usuario?.email}</p>
        )}
      </div>
      {!modoSimple && (
        <Badge variant={esPrincipal ? 'default' : 'secondary'} className="shrink-0">
          {esPrincipal ? (
            <><Monitor className="h-3 w-3 mr-1" />Principal</>
          ) : (
            <><Smartphone className="h-3 w-3 mr-1" />Secundario</>
          )}
        </Badge>
      )}
    </div>
  );
}

function PantallaConfiguracionSync({ hook }: { hook: any }) {
  const { 
    estaAutenticado, 
    usuario,
    signOut,
    setEsLoginOpen, 
    modo, 
    setModo, 
    nombreDispositivo, 
    setNombreDispositivo, 
    codigoUnion, 
    setCodigoUnion, 
    manejarConfiguracion, 
    sincronizando 
  } = hook;

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
      <CabeceraSync modoSimple={true} />

      <div className="space-y-4">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Cuenta</Label>
        {!estaAutenticado ? (
          <Card className="border-blue-500/30 bg-blue-500/5 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <LogIn className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-tight">Inicio de sesión requerido</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Necesitas una cuenta para habilitar la sincronización en la nube.
                </p>
              </div>
              <Button size="sm" onClick={() => setEsLoginOpen(true)} className="bg-blue-600 hover:bg-blue-500 font-bold">
                Iniciar sesión
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{usuario?.email}</p>
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Sesión Activa</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive"
              >
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Modo de dispositivo</Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setModo('primary')}
            className={cn(
              'rounded-xl border-2 p-5 text-left transition-all hover:bg-accent/50',
              modo === 'primary'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-muted/5'
            )}
          >
            <Monitor className={cn('h-7 w-7 mb-3', modo === 'primary' ? 'text-primary' : 'text-muted-foreground')} />
            <p className="font-bold text-sm">Principal</p>
            <p className="text-xs text-muted-foreground mt-1">
              Recibe los reportes de los demás dispositivos.
            </p>
          </button>

          <button
            onClick={() => setModo('secondary')}
            className={cn(
              'rounded-xl border-2 p-5 text-left transition-all hover:bg-accent/50',
              modo === 'secondary'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-muted/5'
            )}
          >
            <Smartphone className={cn('h-7 w-7 mb-3', modo === 'secondary' ? 'text-primary' : 'text-muted-foreground')} />
            <p className="font-bold text-sm">Secundario</p>
            <p className="text-xs text-muted-foreground mt-1">
              Envía reportes al dispositivo principal.
            </p>
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="device-name">Nombre de este dispositivo</Label>
            <Input
              id="device-name"
              placeholder='Ej. "PC Principal", "Móvil de Pedro"'
              value={nombreDispositivo}
              onChange={(e) => setNombreDispositivo(e.target.value)}
            />
          </div>

          {modo === 'secondary' && (
            <div className="space-y-2">
              <Label htmlFor="join-code">Código del dispositivo principal</Label>
              <Input
                id="join-code"
                placeholder="Ej. K7X2M9"
                value={codigoUnion}
                onChange={(e) => setCodigoUnion(e.target.value.toUpperCase())}
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
            onClick={manejarConfiguracion}
            disabled={sincronizando}
          >
            {sincronizando ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4 mr-2" />
            )}
            {modo === 'primary' ? 'Crear canal' : 'Conectarme al canal'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PantallaEstadoSync({ hook }: { hook: any }) {
  const { usuario, esPrincipal, esSecundario, configSync, setEsConfirmarReinicioOpen } = hook;

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
      <CabeceraSync usuario={usuario} esPrincipal={esPrincipal} esSecundario={esSecundario} />

      <Card className={cn(
        'border-2',
        esPrincipal ? 'border-green-500/30 bg-green-500/5' : 'border-blue-500/30 bg-blue-500/5'
      )}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-2.5 w-2.5 rounded-full animate-pulse',
              esPrincipal ? 'bg-green-500' : 'bg-blue-500'
            )} />
            <span className="font-semibold text-sm">
              {esPrincipal ? 'Escuchando reportes entrantes' : 'Listo para enviar reportes'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {esPrincipal
              ? `Canal: ${configSync.channelCode} · Modo: ${configSync.importMode === 'auto' ? 'Automático' : 'Bandeja de entrada'}`
              : `Conectado al canal: ${configSync.channelCode}`}
          </p>
        </CardContent>
      </Card>

      {esPrincipal && <SeccionPrincipalSync hook={hook} />}
      {esSecundario && <SeccionSecundarioSync />}

      <ZonaPeligroSync esPrincipal={esPrincipal} alReiniciar={() => setEsConfirmarReinicioOpen(true)} />
    </div>
  );
}

function SeccionPrincipalSync({ hook }: { hook: any }) {
  const { configSync, manejarCopiarCodigo, setModoImportacion, reportesBandeja, importarDeBandeja, descartarDeBandeja, sincronizando } = hook;

  return (
    <>
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
                {configSync.channelCode}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={manejarCopiarCodigo}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-sm font-medium">Importación automática</p>
              <p className="text-xs text-muted-foreground">
                {configSync.importMode === 'auto'
                  ? 'Los reportes entran directamente a Novedades.'
                  : 'Los reportes van a la bandeja para aprobación manual.'}
              </p>
            </div>
            <Switch
              checked={configSync.importMode === 'auto'}
              onCheckedChange={(v) => setModoImportacion(v ? 'auto' : 'inbox')}
            />
          </div>
        </CardContent>
      </Card>

      {configSync.importMode === 'inbox' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Bandeja de Entrada
                {reportesBandeja.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[10px] h-5">
                    {reportesBandeja.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <CardDescription>Reportes pendientes de importación.</CardDescription>
          </CardHeader>
          <CardContent>
            {reportesBandeja.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-3 opacity-20" />
                No hay reportes pendientes.
              </div>
            ) : (
              <div className="space-y-2">
                {reportesBandeja.map((sr: any) => (
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
                        onClick={() => descartarDeBandeja(sr)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:bg-green-500/10"
                        onClick={() => importarDeBandeja(sr)}
                        disabled={sincronizando}
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
    </>
  );
}

function SeccionSecundarioSync() {
  return (
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
  );
}

function ZonaPeligroSync({ esPrincipal, alReiniciar }: { esPrincipal: boolean; alReiniciar: () => void }) {
  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-destructive">Zona de Peligro</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          size="sm"
          onClick={alReiniciar}
          className="w-full sm:w-auto"
        >
          <WifiOff className="h-4 w-4 mr-2" />
          {esPrincipal ? 'Eliminar canal y desactivar sync' : 'Desconectarme del canal'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ConfirmarReinicioSync({ hook }: { hook: any }) {
  const { esConfirmarReinicioOpen, setEsConfirmarReinicioOpen, esPrincipal, reiniciarSync } = hook;

  return (
    <AlertDialog open={esConfirmarReinicioOpen} onOpenChange={setEsConfirmarReinicioOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar sincronización?</AlertDialogTitle>
          <AlertDialogDescription>
            {esPrincipal
              ? 'Se eliminará el canal y todos los reportes pendientes en Supabase. Los reportes ya importados no se verán afectados.'
              : 'Este dispositivo se desconectará del canal. Podrás volverte a conectar con el código del principal.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => { reiniciarSync(); setEsConfirmarReinicioOpen(false); }}
          >
            Sí, desactivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
