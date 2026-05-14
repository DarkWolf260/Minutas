import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalConfig } from '@/hooks/use-global-config';
import {
  ArrowLeft,
  Globe,
  ShieldAlert,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function AdminConfigPage() {
  const navigate = useNavigate();
  const { config, loading, updateConfig } = useGlobalConfig();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 animate-pulse">
            Cargando Configuración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      <div className="flex-1 overflow-auto p-4 md:p-8 relative">
        <div className="max-w-[1200px] w-full mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate('/admin')}
                  className="h-8 w-8 rounded-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-8 w-1 bg-primary/20 rounded-full" />
                <h1 className="text-2xl font-bold tracking-tight">Configuración Global</h1>
              </div>
              <p className="text-sm text-muted-foreground ml-10">
                Ajustes maestros que afectan el comportamiento de toda la plataforma.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registro de Usuarios */}
            <Card className="rounded-3xl border-muted/50 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden border-2 hover:border-primary/20">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                <UserPlus className="h-32 w-32 rotate-6" />
              </div>
              
              <CardHeader className="pb-4 relative">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 shadow-inner">
                  <UserPlus className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Seguridad de Acceso</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Controla quién puede unirse a la plataforma y cómo se gestionan los nuevos perfiles.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 relative">
                <Separator className="bg-muted/50" />
                
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/40 group/item hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      Permitir Nuevos Registros
                      {config.allow_registration ? (
                        <Badge variant="outline" className="text-[8px] h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Abierto</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] h-4 bg-amber-500/10 text-amber-600 border-amber-500/20">Cerrado</Badge>
                      )}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
                      Si se desactiva, solo los administradores podrán crear cuentas de usuario manualmente.
                    </p>
                  </div>
                  <Switch
                    checked={config.allow_registration}
                    onCheckedChange={(val) => updateConfig('allow_registration', val)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mantenimiento */}
            <Card className="rounded-3xl border-muted/50 bg-card/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 group overflow-hidden border-2 hover:border-primary/20">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                <ShieldAlert className="h-32 w-32 -rotate-6" />
              </div>

              <CardHeader className="pb-4 relative">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 shadow-inner">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold">Estado del Sistema</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Acciones críticas de emergencia que afectan la disponibilidad inmediata del servicio.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 relative">
                <Separator className="bg-muted/50" />
                
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 group/item hover:bg-amber-500/10 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      Modo Mantenimiento
                      {config.maintenance_mode && (
                        <Badge className="text-[8px] h-4 bg-amber-500 text-white border-none">Activo</Badge>
                      )}
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
                      Bloquea el acceso a todos los usuarios no administrativos para realizar actualizaciones críticas.
                    </p>
                  </div>
                  <Switch
                    checked={config.maintenance_mode}
                    onCheckedChange={(val) => updateConfig('maintenance_mode', val)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
