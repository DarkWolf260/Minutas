import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, UserPlus, ArrowLeft, IdCard, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useAuth();
  const { isCloud } = useWorkspaceManager();
  const { config, loading: configLoading } = useGlobalConfig();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const redirectTo = searchParams.get('redirect') || '/';

  // Si ya está autenticado, redirigir automáticamente
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.allow_registration) {
      toast.error('Los registros están cerrados actualmente');
      return;
    }

    if (!email || !cedula || !password || !confirmPassword) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    
    // Parse cedula string (e.g. "V-28702026" or "28702026")
    let cedula_type = 'V';
    let cedula_number = cedula.trim();
    
    const match = cedula_number.match(/^([VvEeJjGgPp])[-.]?(\d+)$/);
    if (match && match[1] && match[2]) {
      cedula_type = match[1].toUpperCase();
      cedula_number = match[2];
    } else {
      // Clean non-numeric characters for the number
      cedula_number = cedula_number.replace(/\D/g, '');
    }

    try {
      const { error } = await signUp(email, password, {
        data: {
          cedula_type,
          cedula_number,
          is_admin: false,
          is_approved: false
        }
      });
      if (error) throw error;
      toast.success('Cuenta creada exitosamente. Por favor verifica tu correo si es necesario.');
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error('Auth error:', err);
      toast.error(err.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] opacity-30 pointer-events-none" />

      {/* Volver button */}
      <div className="absolute top-6 left-6 z-20">
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20 shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)]">
            <img src="/icons/icon-192x192.png" alt="Minutas Logo" className="h-10 w-10 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Cuenta</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {config.allow_registration ? 'Únete a la comunidad de Minutas Cloud' : 'Registros temporalmente cerrados'}
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {config.allow_registration ? (
            <>
              <h2 className="text-xl font-bold mb-6 text-left">Regístrate</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-register">Correo Electrónico</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email-register"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="pl-10 h-11 rounded-xl bg-background transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cedula-register">Número de Cédula</Label>
                  <div className="relative group">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="cedula-register"
                      type="text"
                      placeholder="V-12345678"
                      className="pl-10 h-11 rounded-xl bg-background transition-all"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-register">Contraseña (Mín. 6 caracteres)</Label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password-register"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl bg-background transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confirm-password-register">Confirmar Contraseña</Label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirm-password-register"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl bg-background transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl font-bold mt-4 shadow-lg shadow-primary/20" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <span className="flex items-center">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrarse
                    </span>
                  )}
                </Button>
                
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    ¿Ya tienes una cuenta? <span className="font-semibold underline underline-offset-4">Inicia sesión</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-4">
                <ShieldX className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold">Registros Cerrados</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lo sentimos, en este momento no se permiten nuevos registros en el sistema. 
                Por favor, contacta con un administrador si necesitas una cuenta.
              </p>
              <Button 
                variant="outline" 
                className="w-full rounded-xl mt-4"
                onClick={() => navigate('/login')}
              >
                Ir al Inicio de Sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
