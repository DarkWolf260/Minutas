import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { SideNav } from '@/components/side-nav';
import { MobileNav } from '@/components/mobile-nav';
import { BottomNav } from '@/components/bottom-nav';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { Toaster } from '@/components/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAStatus } from '@/components/pwa-status';
import { DatabaseProvider } from '@/lib/db/db-provider';
import { NotificationsProvider } from '@/lib/notifications-provider';
import { lazy, Suspense, useState, useEffect } from 'react';
import { LoadingScreen } from '@/components/loading-screen';

import { useLocation, useNavigate } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy-load all pages
const NovedadesPage = lazy(() => import('@/pages/novedades'));
const DireccionesPage = lazy(() => import('@/pages/settings/direcciones'));
const EstadisticasPage = lazy(() => import('@/pages/estadisticas'));
const OrdenDelDiaPage = lazy(() => import('@/pages/orden-del-dia'));
const PersonalPage = lazy(() => import('@/pages/personal'));
const PlantillasPage = lazy(() => import('@/pages/plantillas'));
const ReporteFinalPage = lazy(() => import('@/pages/reporte-final'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const SettingsWorkspacesPage = lazy(() => import('@/pages/settings/workspaces'));
const SettingsProfilePage = lazy(() => import('@/pages/settings/profile'));
const SettingsBorrarDatosPage = lazy(() => import('@/pages/settings/borrar-datos'));

const SettingsAboutPage = lazy(() => import('@/pages/settings/about'));
const OfflinePage = lazy(() => import('@/pages/offline'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));

const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
    <div className="w-24 h-1 bg-muted/50 rounded-full overflow-hidden">
      <div className="h-full bg-primary/30 animate-pulse w-full" />
    </div>
    <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase">
      Sincronizando Secciones
    </p>
  </div>
);

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Use the offline page as a full-screen fallback ONLY if we're on the /offline route
  // or if the dynamic loading fails (handled by Suspense/ErrorBoundary)
  // For general use, we'll show a non-intrusive banner.

  return (
    <ThemeProvider defaultTheme="system" storageKey="minutas-theme">
      <DatabaseProvider>
        <NotificationsProvider>
          <TooltipProvider>
              <div className="flex min-h-full w-full flex-col sm:flex-row md:overflow-hidden bg-background overflow-x-hidden" suppressHydrationWarning>
                <SideNav />
                <div className="flex flex-1 flex-col sm:pl-14 md:overflow-hidden relative min-w-0 overflow-x-hidden">
                  <MobileNav />
                  
                  {isOffline && location.pathname !== '/offline' && (
                    <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 sticky top-0 z-20 shadow-sm">
                      <WifiOff className="h-3 w-3" />
                      <span>Modo Sin Conexión - Los cambios se sincronizarán al volver</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 px-2 text-[9px] text-white hover:bg-white/20 ml-2 border border-white/30"
                        onClick={() => navigate('/offline')}
                      >
                        Más info
                      </Button>
                    </div>
                  )}

                  <main className="flex-1 md:overflow-hidden flex flex-col min-h-0 min-w-0 relative bg-muted/30 overflow-x-hidden">
                    <ErrorBoundary name="MainContent">
                      <Suspense fallback={<PageLoader />}>
                        <div key={location.pathname} className="flex-1 flex flex-col min-h-0 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out transform-gpu">
                          <Routes>
                            <Route path="/" element={<NovedadesPage />} />
                            <Route path="/settings/direcciones" element={<DireccionesPage />} />
                            <Route path="/estadisticas" element={<EstadisticasPage />} />
                            <Route path="/orden-del-dia" element={<OrdenDelDiaPage />} />
                            <Route path="/personal" element={<PersonalPage />} />
                            <Route path="/plantillas" element={<PlantillasPage />} />
                            <Route path="/reporte-final" element={<ReporteFinalPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/settings/workspaces" element={<SettingsWorkspacesPage />} />
                            <Route path="/settings/profile" element={<SettingsProfilePage />} />
                            <Route path="/settings/borrar-datos" element={<SettingsBorrarDatosPage />} />

                            <Route path="/settings/about" element={<SettingsAboutPage />} />
                            <Route path="/offline" element={<OfflinePage />} />
                            <Route path="*" element={<NotFoundPage />} />
                          </Routes>
                        </div>
                      </Suspense>
                    </ErrorBoundary>
                  </main>
                  <BottomNav />
                </div>
              </div>
              <WelcomeDialog />
              <PWAStatus />
              <Toaster />
          </TooltipProvider>
        </NotificationsProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
