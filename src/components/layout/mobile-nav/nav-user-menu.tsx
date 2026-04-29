import React from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/providers/theme-provider';

interface NavUserMenuProps {
  profile: any;
  analyst: any;
  displayName: string;
  displayDepartment: string;
  initials: string;
}

export const NavUserMenu = ({ profile, analyst, displayName, displayDepartment, initials }: NavUserMenuProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full transition-all overflow-hidden ring-2 ring-transparent focus:outline-none ml-1 shadow-sm">
        {profile.avatarUrl && !analyst ? (
          <img src={profile.avatarUrl} alt="Perfil" className="h-full w-full object-cover" />
        ) : (
          <div className={cn(
            "flex h-full w-full items-center justify-center text-xs font-bold",
            analyst ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          )}>
            {initials}
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 mt-1 rounded-xl shadow-xl border-muted/60">
        <div className="flex flex-col space-y-1 p-3">
          <p className="text-sm font-bold leading-none truncate tracking-tight">{displayName}</p>
          <p className="text-[10px] leading-none text-muted-foreground truncate uppercase font-bold tracking-wider mt-1">
            {displayDepartment}
          </p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="cursor-not-allowed opacity-50 justify-between py-2.5">
          <div className="flex items-center">
            <User className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Mi Perfil</span>
          </div>
          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-black text-muted-foreground/70 uppercase">Próximamente</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="py-2.5">
          <Link to="/settings" className="cursor-pointer flex w-full items-center">
            <Settings className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Configuración</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apariencia</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-xl border">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                theme === 'light' ? 'bg-background shadow-sm text-primary ring-1 ring-primary/10' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase">Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                theme === 'dark' ? 'bg-background shadow-sm text-primary ring-1 ring-primary/10' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase">Oscuro</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                theme === 'system' ? 'bg-background shadow-sm text-primary ring-1 ring-primary/10' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Monitor className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase">Sistema</span>
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
