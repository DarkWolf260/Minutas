import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Coffee, Code2, Globe, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { APP_VERSION } from './data';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePwa } from '@/components/providers/pwa-provider';

export default function AboutAppPage() {
  const { checkForUpdates, checkingForUpdates, updateServiceWorker } = usePwa();

  const handleCheckUpdates = async () => {
    try {
      const updateFound = await checkForUpdates();
      if (updateFound) {
        toast.info('¡Nueva versión encontrada!', {
          description: 'Hay una nueva versión disponible para instalar.',
          action: {
            label: 'Actualizar',
            onClick: () => updateServiceWorker(true)
          },
          duration: 10000,
        });
      } else {
        toast.success('Todos los componentes están actualizados', {
          description: `Versión actual: ${APP_VERSION}`,
          action: {
            label: 'Cerrar',
            onClick: () => {}
          },
        });
      }
    } catch (error) {
      console.error('Error al comprobar actualizaciones:', error);
      toast.error('No se pudo comprobar si hay actualizaciones', {
        description: 'Por favor, comprueba tu conexión a internet e inténtalo de nuevo.',
      });
    }
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Aplicación</h1>
            <p className="text-muted-foreground text-sm">Información sobre Minutas y su desarrollo.</p>
          </div>
        </div>

        <Card className="shadow-lg border-muted/50 overflow-hidden">
          <CardHeader className="text-center pb-6 bg-muted/20 space-y-4">
            <div className="mx-auto bg-white rounded-2xl h-20 w-20 flex items-center justify-center shadow-xl shadow-black/10 rotate-3 overflow-hidden border p-4">
              <img
                src="/icons/icon-192x192.png"
                alt="App Logo"
                className="h-full w-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase">Minutas</CardTitle>
              <CardDescription className="font-bold text-primary/70">Versión {APP_VERSION}</CardDescription>
            </div>

            <div className="pt-2 flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 gap-2 rounded-full px-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group"
                onClick={handleCheckUpdates}
                disabled={checkingForUpdates}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 transition-transform duration-700", checkingForUpdates && "animate-spin")} />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {checkingForUpdates ? 'Buscando actualizaciones...' : 'Buscar actualizaciones'}
                </span>
              </Button>
            </div>
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
                  Almacenamiento reactivo local con <strong>RxDB</strong> y sincronización en la nube opcional mediante <strong>Supabase</strong>.
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-muted/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Multiplataforma</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Funciona como una <strong>PWA</strong>. Instálala en tu móvil o escritorio y utilízala sin conexión.
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
                  "Esta aplicación fue hecha con la flojera que me daba seguir haciendo minutas en Word,
                  un esclavo de inteligencia artificial y bastante paciencia para explicarle a este toda
                  la lógica que me saqué del forro para que funcione esta vaina, todo esto con tecnologías
                  que ni me molesté en averiguar como funcionan"
                </p>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="h-px flex-1 bg-muted-foreground/10" />
                  <Coffee className="h-4 w-4 text-amber-600/50" />
                  <div className="h-px flex-1 bg-muted-foreground/10" />
                </div>
              </blockquote>
            </div>

            <div className="flex items-center justify-center pt-4">
              <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest">
                © 2026 Rubén Rojas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
