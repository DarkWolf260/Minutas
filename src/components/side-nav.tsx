'use client';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notification-bell';
import { useTheme } from '@/components/theme-provider';
import { useProfile } from '@/hooks/use-profile';
import { useSettings } from '@/hooks/use-settings';
import { getInitials } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Novedades', icon: Newspaper },
  { href: '/orden-del-dia', label: 'Lista', icon: ClipboardList },
  { href: '/reporte-final', label: 'Reporte', icon: History },
  { href: '/personal', label: 'Personal', icon: Users },
];

export function SideNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();
  const { settings } = useSettings();

  // Dynamic name logic: Use Analista de CEMUPRAD if a guard is active
  const analyst = settings.isGuardOpen 
    ? settings.ordenDelDiaDraft?.staff?.['Analista de CEMUPRAD']?.[0]
    : null;
    
  const displayName = analyst?.name || profile.name || 'Usuario';
  const displayDepartment = analyst ? 'Analista CEMUPRAD' : (profile.department || 'Área no asignada');
  const initials = getInitials(displayName);

  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background/80 backdrop-blur-md sm:flex shadow-2xl shadow-black/5">
        <nav className="flex flex-col items-center gap-6 px-2 py-5">
          <Link
            to="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-background/50 border shadow-sm text-lg font-semibold md:h-8 md:w-8 md:text-base overflow-hidden"
          >
            <img src="/icons/icon-192x192.png" alt="App Icon" className="h-6 w-6 object-contain transition-all group-hover:scale-110" />
            <span className="sr-only">PC Reportes</span>
          </Link>

          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  to={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8',
                    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <NotificationBell />
          
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-all overflow-hidden md:h-8 md:w-8 ring-2 ring-transparent focus:outline-none',
                  pathname.startsWith('/settings') ? 'ring-primary/40 ring-offset-1 ring-offset-background' : 'hover:ring-primary/30'
                )}>
                  {profile.avatarUrl && !analyst ? (
                    <img src={profile.avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                    <div className={cn(
                      "flex h-full w-full items-center justify-center text-xs font-semibold",
                      analyst ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {initials}
                    </div>
                  )}
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
                    onClick={() => setTheme('dark')} 
                    className={cn("p-1.5 rounded-sm transition-colors", theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                    title="Oscuro"
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
