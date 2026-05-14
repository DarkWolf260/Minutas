import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { 
  ArrowLeft, 
  Globe, 
  ShieldAlert, 
  UserPlus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AjustesGenerales } from '@/components/shared/ajustes-generales';

export default function AdminConfigPage() {
  const navigate = useNavigate();
  const { config, loading, updateConfig } = useGlobalConfig();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-progress w-full" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            Cargando Configuración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="p-4 md:p-8 border-b bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuración Global</h1>
            <p className="text-sm text-muted-foreground">
              Ajustes generales que afectan a toda la plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto grid gap-6">
          
          {/* Access and Security */}
          <Card className="rounded-3xl border-muted/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Acceso y Seguridad</CardTitle>
                  <CardDescription>Control de registros y disponibilidad del sistema.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base font-bold">Permitir Nuevos Registros</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Habilita o deshabilita el formulario de registro para nuevos usuarios.
                  </p>
                </div>
                <Switch 
                  checked={config.allow_registration}
                  onCheckedChange={(checked) => updateConfig('allow_registration', checked)}
                />
              </div>
              
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <Label className="text-base font-bold">Modo Mantenimiento</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Muestra un mensaje de mantenimiento y restringe el uso de la app.
                  </p>
                </div>
                <Switch 
                  checked={config.maintenance_mode}
                  onCheckedChange={(checked) => updateConfig('maintenance_mode', checked)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Institutional Values (Ajustes Generales) */}
          <AjustesGenerales />

          {/* More coming soon... */}
          <div className="text-center p-8 border-2 border-dashed rounded-3xl opacity-50">
            <p className="text-sm text-muted-foreground">Próximamente: Configuración de colores, logos y gestión de módulos.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
