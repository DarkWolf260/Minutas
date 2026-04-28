import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useSettings } from '@/hooks/use-settings';
import { toast } from 'sonner';
import { SetupStepLayout } from './layout';
import { AjustesGeneralesForm } from '@/components/shared/ajustes-generales-form';

const OPCIONES_TEMA = [
  { value: 'light' as const, label: 'Claro', icon: Sun, desc: 'Fondo blanco, ideal para luz del día' },
  { value: 'system' as const, label: 'Sistema', icon: Monitor, desc: 'Sigue la preferencia del dispositivo' },
  { value: 'dark' as const, label: 'Oscuro', icon: Moon, desc: 'Fondo oscuro, más cómodo de noche' },
];

const META_CAMPOS_KEYS = ['Municipio', 'Estado', 'REDAN', 'ZOEDAN'];

const VALORES_GENERALES_DEFECTO: Record<string, string> = {
  Municipio: '', Estado: 'Anzoátegui', REDAN: 'Oriente', ZOEDAN: 'Anzoátegui',
};

export function PasoPreferencias({ alSiguiente, alAtras }: { alSiguiente: () => void; alAtras: () => void }) {
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
      toast.error('Error al guardar la configuración.'); 
    } finally { 
      setGuardando(false); 
    }
  };

  if (!definicionesCargadas || !settingsCargados) {
    return (
      <div className="flex flex-col max-w-md mx-auto space-y-4 animate-in fade-in duration-300">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
      </div>
    );
  }

  return (
    <SetupStepLayout
      alAtras={alAtras}
      alSiguiente={manejarGuardarYContinuar}
      cargando={guardando}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Settings2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Preferencias</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Configura el aspecto y los datos por defecto de tus reportes.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Apariencia</Label>
            <div className="grid grid-cols-3 gap-2">
              {OPCIONES_TEMA.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTema(value)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all',
                    tema === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted/30 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

            <AjustesGeneralesForm 
              values={valoresLocales}
              onChange={(key, val) => setValoresLocales(prev => ({ ...prev, [key]: val }))}
              definitions={definiciones}
              fieldKeys={META_CAMPOS_KEYS}
            />
        </div>
      </div>
    </SetupStepLayout>
  );
}
