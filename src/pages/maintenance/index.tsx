import React from 'react';
import { Hammer, HardHat, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-card/40 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative z-10">
        <div className="mx-auto w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_50px_-10px_rgba(245,158,11,0.3)]">
          <Hammer className="h-10 w-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center justify-center gap-2">
            <HardHat className="h-6 w-6" />
            Mantenimiento
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Estamos realizando mejoras importantes en la plataforma para ofrecerte un mejor servicio. 
            <span className="block mt-2 font-bold text-foreground">Volveremos en breve.</span>
          </p>
        </div>

        <div className="pt-4 border-t border-muted/50 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Estado: Actualizando Servidores
          </div>
          
          <Button 
            variant="outline" 
            className="w-full rounded-xl font-bold h-11 border-amber-500/20 hover:bg-amber-500/10"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Verificar Estado
          </Button>
        </div>
      </div>
    </div>
  );
}
