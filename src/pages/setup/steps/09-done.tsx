import { ShieldCheck, ArrowRight, FileText, CheckCircle2, MapPin, Database, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SetupStepLayout } from './layout';
import { useFieldDefinitions } from '@/hooks/configuracion';

export function PasoDone({
  alFinalizar,
  alIrAPlantillas,
}: {
  alFinalizar: () => void;
  alIrAPlantillas?: () => void;
}) {
  const { definitions } = useFieldDefinitions();
  const municipio = definitions['Municipio']?.value || 'Estándar';
  const estado = definitions['Estado']?.value || 'Anzoátegui';

  return (
    <SetupStepLayout alSiguiente={alFinalizar} sinFooter>
      <div className="flex flex-col items-center justify-center text-center space-y-7 py-6 h-full min-h-[75vh]">
        {/* Icono de Victoria */}
        <div className="relative">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-md ring-8 ring-primary/5">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Títulos */}
        <div className="space-y-2 max-w-[340px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            ¡Estación Lista para Operar!
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Tu configuración ha sido guardada en este equipo. El sistema está listo para registrar novedades y guardias.
          </p>
        </div>

        {/* Resumen de la Estación */}
        <div className="w-full max-w-[360px] grid grid-cols-2 gap-2.5 text-left">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ubicación</span>
            </div>
            <p className="text-xs font-semibold truncate text-foreground">
              {municipio ? `${municipio}, ${estado}` : estado}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Estructura</span>
            </div>
            <p className="text-xs font-semibold truncate text-foreground">
              Cargos Listos
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Database className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Base de Datos</span>
            </div>
            <p className="text-xs font-semibold truncate text-foreground">
              Local y Offline
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Plantillas</span>
            </div>
            <p className="text-xs font-semibold truncate text-foreground">
              Preconfiguradas
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="w-full max-w-[360px] space-y-3 pt-2">
          <Button
            onClick={alFinalizar}
            className="w-full h-11 text-sm font-bold shadow-md cursor-pointer"
          >
            Comenzar a Trabajar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {alIrAPlantillas && (
            <Button
              variant="outline"
              onClick={alIrAPlantillas}
              className="w-full h-10 text-xs font-medium cursor-pointer"
            >
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              Explorar Plantillas de Novedades
            </Button>
          )}
        </div>
      </div>
    </SetupStepLayout>
  );
}
