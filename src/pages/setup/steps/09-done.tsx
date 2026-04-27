import { MessageSquarePlus, Heart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SetupStepLayout } from './layout';

export function PasoDone({ alFinalizar }: { nombreWorkspace: string; alFinalizar: () => void }) {
  return (
    <SetupStepLayout alSiguiente={alFinalizar} sinFooter>
      <div className="flex flex-col items-center justify-center text-center space-y-10 py-4 h-full min-h-[80vh]">
        <div className="relative">
          <div className="relative h-20 w-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center shadow-2xl ring-1 ring-indigo-500/40">
            <MessageSquarePlus className="h-10 w-10 text-indigo-400" />
          </div>
        </div>
        
        <div className="space-y-4 max-w-[360px] mx-auto">
          <h2 className="text-4xl font-bold tracking-tight">¡Tu opinión importa!</h2>
          <p className="text-muted-foreground text-[13px] leading-relaxed px-4 opacity-80">
            Si encuentras algún error, tienes una sugerencia o simplemente quieres compartir tu experiencia, puedes enviarnos un comentario en cualquier momento desde <strong className="text-foreground">Configuración</strong> → <strong className="text-foreground">Enviar Comentarios</strong>.
          </p>
        </div>

        <div className="w-full max-w-[360px] pt-2 space-y-10">
          <div className="bg-muted/20 border border-border/50 rounded-2xl p-6 text-left space-y-4 shadow-2xl backdrop-blur-sm">
            {[
              'Puedes enviar tantos comentarios como necesites',
              'Reporta errores, bugs o comportamientos inesperados',
              'Propón nuevas funciones o mejoras',
              'Cada mensaje es leído y tomado en cuenta'
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3.5 group">
                <Heart className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0 group-hover:scale-125 transition-transform duration-300" />
                <p className="text-[13px] text-muted-foreground leading-tight group-hover:text-foreground transition-colors">{text}</p>
              </div>
            ))}
          </div>

          <Button 
            onClick={alFinalizar}
            style={{ backgroundColor: '#3575dd' }}
            className="w-full text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            ¡Entendido, empezar!
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </SetupStepLayout>
  );
}
