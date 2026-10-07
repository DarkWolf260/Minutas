import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChevronLeft,
  Globe,
  FileText,
  ClipboardCheck,
  Activity,
  Truck,
  AlertTriangle,
  GraduationCap,
  Presentation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TEMPLATE_LIST = [
  { name: 'Guardia preventiva',                  icon: ClipboardCheck, color: 'text-blue-500' },
  { name: 'Recorrido preventivo',                icon: Globe,          color: 'text-emerald-500' },
  { name: 'Atención prehospitalaria',            icon: Activity,       color: 'text-rose-500' },
  { name: 'Atención prehospitalaria y traslado', icon: Truck,          color: 'text-amber-500' },
  { name: 'Accidente de tránsito',               icon: AlertTriangle,  color: 'text-orange-500' },
  { name: 'Capacitación',                        icon: GraduationCap,  color: 'text-purple-500' },
  { name: 'Sesión educativa',                    icon: Presentation,   color: 'text-indigo-500' },
];

export default function AboutTemplatesPage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Sticky Top Header */}
      <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/settings/about">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Catálogo de Plantillas
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Reportes operativos actualmente soportados en el sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          <Card className="shadow-xs border-muted/60 overflow-hidden">
            <CardHeader className="bg-muted/5 border-b pb-3">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Plantillas disponibles
              </CardTitle>
              <CardDescription>
                Formatos optimizados y listos para usar en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATE_LIST.map((template, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3.5 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-colors group"
                  >
                    <div className={cn('p-2 rounded-lg bg-background shadow-xs border group-hover:scale-105 transition-transform', template.color)}>
                      <template.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm">{template.name}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-dashed text-center space-y-1.5 bg-muted/5">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Próximamente</p>
                <p className="text-xs sm:text-sm text-muted-foreground text-balance">Continuamos trabajando en la digitalización de más formatos operativos.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
