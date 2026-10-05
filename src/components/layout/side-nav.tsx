'use client';

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  History,
  Newspaper,
  Settings,
  ClipboardList,
  Users,
  Moon,
  Sun,
  Monitor,
  User,
  BarChart2,
  FileText,
  LogIn,
  LogOut,
  ShieldAlert,
  Eclipse,
  Briefcase,
  PanelLeftClose,
  PanelLeft,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/notification-bell';
import { QuickChatSelector } from '@/components/layout/quick-chat-selector';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { openCommandMenu } from '@/components/layout/command-menu';
import { useSidebarExpanded } from '@/hooks/ui';
import { useTheme } from '@/components/providers/theme-provider';
import { useAuth } from '@/hooks/admin';
import { useAdmin } from '@/hooks/admin';
import { useProfile } from '@/hooks/configuracion';
import { useSettings } from '@/hooks/configuracion';
import { useGlobalConfig } from '@/hooks/configuracion';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { getInitials } from '@/lib/utils';
import { APP_VERSION } from '@/pages/settings/about/data';
import type { AppModuleId } from '@/lib/types';

const ALL_NAV_ITEMS: { href: string; label: string; icon: any; moduleId: AppModuleId }[] = [
  { href: '/', label: 'Novedades', icon: Newspaper, moduleId: 'novedades' },
  { href: '/orden-del-dia', label: 'Orden del Día', icon: ClipboardList, moduleId: 'orden-del-dia' },
  { href: '/reporte-final', label: 'Reporte Final', icon: History, moduleId: 'reporte-final' },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart2, moduleId: 'estadisticas' },
  { href: '/personal', label: 'Personal', icon: Users, moduleId: 'personal' },
  { href: '/plantillas', label: 'Plantillas', icon: FileText, moduleId: 'plantillas' },
];

