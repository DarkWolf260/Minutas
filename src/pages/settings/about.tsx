import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Coffee, 
  Code2, 
  Globe, 
  Database, 
  FileText, 
  ClipboardCheck, 
  Activity, 
  Truck, 
  AlertTriangle, 
  GraduationCap, 
  Presentation 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function SettingsAboutPage() {
  const appVersion = '1.0.0';

  const templates = [
    { name: 'Guardia preventiva', icon: ClipboardCheck, color: 'text-blue-500' },
    { name: 'Recorrido preventivo', icon: Globe, color: 'text-emerald-500' },
    { name: 'Atención prehospitalaria', icon: Activity, color: 'text-rose-500' },
    { name: 'Atención prehospitalaria y traslado', icon: Truck, color: 'text-amber-500' },
    { name: 'Accidente de tránsito', icon: AlertTriangle, color: 'text-orange-500' },
    { name: 'Capacitación', icon: GraduationCap, color: 'text-purple-500' },
    { name: 'Sesión educativa', icon: Presentation, color: 'text-indigo-500' },
  ];

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-8">
        {/* Header with Standard Back Button */}
        <div className="flex items-center gap-4 mb-2">
          <Link to="/settings" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Acerca de</h1>
            <p className="text-muted-foreground mt-1 text-sm">Información sobre la aplicación y su desarrollo.</p>
          </div>
        </div>

        <Tabs defaultValue="app" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="app" className="font-bold">Aplicación</TabsTrigger>
            <TabsTrigger value="templates" className="font-bold">Plantillas</TabsTrigger>
          </TabsList>

          <TabsContent value="app" className="mt-0 space-y-8 outline-none">
            <Card className="shadow-lg border-muted/50 overflow-hidden">
              <CardHeader className="text-center pb-2 bg-muted/20">
                <div className="mx-auto bg-white rounded-2xl h-20 w-20 flex items-center justify-center mb-4 shadow-xl shadow-black/10 rotate-3 overflow-hidden border p-4">
                  <img
                    src="/icons/icon-192x192.png"
                    alt="App Logo"
                    className="h-full w-full object-contain"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
                <CardTitle className="text-3xl font-black tracking-tighter uppercase">PC Reportes</CardTitle>
                <CardDescription className="font-bold text-primary/70">Versión {appVersion}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-8">
                <div className="text-center space-y-4 max-w-lg mx-auto">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Una herramienta diseñada para profesionales que necesitan agilizar la generación de reportes operativos,
                    manteniendo la integridad de los datos localmente y funcionando con total independencia.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Database className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Base de Datos</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Almacenamiento local avanzado con <strong>RxDB</strong>. Tus datos nunca salen de tu dispositivo sin tu permiso.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Globe className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Multiplataforma</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Funciona como una <strong>PWA</strong>. Instálala en tu móvil o escritorio y utilízala sin conexión a internet.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Code2 className="h-4 w-4" />
                    <h3 className="font-bold text-sm uppercase tracking-widest">Nota del Desarrollador</h3>
                  </div>
                  <blockquote className="relative p-6 rounded-2xl bg-muted/30 border-l-4 border-primary">
                    <p className="italic text-sm text-muted-foreground leading-relaxed">
                      "Esta aplicación fue hecha con la flojera que me daba seguir editando en Word las
                      minutas, un esclavo de IA y bastante paciencia para explicarle al esclavo toda la
                      lógica que me saqué del forro para que funcione esta aplicación en un lenguaje y framework
                      de los cuales ni me molesté en aprender su sintaxis."
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <div className="h-px flex-1 bg-muted-foreground/10" />
                      <Coffee className="h-4 w-4 text-amber-600/50" />
                      <div className="h-px flex-1 bg-muted-foreground/10" />
                    </div>
                  </blockquote>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest">
                    © 2026 Rubén Rojas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-0 outline-none">
            <Card className="shadow-lg border-muted/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Catálogo de Plantillas
                </CardTitle>
                <CardDescription>
                  Reportes operativos actualmente soportados y optimizados para el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                {templates.map((template, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-4 p-4 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-colors group"
                  >
                    <div className={cn("p-2 rounded-lg bg-background shadow-sm border group-hover:scale-110 transition-transform", template.color)}>
                      <template.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm sm:text-base">{template.name}</span>
                  </div>
                ))}
                <div className="mt-6 p-4 rounded-xl border border-dashed text-center space-y-2 bg-muted/5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Próximamente</p>
                  <p className="text-sm text-balance">Continuamos trabajando en la digitalización de más formatos operativos.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
