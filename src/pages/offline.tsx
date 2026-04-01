'use client';

import { WifiOff, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center animate-in fade-in duration-500 bg-muted/5 h-full min-h-[80vh]">
      <div className="max-w-md space-y-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 border-2 border-dashed border-primary/20">
          <WifiOff className="h-9 w-9 text-primary/40" />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Sin Conexión</h3>
          <p className="text-sm max-w-[280px] mx-auto text-muted-foreground/60 leading-relaxed text-balance">
            Parece que no tienes acceso a internet. La aplicación sigue funcionando con los datos guardados localmente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="sm"
            className="h-10 px-6 text-xs font-medium gap-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          
          <Button
            onClick={() => (window.location.href = '/')}
            variant="outline"
            size="sm"
            className="h-10 px-8 text-xs font-bold gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 shadow-sm"
          >
            <Home className="h-4 w-4" />
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
