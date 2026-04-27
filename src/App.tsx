import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SideNav } from '@/components/layout/side-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAStatus } from '@/components/layout/pwa-status';
import { DatabaseProvider } from '@/lib/db/db-provider';
import { NotificationsProvider } from '@/lib/notifications-provider';
import { SyncProvider } from '@/lib/sync/sync-context';
import { lazy, Suspense, useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingTour } from '@/components/ui/custom/onboarding-tour';

// Setup helpers
import SetupPage from '@/pages/setup';
import { SETUP_DONE_KEY, tryGet, trySet, tryRemove } from '@/hooks/use-setup';

// ─── Lazy-load app pages ──────────────────────────────────────────────────────

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
const SettingsSyncPage = lazy(() => import('@/pages/settings/sync'));
const SettingsFeedbackPage = lazy(() => import('@/pages/settings/feedback'));
const SettingsAboutPage = lazy(() => import('@/pages/settings/about'));
const SettingsModulesPage = lazy(() => import('@/pages/settings/modules'));
const AboutAppPage = lazy(() => import('@/pages/settings/about/app'));
const AboutGuidePage = lazy(() => import('@/pages/settings/about/guide'));
const AboutChangelogPage = lazy(() => import('@/pages/settings/about/changelog'));
const AboutTemplatesPage = lazy(() => import('@/pages/settings/about/templates'));
const OfflinePage = lazy(() => import('@/pages/offline'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));

// ─── Shared loader ────────────────────────────────────────────────────────────

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
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Check if we should trigger the tour
    if (tryGet('minutas-trigger-tour') === 'true') {
      setShowTour(true);
      tryRemove('minutas-trigger-tour');
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div
      className="flex min-h-full w-full flex-col sm:flex-row md:overflow-hidden bg-background overflow-x-hidden"
      suppressHydrationWarning
    >
      <SideNav />
      <div className="flex flex-1 flex-col sm:pl-14 md:overflow-hidden relative min-w-0 overflow-x-hidden">
        <MobileNav />

        {isOffline && location.pathname !== '/offline' && (
          <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 sticky top-0 z-20 shadow-sm">
            <WifiOff className="h-3 w-3" />
            <span>Modo Sin Conexión — Los cambios se sincronizarán al volver</span>
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
              <div
                key={location.pathname}
                className="flex-1 flex flex-col min-h-0 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
              >
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
                  <Route path="/settings/sync" element={<SettingsSyncPage />} />
                  <Route path="/settings/modules" element={<SettingsModulesPage />} />
                  <Route path="/settings/feedback" element={<SettingsFeedbackPage />} />
                  <Route path="/settings/about" element={<SettingsAboutPage />} />
                  <Route path="/settings/about/app" element={<AboutAppPage />} />
                  <Route path="/settings/about/guide" element={<AboutGuidePage />} />
                  <Route path="/settings/about/changelog" element={<AboutChangelogPage />} />
                  <Route path="/settings/about/templates" element={<AboutTemplatesPage />} />
                  <Route path="/offline" element={<OfflinePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>

        <BottomNav />
      </div>

      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}

// ─── Root — decides synchronously whether to show Setup or the App ────────────

function Root() {
  // ⚡ Synchronous check at render time — localStorage is read before the first
  // paint, so the user NEVER sees a flash of the app layout during setup.
  const [setupDone, setSetupDone] = useState<boolean>(() => !!tryGet(SETUP_DONE_KEY));

  const handleSetupComplete = (goToTemplates = false) => {
    setSetupDone(true);
    if (goToTemplates) trySet('minutas-template-bootstrap-ok', 'true');
    // After setting state, AppLayout renders. Navigate to the right page.
    // We use a tiny delay so the router is ready.
    if (goToTemplates) {
      setTimeout(() => { window.location.replace('/plantillas'); }, 50);
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="minutas-theme">
      <DatabaseProvider setupMode={!setupDone}>
        <NotificationsProvider>
          <SyncProvider>
            <TooltipProvider>
              {setupDone ? (
                // ── Normal app shell ─────────────────────────────────────────
                <Suspense fallback={<PageLoader />}>
                  <AppLayout />
                </Suspense>
              ) : (
                // ── Full-screen setup wizard (no SideNav, no BottomNav) ──────
                // SetupPage uses DatabaseProvider hooks internally (workspace, settings)
                <SetupPage onComplete={handleSetupComplete} />
              )}

              {/* Global overlays — shown in both modes */}
              <PWAStatus />
              <Toaster />
            </TooltipProvider>
          </SyncProvider>
        </NotificationsProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}

// ─── App entry ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}

