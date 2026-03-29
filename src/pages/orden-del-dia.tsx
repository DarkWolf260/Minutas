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
import { Eye, Play, Lock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { OrdenDelDiaForm } from '@/components/orden-del-dia';

export default function OrdenDelDiaPage() {
  const { guards, isLoaded: guardsLoaded } = useGuards();
  const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
  const { isLoaded: rolesLoaded } = useRoles();

  const [selectedGuardId, setSelectedGuardId] = useState<string>('');
  const [periodo, setPeriodo] = useState('');
  const formRef = useRef<{ generateOrder: () => void }>(null);

  useEffect(() => {
    if (settingsLoaded) {
      if (settings.guardPeriod) {
        setPeriodo(settings.guardPeriod);
      } else {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDate = (date: Date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        setPeriodo(`${formatDate(today)} AL ${formatDate(tomorrow)}`);
      }
    }
  }, [settingsLoaded, settings.guardPeriod]);

  // Sync selectedGuardId with the active guard from settings
  useEffect(() => {
    if (
      settingsLoaded &&
      settings.activeGuardId &&
      selectedGuardId !== settings.activeGuardId &&
      guardsLoaded &&
      guards.some((g) => g.id === settings.activeGuardId)
    ) {
      setSelectedGuardId(settings.activeGuardId);
    }
  }, [settings, settingsLoaded, guards, guardsLoaded, selectedGuardId]);

  const handleActiveGuardChange = (guardId: string) => {
    if (!guardId) return;
    setSelectedGuardId(guardId);
    saveSettings({ ...settings, activeGuardId: guardId });
  };

  const selectedGuardForForm = guards.find((g) => g.id === selectedGuardId);
  const isGuardOpen = settings.isGuardOpen || false;

  const handleOpenGuard = () => {
    if (!selectedGuardId) return;
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
    <ScrollArea className="h-full w-full" type="always">
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1700px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orden del Día</h1>
          <p className="text-muted-foreground">
            Genera el reporte diario de operaciones para la guardia activa.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-wrap items-end gap-4">
            <div className="space-y-2 max-w-xs flex-1 min-w-[200px]">
              <Label
                htmlFor="guard-select"
                className="text-xs uppercase font-bold text-muted-foreground"
              >
                Guardia Activa Actual
              </Label>
              <Select 
                value={selectedGuardId} 
                onValueChange={handleActiveGuardChange}
                disabled={isGuardOpen}
              >
                <SelectTrigger id="guard-select" className={`h-10 ${isGuardOpen ? 'bg-muted opacity-80' : 'bg-background'}`}>
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
                className="text-xs uppercase font-bold text-muted-foreground"
              >
                Periodo
              </Label>
              <Input
                id="periodo"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                disabled={isGuardOpen}
                className={`h-10 ${isGuardOpen ? 'bg-muted opacity-80' : 'bg-background'}`}
                placeholder="Ej: 28/03/2026 AL 29/03/2026"
              />
            </div>
            <div className="flex items-center gap-3 pb-0.5 ml-auto">
              {isGuardOpen ? (
                <Badge variant="outline" className="h-10 px-4 gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-wider animate-pulse">
                  <CheckCircle2 className="h-4 w-4" />
                  Guardia Activa
                </Badge>
              ) : (
                <Button 
                  onClick={handleOpenGuard}
                  disabled={!selectedGuardId}
                  className="gap-2 h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Abrir Guardia
                </Button>
              )}
              
              <Button 
                onClick={() => formRef.current?.generateOrder()} 
                disabled={!selectedGuardId}
                variant="outline"
                className="gap-2 h-10 px-6 shadow-sm hover:shadow-md transition-all active:scale-95 border-primary/20 hover:bg-primary/5"
              >
                <Eye className="h-4 w-4" />
                Generar Orden
              </Button>
            </div>
          </div>

          {selectedGuardId ? (
            <OrdenDelDiaForm
              ref={formRef}
              selectedGuard={selectedGuardId}
              initialData={selectedGuardForForm?.staff}
              periodo={periodo}
            />
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
              <p className="text-muted-foreground">
                Por favor, selecciona una guardia para empezar.
              </p>
              {guards.length === 0 && (
                <p className="text-xs mt-2">
                  No hay guardias definidas. Ve a{' '}
                  <Link to="/personal" className="text-primary font-bold hover:underline">
                    Gestión de Personal
                  </Link>{' '}
                  para crearlas.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
