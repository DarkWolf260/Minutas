'use client';

import React, { useState } from 'react';
import { Wifi, WifiOff, Send, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSyncPagina } from '@/hooks/sync';

// Componentes extraídos (SOLID)
import { SyncSetup } from './sync/components/sync-setup';
import { SyncQRDisplay } from './sync/components/sync-qr-display';
import { SyncInbox } from './sync/components/sync-inbox';
import { SyncModals } from './sync/components/sync-modals';
import { SyncWhatsApp } from './sync/components/sync-whatsapp';

export default function SyncPage() {
  const hook = useSyncPagina();
  const { estaConfigurado } = hook;

  const [esQRScannerOpen, setEsQRScannerOpen] = useState(false);

  // Vista de configuración cuando no está sincronizado
  if (!estaConfigurado) {
    return (
      <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
        {/* Header fijo centrado */}
        <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                <Wifi className="h-6 w-6 text-primary" />
                Sincronización
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Conecta dispositivos para transferir reportes y datos en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0" type="always">
          <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
            <SyncSetup hook={hook} setEsQRScannerOpen={setEsQRScannerOpen} />
            <div className="w-full">
              <SyncWhatsApp />
            </div>
          </div>
        </ScrollArea>

        <SyncModals 
          hook={hook} 
          esQRScannerOpen={esQRScannerOpen} 
          setEsQRScannerOpen={setEsQRScannerOpen} 
        />
      </div>
    );
  }

  // Pantalla de Estado Activo
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Header fijo centrado */}
      <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wifi className="h-6 w-6 text-primary" />
              Sincronización
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {hook.usuario?.email || 'Conexión activa entre dispositivos'}
            </p>
          </div>
          <Badge variant={hook.esPrincipal ? 'default' : 'secondary'} className="shrink-0 h-7 rounded-lg">
            {hook.esPrincipal ? (
              <><Monitor className="h-3 w-3 mr-1.5" />Principal</>
            ) : (
              <><Smartphone className="h-3 w-3 mr-1.5" />Secundario</>
            )}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          {/* Indicador de Estado */}
          <Card className={cn(
            'border shadow-xs rounded-xl overflow-hidden relative group',
            hook.esPrincipal ? 'border-green-500/20 bg-green-500/5' : 'border-blue-500/20 bg-blue-500/5'
          )}>
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full",
              hook.esPrincipal ? "bg-green-500" : "bg-blue-500"
            )} />
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-2.5 w-2.5 rounded-full animate-pulse',
                  hook.esPrincipal ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                )} />
                <span className="font-bold text-sm tracking-tight">
                  {hook.esPrincipal ? 'Escuchando reportes entrantes' : 'Listo para enviar reportes'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {hook.esPrincipal
                  ? `Canal: ${hook.configSync.channelCode} · Importación: ${hook.configSync.importMode === 'auto' ? 'Automática' : 'Manual'}`
                  : `Conectado al canal: ${hook.configSync.channelCode}`}
              </p>
            </CardContent>
          </Card>

          {/* Sección de Vinculación (QR Directo) */}
          {hook.esPrincipal && (
            <SyncQRDisplay 
              channelCode={hook.configSync.channelCode || ''} 
              manejarCopiarCodigo={hook.manejarCopiarCodigo} 
            />
          )}

          {/* Bandeja de Entrada */}
          {hook.esPrincipal && <SyncInbox hook={hook} />}

          {/* Guía para Secundarios */}
          {hook.esSecundario && (
            <Card className="border-muted/60 rounded-xl overflow-hidden bg-card shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  Instrucciones de Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[13px] text-muted-foreground space-y-4 pt-4">
                <p>Al guardar un reporte en <span className="font-bold text-foreground">Novedades</span> aparecerá un nuevo botón:</p>
                <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3 font-bold text-foreground border border-dashed border-primary/20">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  Enviar al Dispositivo Principal
                </div>
                <p className="leading-relaxed">
                  Al pulsarlo, el reporte se guardará en este dispositivo y se enviará instantáneamente al principal a través de la nube.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Módulo de WhatsApp */}
          <SyncWhatsApp />

          {/* Zona de Peligro */}
          <Card className="border-destructive/30 rounded-xl overflow-hidden bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-destructive">Desactivar Sincronización</CardTitle>
              <p className="text-xs text-muted-foreground">
                Si desactivas la sincronización, este dispositivo dejará de compartir datos en tiempo real.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => hook.setEsConfirmarReinicioOpen(true)}
                className="w-full sm:w-auto h-10 px-5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-all font-bold gap-2"
              >
                <WifiOff className="h-4 w-4" />
                {hook.esPrincipal ? 'Eliminar canal y cerrar' : 'Desconectarme de este canal'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <SyncModals 
        hook={hook} 
        esQRScannerOpen={esQRScannerOpen} 
        setEsQRScannerOpen={setEsQRScannerOpen} 
      />
    </div>
  );
}
