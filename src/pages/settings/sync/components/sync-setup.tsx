import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Monitor, Smartphone, Camera, Wifi, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SyncHeader } from './sync-header';

interface SyncSetupProps {
  hook: any;
  setEsQRScannerOpen: (v: boolean) => void;
  whatsappComponent?: React.ReactNode;
}

export const SyncSetup = ({ hook, setEsQRScannerOpen, whatsappComponent }: SyncSetupProps) => {
  const navigate = useNavigate();
  const {
    estaAutenticado,
    usuario,
    signOut,
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
    <div className="max-w-5xl mx-auto w-full px-4 pt-8 pb-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SyncHeader modoSimple={true} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
        {/* Lado Izquierdo: Cuenta y Modo de dispositivo */}
        <div className="lg:col-span-7 space-y-6">
          {/* Autenticación (SRP) */}
          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Cuenta</Label>
            {!estaAutenticado ? (
              <Card className="border-blue-500/30 bg-blue-500/5 shadow-sm overflow-hidden group">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <LogIn className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold tracking-tight text-blue-900 dark:text-blue-200">Inicio de sesión requerido</p>
                    <p className="text-[11px] text-blue-800/60 dark:text-blue-300/60 leading-snug">
                      Necesitas una cuenta para habilitar la sincronización en la nube.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/login?redirect=/settings/sync')} className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/20">
                    Iniciar sesión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-500/20 bg-green-500/5 shadow-sm overflow-hidden">
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

          {/* Selección de Modo (OCP) */}
          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Modo de dispositivo</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setModo('primary')}
                className={cn(
                  'rounded-2xl border-2 p-5 text-left transition-all relative overflow-hidden group',
                  modo === 'primary'
                    ? 'border-primary bg-primary/5 shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] ring-2 ring-primary/10'
                    : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30'
                )}
              >
                <div className={cn(
                  "absolute top-3 right-3 h-2 w-2 rounded-full",
                  modo === 'primary' ? "bg-primary" : "bg-transparent"
                )} />
                <Monitor className={cn('h-7 w-7 mb-3 transition-colors', modo === 'primary' ? 'text-primary' : 'text-muted-foreground')} />
                <p className="font-bold text-sm">Principal</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                  Recibe los reportes de los demás dispositivos.
                </p>
              </button>

              <button
                onClick={() => setModo('secondary')}
                className={cn(
                  'rounded-2xl border-2 p-5 text-left transition-all relative overflow-hidden group',
                  modo === 'secondary'
                    ? 'border-primary bg-primary/5 shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] ring-2 ring-primary/10'
                    : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30'
                )}
              >
                <div className={cn(
                  "absolute top-3 right-3 h-2 w-2 rounded-full",
                  modo === 'secondary' ? "bg-primary" : "bg-transparent"
                )} />
                <Smartphone className={cn('h-7 w-7 mb-3 transition-colors', modo === 'secondary' ? 'text-primary' : 'text-muted-foreground')} />
                <p className="font-bold text-sm">Secundario</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                  Envía reportes al dispositivo principal.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Configuración de dispositivo y WhatsApp */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="device-name" className="text-xs font-bold text-muted-foreground ml-1">Nombre de este dispositivo</Label>
                <Input
                  id="device-name"
                  placeholder='Ej. "PC Principal", "Móvil de Pedro"'
                  value={nombreDispositivo}
                  onChange={(e) => setNombreDispositivo(e.target.value)}
                  className="h-11 rounded-xl focus-visible:ring-primary/20 transition-all"
                />
              </div>

              {modo === 'secondary' && (
                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                  <Label htmlFor="join-code" className="text-xs font-bold text-muted-foreground ml-1">Código del dispositivo principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="join-code"
                      placeholder="Ej. K7X2M9"
                      value={codigoUnion}
                      onChange={(e) => setCodigoUnion(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="font-mono tracking-[0.3em] text-center text-xl font-black uppercase flex-1 h-11 rounded-xl bg-muted/30 focus-visible:bg-background transition-all"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm"
                      onClick={() => setEsQRScannerOpen(true)}
                      title="Escanear código QR"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    Encuentra este código en el dispositivo principal.
                  </p>
                </div>
              )}

              <Button
                className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/10"
                onClick={manejarConfiguracion}
                disabled={sincronizando}
              >
                {sincronizando ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
                {modo === 'primary' ? 'Crear canal de sincronización' : 'Conectarme al canal'}
              </Button>
            </CardContent>
          </Card>

          {whatsappComponent}
        </div>
      </div>
    </div>
  );
};
