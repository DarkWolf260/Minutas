import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChevronLeft,
  ChevronRight,
  Info,
  BookOpen,
  ListChecks,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { APP_VERSION } from './about/data';

const ABOUT_MODULES = [
  {
    to: '/settings/about/app',
    icon: Info,
    color: 'bg-slate-500/10 text-slate-600',
    title: 'Aplicación',
    desc: 'Información sobre la versión, tecnología y créditos.',
  },
  {
    to: '/settings/about/guide',
    icon: BookOpen,
    color: 'bg-green-500/10 text-green-600',
    title: 'Guía de uso',
    desc: 'Flujo de trabajo recomendado para empezar a usar Minutas.',
  },
  {
    to: '/settings/about/changelog',
    icon: ListChecks,
    color: 'bg-primary/10 text-primary',
    title: 'Historial de Cambios',
    desc: 'Novedades, mejoras y correcciones por versión.',
  },
  {
    to: '/settings/about/templates',
    icon: FileText,
    color: 'bg-amber-500/10 text-amber-600',
    title: 'Catálogo de Plantillas',
    desc: 'Reportes operativos actualmente disponibles en el sistema.',
  },
];

export default function SettingsAboutPage() {
  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/settings" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Acerca de</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Versión {APP_VERSION} · Información y recursos de la aplicación.
            </p>
          </div>
        </div>

        {/* Module list */}
        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Secciones</CardTitle>
            <CardDescription>Selecciona una sección para ver más detalles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {ABOUT_MODULES.map(({ to, icon: Icon, color, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
