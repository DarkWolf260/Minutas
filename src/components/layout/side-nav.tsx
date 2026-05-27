'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useTheme } from '@/components/providers/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
import { useProfile } from '@/hooks/use-profile';
import { useSettings } from '@/hooks/use-settings';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { getInitials } from '@/lib/utils';
import type { AppModuleId } from '@/lib/types';

const ALL_NAV_ITEMS: { href: string; label: string; icon: any; moduleId: AppModuleId }[] = [
  { href: '/', label: 'Novedades', icon: Newspaper, moduleId: 'novedades' },
  { href: '/orden-del-dia', label: 'Lista', icon: ClipboardList, moduleId: 'orden-del-dia' },
  { href: '/reporte-final', label: 'Reporte', icon: History, moduleId: 'reporte-final' },
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
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceManager();

  const disabled_modules = settings.disabled_modules || [];
  const navItems = ALL_NAV_ITEMS.filter((item) => !disabled_modules.includes(item.moduleId));

  // Dynamic name logic: Use Analista de CEMUPRAD if a guard is active
  const analyst = settings.is_guard_open
    ? settings.orden_del_dia_draft?.staff?.['Analista de CEMUPRAD']?.[0]
    : null;

  const displayName = analyst?.name || profile.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayDepartment = analyst ? 'Analista CEMUPRAD' : (profile.department || 'Área no asignada');
  const initials = getInitials(displayName);

  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background/80 backdrop-blur-md sm:flex shadow-2xl shadow-black/5">
        <nav className="flex flex-col items-center gap-6 px-2 py-5">
          <Link
            to="#"
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)] transition-all hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] md:h-9 md:w-9"
          >
            <img src="/icons/icon-192x192.png" alt="App Icon" className="h-6 w-6 object-contain transition-all group-hover:scale-110" />
            <span className="sr-only">Minutas</span>
          </Link>
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/admin"
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 md:h-9 md:w-9 ring-1 ring-transparent',
                    pathname.startsWith('/admin')
                      ? 'bg-primary/10 text-primary ring-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <ShieldAlert className="h-5 w-5" />
                  <span className="sr-only">Admin Panel</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Panel de Administrador</TooltipContent>
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
                      'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 md:h-9 md:w-9 ring-1 ring-transparent',
                      isActive
                        ? 'bg-primary/10 text-primary ring-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <NotificationBell />
          
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 md:h-9 md:w-9 ring-1 ring-transparent focus:outline-none shadow-[0_0_15px_-5px_rgba(0,0,0,0.1)]',
                  pathname.startsWith('/settings') 
                    ? 'bg-primary/10 ring-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]' 
                    : 'hover:ring-primary/20 hover:bg-muted/50'
                )}>
                  <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden shadow-sm ring-1 ring-border">
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
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Configuración</TooltipContent>
            </Tooltip>

            <DropdownMenuContent side="right" align="end" className="w-56 mb-2 ml-2">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{displayDepartment}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="cursor-not-allowed opacity-50 justify-between">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </div>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-2">Próximamente</span>
              </DropdownMenuItem>
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
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer font-medium text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate('/login')} className="cursor-pointer font-medium text-blue-500 focus:text-blue-500">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Iniciar Sesión</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                <span className="text-muted-foreground">Tema</span>
                <div className="flex bg-muted/50 rounded-md p-0.5 border">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn("p-1.5 rounded-sm transition-colors", theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    title="Claro"
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('facebook')}
                    className={cn("p-1.5 rounded-sm transition-colors", theme === 'facebook' ? 'bg-background shadow-sm text-[#2D88FF]' : 'text-muted-foreground hover:text-foreground')}
                    title="Modo Gris"
                  >
                    <Eclipse className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn("p-1.5 rounded-sm transition-colors", theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    title="Modo OLED"
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn("p-1.5 rounded-sm transition-colors", theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    title="Sistema"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </aside>
    </TooltipProvider>
  );
}


