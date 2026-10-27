'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  LogOut,
  WifiOff,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { QRCodeSVG } from 'qrcode.react';
import { useWhatsAppBot } from '@/hooks/whatsapp';
import { useSettings } from '@/hooks/configuracion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.73.44 3.4 1.28 4.88L2.05 22l5.26-1.38C8.73 21.43 10.35 21.87 12 21.87c5.52 0 10-4.48 10-10S17.52 2 12.004 2zm0 18c-1.5 0-2.95-.38-4.23-1.1l-.3-.17-3.15.83.84-3.07-.19-.31c-.78-1.25-1.2-2.7-1.2-4.18 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.56-6.32c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.23.25-.39.08-.15.04-.29-.02-.41-.06-.12-.56-1.35-.77-1.85-.2-.5-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.88.86-.88 2.1s.9 2.43 1.02 2.6c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.59.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
    </svg>
  );
}

interface QuickChatSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export function QuickChatSelector({ className, showLabel }: QuickChatSelectorProps) {
  const { settings } = useSettings();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');

  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isBotReady = bot.isAvailable && bot.status.isReady;

  // Actualizar estado al abrir el diálogo y sondear cada 3s mientras esté abierto
  useEffect(() => {
    if (!isOpen) return;
    bot.checkStatus(true);

    const timer = setInterval(() => {
      bot.checkStatus(false);
    }, 3000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await bot.checkStatus(true);
      toast.success('Estado de WhatsApp actualizado');
    } catch {
      toast.error('Error al consultar estado');
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await bot.logout();
      toast.success('Sesión de WhatsApp cerrada');
    } catch {
      toast.error('Error al cerrar sesión');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const triggerButton = (
    <Button
      variant="ghost"
      size="default"
      onClick={() => setIsOpen(true)}
      className={cn(
        "relative w-full h-9 p-0 rounded-xl transition-all hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-sm flex items-center justify-start cursor-pointer",
        className
      )}
      title={showLabel ? undefined : "WhatsApp (Escanear QR / Conexión)"}
    >
      <div className="flex h-9 w-10 shrink-0 items-center justify-center relative">
        <WhatsAppIcon
          className={cn(
            "h-4 w-4 transition-colors",
            isBotReady
              ? "text-emerald-600 dark:text-emerald-400"
              : bot.status.needsAuth
              ? "text-amber-500"
              : "text-muted-foreground"
          )}
        />
        {/* Punto indicador de estado */}
        <span
          className={cn(
            "absolute right-2 top-2 h-2 w-2 rounded-full border border-background transition-colors",
            isBotReady
              ? "bg-emerald-500"
              : bot.status.needsAuth
              ? "bg-amber-500 animate-pulse"
              : "bg-muted-foreground/40"
          )}
        />
      </div>
      {showLabel && (
        <span className="truncate flex-1 text-left whitespace-nowrap animate-slide-down pr-2">
          {isBotReady ? "WhatsApp Conectado" : bot.status.needsAuth ? "Escanear QR" : "Conectar WhatsApp"}
        </span>
      )}
      {!showLabel && <span className="sr-only">WhatsApp (Escanear QR)</span>}
    </Button>
  );

  return (
    <>
      {!showLabel ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {triggerButton}
          </TooltipTrigger>
          <TooltipContent side="right">
            {isBotReady ? "WhatsApp (Conectado)" : bot.status.needsAuth ? "WhatsApp (Escanear QR)" : "Conectar WhatsApp"}
          </TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}

      {/* Ventana Modal para Escanear Código QR y Estado de WhatsApp */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <WhatsAppIcon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-base font-bold text-foreground">
                  Vinculación de WhatsApp
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Escanea el código QR desde tu teléfono para sincronizar WhatsApp con Minutas.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            {/* ESTADO 1: REQUIERE AUTENTICACIÓN / CÓDIGO QR */}
            {bot.status.needsAuth ? (
              <div className="flex flex-col items-center gap-3 py-1">
                {bot.status.qr ? (
                  <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md animate-in zoom-in-95 duration-200">
                    <QRCodeSVG
                      key={bot.status.qr}
                      value={bot.status.qr}
                      size={210}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-2xl w-full gap-3 bg-muted/20">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold text-foreground">
                      Generando código QR...
                    </p>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Iniciando cliente de WhatsApp y solicitando credenciales.
                    </p>
                  </div>
                )}

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Código sincronizado en tiempo real</span>
                </div>

                {/* Instrucciones paso a paso */}
                <div className="w-full bg-muted/30 rounded-xl p-3 border border-border/60 text-left space-y-1.5 text-xs">
                  <span className="font-bold text-foreground block text-xs">
                    Pasos para escanear:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground leading-relaxed">
                    <li>Abre <strong>WhatsApp</strong> en tu teléfono móvil.</li>
                    <li>Toca <strong>Menú (⋮)</strong> o ve a <strong>Ajustes</strong>.</li>
                    <li>Selecciona <strong>Dispositivos vinculados</strong> y toca <strong>Vincular un dispositivo</strong>.</li>
                    <li>Apunta la cámara de tu teléfono hacia este código QR.</li>
                  </ol>
                </div>
              </div>
            ) : isBotReady ? (
              /* ESTADO 2: YA CONECTADO */
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    ¡WhatsApp Conectado!
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[300px]">
                    Tu dispositivo está vinculado y listo para enviar reportes y sincronizar mensajes.
                  </p>
                </div>

                <div className="w-full bg-muted/30 rounded-xl p-3 border border-border/60 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estado del Bot:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      En línea y sincronizado
                    </span>
                  </div>
                  {bot.chats.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Chats disponibles:</span>
                      <span className="font-semibold text-foreground">{bot.chats.length} chats</span>
                    </div>
                  )}
                  {bot.status.activeWorkspace && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Área de trabajo:</span>
                      <span className="font-semibold text-foreground">{bot.status.activeWorkspace}</span>
                    </div>
                  )}
                </div>

                <div className="w-full flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex-1 text-xs h-8 gap-1.5"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                    <span>Verificar Estado</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 text-xs h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Desvincular</span>
                  </Button>
                </div>
              </div>
            ) : !bot.isAvailable ? (
              /* ESTADO 3: SERVIDOR LOCAL DESCONECTADO */
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className="h-14 w-14 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <WifiOff className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Servidor de WhatsApp Desconectado
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[300px]">
                    El bot local en <code>localhost:3001</code> no responde o no está en ejecución.
                  </p>
                </div>

                <div className="w-full bg-muted/40 rounded-xl p-3 border border-border/50 text-xs text-muted-foreground text-left space-y-1.5">
                  <p className="font-semibold text-foreground text-xs">Para iniciar el bot:</p>
                  <p className="text-[11px] leading-relaxed">
                    Abre una terminal en la carpeta <code>whatsapp-bot</code> e inicia el servicio:
                  </p>
                  <code className="block bg-background px-2.5 py-1.5 rounded-lg border text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold select-all">
                    npm start
                  </code>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white mt-1"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                  <span>Reintentar Conexión</span>
                </Button>
              </div>
            ) : (
              /* ESTADO 4: CONECTANDO O CARGANDO */
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold text-foreground">
                  {bot.status.statusMessage || 'Conectando con WhatsApp...'}
                </p>
                <p className="text-[11px] text-muted-foreground text-center max-w-[260px]">
                  Espera un momento mientras se establece la sesión en el servidor.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between border-t border-border/50 pt-2">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Conexión segura cifrada de extremo a extremo</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs h-8"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default QuickChatSelector;
