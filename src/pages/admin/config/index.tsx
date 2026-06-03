import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGlobalConfig } from '@/hooks/use-global-config';
import {
  ChevronLeft,
  ShieldAlert,
  UserPlus,
  Loader2,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MODULE_DEFS } from '@/pages/settings/modules';

export default function AdminConfigPage() {
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
    <div className="flex flex-col min-h-screen bg-background overflow-y-auto custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1700px] mx-auto flex flex-col gap-8">
        
        {/* CABECERA (ESTÁNDAR APP) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight">Configuración Global</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Ajustes maestros que afectan el comportamiento de toda la plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registro de Usuarios */}
          <Card className="group shadow-md border-primary/10 hover:border-primary/30 overflow-hidden relative bg-card/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
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
          <Card className="group shadow-md border-primary/10 hover:border-primary/30 overflow-hidden relative bg-card/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
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

        {/* Módulos para Administradores */}
        <Card className="group shadow-md border-primary/10 hover:border-primary/30 overflow-hidden relative bg-card/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
            <LayoutGrid className="h-32 w-32 rotate-6" />
          </div>
          
          <CardHeader className="pb-4 relative">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-4 shadow-inner">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Módulos para Administradores</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Elige qué módulos están disponibles de forma global en la navegación de todos los usuarios administradores.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 relative">
            <Separator className="bg-muted/50" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULE_DEFS.map(({ id, label, description, icon: Icon, color }) => {
                const disabled_modules_admins = config.disabled_modules_admins || [];
                const enabled = !disabled_modules_admins.includes(id);
                const locked = id === 'novedades';

                const toggleModule = () => {
                  const next = disabled_modules_admins.includes(id)
                    ? disabled_modules_admins.filter((m: string) => m !== id)
                    : [...disabled_modules_admins, id];
                  updateConfig('disabled_modules_admins', next);
                };

                return (
                  <div
                    key={id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-2xl border transition-all duration-300',
                      enabled 
                        ? 'bg-card border-muted/40 hover:bg-muted/10' 
                        : 'bg-muted/10 border-muted/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity',
                        color,
                        !enabled && 'opacity-40'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className={cn('transition-opacity', !enabled && 'opacity-40')}>
                        <p className="text-sm font-semibold leading-tight">{label}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{description}</p>
                      </div>
                      {locked && (
                        <span className="text-[9px] font-bold uppercase tracking-wide bg-muted border px-1.5 py-0.5 rounded text-muted-foreground ml-1">
                          Requerido
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={toggleModule}
                      disabled={locked}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
