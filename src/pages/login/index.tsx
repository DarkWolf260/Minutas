import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const redirectTo = searchParams.get('redirect') || '/';

  // Si ya está autenticado, redirigir automáticamente
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success('Sesión iniciada correctamente');
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error('Auth error:', err);
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={() => {
            if (redirectTo === '/') {
              navigate(-1);
            } else {
              navigate(redirectTo);
            }
          }}
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
          <h1 className="text-3xl font-bold tracking-tight">Minutas Cloud</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sincroniza tus datos y accede a la comunidad
          </p>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-left">Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-login">Correo Electrónico</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email-login"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password-login">Contraseña</Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password-login"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 rounded-xl bg-background transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
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
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </span>
              )}
            </Button>
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate(`/register?redirect=${encodeURIComponent(redirectTo)}`)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ¿No tienes una cuenta? <span className="font-semibold underline underline-offset-4">Regístrate</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
