import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS } from './data';

export default function AboutGuidePage() {
  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/settings/about" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Guía de uso</h1>
            <p className="text-muted-foreground text-sm">Pasos recomendados para empezar a trabajar con Minutas.</p>
          </div>
        </div>

        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Flujo de Trabajo
            </CardTitle>
            <CardDescription>
              Sigue estos pasos en orden para poner en marcha tu primera guardia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {WORKFLOW_STEPS.map(({ icon: Icon, color, title, desc, link, linkLabel }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1 flex-1">
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  <Link to={link}>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary mt-1">
                      {linkLabel} →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
              💡 <strong className="text-foreground">Consejo:</strong> Si quieres volver a ver el asistente de configuración inicial,
              borra los datos de la app desde{' '}
              <Link to="/settings/borrar-datos" className="text-primary underline underline-offset-2">
                Configuración → Borrar datos
              </Link>.
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
