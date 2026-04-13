import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, Play, Lock, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { OrdenDelDiaForm } from '@/components/orden-del-dia/index';

export default function OrdenDelDiaPage() {
  const { guards, isLoaded: guardsLoaded } = useGuards();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { isLoaded: rolesLoaded } = useRoles();

  const [selectedGuardId, setSelectedGuardId] = useState<string>('');
  const [periodo, setPeriodo] = useState('');
  const formRef = useRef<{ generateOrder: () => void }>(null);
  const lastSavedSettings = useRef<{ activeGuardId?: string, guardPeriod?: string }>({});

  useEffect(() => {
    if (settingsLoaded) {
      const globalPeriod = settings.guardPeriod || '';
      
      // Default to auto-calculated period if no period is set in settings
      let fallbackPeriod = '';
      if (!globalPeriod) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDate = (date: Date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };
        fallbackPeriod = `${formatDate(today)} AL ${formatDate(tomorrow)}`;
      }

      const effectivePeriod = globalPeriod || fallbackPeriod;

      // Only sync if different from OUR last saved value
      if (lastSavedSettings.current.guardPeriod !== globalPeriod) {
        setPeriodo(effectivePeriod);
        lastSavedSettings.current.guardPeriod = globalPeriod;
      }
    }
  }, [settingsLoaded, settings.guardPeriod]);

  // Sync selectedGuardId with the active guard from settings
  useEffect(() => {
    if (
      settingsLoaded &&
      settings.activeGuardId &&
      guardsLoaded &&
      guards.some((g) => g.id === settings.activeGuardId)
    ) {
      // Only sync if different from OUR last saved value
      if (lastSavedSettings.current.activeGuardId !== settings.activeGuardId) {
        setSelectedGuardId(settings.activeGuardId);
        lastSavedSettings.current.activeGuardId = settings.activeGuardId;
      }
    }
  }, [settings.activeGuardId, settingsLoaded, guards, guardsLoaded]);

  const handleActiveGuardChange = (guardId: string) => {
    if (!guardId) return;
    setSelectedGuardId(guardId);
    lastSavedSettings.current.activeGuardId = guardId;
    saveSettings({ ...settings, activeGuardId: guardId });
  };

  const selectedGuardForForm = guards.find((g) => g.id === selectedGuardId);
  const isGuardOpen = settings.isGuardOpen || false;

  const handleOpenGuard = () => {
    if (!selectedGuardId) return;
    lastSavedSettings.current.activeGuardId = selectedGuardId;
    lastSavedSettings.current.guardPeriod = periodo;
    saveSettings({ isGuardOpen: true, activeGuardId: selectedGuardId, guardPeriod: periodo });
  };
  const isLoaded = guardsLoaded && rolesLoaded && settingsLoaded;

  if (!isLoaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-full max-w-sm mx-auto mb-4" />
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen md:h-full bg-background overflow-y-auto md:overflow-hidden relative">
      <div className="flex-1 flex flex-col md:h-full md:overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1700px] mx-auto md:h-full flex flex-col gap-6 min-h-0 pb-32 sm:pb-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4">
              <Link to="/" className="shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">Orden del Día</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Genera el reporte diario de operaciones para la guardia activa.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {isGuardOpen && (
                <Badge variant="outline" className="hidden md:flex h-9 px-4 gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-wider animate-pulse rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  Guardia Activa
                </Badge>
              )}
              <Button 
                onClick={() => formRef.current?.generateOrder()} 
                disabled={!selectedGuardId}
                size="sm"
                className="hidden sm:flex gap-2 shadow-sm font-bold"
              >
                <Eye className="h-4 w-4" />
                Generar Orden
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 shrink-0">
            <Card className="md:col-span-12 shadow-sm border-muted/60 overflow-hidden">
              <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Configuración de la Guardia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-wrap items-end gap-6">
                <div className="space-y-2 max-w-xs flex-1 min-w-[200px]">
                  <Label
                    htmlFor="guard-select"
                    className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
                  >
                    Guardia de Turno
                  </Label>
                  <Select 
                    value={selectedGuardId} 
                    onValueChange={handleActiveGuardChange}
                    disabled={isGuardOpen}
                  >
                    <SelectTrigger id="guard-select" className={`h-10 rounded-lg shadow-sm ${isGuardOpen ? 'bg-muted opacity-80' : 'bg-background'}`}>
                      <SelectValue placeholder="Selecciona una guardia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {guards.map((guard) => (
                        <SelectItem key={guard.id} value={guard.id}>
                          Guardia "{guard.id}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-w-xs flex-1 min-w-[200px]">
                  <Label
                    htmlFor="periodo"
                    className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
                  >
                    Periodo de Operaciones
                  </Label>
                  <Input
                    id="periodo"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    disabled={isGuardOpen}
                    className={`h-10 rounded-lg shadow-sm ${isGuardOpen ? 'bg-muted opacity-80' : 'bg-background'}`}
                    placeholder="Ej: 28/03/2026 AL 29/03/2026"
                  />
                </div>
                {!isGuardOpen && (
                  <Button 
                    onClick={handleOpenGuard}
                    disabled={!selectedGuardId}
                    size="sm"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold ml-auto"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Abrir Nueva Guardia
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 min-h-0">
            {selectedGuardId ? (
              <div className="h-full">
                <OrdenDelDiaForm
                  ref={formRef}
                  selectedGuard={selectedGuardId}
                  initialData={selectedGuardForForm?.staff}
                  periodo={periodo}
                />
              </div>
            ) : (
              <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-muted/20 border-muted/50 transition-all hover:bg-muted/30 h-full flex flex-col items-center justify-center">
                <div className="bg-muted p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-lg font-bold mb-1">Esperando Selección</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto text-center px-4">
                  Por favor, selecciona una guardia en el panel superior para cargar el formulario de operaciones.
                </p>
                {guards.length === 0 && (
                  <div className="mt-6">
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link to="/personal">
                        Configurar Guardias en Personal
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button for Generating Order */}
      <div className="sm:hidden fixed bottom-24 right-6 z-50 animate-in fade-in zoom-in duration-300 ease-out">
        <Button
          onClick={() => formRef.current?.generateOrder()}
          disabled={!selectedGuardId}
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary-foreground/10 hover:scale-105 active:scale-95 transition-all duration-300"
          title="Generar Orden del Día"
        >
          <Eye className="h-7 w-7" />
        </Button>
      </div>
    </div>
  );
}
