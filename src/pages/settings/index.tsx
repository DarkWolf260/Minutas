import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AjustesGenerales } from '@/components/shared/ajustes-generales';
import { useSettings } from '@/hooks/use-settings';
import { useUnits } from '@/hooks/use-units';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useUser } from '@/components/providers/user-provider';
import { useWorkspaceManager } from '@/lib/db/db-context';
import {
  User,
  Layers,
  FileText,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Settings2,
  MapPin,
  Info,
  Wifi,
  MessageSquarePlus,
  LayoutGrid,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SettingsPage() {
  const { isLoaded: unitsLoaded } = useUnits();
  const { isLoaded: rolesLoaded } = useRoles();
  const { isLoaded: deptsLoaded } = useDepartments();
  const { isLoaded: settingsLoaded } = useSettings();
  const { isLoaded: definitionsLoaded } = useFieldDefinitions();
  const { isAdmin } = useUser();
  const { isCloud } = useWorkspaceManager();

  const isLoaded = unitsLoaded && rolesLoaded && deptsLoaded && settingsLoaded && definitionsLoaded;
  const isDataRestricted = isCloud && !isAdmin;

  if (!isLoaded) {
    return (
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 h-[600px]">
            <Skeleton className="h-full w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-5 h-[600px]">
            <Skeleton className="h-full w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background overflow-y-auto md:overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-24 md:pb-6 flex flex-col h-auto md:h-full min-h-0">
        <div className="shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          </div>
          <p className="text-muted-foreground">
            Gestiona las preferencias de la aplicación y el área de trabajo activa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch md:items-start flex-1 min-h-0 mt-8 overflow-y-auto md:overflow-hidden pb-8 md:pb-0">
          {/* Lado Izquierdo: Ajustes Generales */}
          <div className="lg:col-span-7 h-auto md:h-full flex flex-col min-h-0">
            <AjustesGenerales />
          </div>

          {/* Lado Derecho: Otros Ajustes */}
          <div className="lg:col-span-5 flex flex-col h-auto md:h-full min-h-0">

            {/* Tarjeta Consolidada: Otros Ajustes */}
            <Card className="border shadow-sm bg-card flex flex-col h-full min-h-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Otros ajustes
                </CardTitle>
                <CardDescription>
                  Configuración de módulos, plantillas, sincronización y mantenimiento de datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                <ScrollArea className="flex-1" type="hover">
                  <div className="space-y-2 p-4 pt-0">

                    <Link
                      to="/settings/modules"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <LayoutGrid className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Módulos</p>
                          <p className="text-xs text-muted-foreground">Activa o desactiva secciones de la aplicación</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>

                    <Link
                      to="/settings/workspaces"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Áreas de Trabajo</p>
                          <p className="text-xs text-muted-foreground">Gestiona entornos locales independientes múltiples</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>

                    <Link
                      to="/plantillas"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Plantillas de Reporte</p>
                          <p className="text-xs text-muted-foreground">Crear, editar y gestionar plantillas</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>

                    <Link
                      to="/settings/direcciones"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Gestor de Direcciones</p>
                          <p className="text-xs text-muted-foreground">Administrar ubicaciones y puntos de interés</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>

                    <Link
                      to="/settings/sync"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                          <Wifi className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Sincronización</p>
                          <p className="text-xs text-muted-foreground">Enviar reportes entre dispositivos en tiempo real</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>

                    <Link
                      to="/settings/feedback"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <MessageSquarePlus className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Enviar Comentarios</p>
                          <p className="text-xs text-muted-foreground">Sugerencias, errores o cualquier opinión</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>

                    {isDataRestricted ? (
                      <div
                        className="flex items-center justify-between p-3 rounded-lg border opacity-50 cursor-not-allowed group bg-muted/20"
                        title="Solo los administradores pueden borrar datos en áreas de la nube"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-destructive">Borrar datos de la app</p>
                              <span className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground font-bold uppercase tracking-widest">Bloqueado</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Acción restringida por administración</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <Link
                        to="/settings/borrar-datos"
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-destructive">Borrar datos de la app</p>
                            <p className="text-xs text-muted-foreground">Acciones irreversibles y limpieza</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                      </Link>
                    )}

                    <Link
                      to="/settings/about"
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                          <Info className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Acerca de</p>
                          <p className="text-xs text-muted-foreground">Información, versión y créditos</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>

                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

