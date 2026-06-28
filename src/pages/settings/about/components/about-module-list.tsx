import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Info, BookOpen, ListChecks } from 'lucide-react';
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
];

export const AboutModuleList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ABOUT_MODULES.map(({ to, icon: Icon, color, title, desc }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col justify-between p-5 rounded-2xl border bg-card hover:border-primary/30 hover:bg-muted/5 transition-all group shadow-sm hover:shadow-md h-full"
        >
          <div className="space-y-4">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-base tracking-tight">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-4 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            <span>Ver más</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </Link>
      ))}
    </div>
  );
};
