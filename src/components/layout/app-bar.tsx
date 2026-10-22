'use client';

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from '@/components/layout/notification-bell';
import { QuickChatSelector } from '@/components/layout/quick-chat-selector';
import { useMobileNav } from './mobile-nav/use-mobile-nav';
import { NavUserMenu } from './mobile-nav/nav-user-menu';
import { cn } from '@/lib/utils';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const STATIC_TITLES: Record<string, string> = {
  '/': 'Novedades',
  '/novedades': 'Novedades',
  '/orden-del-dia': 'Orden del Día',
  '/reporte-final': 'Reporte de Cierre',
  '/estadisticas': 'Estadísticas',
  '/personal': 'Personal',
  '/plantillas': 'Plantillas',
  '/settings': 'Configuración',
  '/admin': 'Panel Administrador',
  '/offline': 'Modo Sin Conexión',
};

const SUB_TITLES: Record<string, string> = {
  profile: 'Perfil',
  security: 'Seguridad',
  about: 'Acerca de',
  whatsapp: 'WhatsApp',
  backup: 'Respaldos',
  modules: 'Módulos',
  users: 'Usuarios',
  config: 'Configuración',
  workspaces: 'Áreas de Trabajo',
  feedback: 'Comentarios y Feedback',
};

function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const firstPart = pathname.split('?')[0] ?? '';
  const cleanPath = firstPart.replace(/\/$/, '') || '/';

  if (STATIC_TITLES[cleanPath]) {
    return [{ label: STATIC_TITLES[cleanPath] }];
  }

  // Rutas anidadas en /settings
  if (cleanPath.startsWith('/settings/')) {
    const sub = cleanPath.replace('/settings/', '');
    return [
      { label: 'Configuración', href: '/settings' },
      { label: SUB_TITLES[sub] || sub.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
    ];
  }

  // Rutas anidadas en /admin
  if (cleanPath.startsWith('/admin/')) {
    const sub = cleanPath.replace('/admin/', '');
    return [
      { label: 'Panel Admin', href: '/admin' },
      { label: SUB_TITLES[sub] || sub.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
    ];
  }

  // Formato genérico por segmentos
  const parts = cleanPath.split('/').filter(Boolean);
  return parts.map((part, index) => {
    const isLast = index === parts.length - 1;
    const href = '/' + parts.slice(0, index + 1).join('/');
    const formatted = SUB_TITLES[part] || part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return isLast ? { label: formatted } : { label: formatted, href };
  });
}

export function AppBar() {
  const location = useLocation();
  const {
    profile,
    analyst,
    displayName,
    displayDepartment,
    initials,
  } = useMobileNav();

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 shadow-sm select-none transition-colors duration-200">
      {/* Lado izquierdo: Logo de la app y el título / sección */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/"
          className="flex items-center gap-2.5 group shrink-0 focus-visible:outline-none"
          title="Minutas — Inicio"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all duration-200 group-hover:bg-primary/20 group-hover:scale-105 shadow-2xs">
            <img
              src="/icons/icon-192x192.png"
              alt="Logo Minutas"
              className="h-5 w-5 object-contain transition-transform group-hover:scale-110"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            Minutas
          </span>
        </Link>

        {breadcrumbs.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 min-w-0 animate-in fade-in duration-200">
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.label}>
                <span className="text-muted-foreground/30 font-light text-base select-none">/</span>
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors truncate max-w-[160px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground truncate max-w-[200px]">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Lado derecho:
          - En escritorio (sm en adelante): Completamente limpio, solo logo y título como solicitado.
          - En móviles (< sm): Controles esenciales (WhatsApp, notificaciones, perfil) para no perder funcionalidad.
      */}
      <div className="flex items-center gap-1.5 shrink-0 sm:hidden">
        <QuickChatSelector />
        <NotificationBell />
        <NavUserMenu
          profile={profile}
          analyst={analyst}
          displayName={displayName}
          displayDepartment={displayDepartment}
          initials={initials}
        />
      </div>
    </header>
  );
}

export default AppBar;
