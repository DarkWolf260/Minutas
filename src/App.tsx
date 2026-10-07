import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SideNav } from '@/components/layout/side-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWAStatus } from '@/components/layout/pwa-status';
import { PwaProvider } from '@/components/providers/pwa-provider';
import { DatabaseProvider } from '@/lib/db/db-provider';
import { NotificationsProvider } from '@/lib/notifications-provider';
import { SyncProvider } from '@/lib/sync/sync-context';
import { AuthProvider } from '@/components/providers/auth-provider';
import { UserProvider, useUser } from '@/components/providers/user-provider';
import { ScheduledMessagesWorker } from '@/components/scheduled-messages-worker';
import { lazy, Suspense, useState, useEffect } from 'react';
import { WifiOff, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingTour } from '@/components/ui/custom/onboarding-tour';
import { cn } from '@/lib/utils';

// Setup helpers
import SetupPage from '@/pages/setup';
import { SETUP_DONE_KEY, tryGet, trySet, tryRemove } from '@/hooks/configuracion';
import { APP_VERSION } from '@/pages/settings/about/data';
import { AdminRoute } from '@/components/auth/admin-route';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/admin';
import { useGlobalConfig, GlobalConfigProvider } from '@/hooks/configuracion';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { usePrecacheImages, useSidebarExpanded } from '@/hooks/ui';
import { useOfflineUpload } from '@/hooks/novedades';
import { CommandMenu } from '@/components/layout/command-menu';

// ─── Lazy-load app pages ──────────────────────────────────────────────────────

import OfflinePage from '@/pages/offline';
import NotFoundPage from '@/pages/not-found';
import LoginPage from '@/pages/login';

import NovedadesPage from '@/pages/novedades';
import OrdenDelDiaPage from '@/pages/orden-del-dia';
import PersonalPage from '@/pages/personal';
import PlantillasPage from '@/pages/plantillas';
import ReporteFinalPage from '@/pages/reporte-final';

const EstadisticasPage = lazy(() => import('@/pages/estadisticas'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const RegisterPage = lazy(() => import('@/pages/register'));
const AdminDashboardPage = lazy(() => import('@/pages/admin'));
const AdminUsersPage = lazy(() => import('@/pages/admin/users'));
const AdminConfigPage = lazy(() => import('@/pages/admin/config'));
const AdminWorkspacesPage = lazy(() => import('@/pages/admin/workspaces'));
const AdminFeedbackPage = lazy(() => import('@/pages/admin/feedback'));
const MaintenancePage = lazy(() => import('@/pages/maintenance'));

// ─── Shared loader ────────────────────────────────────────────────────────────

const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 px-6 text-center">
    <div className="w-24 h-1 bg-muted/50 rounded-full overflow-hidden">
      <div className="h-full bg-primary/30 animate-pulse w-full" />
    </div>
  </div>
);


function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isApproved, isAdmin, loading: statusLoading } = useUser();
  const { config, loading: configLoading } = useGlobalConfig();
  const { isCloud, currentWorkspace } = useWorkspaceManager();
  const { isExpanded } = useSidebarExpanded();
  
  // Pre-download all reports photos for offline availability
  usePrecacheImages();
  
  // Background upload sync for offline captured photos
  useOfflineUpload();

  // Dynamic Text Size adjustment effect
  useEffect(() => {
    const factors: Record<string, number> = {
      small: 0.875,
      normal: 1.0,
      large: 1.125,
      xlarge: 1.25
    };
    
    const applySize = () => {
      const savedSize = localStorage.getItem('minutas-text-size') || 'normal';
      const factor = factors[savedSize] ?? 1.0;
      const isDesktop = window.innerWidth >= 640;
      const baseSize = isDesktop ? 16 : 14;
      document.documentElement.style.fontSize = `${baseSize * factor}px`;
    };
    
    applySize();
    window.addEventListener('resize', applySize);
    
    // Listen for custom events to update size instantly
    const handleTextSizeChange = () => {
      applySize();
    };
    window.addEventListener('minutas-text-size-changed', handleTextSizeChange);
    
    return () => {
      window.removeEventListener('resize', applySize);
      window.removeEventListener('minutas-text-size-changed', handleTextSizeChange);
    };
  }, []);
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  // Si el usuario está autenticado pero no está aprobado, ocultamos la navegación por completo.
  const showNav = !isAuthPage && 
    (!isCloud || (user && isApproved && !statusLoading)) && 
    (!config.maintenance_mode || isAdmin) &&
    !(user && !isApproved && !statusLoading);
  
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showOnlineBar, setShowOnlineBar] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      setShowOnlineBar(true);
      setTimeout(() => setShowOnlineBar(false), 4000); // Show for 4 seconds
    };
    const onOffline = () => {
      setIsOffline(true);
      setShowOnlineBar(false);
    };
    
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
      <div className={cn(
        "flex flex-1 flex-col md:overflow-hidden relative min-w-0 overflow-x-hidden transition-[padding] duration-300 ease-out",
        showNav && (isExpanded ? "sm:pl-64" : "sm:pl-16")
      )}>
        {showNav && <MobileNav />}

        {(isOffline || showOnlineBar) && location.pathname !== '/offline' && (
          <div className={cn(
            "text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 sticky top-0 z-[50] shadow-md transition-colors",
            isOffline ? "bg-amber-500" : "bg-emerald-500"
          )}>
            {isOffline ? <WifiOff className="h-3 w-3" /> : <RefreshCw className="h-3 w-3 animate-spin-slow" />}
            <span>
              {isOffline 
                ? `Modo Sin Conexión${user ? ' — Los cambios se sincronizarán al volver' : ''}`
                : `Conexión Restaurada${user ? ' — Sincronizando datos...' : ''}`}
            </span>
          </div>
        )}

        {config.maintenance_mode && isAdmin && (
          <div className="bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 flex items-center justify-center gap-2 sticky top-0 z-[49] shadow-inner">
            <ShieldAlert className="h-3 w-3" />
            <span>Aviso: El Modo Mantenimiento está ACTIVO para usuarios generales</span>
          </div>
        )}

        <main className="flex-1 md:overflow-hidden flex flex-col min-h-0 min-w-0 relative bg-background overflow-x-hidden">
          {config.maintenance_mode && !isAdmin && location.pathname !== '/login' ? (
            <Suspense fallback={<PageLoader />}>
              <MaintenancePage />
            </Suspense>
          ) : (
            <ErrorBoundary name="MainContent">
              <Suspense fallback={<PageLoader />}>
              <div
                key={location.pathname.split('/')[1] || 'root'}
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
                  <Route path="/settings/*" element={
                    <ProtectedRoute>
                      <SettingsPage />
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
                  <Route path="/admin/feedback" element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminFeedbackPage />
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
      <CommandMenu />
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
      <PwaProvider>
        <AuthProvider>
          <UserProvider>
            <GlobalConfigProvider>
              <DatabaseProvider setupMode={!setupDone}>
              <NotificationsProvider>
                <SyncProvider>
                  <TooltipProvider>
                    {setupDone ? (
                      // ── Normal app shell ─────────────────────────────────────────
                      <Suspense fallback={<PageLoader />}>
                        <ScheduledMessagesWorker />
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
            </GlobalConfigProvider>
          </UserProvider>
        </AuthProvider>
      </PwaProvider>
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

