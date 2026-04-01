import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { GlobalTagsManager } from '@/components/global-tags-manager';
import { useSettings } from '@/hooks/use-settings';
import { useUnits } from '@/hooks/use-units';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import {
  User,
  Zap,
  Database,
  Plus,
  Trash2,
  Layers,
  FileText,
  ChevronRight,
  AlertTriangle,
  Settings2,
  MapPin,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SettingsPage() {
  const { isLoaded: unitsLoaded } = useUnits();
  const { isLoaded: rolesLoaded } = useRoles();
  const { isLoaded: deptsLoaded } = useDepartments();
  const { isLoaded: settingsLoaded } = useSettings();

  const isLoaded = unitsLoaded && rolesLoaded && deptsLoaded && settingsLoaded;

  if (!isLoaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
        <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
        <Skeleton className="h-48 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-32 sm:pb-16 space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las preferencias de la aplicación y el área de trabajo activa.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Lado Izquierdo: Ajustes Generales */}
          <div className="lg:col-span-7">
            <GlobalTagsManager />
          </div>

          {/* Lado Derecho: Otros Ajustes */}
          <div className="lg:col-span-5 space-y-8">
            {/* Tarjeta Consolidad: Otros Ajustes */}
            <Card className="shadow-lg border-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Otros ajustes
                </CardTitle>
                <CardDescription>
                  Configuración de plantillas, sincronización y mantenimiento de datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link
                  to="/settings/workspaces"
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Áreas de Trabajo</p>
                      <p className="text-xs text-muted-foreground">Gestiona entornos locales independientes múltiples</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>

                <div
                  title="Función futura..."
                  className="flex items-center justify-between p-4 rounded-lg border opacity-50 cursor-not-allowed group bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Perfil de Usuario</p>
                        <span className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground font-bold">PRÓXIMAMENTE</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Administra tu identidad local y firma</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <Link
                  to="/plantillas"
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Plantillas de Reporte</p>
                      <p className="text-xs text-muted-foreground">Crear, editar y gestionar plantillas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>

                <Link
                  to="/settings/direcciones"
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Gestor de Direcciones</p>
                      <p className="text-xs text-muted-foreground">Administrar ubicaciones y puntos de interés</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>



                <Link
                  to="/settings/borrar-datos"
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-destructive">Borrar datos de la app</p>
                      <p className="text-xs text-muted-foreground">Acciones irreversibles y limpieza</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                </Link>

                <Link
                  to="/settings/about"
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                      <Info className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Acerca de</p>
                      <p className="text-xs text-muted-foreground">Información, versión y créditos</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
