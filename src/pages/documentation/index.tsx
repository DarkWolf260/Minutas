import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookUser, Wrench, History, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DocumentationHubPage() {
  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <header className="mb-8 text-center w-full">
          <h1 className="text-4xl font-bold tracking-tight">Centro de Documentación</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Explora las guías y la documentación técnica de la aplicación.
          </p>
        </header>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl font-bold">1</span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <BookUser className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>1. Guía de Usuario</CardTitle>
                  <CardDescription>
                    Aprende a usar la aplicación, desde la gestión de datos hasta la lógica de
                    reportes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Guía detallada sobre guardado de datos, renderizado de reportes y gestión avanzada
                de personal.
              </p>
              <Button asChild>
                <Link to="/documentation/user-guide">
                  Ver Guía <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl font-bold">2</span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 text-blue-500 p-3 rounded-full">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>2. Historial de Cambios</CardTitle>
                  <CardDescription>
                    Registro de nuevas funcionalidades y correcciones de errores.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Consulta qué hay de nuevo en la última versión (v1.6.0) y versiones anteriores.
              </p>
              <Button asChild variant="outline">
                <Link to="/documentation/changelog">
                  Ver Changelog <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl font-bold">3</span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 text-green-500 p-3 rounded-full">
                  <Map className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>3. Hoja de Ruta</CardTitle>
                  <CardDescription>
                    Planificación de futuras características y mejoras del sistema.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Un vistazo a las funcionalidades planificadas y el progreso actual del desarrollo.
              </p>
              <Button asChild variant="outline">
                <Link to="/documentation/roadmap">
                  Ver Roadmap <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-8xl font-bold">4</span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 text-accent-foreground p-3 rounded-full">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>4. Documentación Técnica</CardTitle>
                  <CardDescription>
                    Inmersión profunda en el motor de plantillas y arquitectura.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explicación técnica del archivo `template-parser.ts` y la lógica de análisis.
              </p>
              <Button asChild variant="secondary">
                <Link to="/documentation/template-engine">
                  Ver Documentación <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
