import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Newspaper,
  Users,
  ClipboardList,
  History,
  BarChart2,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSettings } from '@/hooks/configuracion';
import { useAdmin } from '@/hooks/admin';
import { useGlobalConfig } from '@/hooks/configuracion';
import type { AppModuleId } from '@/lib/types';

const ALL_NAV_ITEMS: { href: string; label: string; icon: any; moduleId: AppModuleId }[] = [
  { href: '/',              label: 'Novedades',    icon: Newspaper,     moduleId: 'novedades' },
  { href: '/orden-del-dia', label: 'Lista',        icon: ClipboardList, moduleId: 'orden-del-dia' },
  { href: '/reporte-final', label: 'Reporte',      icon: History,       moduleId: 'reporte-final' },
  { href: '/personal',      label: 'Personal',     icon: Users,         moduleId: 'personal' },
  { href: '/estadisticas',  label: 'Estadísticas', icon: BarChart2,     moduleId: 'estadisticas' },
  { href: '/plantillas',    label: 'Plantillas',   icon: FileText,      moduleId: 'plantillas' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { isAdmin } = useAdmin();
  const { config: globalConfig } = useGlobalConfig();

  const disabled_modules = [
    ...(settings.disabled_modules || []),
    ...(isAdmin ? (globalConfig.disabled_modules_admins || []) : [])
  ];
  const navItems = ALL_NAV_ITEMS.filter((item) => !disabled_modules.includes(item.moduleId));

  // If 5 or fewer items, show all directly; otherwise show top 4 + "Más"
  const maxDirectItems = 5;
  const useOverflow = navItems.length > maxDirectItems;
  const directItems = useOverflow ? navItems.slice(0, 4) : navItems;
  const overflowItems = useOverflow ? navItems.slice(4) : [];

  const isOverflowActive = overflowItems.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  );

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-1">
        {directItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 gap-1 px-1 min-w-0 touch-manipulation",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                isActive ? "bg-primary/10 scale-110 shadow-sm" : "hover:bg-muted/40"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px] text-primary" : "stroke-2")} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-tight truncate w-full text-center px-0.5",
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {useOverflow && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 gap-1 px-1 min-w-0 touch-manipulation focus:outline-none",
                  isOverflowActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isOverflowActive ? "bg-primary/10 scale-110 shadow-sm" : "hover:bg-muted/40"
                )}>
                  <MoreHorizontal className={cn("h-5 w-5", isOverflowActive ? "stroke-[2.5px] text-primary" : "stroke-2")} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold leading-tight truncate w-full text-center px-0.5",
                  isOverflowActive ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  Más
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-48 mb-2 p-1.5 shadow-2xl rounded-2xl border-2">
              {overflowItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer font-medium text-xs my-0.5",
                      isActive ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}


