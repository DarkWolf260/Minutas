import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Newspaper,
  Users,
  ClipboardList,
  History,
  BarChart2,
  FileText,
  CalendarClock,
} from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useAdmin } from '@/hooks/use-admin';
import { useGlobalConfig } from '@/hooks/use-global-config';
import type { AppModuleId } from '@/lib/types';

const ALL_NAV_ITEMS: { href: string; label: string; icon: any; moduleId: AppModuleId }[] = [
  { href: '/',              label: 'Novedades',    icon: Newspaper,    moduleId: 'novedades' },
  { href: '/orden-del-dia', label: 'Lista',        icon: ClipboardList, moduleId: 'orden-del-dia' },
  { href: '/actividades',   label: 'Tablón',       icon: CalendarClock, moduleId: 'actividades' },
  { href: '/reporte-final', label: 'Reporte',      icon: History,      moduleId: 'reporte-final' },
  { href: '/estadisticas',  label: 'Estadísticas', icon: BarChart2,    moduleId: 'estadisticas' },
  { href: '/personal',      label: 'Personal',     icon: Users,        moduleId: 'personal' },
  { href: '/plantillas',    label: 'Plantillas',   icon: FileText,     moduleId: 'plantillas' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const { settings } = useSettings();
  const { isAdmin } = useAdmin();
  const { config: globalConfig } = useGlobalConfig();

  const disabled_modules = [
    ...(settings.disabled_modules || []),
    ...(isAdmin ? (globalConfig.disabled_modules_admins || []) : [])
  ];
  const navItems = ALL_NAV_ITEMS.filter((item) => !disabled_modules.includes(item.moduleId));

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t pb-safe">
      <div className="flex items-center justify-between h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 gap-1 px-0.5 min-w-0",
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              </div>
              <span className={cn(
                "text-[9px] font-medium leading-none truncate w-full text-center px-1",
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

