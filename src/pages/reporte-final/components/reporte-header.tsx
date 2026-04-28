import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReporteHeaderProps {
  hook: any;
  isMobile: boolean;
}

export function ReporteHeader({ hook, isMobile }: ReporteHeaderProps) {
  const {
    tabActiva,
    reportesGuardadosOrdenados,
    manejarCorregirFechasHistorial,
    manejarGenerarReporte,
    estaCargado
  } = hook;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
      <div className="flex items-center gap-4">
        <Link to="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Cierre</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestiona y consulta los reportes de cierre de guardia.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
        <TabsList className="grid w-[240px] grid-cols-2 shadow-sm">
          <TabsTrigger value="generate">Generar</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {tabActiva === 'history' && reportesGuardadosOrdenados.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={manejarCorregirFechasHistorial}
            className="text-[10px] font-bold uppercase tracking-wider h-8 border-primary/20 text-primary hover:bg-primary/5 ml-2"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Sincronizar Fechas
          </Button>
        )}

        {tabActiva === 'generate' && !isMobile && estaCargado && (
          <Button
            onClick={manejarGenerarReporte}
            size="sm"
            className="hidden sm:flex gap-2 shadow-sm font-bold ml-2"
          >
            <FileText className="h-4 w-4" />
            Generar Reporte Final
          </Button>
        )}
      </div>
    </div>
  );
}
