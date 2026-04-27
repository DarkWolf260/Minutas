import { CheckCircle2 } from 'lucide-react';
import { SetupStepLayout } from './layout';

export function PasoBienvenida({ alSiguiente }: { alSiguiente: () => void }) {
  return (
    <SetupStepLayout alSiguiente={alSiguiente} sigTexto="Comenzar configuración">
      <div className="flex flex-col items-center justify-center text-center space-y-8 py-4 h-full min-h-[70vh]">
        <div className="relative mb-4">
          <img
            src="/icons/icon-192x192.png"
            alt="Minutas"
            className="relative h-28 w-28 rounded-2xl object-contain bg-background p-6 shadow-2xl"
          />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido a Minutas</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto">
            Configura tu espacio de trabajo en unos pocos pasos.
          </p>
        </div>

        <div className="w-full max-w-[320px] pt-4">
          <div className="bg-muted/20 rounded-2xl border border-border/50 p-6 space-y-4 shadow-sm">
            {[
              { text: 'Todo se guarda localmente en tu dispositivo', icon: CheckCircle2 },
              { text: 'Ningún dato se comparte con terceros', icon: CheckCircle2 },
              { text: 'Puedes sincronizar entre dispositivos opcionalmente', icon: CheckCircle2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3.5 text-[13px] font-medium text-muted-foreground">
                <item.icon className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-left leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SetupStepLayout>
  );
}
