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
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/settings/about" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catálogo de Plantillas</h1>
            <p className="text-muted-foreground text-sm">Reportes operativos actualmente soportados.</p>
          </div>
        </div>

        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Plantillas disponibles
            </CardTitle>
            <CardDescription>
              Formatos optimizados y listos para usar en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {TEMPLATE_LIST.map((template, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-colors group"
              >
                <div className={cn('p-2 rounded-lg bg-background shadow-sm border group-hover:scale-110 transition-transform', template.color)}>
                  <template.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-sm sm:text-base">{template.name}</span>
              </div>
            ))}
            <div className="mt-4 p-4 rounded-xl border border-dashed text-center space-y-2 bg-muted/5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Próximamente</p>
              <p className="text-sm text-balance">Continuamos trabajando en la digitalización de más formatos operativos.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
