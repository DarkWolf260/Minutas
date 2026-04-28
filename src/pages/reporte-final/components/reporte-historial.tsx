import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Users, Calendar, Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReporteHistorialProps {
  hook: any;
}

export function ReporteHistorial({ hook }: ReporteHistorialProps) {
  const {
    estaCargado,
    reportesGuardadosOrdenados,
    manejarVerReporteGuardado,
    manejarEliminarReporteGuardado
  } = hook;

  if (!estaCargado) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[180px] w-full rounded-2xl" />
        <Skeleton className="h-[180px] w-full rounded-2xl" />
        <Skeleton className="h-[180px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col md:min-h-0">
      {reportesGuardadosOrdenados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {reportesGuardadosOrdenados.map((report: any) => (
            <Card
              key={report.id}
              className="group cursor-pointer hover:border-primary/40 hover:shadow-xl transition-all duration-300 rounded-2xl border-2 overflow-hidden bg-background relative"
              onClick={() => manejarVerReporteGuardado(report.id)}
            >
              <div className="absolute top-0 right-0 p-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  onClick={(e) => manejarEliminarReporteGuardado(report.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="pb-3 bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {format(new Date(report.date), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                <CardTitle className="text-base line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
                  {report.summary}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 border-t bg-background">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Grupo {report.guardGroup}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{format(new Date(report.generatedAt), 'HH:mm')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-4 border-dashed rounded-3xl bg-muted/5 max-w-2xl mx-auto w-full">
          <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
            <History className="h-10 w-10 text-muted-foreground/20" />
          </div>
          <h3 className="text-xl font-bold mb-2">No hay reportes archivados</h3>
          <p className="text-muted-foreground max-w-xs">
            Los reportes finales que generes y guardes aparecerán en esta sección cronológicamente.
          </p>
        </div>
      )}
    </div>
  );
}
