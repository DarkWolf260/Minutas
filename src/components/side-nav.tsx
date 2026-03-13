'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useP2P } from '@/lib/db/p2p-provider';
import { NotificationBell } from '@/components/notification-bell';

const navItems = [
  { href: '/', label: 'Novedades', icon: Newspaper },
  { href: '/orden-del-dia', label: 'Orden del Día', icon: ClipboardList },
  { href: '/reporte-final', label: 'Reporte Final', icon: History },
  { href: '/direcciones', label: 'Direcciones', icon: NotebookPen },
  { href: '/personal', label: 'Personal', icon: Users },
];

export function SideNav() {
  const pathname = usePathname();
  const { isSyncing, peerCount } = useP2P();

  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-card sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Mountain className="h-4 w-4 transition-all group-hover:scale-110" />
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
                  href={item.href}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8',
                  pathname === '/settings' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Configuración</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Configuración</TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </nav>
      </aside>
    </TooltipProvider>
  );
}
