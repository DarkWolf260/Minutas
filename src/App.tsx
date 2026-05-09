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
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/components/providers/auth-provider';

// Setup helpers
import SetupPage from '@/pages/setup';
import { SETUP_DONE_KEY, tryGet, trySet, tryRemove } from '@/hooks/use-setup';
import { AdminRoute } from '@/components/auth/admin-route';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useUserStatus } from '@/hooks/use-user-status';
import { useAuth } from '@/hooks/use-auth';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useWorkspaceManager } from '@/lib/db/db-context';

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
const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const AdminDashboardPage = lazy(() => import('@/pages/admin'));
const AdminUsersPage = lazy(() => import('@/pages/admin/users'));
const AdminConfigPage = lazy(() => import('@/pages/admin/config'));
const AdminWorkspacesPage = lazy(() => import('@/pages/admin/workspaces'));
const MaintenancePage = lazy(() => import('@/pages/maintenance'));

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
  const { user } = useAuth();
  const { isApproved, isAdmin, loading: statusLoading } = useUserStatus();
  const { config, loading: configLoading } = useGlobalConfig();
  const { isCloud } = useWorkspaceManager();
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  // If user is in local mode (!isCloud), navigation is always allowed outside auth pages.
  // In cloud mode, requires authenticated and approved user.
  const showNav = !isAuthPage && (!isCloud || (user && isApproved && !statusLoading)) && (!config.maintenance_mode || isAdmin);
  
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
      {showNav && <SideNav />}
      <div className={cn("flex flex-1 flex-col md:overflow-hidden relative min-w-0 overflow-x-hidden", showNav && "sm:pl-14")}>
        {showNav && <MobileNav />}

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
          {config.maintenance_mode && !isAdmin && !isAuthPage ? (
            <Suspense fallback={<PageLoader />}>
              <MaintenancePage />
            </Suspense>
          ) : (
            <ErrorBoundary name="MainContent">
              <Suspense fallback={<PageLoader />}>
              <div
                key={location.pathname}
                className="flex-1 flex flex-col min-h-0 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
              >
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <NovedadesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/settings/direcciones" element={
                    <ProtectedRoute>
                      <DireccionesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/estadisticas" element={
                    <ProtectedRoute>
                      <EstadisticasPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/orden-del-dia" element={
                    <ProtectedRoute>
                      <OrdenDelDiaPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/personal" element={
                    <ProtectedRoute>
                      <PersonalPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/plantillas" element={
                    <ProtectedRoute>
                      <PlantillasPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/reporte-final" element={
                    <ProtectedRoute>
                      <ReporteFinalPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/workspaces" element={
                    <ProtectedRoute>
                      <SettingsWorkspacesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/profile" element={
                    <ProtectedRoute>
                      <SettingsProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/borrar-datos" element={
                    <ProtectedRoute>
                      <SettingsBorrarDatosPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/sync" element={
                    <ProtectedRoute>
                      <SettingsSyncPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/modules" element={
                    <ProtectedRoute>
                      <SettingsModulesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/feedback" element={
                    <ProtectedRoute>
                      <SettingsFeedbackPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/about" element={
                    <ProtectedRoute>
                      <SettingsAboutPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/about/app" element={
                    <ProtectedRoute>
                      <AboutAppPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/about/guide" element={
                    <ProtectedRoute>
                      <AboutGuidePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/about/changelog" element={
                    <ProtectedRoute>
                      <AboutChangelogPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings/about/templates" element={
                    <ProtectedRoute>
                      <AboutTemplatesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline" element={<OfflinePage />} />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminDashboardPage />
                      </AdminRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminUsersPage />
                      </AdminRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/config" element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminConfigPage />
                      </AdminRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/workspaces" element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminWorkspacesPage />
                      </AdminRoute>
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </Suspense>
          </ErrorBoundary>
          )}
        </main>

        {showNav && <BottomNav />}
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
      <AuthProvider>
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
      </AuthProvider>
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

