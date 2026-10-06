import { useState, useEffect } from 'react';
import { ShieldCheck, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { useFieldDefinitions, useSettings } from '@/hooks/configuracion';
import { toast } from 'sonner';
import { SetupStepLayout } from './layout';
import { AjustesGeneralesForm } from '@/components/shared/ajustes-generales-form';

const OPCIONES_TEMA = [
  { value: 'light' as const, label: 'Claro', icon: Sun },
  { value: 'system' as const, label: 'Sistema', icon: Monitor },
  { value: 'dark' as const, label: 'Oscuro', icon: Moon },
];

const META_CAMPOS_KEYS = ['Municipio', 'Estado', 'REDAN', 'ZOEDAN'];

const VALORES_GENERALES_DEFECTO: Record<string, string> = {
  Municipio: 'Urbaneja',
  Estado: 'Anzoátegui',
  REDAN: 'Oriente',
  ZOEDAN: 'Anzoátegui',
};

export function PasoBienvenida({ alSiguiente }: { alSiguiente: () => void }) {
  const { theme: tema, setTheme: setTema } = useTheme();
  const { definitions: definiciones, saveDefinitions: guardarDefiniciones, isLoaded: definicionesCargadas } = useFieldDefinitions();
  const { isLoaded: settingsCargados } = useSettings();
  const [valoresLocales, setValoresLocales] = useState<Record<string, string>>(VALORES_GENERALES_DEFECTO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!definicionesCargadas) return;
    setValoresLocales((prev) => {
      const mezclado = { ...prev };
      META_CAMPOS_KEYS.forEach((key) => {
        const almacenado = definiciones[key]?.value;
        if (almacenado !== undefined) mezclado[key] = almacenado;
      });
      return mezclado;
    });
  }, [definicionesCargadas, definiciones]);

  const manejarGuardarYContinuar = async () => {
    setGuardando(true);
    try {
      const nuevasDefs = { ...definiciones };
      META_CAMPOS_KEYS.forEach((key) => {
        nuevasDefs[key] = {
          ...(nuevasDefs[key] ?? { label: key, type: 'predefined', sectionId: 'default' }),
          value: valoresLocales[key] ?? '',
        };
      });
      await guardarDefiniciones(nuevasDefs);
      alSiguiente();
    } catch {
      toast.error('Error al guardar la configuración inicial.');
    } finally {
      setGuardando(false);
    }
  };

  if (!definicionesCargadas || !settingsCargados) {
    return (
      <div className="flex flex-col max-w-md mx-auto space-y-4 py-8 animate-in fade-in duration-300">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-11 bg-muted/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <SetupStepLayout
      alSiguiente={manejarGuardarYContinuar}
      sigTexto="Continuar a Módulos"
      cargando={guardando}
    >
      <div className="space-y-6 py-2">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-9 w-9 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bienvenido a Minutas</h1>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[320px] mx-auto mt-1">
              Configura tu estación de guardia táctica en menos de un minuto.
            </p>
          </div>
        </div>

        {/* Apariencia */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Apariencia Visual
          </span>
          <div className="grid grid-cols-3 gap-2">
            {OPCIONES_TEMA.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTema(value)}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all cursor-pointer font-medium text-xs',
                  tema === value
                    ? 'border-primary bg-primary/5 text-primary shadow-sm font-semibold'
                    : 'border-border/70 hover:bg-muted/40 text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ubicación / Jurisdicción */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Jurisdicción y Despacho
          </span>
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/60">
            <AjustesGeneralesForm
              values={valoresLocales}
              onChange={(key, val) => setValoresLocales((prev) => ({ ...prev, [key]: val }))}
              definitions={definiciones}
              fieldKeys={META_CAMPOS_KEYS}
              columns={2}
            />
          </div>
        </div>

        {/* Garantía de privacidad táctica */}
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-center">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            🔒 Todos los datos se almacenan <strong>100% localmente</strong> en este equipo. Funciona de forma completamente autónoma sin conexión.
          </p>
        </div>
      </div>
    </SetupStepLayout>
  );
}
