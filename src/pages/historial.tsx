'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Eye, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGuardHistory } from '@/hooks/use-guard-history';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HistorialPage() {
  const { reports, isLoaded, deleteGuardReport } = useGuardHistory();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  const handleView = (id: string) => {
    setSelectedReportId(id);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGuardReport(id);
    if (selectedReportId === id) {
      setViewDialogOpen(false);
      setSelectedReportId(null);
    }
  };

  // Sort reports by generatedAt descending (newest first)
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Historial de Guardias</CardTitle>
            <CardDescription>Reportes de cierre generados y guardados anteriormente.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoaded ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No hay reportes guardados en el historial.
              </div>
            ) : (
              <div className="grid gap-4">
                {sortedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1 mb-4 sm:mb-0">
                      <div className="font-semibold text-lg">
                        {report.summary || 'Reporte sin título'}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(report.date), 'PPP', { locale: es })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Generado: {format(new Date(report.generatedAt), 'Pp', { locale: es })}
                        </span>
                        {report.guardGroup && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {report.guardGroup}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleView(report.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. El reporte se borrará permanentemente
                              del historial de este dispositivo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => handleDelete(report.id, e as any)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-3xl flex flex-col">
            <DialogHeader>
              <DialogTitle>Detalle del Reporte</DialogTitle>
              <DialogDescription>
                {selectedReport && format(new Date(selectedReport.date), 'PPP', { locale: es })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 border rounded-md bg-muted/50 overflow-hidden">
              <ScrollArea className="h-full w-full" type="always">
                <div className="p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedReport?.content || ''}
                </div>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button
                onClick={() => navigator.clipboard.writeText(selectedReport?.content || '')}
                variant="outline"
              >
                Copiar al portapapeles
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
