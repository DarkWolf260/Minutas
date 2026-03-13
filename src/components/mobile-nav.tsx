'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { OnlineStatus } from '@/components/online-status';
import { NotificationBell } from '@/components/notification-bell';
import {
  Menu,
  Mountain,
  Newspaper,
  Settings,
  FileText,
  ClipboardList,
  ClipboardCheck,
  NotebookPen,
  TrendingUp,
  Users,
  History,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Novedades', icon: Newspaper },
  { href: '/orden-del-dia', label: 'Orden del Día', icon: ClipboardList },
  { href: '/reporte-final', label: 'Reporte Final', icon: History },
  { href: '/direcciones', label: 'Direcciones', icon: NotebookPen },
  { href: '/personal', label: 'Personal', icon: Users },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu de navegación</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mountain className="h-4 w-4" />
              </div>
              <span>PC Reportes</span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Menú de navegación principal para acceder a todas las secciones de la aplicación.
            </SheetDescription>
          </SheetHeader>
          <nav className="grid gap-2 text-lg font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-2.5 py-2 rounded-md transition-colors',
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2 font-semibold">
        <Mountain className="h-5 w-5 text-primary" />
        <span className="text-sm">PC Reportes</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <OnlineStatus />
      </div>
    </header>
  );
}
