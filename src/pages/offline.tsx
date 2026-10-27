'use client';

import { WifiOff, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="empty-state-container min-h-[80vh]">
      <div className="max-w-md">
        <div className="empty-state-icon-box">
          <WifiOff className="h-7 w-7 text-primary" />
        </div>
        
        <h3 className="empty-state-title text-lg sm:text-xl">Sin Conexión</h3>
        <p className="empty-state-desc max-w-xs mt-2">
          No tienes acceso a internet. La aplicación sigue funcionando con los datos guardados localmente.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
          
          <Button
            onClick={() => (window.location.href = '/')}
            variant="default"
            size="sm"
          >
            <Home className="h-4 w-4" />
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
