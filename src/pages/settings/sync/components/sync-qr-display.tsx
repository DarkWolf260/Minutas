import React from 'react';
import { Copy, QrCode } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRGenerator } from '@/components/sync/qr-generator';
import { Badge } from '@/components/ui/badge';

interface SyncQRDisplayProps {
  channelCode: string;
  manejarCopiarCodigo: () => void;
}

export const SyncQRDisplay = ({ channelCode, manejarCopiarCodigo }: SyncQRDisplayProps) => {
  return (
    <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 text-center sm:text-left bg-primary/5 border-b">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <QrCode className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-bold">Código de Vinculación</CardTitle>
          <Badge variant="secondary" className="ml-auto hidden sm:flex bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest">
            Scan & Sync
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Comparte este código con los dispositivos secundarios para conectarlos.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-8">
        <div className="flex flex-col items-center gap-8">
          {/* El QR directo y grande como pidió el usuario */}
          <div className="relative group p-4 bg-white rounded-3xl shadow-inner border-2 border-dashed border-primary/20 transition-all hover:border-primary/40">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <QRGenerator value={channelCode || ''} size={200} />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background border px-3 py-1 rounded-full shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cámara</p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-4 items-center">
            <div className="w-full flex items-center gap-3">
              <div
                className="flex-1 bg-muted/30 border-2 rounded-2xl py-5 px-6 flex items-center justify-center group hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer relative shadow-sm"
                onClick={manejarCopiarCodigo}
              >
                <div className="absolute top-0 left-0 h-full w-1 bg-primary rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="font-mono text-4xl sm:text-5xl font-black tracking-[0.25em] text-primary select-all drop-shadow-sm">
                  {channelCode}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-sm hover:shadow-md active:scale-95"
                onClick={manejarCopiarCodigo}
                title="Copiar código"
              >
                <Copy className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest animate-pulse">
              Toca el código para copiarlo al portapapeles
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
