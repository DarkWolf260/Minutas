'use client';

/**
 * GuardSelector — Componente reutilizable para seleccionar y abrir una guardia.
 *
 * Se usa como panel inline en cualquier módulo cuando no hay guardia activa,
 * permitiendo al usuario abrir una guardia sin tener que ir a Orden del Día.
 *
 * Props:
 *  - compact: muestra versión pequeña (para banners/tarjetas informativas)
 *  - showPeriod: muestra el campo de periodo (default true)
 */

import { Play, CheckCircle2, Lock, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveGuard } from '@/hooks/use-active-guard';
import { Link } from 'react-router-dom';

interface GuardSelectorProps {
  /** Muestra versión compacta sin la tarjeta envolvente */
  compact?: boolean;
  /** Muestra el campo de periodo (default: true) */
  showPeriod?: boolean;
  /** Texto alternativo para el botón de acción principal */
  actionLabel?: string;
  /** Callback adicional cuando se abre una guardia */
  onGuardOpened?: () => void;
  /** Si true, muestra un link a Orden del Día en lugar del formulario */
  linkToOrdenDelDia?: boolean;
}

/** Panel completo de selección de guardia con card envolvente */
export function GuardSelector({
  showPeriod = true,
  actionLabel = 'Abrir Nueva Guardia',
  onGuardOpened,
  linkToOrdenDelDia = false,
}: GuardSelectorProps) {
  const {
    guards,
    selectedGuardId,
    setSelectedGuardId,
    periodo,
    setPeriodo,
    isGuardOpen,
    openGuard,
    isLoaded,
  } = useActiveGuard();

  const handleOpen = () => {
    openGuard();
    onGuardOpened?.();
  };

  if (!isLoaded) return null;

  return (
    <Card className="shadow-sm border-muted/60 overflow-hidden">
      <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-primary" />
          Configuración de la Guardia
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-wrap items-end gap-6">
        {/* Guard select */}
        <div className="space-y-2 max-w-xs flex-1 min-w-[200px]">
          <Label
            htmlFor="guard-selector-select"
            className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
          >
            Guardia de Turno
          </Label>
          <Select
            value={selectedGuardId}
            onValueChange={setSelectedGuardId}
            disabled={isGuardOpen}
          >
            <SelectTrigger
              id="guard-selector-select"
              className={`h-10 rounded-lg shadow-sm ${isGuardOpen ? 'bg-muted opacity-80' : 'bg-background'}`}
            >
              <SelectValue placeholder="Selecciona una guardia..." />
            </SelectTrigger>
            <SelectContent>
              {guards.map((guard) => (
                <SelectItem key={guard.id} value={guard.id}>
                  Guardia &quot;{guard.id}&quot;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Periodo */}
        {showPeriod && (
          <div className="space-y-2 max-w-xs flex-1 min-w-[200px]">
            <Label
              htmlFor="guard-selector-period"
              className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
            >
              Periodo de Operaciones
            </Label>
            <Input
              id="guard-selector-period"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={isGuardOpen}
              className={`h-10 rounded-lg shadow-sm ${isGuardOpen ? 'bg-muted opacity-80' : 'bg-background'}`}
              placeholder="Ej: 28/03/2026 AL 29/03/2026"
            />
          </div>
        )}

        {/* Action */}
        <div className="flex items-center gap-3 ml-auto">
          {isGuardOpen ? (
            <Badge
              variant="outline"
              className="h-9 px-4 gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-wider animate-pulse rounded-xl"
            >
              <CheckCircle2 className="h-4 w-4" />
              Guardia Activa
            </Badge>
          ) : linkToOrdenDelDia ? (
            <Button asChild size="sm" className="gap-2 font-bold shadow-sm">
              <Link to="/orden-del-dia">
                <Newspaper className="h-3.5 w-3.5" />
                Ir a Orden del Día
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handleOpen}
              disabled={!selectedGuardId}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold"
            >
              <Play className="h-3 w-3 fill-current" />
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** ─── Inline "no guard" empty-state ──────────────────────────────────────── */

interface NoGuardBannerProps {
  /** Mensaje descriptivo */
  message?: string;
  /** Si true, muestra el mini formulario en lugar de solo el link */
  allowOpenHere?: boolean;
  onGuardOpened?: () => void;
}

/**
 * EmptyState que se muestra cuando no hay guardia activa.
 * Con `allowOpenHere=true` incluye el formulario de selección de guardia inline.
 */
export function NoGuardBanner({
  message = 'Para registrar novedades primero debes abrir una nueva guardia.',
  allowOpenHere = true,
  onGuardOpened,
}: NoGuardBannerProps) {
  const {
    guards,
    selectedGuardId,
    setSelectedGuardId,
    periodo,
    setPeriodo,
    openGuard,
    settings,
    isLoaded,
  } = useActiveGuard();

  const ordenDelDiaDisabled = (settings.disabledModules || []).includes('orden-del-dia');

  const handleOpen = () => {
    openGuard();
    onGuardOpened?.();
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500 gap-8 w-full h-full">
      <div className="max-w-sm space-y-4">
        <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto border-2 border-dashed border-amber-500/20">
          <Lock className="h-9 w-9 text-amber-500/40" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground/80 tracking-tight">
            Guardia no Iniciada
          </h3>
          <p className="text-sm text-muted-foreground/60 leading-relaxed">{message}</p>
        </div>
      </div>

      {allowOpenHere && guards.length > 0 && (
        <div className="w-full max-w-md bg-card border border-muted/60 rounded-2xl shadow-sm p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left">
            Abrir guardia aquí
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Guard select */}
            <div className="flex-1 space-y-1.5">
              <Label
                htmlFor="no-guard-select"
                className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
              >
                Guardia
              </Label>
              <Select value={selectedGuardId} onValueChange={setSelectedGuardId}>
                <SelectTrigger id="no-guard-select" className="h-10 rounded-lg bg-background">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {guards.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      Guardia &quot;{g.id}&quot;
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Periodo */}
            <div className="flex-1 space-y-1.5">
              <Label
                htmlFor="no-guard-period"
                className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
              >
                Periodo
              </Label>
              <Input
                id="no-guard-period"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                placeholder="DD/MM/YYYY AL DD/MM/YYYY"
                className="h-10 rounded-lg bg-background"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpen}
              disabled={!selectedGuardId}
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              size="sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Abrir Guardia
            </Button>
            {!ordenDelDiaDisabled && (
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/orden-del-dia">
                  <Newspaper className="h-3.5 w-3.5" />
                  Orden del Día
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {guards.length === 0 && (
        <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
          <Link to="/personal">Configurar Guardias en Personal</Link>
        </Button>
      )}
    </div>
  );
}
