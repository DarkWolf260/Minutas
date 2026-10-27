import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Globe,
  FileText,
  ClipboardCheck,
  Activity,
  Truck,
  AlertTriangle,
  GraduationCap,
  Presentation,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

              <div className="p-4 rounded-xl border border-border/60 text-center space-y-1 bg-muted/20">
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
