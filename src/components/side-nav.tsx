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
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import {
  History,
  Newspaper,
  Settings,
  Mountain,
  FileText,
  ClipboardList,
  ClipboardCheck,
  NotebookPen,
  TrendingUp,
  Users,
  Zap,
  User,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useP2P } from '@/lib/db/p2p-provider';
import { NotificationBell } from '@/components/notification-bell';
import { useProfile } from '@/hooks/use-profile';
import { getInitials } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

const navItems = [
  { href: '/', label: 'Novedades', icon: Newspaper },
  { href: '/orden-del-dia', label: 'Orden del Día', icon: ClipboardList },
  { href: '/reporte-final', label: 'Reporte Final', icon: History },
  { href: '/personal', label: 'Personal', icon: Users },
];

export function SideNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isSyncing, peerCount } = useP2P();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();

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
          
          {isSyncing && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500 animate-pulse">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                Sincronización P2P Activa ({peerCount} pares)
              </TooltipContent>
            </Tooltip>
          )}

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
                  pathname.startsWith('/settings') ? 'ring-primary/50 ring-offset-2 ring-offset-background' : 'hover:ring-primary/30'
                )}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(profile.name)}
                    </div>
                  )}
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Opciones</TooltipContent>
            </Tooltip>
            
            <DropdownMenuContent side="right" align="end" className="w-56 mb-2 ml-2">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none truncate">{profile.name || 'Usuario'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{profile.department || 'Área no asignada'}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
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
