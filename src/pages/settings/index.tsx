'use client';

import { lazy, Suspense, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AjustesGenerales } from '@/components/shared/ajustes-generales';
import { useSettings } from '@/hooks/configuracion';
import { useUnits } from '@/hooks/configuracion';
import { useRoles } from '@/hooks/personal';
import { useDepartments } from '@/hooks/personal';
import { useFieldDefinitions } from '@/hooks/configuracion';
import { useUser } from '@/components/providers/user-provider';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSidebar } from './components/settings-sidebar';

// Subpáginas de configuración cargadas dinámicamente
const SettingsModulesPage = lazy(() => import('@/pages/settings/modules'));
const SettingsWorkspacesPage = lazy(() => import('@/pages/settings/workspaces'));
const DireccionesPage = lazy(() => import('@/pages/settings/direcciones'));
const SettingsSyncPage = lazy(() => import('@/pages/settings/sync'));
const SettingsFeedbackPage = lazy(() => import('@/pages/settings/feedback'));
const SettingsBorrarDatosPage = lazy(() => import('@/pages/settings/borrar-datos'));
const SettingsProfilePage = lazy(() => import('@/pages/settings/profile'));
const SettingsAboutPage = lazy(() => import('@/pages/settings/about'));
const AboutAppPage = lazy(() => import('@/pages/settings/about/app'));
const AboutGuidePage = lazy(() => import('@/pages/settings/about/guide'));
const AboutChangelogPage = lazy(() => import('@/pages/settings/about/changelog'));
const AboutTemplatesPage = lazy(() => import('@/pages/settings/about/templates'));

const SECTION_LABELS: Record<string, string> = {
  general: 'Ajustes Generales',
  modules: 'Módulos',
  workspaces: 'Áreas de Trabajo',
  direcciones: 'Direcciones',
  sync: 'Sincronización',
  feedback: 'Enviar Comentarios',
  'borrar-datos': 'Borrar Datos',
  profile: 'Mi Perfil',
  about: 'Acerca de',
};

function getActiveSectionFromPath(pathname: string): string {
  if (pathname === '/settings' || pathname === '/settings/general') return 'general';
  if (pathname.startsWith('/settings/modules')) return 'modules';
  if (pathname.startsWith('/settings/workspaces')) return 'workspaces';
  if (pathname.startsWith('/settings/direcciones')) return 'direcciones';
  if (pathname.startsWith('/settings/sync')) return 'sync';
  if (pathname.startsWith('/settings/feedback')) return 'feedback';
  if (pathname.startsWith('/settings/borrar-datos')) return 'borrar-datos';
  if (pathname.startsWith('/settings/profile')) return 'profile';
  if (pathname.startsWith('/settings/about')) return 'about';
  return 'general';
}

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isLoaded: unitsLoaded } = useUnits();
  const { isLoaded: rolesLoaded } = useRoles();
  const { isLoaded: deptsLoaded } = useDepartments();
  const { isLoaded: settingsLoaded } = useSettings();
  const { isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { isAdmin } = useUser();
  const { isCloud } = useWorkspaceManager();

  const isLoaded = unitsLoaded && rolesLoaded && deptsLoaded && settingsLoaded && definitionsLoaded;
  const isDataRestricted = isCloud && !isAdmin;

  const activeSection = useMemo(
    () => getActiveSectionFromPath(location.pathname),
    [location.pathname]
  );

  // En móvil: Si está en "/settings", muestra la barra lateral.
  // Si está en cualquier otra subruta ("/settings/general", "/settings/modules", etc.), muestra el detalle.
  const mobileView = location.pathname === '/settings' ? 'sidebar' : 'detail';

  const renderSectionContent = () => {
    const path = location.pathname;

    if (path === '/settings/about/app') return <AboutAppPage />;
    if (path === '/settings/about/guide') return <AboutGuidePage />;
    if (path === '/settings/about/changelog') return <AboutChangelogPage />;
    if (path === '/settings/about/templates') return <AboutTemplatesPage />;

    switch (activeSection) {
      case 'modules':
        return <SettingsModulesPage />;
      case 'workspaces':
        return <SettingsWorkspacesPage />;
      case 'direcciones':
        return <DireccionesPage />;
      case 'sync':
        return <SettingsSyncPage />;
      case 'feedback':
        return <SettingsFeedbackPage />;
      case 'borrar-datos':
        return <SettingsBorrarDatosPage />;
      case 'profile':
        return <SettingsProfilePage />;
      case 'about':
        return <SettingsAboutPage />;
      case 'general':
      default:
        return <AjustesGenerales />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col h-full w-full bg-background overflow-hidden sm:flex-row flex-1">
        {/* Skeleton Sidebar */}
        <div className="h-full w-full sm:w-80 lg:w-96 border-r bg-card p-4 space-y-4 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>

        {/* Skeleton Main */}
        <div className="hidden sm:flex flex-1 p-6 md:p-8">
          <Skeleton className="h-full w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden sm:flex-row flex-1">
      {/* Barra Lateral de Configuración (estilo Novedades) */}
      <SettingsSidebar
        activeSection={activeSection}
        onSelectSection={(id) => {
          if (id === 'general') {
            navigate('/settings/general');
          }
        }}
        isDataRestricted={isDataRestricted}
        mobileView={mobileView}
      />

      {/* Área Principal de Configuración */}
      <main
        className={cn(
          'flex-1 flex flex-col min-h-0 overflow-hidden bg-background animate-in fade-in slide-in-from-right-4 duration-300 sm:animate-none',
          location.pathname === '/settings' ? 'hidden sm:flex' : 'flex'
        )}
      >
        {/* Cabecera Móvil para volver a la barra lateral de configuración */}
        <div className="sm:hidden border-b p-3 bg-card flex items-center justify-between sticky top-0 z-10 h-14 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="text-xs font-semibold gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Configuración
          </Button>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
            {SECTION_LABELS[activeSection] || 'Detalles'}
          </span>
        </div>

        {/* Vista Activa Renderizada */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Suspense
            fallback={
              <div className="flex-1 p-6 space-y-4 max-w-4xl mx-auto w-full">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-[400px] w-full rounded-2xl" />
              </div>
            }
          >
            {renderSectionContent()}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
