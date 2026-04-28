'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        await html5QrCode.start(
          { facingMode: 'environment' }, // Forzar cámara trasera
          config,
          (decodedText) => {
            const cleanText = decodedText.trim().toUpperCase();
            if (cleanText.length === 6) {
              html5QrCode.stop().then(() => {
                onScan(cleanText);
              }).catch(err => {
                console.error("Error stopping", err);
                onScan(cleanText);
              });
            }
          },
          (errorMessage) => {
            // Ignorar errores de escaneo frame-by-frame
          }
        );
        
        setIsReady(true);
        setError(null);
      } catch (err: any) {
        console.error("Error starting QR scanner:", err);
        setError(err.message || "No se pudo acceder a la cámara");
        setIsReady(false);
        
        if (err.name === 'NotAllowedError') {
          toast.error("Permiso de cámara denegado");
        } else {
          toast.error("Error al iniciar la cámara");
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Error on unmount", err));
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border-4 border-muted shadow-2xl">
        <div id="qr-reader" className="w-full h-full" />
        
        {!isReady && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-10">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-xs font-bold text-white/70 animate-pulse">Iniciando cámara...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-20 p-6 text-center">
            <CameraOff className="h-10 w-10 text-destructive mb-4" />
            <p className="text-sm font-bold text-foreground mb-2">Error de Cámara</p>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              {error.includes("Permission") 
                ? "Necesitamos acceso a la cámara para escanear el QR. Por favor, concede los permisos en tu navegador."
                : "No pudimos conectar con la cámara trasera de tu dispositivo."}
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="font-bold">
              Reintentar
            </Button>
          </div>
        )}
        
        {/* Overlay de diseño premium */}
        {isReady && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Marco de escaneo centrado absolutamente */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
              {/* Esquinas en Azul Primary */}
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl shadow-[0_0_15px_rgba(var(--primary),0.4)]" />
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl shadow-[0_0_15px_rgba(var(--primary),0.4)]" />
              <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl shadow-[0_0_15px_rgba(var(--primary),0.4)]" />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl shadow-[0_0_15px_rgba(var(--primary),0.4)]" />
              
              {/* Resplandor central sutil */}
              <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse" />
            </div>
          </div>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={onClose} className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-6">
        <X className="h-4 w-4" />
        Cerrar Escáner
      </Button>

      <style dangerouslySetInnerHTML={{ __html: `
        #qr-reader { border: none !important; width: 100% !important; }
        #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
        #qr-shaded-region { display: none !important; }
        #qr-reader__scan_region { background: transparent !important; }
        #qr-reader__dashboard { display: none !important; }
      `}} />
    </div>
  );
}
