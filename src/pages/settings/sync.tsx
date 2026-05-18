'use client';

import React, { useState } from 'react';
import { WifiOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSyncPagina } from '@/hooks/use-sync-pagina';

// Componentes extraídos (SOLID)
import { SyncHeader } from './sync/components/sync-header';
import { SyncSetup } from './sync/components/sync-setup';
import { SyncQRDisplay } from './sync/components/sync-qr-display';
import { SyncInbox } from './sync/components/sync-inbox';
import { SyncModals } from './sync/components/sync-modals';
import { SyncWhatsApp } from './sync/components/sync-whatsapp';

export default function SyncPage() {
  const hook = useSyncPagina();
  const { estaConfigurado } = hook;

  const [esQRScannerOpen, setEsQRScannerOpen] = useState(false);

  // Vista de configuración (SRP)
  if (!estaConfigurado) {
    return (
      <div className="flex flex-col h-full bg-background overflow-y-auto px-4 pb-32">
        <SyncSetup hook={hook} setEsQRScannerOpen={setEsQRScannerOpen} />
        <div className="max-w-2xl mx-auto w-full mt-3">
          <SyncWhatsApp />
        </div>
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
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <ScrollArea className="flex-1" type="always">
        <div className="max-w-2xl mx-auto w-full px-4 pt-8 pb-32 space-y-8 animate-in fade-in duration-500">
          <SyncHeader 
            usuario={hook.usuario} 
            esPrincipal={hook.esPrincipal} 
            esSecundario={hook.esSecundario} 
          />

          {/* Indicador de Estado */}
          <Card className={cn(
            'border-2 shadow-sm rounded-2xl overflow-hidden relative group',
            hook.esPrincipal ? 'border-green-500/20 bg-green-500/5' : 'border-blue-500/20 bg-blue-500/5'
          )}>
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full",
              hook.esPrincipal ? "bg-green-500" : "bg-blue-500"
            )} />
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-2.5 w-2.5 rounded-full animate-pulse',
                  hook.esPrincipal ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                )} />
                <span className="font-bold text-sm tracking-tight">
                  {hook.esPrincipal ? 'Escuchando reportes entrantes' : 'Listo para enviar reportes'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 font-medium">
                {hook.esPrincipal
                  ? `Canal: ${hook.configSync.channelCode} · Importación: ${hook.configSync.importMode === 'auto' ? 'Automática' : 'Manual'}`
                  : `Conectado al canal: ${hook.configSync.channelCode}`}
              </p>
            </CardContent>
          </Card>

          {/* Sección de Vinculación (QR Directo - SRP) */}
          {hook.esPrincipal && (
            <SyncQRDisplay 
              channelCode={hook.configSync.channelCode || ''} 
              manejarCopiarCodigo={hook.manejarCopiarCodigo} 
            />
          )}

          {/* Bandeja de Entrada (SRP) */}
          {hook.esPrincipal && <SyncInbox hook={hook} />}

          {/* Guía para Secundarios */}
          {hook.esSecundario && (
            <Card className="border-muted/60 rounded-2xl overflow-hidden bg-card/50">
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
          <div className="pt-8 border-t space-y-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-destructive">Desactivar Sincronización</h3>
              <p className="text-xs text-muted-foreground">
                Si desactivas la sincronización, este dispositivo dejará de compartir datos en tiempo real.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => hook.setEsConfirmarReinicioOpen(true)}
              className="w-full sm:w-auto h-11 px-6 rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all font-bold gap-2"
            >
              <WifiOff className="h-4 w-4" />
              {hook.esPrincipal ? 'Eliminar canal y cerrar' : 'Desconectarme de este canal'}
            </Button>
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
