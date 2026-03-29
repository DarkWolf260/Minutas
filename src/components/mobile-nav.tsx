'use client';

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OnlineStatus } from '@/components/online-status';
import { NotificationBell } from '@/components/notification-bell';
import { useProfile } from '@/hooks/use-profile';
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
import { useTheme } from '@/components/theme-provider';

export function MobileNav() {
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:hidden shadow-sm shadow-black/5">
      <div className="flex items-center gap-2 font-semibold flex-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/50 border overflow-hidden shadow-sm">
          <img src="/icons/icon-192x192.png" alt="App Icon" className="h-4 w-4 object-contain" />
        </div>
        <span className="text-sm">PC Reportes</span>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <OnlineStatus />
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full transition-all overflow-hidden ring-2 ring-transparent focus:outline-none focus-visible:ring-primary/50 ml-1">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(profile.name)}
              </div>
            )}
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none truncate">{profile.name || 'Usuario'}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{profile.department || 'Área no asignada'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/profile" className="cursor-pointer flex w-full items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
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
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setTheme('dark')} 
                  className={cn("p-1.5 rounded-sm transition-colors", theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setTheme('system')} 
                  className={cn("p-1.5 rounded-sm transition-colors", theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
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
