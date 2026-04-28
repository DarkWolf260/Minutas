import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Info, BookOpen, ListChecks, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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

export const AboutModuleList = () => {
  return (
    <Card className="shadow-lg border-muted/50 rounded-2xl overflow-hidden">
      <CardHeader className="bg-muted/5 border-b">
        <CardTitle className="text-base font-bold tracking-tight">Secciones</CardTitle>
        <CardDescription className="text-xs">Selecciona una sección para ver más detalles.</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-2">
        {ABOUT_MODULES.map(({ to, icon: Icon, color, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-muted-foreground/10 hover:bg-muted/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">{title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