export function SideNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();
  const { settings } = useSettings();
  const { isAuthenticated, signOut, user } = useAuth();
  const { isAdmin } = useAdmin();
  const { config: globalConfig } = useGlobalConfig();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceManager();
  const { isExpanded, toggleExpanded } = useSidebarExpanded();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const disabled_modules = [
    ...(settings.disabled_modules || []),
    ...(isAdmin ? (globalConfig.disabled_modules_admins || []) : [])
  ];
  const navItems = ALL_NAV_ITEMS.filter((item) => !disabled_modules.includes(item.moduleId));

  // Dynamic name logic: Use Analista de Sala de Monitoreo if a guard is active
  const analyst = settings.is_guard_open
    ? (settings.orden_del_dia_draft?.staff?.['Analista de Sala de Monitoreo']?.[0]
      || Object.entries(settings.orden_del_dia_draft?.staff || {}).find(([k]) => k.toLowerCase().includes('analista'))?.[1]?.[0])
    : null;

  const displayName = analyst?.name || profile.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayDepartment = analyst ? 'Analista Sala de Monitoreo' : (profile.department || 'Área no asignada');
  const initials = getInitials(displayName);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden flex-col border-r bg-background/95 backdrop-blur-md sm:flex shadow-sm transition-[width] duration-300 ease-out select-none",
          isExpanded ? "w-56" : "w-14"
        )}
      >
        {/* Top Header: Only Brand / Logo */}
        <div className="flex items-center h-16 border-b border-border/80 px-2.5">
          <Link
            to="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all hover:bg-primary/20 cursor-pointer"
            title="Ir a Inicio"
          >
            <img src="/icons/icon-192x192.png" alt="App Icon" className="h-5 w-5 object-contain" />
          </Link>
          {isExpanded && (
            <div className="flex flex-col min-w-0 pl-2.5 whitespace-nowrap overflow-hidden animate-slide-down">
              <span className="text-sm font-bold tracking-tight text-foreground truncate">
                Minutas
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {currentWorkspace || 'Principal'}
              </span>
            </div>
          )}
        </div>

        {/* Quick Search Bar */}
        <div className="px-2.5 pt-2.5 pb-1">
          <button
            type="button"
            onClick={openCommandMenu}
            title="Buscar o comandos (Ctrl+K)"
            aria-label="Buscar o comandos (Ctrl+K)"
            className="w-full flex items-center h-9 rounded-xl border border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 text-xs font-medium cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center">
              <Search className="h-4 w-4" />
            </div>
            {isExpanded && (
              <span className="truncate flex-1 text-left whitespace-nowrap animate-slide-down pr-2">
                Buscar o comandos (Ctrl+K)...
              </span>
            )}
          </button>
        </div>

        {/* Navigation Items (Clean without visible shortcut badges) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/admin"
                  className={cn(
                    'w-full flex items-center h-9 rounded-xl transition-all duration-150 text-sm font-medium cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5',
                    pathname.startsWith('/admin')
                      ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                  </div>
                  {isExpanded && <span className="truncate flex-1 text-left whitespace-nowrap animate-slide-down pr-2">Panel Admin</span>}
                </Link>
              </TooltipTrigger>
              {!isExpanded && <TooltipContent side="right">Panel de Administrador</TooltipContent>}
            </Tooltip>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      'w-full flex items-center h-9 rounded-xl transition-all duration-150 text-sm font-medium cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    </div>
                    {isExpanded && (
                      <span className="truncate flex-1 text-left whitespace-nowrap animate-slide-down pr-2">{item.label}</span>
                    )}
                  </Link>
                </TooltipTrigger>
                {!isExpanded && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer Area: Stacked vertically with full names when expanded */}
        <div className="mt-auto border-t border-border/80 px-2.5 py-3 space-y-1.5">
          {/* WhatsApp Bot (Stacked vertically with label when expanded) */}
          <div className="w-full flex justify-center">
            <QuickChatSelector showLabel={isExpanded} />
          </div>

          {/* Notifications Panel (Stacked vertically with label when expanded) */}
          <div className="w-full flex justify-center">
            <NotificationBell showLabel={isExpanded} />
          </div>

          {/* Expand / Collapse Toggle Button at the bottom */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            title={isExpanded ? "Colapsar barra lateral (Ctrl+B)" : "Expandir barra lateral (Ctrl+B)"}
            aria-label={isExpanded ? "Colapsar barra lateral" : "Expandir barra lateral"}
            className={cn(
              "w-full flex items-center h-9 rounded-xl transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 text-sm font-medium cursor-pointer select-none",
              isExpanded
                ? "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                : "bg-muted/60 hover:bg-primary/15 hover:text-primary text-foreground border border-border hover:border-primary/30 shadow-xs active:scale-95"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center">
              {isExpanded ? (
                <PanelLeftClose className="h-4 w-4 shrink-0" />
              ) : (
                <PanelLeft className="h-4 w-4 shrink-0" />
              )}
            </div>
            {isExpanded && (
              <span className="truncate flex-1 text-left whitespace-nowrap animate-slide-down pr-2">
                Colapsar barra
              </span>
            )}
          </button>

          {/* User Menu Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center h-9 rounded-xl transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer mt-1"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <div className="h-7 w-7 rounded-full overflow-hidden border border-border shadow-xs flex items-center justify-center">
                    {profile.avatarUrl && !analyst ? (
                      <img src={profile.avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
                    ) : (
                      <div className={cn(
                        "flex h-full w-full items-center justify-center text-[10px] font-black",
                        analyst ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="flex flex-col text-left min-w-0 flex-1 pl-1 pr-2 animate-slide-down">
                    <span className="text-xs font-semibold text-foreground truncate">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{displayDepartment}</span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side={isExpanded ? "top" : "right"} align="end" className="w-56 mb-2">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate mt-1">{displayDepartment}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer font-medium">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer font-medium text-primary focus:text-primary">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span>Panel Admin</span>
                  </DropdownMenuItem>

                  {workspaces && workspaces.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer font-medium text-orange-500 focus:text-orange-500 data-[state=open]:text-orange-500 data-[state=open]:bg-orange-500/10">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>Áreas de Trabajo</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 ml-1">
                        {workspaces.map((ws: string) => (
                          <DropdownMenuItem
                            key={ws}
                            onClick={() => switchWorkspace(ws)}
                            className={cn(
                              "cursor-pointer font-medium flex items-center justify-between",
                              currentWorkspace === ws ? "bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary" : ""
                            )}
                          >
                            <span className="truncate">{ws}</span>
                            {currentWorkspace === ws && <span className="flex h-2 w-2 rounded-full bg-primary" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              {isAuthenticated ? (
                <DropdownMenuItem
                  onClick={() => setShowLogoutConfirm(true)}
                  className="cursor-pointer font-medium text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/login')} className="cursor-pointer font-medium text-primary focus:text-primary">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Iniciar Sesión</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                <span className="text-muted-foreground font-medium">Tema</span>
                <div className="flex bg-muted/60 rounded-lg p-0.5 border border-border">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn("p-1 rounded-sm transition-colors", theme === 'light' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground')}
                    title="Claro"
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('facebook')}
                    className={cn("p-1 rounded-sm transition-colors", theme === 'facebook' ? 'bg-background shadow-xs text-[#2D88FF] font-bold' : 'text-muted-foreground hover:text-foreground')}
                    title="Modo Gris"
                  >
                    <Eclipse className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn("p-1 rounded-sm transition-colors", theme === 'dark' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground')}
                    title="Modo OLED"
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn("p-1 rounded-sm transition-colors", theme === 'system' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground hover:text-foreground')}
                    title="Sistema"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Version indicator in dropdown */}
              <DropdownMenuSeparator />
              <div className="px-2 py-1 text-[10px] text-muted-foreground/80 flex items-center justify-between">
                <span>Versión</span>
                <span className="font-mono font-semibold">v{APP_VERSION}</span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Destructive Logout Confirmation Dialog */}
        <ConfirmDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
          onConfirm={signOut}
          title="¿Cerrar Sesión?"
          message="¿Estás seguro de que deseas salir del sistema? Cualquier dato o borrador que no haya sido guardado podría perderse."
          confirmText="Cerrar Sesión"
          cancelText="Permanecer"
          variant="destructive"
        />
      </aside>
    </TooltipProvider>
  );
}
