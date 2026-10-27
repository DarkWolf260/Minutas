import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS } from './data';

export default function AboutGuidePage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          <Card className="shadow-xs border-muted/60 overflow-hidden">
            <CardHeader className="bg-muted/5 border-b pb-3">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Flujo de Trabajo
              </CardTitle>
              <CardDescription>
                Sigue estos pasos en orden para poner en marcha tu primera guardia.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
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
    </div>
  );
}
