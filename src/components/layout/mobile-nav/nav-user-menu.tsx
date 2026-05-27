import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, Sun, Moon, Monitor, LogIn, LogOut, ShieldAlert, Eclipse } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useTheme } from '@/components/providers/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { Briefcase } from 'lucide-react';

interface NavUserMenuProps {
  profile: any;
  analyst: any;
  displayName: string;
  displayDepartment: string;
  initials: string;
}

export const NavUserMenu = ({ profile, analyst, displayName, displayDepartment, initials }: NavUserMenuProps) => {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspaceManager();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full transition-all overflow-hidden ring-2 ring-border/80 focus:outline-none ml-1 shadow-sm">
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

      <DropdownMenuContent align="end" className="w-64 mt-1 rounded-xl shadow-xl border-border">
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

        {isAdmin && (
          <>
            <DropdownMenuItem asChild className="py-2.5">
              <Link to="/admin" className="cursor-pointer flex w-full items-center text-primary focus:text-primary">
                <ShieldAlert className="mr-3 h-4 w-4" />
                <span className="text-sm font-medium">Panel Admin</span>
              </Link>
            </DropdownMenuItem>
            
            {workspaces && workspaces.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="py-2.5 cursor-pointer flex w-full items-center text-orange-500 focus:text-orange-500 data-[state=open]:text-orange-500 data-[state=open]:bg-orange-500/10">
                  <Briefcase className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Áreas de Trabajo</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 mb-2">
                  {workspaces.map((ws: string) => (
                    <DropdownMenuItem
                      key={ws}
                      onClick={() => switchWorkspace(ws)}
                      className={cn(
                        "cursor-pointer py-2.5 flex items-center justify-between",
                        currentWorkspace === ws ? "bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary" : ""
                      )}
                    >
                      <span className="text-sm font-medium truncate">{ws}</span>
                      {currentWorkspace === ws && <span className="flex h-2 w-2 rounded-full bg-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
          </>
        )}

        <DropdownMenuSeparator />

        <div className="px-2 py-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apariencia</span>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-muted/30 p-1 rounded-xl border">
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
              onClick={() => setTheme('facebook')}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                theme === 'facebook' ? 'bg-background shadow-sm text-[#2D88FF] ring-1 ring-[#2D88FF]/10' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Eclipse className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase">Gris</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                theme === 'dark' ? 'bg-background shadow-sm text-primary ring-1 ring-primary/10' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase">OLED</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={cn(
                "flex flex-col items-center gap-1 py-2 rounded-lg transition-all",
                theme === 'system' ? 'bg-background shadow-sm text-primary ring-1 ring-primary/10' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Monitor className="h-4 w-4" />
              <span className="text-[9px] font-bold uppercase">Auto</span>
            </button>
          </div>
        </div>

        <DropdownMenuSeparator />
        
        {isAuthenticated ? (
          <DropdownMenuItem onClick={() => signOut()} className="py-2.5 cursor-pointer text-red-500 focus:text-red-500 font-medium">
            <LogOut className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => navigate('/login')} className="py-2.5 cursor-pointer font-medium">
            <LogIn className="mr-3 h-4 w-4" />
            <span className="text-sm font-medium">Iniciar Sesión</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
