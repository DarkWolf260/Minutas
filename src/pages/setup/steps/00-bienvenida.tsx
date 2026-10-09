import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sun, 
  Moon, 
  Monitor, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  LogIn, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { useFieldDefinitions, useSettings, useGlobalConfig } from '@/hooks/configuracion';
import { useAuth } from '@/hooks/admin';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useCloudWorkspaces } from '@/hooks/sync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface PasoBienvenidaProps {
  alSiguiente: () => void;
  alIniciarSesionExitoso: () => void;
  alEntrarDirectoOffline?: () => void;
}

export function PasoBienvenida({
  alSiguiente,
  alIniciarSesionExitoso,
  alEntrarDirectoOffline,
}: PasoBienvenidaProps) {
  const { isAuthenticated, user, signIn } = useAuth();
  const { switchWorkspace } = useWorkspaceManager();
  const { fetchCloudWorkspaces } = useCloudWorkspaces();
  const { config } = useGlobalConfig();

  const { theme: tema, setTheme: setTema } = useTheme();
  const { definitions: definiciones, saveDefinitions: guardarDefiniciones, isLoaded: definicionesCargadas } = useFieldDefinitions();
  const { isLoaded: settingsCargados } = useSettings();

  const [valoresLocales, setValoresLocales] = useState<Record<string, string>>(VALORES_GENERALES_DEFECTO);
  const [guardando, setGuardando] = useState(false);

  // Estados de modo y autenticación
  const [modoOffline, setModoOffline] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [iniciandoSesion, setIniciandoSesion] = useState(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (!isSupabaseConfigured) {
      toast.error('Supabase no está configurado. Revisa tu archivo .env');
      return;
    }

    setIniciandoSesion(true);
    setErrorLogin(null);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) throw error;

      toast.success('Sesión iniciada correctamente');

      try {
        const cloudWs = await fetchCloudWorkspaces();
        if (cloudWs && cloudWs.length > 0) {
          await switchWorkspace(cloudWs[0].id);
        }
      } catch (wsErr) {
        console.warn('[Setup] Auto switch workspace error:', wsErr);
      }

      alIniciarSesionExitoso();
    } catch (err: any) {
      console.error('[Setup] Login error:', err);
      const msg = err?.message || 'Error al iniciar sesión';
      setErrorLogin(msg);
      toast.error(msg);
    } finally {
      setIniciandoSesion(false);
    }
  };

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

  // Vista 1: Formulario de inicio de sesión directo con opción de trabajar offline abajo
  if (!modoOffline) {
    return (
      <SetupStepLayout sinFooter>
        <div className="space-y-6 py-2 max-w-md mx-auto animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center ring-1 ring-primary/20 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]">
              <img src="/icons/icon-192x192.png" alt="Minutas Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bienvenido a Minutas</h1>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-[320px] mx-auto mt-1">
                Inicia sesión para sincronizar tus áreas de trabajo y reportes en la nube.
              </p>
            </div>
          </div>

          {config.maintenance_mode && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Modo de mantenimiento activo</span>
            </div>
          )}

          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-1.5 text-left">
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Supabase no está configurado</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Faltan credenciales en <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-foreground">.env</code>. Puedes usar la opción abajo para trabajar offline.
              </p>
            </div>
          )}

          {/* Si ya hay sesión activa */}
          {isAuthenticated && user ? (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="font-semibold text-foreground">
                    Sesión activa detectada
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-[240px] sm:max-w-none">
                    Conectado como <strong className="text-foreground">{user.email}</strong>.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={alIniciarSesionExitoso}
                className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer shadow-sm sm:self-center"
              >
                Entrar al Sistema
              </Button>
            </div>
          ) : (
            /* Formulario de Inicio de Sesión */
            <div className="bg-card/50 backdrop-blur-sm border border-border/70 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-left text-foreground">
                Iniciar Sesión
              </h2>

              {errorLogin && (
                <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorLogin}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="setup-email" className="text-xs font-medium text-foreground">
                    Correo Electrónico
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="setup-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="pl-10 h-11 rounded-xl bg-background transition-all text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={iniciandoSesion}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <Label htmlFor="setup-password" className="text-xs font-medium text-foreground">
                    Contraseña
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="setup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 rounded-xl bg-background transition-all text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={iniciandoSesion}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl font-bold mt-2 shadow-md shadow-primary/20 gap-2 cursor-pointer"
                  disabled={iniciandoSesion || !isSupabaseConfigured}
                >
                  {iniciandoSesion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-1" />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Separador */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative px-3 bg-background text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              o modo local
            </div>
          </div>

          {/* Opción más abajo: Trabajar Offline */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModoOffline(true)}
              className="w-full h-11 rounded-xl font-bold gap-2 border-border/80 hover:bg-muted/50 cursor-pointer text-xs shadow-xs"
            >
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              Trabajar Offline
            </Button>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-muted-foreground">
                Usa Minutas sin cuenta ni conexión
              </span>
              {alEntrarDirectoOffline && (
                <button
                  type="button"
                  onClick={alEntrarDirectoOffline}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer transition-colors"
                >
                  Entrar directo
                </button>
              )}
            </div>
          </div>
        </div>
      </SetupStepLayout>
    );
  }

  // Vista 2: Modo Offline - Configuración de la estación local
  return (
    <SetupStepLayout
      alAtras={() => setModoOffline(false)}
      alSiguiente={manejarGuardarYContinuar}
      sigTexto="Continuar a Módulos"
      cargando={guardando}
    >
      <div className="space-y-6 py-2 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-9 w-9 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estación Local (Offline)</h1>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-[320px] mx-auto mt-1">
              Configura tu estación de guardia táctica para trabajar de forma autónoma.
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
