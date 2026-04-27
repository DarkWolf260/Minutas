import { BookOpen, LayoutGrid, Zap, FileText } from 'lucide-react';
import { SetupStepLayout } from './layout';

export function PasoGuia({ alSiguiente }: { alSiguiente: () => void }) {
  return (
    <SetupStepLayout
      alSiguiente={alSiguiente}
      sigTexto="¡Entendido, empezar!"
    >
      <div className="space-y-8 py-4">
        <div className="relative mx-auto w-fit">
          <div className="relative h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner border">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Guía Rápida</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Al terminar el tour, verás resaltados los elementos más importantes.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: LayoutGrid, title: 'Barra lateral', desc: 'Navega entre módulos' },
            { icon: Zap, title: 'Nueva Guardia', desc: 'Abre el turno para reportar' },
            { icon: FileText, title: 'Novedades', desc: 'Registra incidencias al instante' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
              <div className="h-10 w-10 rounded-xl bg-background border flex items-center justify-center shrink-0 shadow-sm">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm tracking-tight">{item.title}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SetupStepLayout>
  );
}
