import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStatus } from '@/hooks/use-user-status';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isApproved, loading: statusLoading } = useUserStatus();
  const location = useLocation();

  if (authLoading || statusLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          Verificando Credenciales...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isApproved) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          
          <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Acceso Pendiente</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu cuenta ha sido registrada correctamente, pero aún debe ser 
              <span className="font-bold text-foreground"> aprobada por un administrador </span> 
              antes de que puedas acceder al sistema.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl font-bold h-11"
              onClick={() => window.location.reload()}
            >
              Ya me aprobaron, entrar
            </Button>
            <Button 
              variant="ghost" 
              className="rounded-xl h-11 text-muted-foreground hover:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
          
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-black">
            ID: {user.id.slice(0, 8)}...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
