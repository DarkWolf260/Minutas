import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { SideNav } from '@/components/side-nav';
import { MobileNav } from '@/components/mobile-nav';
import { BottomNav } from '@/components/bottom-nav';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { Toaster } from '@/components/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWARegistration } from '@/components/pwa-registration';
import { PWAStatus } from '@/components/pwa-status';
import { DatabaseProvider } from '@/lib/db/db-provider';
import { P2PProvider } from '@/lib/db/p2p-provider';
import { NotificationsProvider } from '@/lib/notifications-provider';
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/loading-screen';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// Lazy-load all pages
const NovedadesPage = lazy(() => import('@/pages/novedades'));
const DireccionesPage = lazy(() => import('@/pages/settings/direcciones'));
const EstadisticasPage = lazy(() => import('@/pages/estadisticas'));
const HistorialPage = lazy(() => import('@/pages/historial'));
const OrdenDelDiaPage = lazy(() => import('@/pages/orden-del-dia'));
const PersonalPage = lazy(() => import('@/pages/personal'));
const PlantillasPage = lazy(() => import('@/pages/plantillas'));
const ReporteFinalPage = lazy(() => import('@/pages/reporte-final'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const SettingsWorkspacesPage = lazy(() => import('@/pages/settings/workspaces'));
const SettingsProfilePage = lazy(() => import('@/pages/settings/profile'));
const SettingsBorrarDatosPage = lazy(() => import('@/pages/settings/borrar-datos'));
const SettingsP2PPage = lazy(() => import('@/pages/settings/p2p'));
const SettingsAboutPage = lazy(() => import('@/pages/settings/about'));
const OfflinePage = lazy(() => import('@/pages/offline'));

const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
    <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground/50 uppercase">Sincronizando Secciones</p>
  </div>
);

function AppLayout() {
  const location = useLocation();

  return (
    <ThemeProvider defaultTheme="system" storageKey="minutas-theme">
      <DatabaseProvider>
        <NotificationsProvider>
          <P2PProvider>
            <TooltipProvider>
              <div className="flex min-h-full w-full flex-col sm:flex-row md:overflow-hidden bg-background" suppressHydrationWarning>
                <SideNav />
                <div className="flex flex-1 flex-col sm:pl-14 md:overflow-hidden relative">
                  <MobileNav />
                  <main className="flex-1 md:overflow-hidden flex flex-col min-h-0 relative bg-muted/30">
                    <ErrorBoundary name="MainContent">
                      <Suspense fallback={<PageLoader />}>
                        <div key={location.pathname} className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out">
                          <Routes>
                            <Route path="/" element={<NovedadesPage />} />
                            <Route path="/settings/direcciones" element={<DireccionesPage />} />
                            <Route path="/estadisticas" element={<EstadisticasPage />} />
                            <Route path="/historial" element={<HistorialPage />} />
                            <Route path="/orden-del-dia" element={<OrdenDelDiaPage />} />
                            <Route path="/personal" element={<PersonalPage />} />
                            <Route path="/plantillas" element={<PlantillasPage />} />
                            <Route path="/reporte-final" element={<ReporteFinalPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/settings/workspaces" element={<SettingsWorkspacesPage />} />
                            <Route path="/settings/profile" element={<SettingsProfilePage />} />
                            <Route path="/settings/borrar-datos" element={<SettingsBorrarDatosPage />} />
                            <Route path="/settings/p2p" element={<SettingsP2PPage />} />
                            <Route path="/settings/about" element={<SettingsAboutPage />} />
                            <Route path="/offline" element={<OfflinePage />} />
                          </Routes>
                        </div>
                      </Suspense>
                    </ErrorBoundary>
                  </main>
                  <BottomNav />
                </div>
              </div>
              <WelcomeDialog />
              <PWARegistration />
              <PWAStatus />
              <Toaster />
            </TooltipProvider>
          </P2PProvider>
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
