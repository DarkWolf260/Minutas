'use client';

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useProfile } from '@/hooks/use-profile';
import { useSettings } from '@/hooks/use-settings';
import { getInitials } from '@/lib/utils';
import {
  User,
  Settings,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/providers/theme-provider';

export function MobileNav() {
  const { profile } = useProfile();
  const { settings } = useSettings();
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();

  // Dynamic name logic: Use Analista de CEMUPRAD if a guard is active
  const analyst = settings.isGuardOpen 
    ? settings.ordenDelDiaDraft?.staff?.['Analista de CEMUPRAD']?.[0]
    : null;
    
  const displayName = analyst?.name || profile.name || 'Usuario';
  const displayDepartment = analyst ? 'Analista CEMUPRAD' : (profile.department || 'Área no asignada');
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/90 backdrop-blur-md px-5 sm:hidden shadow-sm shadow-black/5">
      <div className="flex items-center gap-3 font-semibold flex-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/50 border overflow-hidden shadow-sm shrink-0">
          <img src="/icons/icon-192x192.png" alt="App Icon" className="h-5 w-5 object-contain" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground truncate">
          PC Reportes
        </span>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full transition-all overflow-hidden ring-2 ring-transparent focus:outline-none ml-1">
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
          
          <DropdownMenuContent align="end" className="w-56 mt-1">
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

            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer flex w-full items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </Link>
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
      </div>
    </header>
  );
}

