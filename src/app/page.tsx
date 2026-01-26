
'use client';

import { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, AlertTriangle, Trash2, PlusCircle, ChevronLeft } from 'lucide-react';
import { ReportViewer } from '@/components/report/report-viewer';
import { ReportGenerator } from '@/components/report/report-generator';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useDrafts } from '@/hooks/use-drafts';
import type { Report, Template } from '@/types';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { sortReports } from '@/lib/report-sorter';
import { findValueInFormData } from '@/lib/report-sorter';

function NovedadesPageContent() {
  const { reports, addReport, updateReport, removeReport, clearAllReports } = useReports();
  const { templates, configs } = useTemplates();
  const { draft, clearDraft, isLoaded: draftIsLoaded } = useDrafts();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const preSelectedId = searchParams.get('selected');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingReport, setCreatingReport] = useState<Template | null>(null);
  const [initialDraftData, setInitialDraftData] = useState<Record<string, any> | undefined>(undefined);

  const sortedReports = useMemo(() => {
    return sortReports(reports, 'asc');
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!searchQuery) {
      return sortedReports;
    }
    return sortedReports.filter(report =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedReports, searchQuery]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    // This effect handles draft restoration and default report selection.

    // 1. Handle draft restoration first.
    if (draftIsLoaded && draft) {
      const template = templates.find(t => t.id === draft.templateId);
      if (template) {
        setInitialDraftData(draft.formData);
        setCreatingReport(template);
        return;
      } else {
        clearDraft();
      }
    }

    // 2. If we are in creation mode, do nothing else.
    if (creatingReport) {
      return;
    }

    // 3. If a valid report is already selected, do nothing.
    // The user's selection should be preserved.
    if (selectedReportId && reports.find(r => r.id === selectedReportId)) {
      return;
    }

    // 4. If we're here, there's no valid selection. Let's pick one.
    // Give priority to the URL parameter.
    if (preSelectedId && reports.find(r => r.id === preSelectedId)) {
      setSelectedReportId(preSelectedId);
    } else if (filteredReports.length > 0) { // Fallback to the first report in the list.
      setSelectedReportId(filteredReports[0]!.id);
    } else { // No reports to select.
      setSelectedReportId(null);
    }
  }, [
    isMounted,
    preSelectedId,
    reports,
    filteredReports,
    creatingReport,
    draft,
    draftIsLoaded,
    templates,
    clearDraft,
  ]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId || creatingReport) return null;
    return reports.find(report => report.id === selectedReportId) ?? null;
  }, [selectedReportId, reports, creatingReport]);

  const handleDeleteReport = async (id: string) => {
    await removeReport(id);
    if (selectedReportId === id) {
      setSelectedReportId(null);
    }
    setReportToDelete(null);
  }

  const handleClearAll = async () => {
    await clearAllReports();
    setReportToDelete(null);
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setInitialDraftData(undefined);
      setSelectedReportId(null);
      setCreatingReport(template);
      setIsCreateDialogOpen(false);
    }
  };

  const handleSaveNewReport = async (report: Report) => {
    await clearDraft();
    await addReport(report);
    setCreatingReport(null);
    setInitialDraftData(undefined);
    router.push(`/?selected=${report.id}`);
  }

  const handleCancelCreation = async () => {
    await clearDraft();
    setCreatingReport(null);
    setInitialDraftData(undefined);
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-screen bg-background overflow-hidden sm:flex-row">
        {/* Sidebar / List - Hidden on mobile if a report is being viewed/created */}
        <aside className={cn(
          "h-full w-full sm:w-80 flex-col border-r bg-card flex",
          (selectedReportId || creatingReport) ? "hidden sm:flex" : "flex"
        )}>
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-lg font-semibold">Novedades</h2>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear
            </Button>
          </div>
          <div className="relative p-3">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar reporte..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-3 pt-0">
              {filteredReports.map((report) => {
                const horaValue = findValueInFormData(report.formData, 'Hora');
                return (
                  <button
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      setCreatingReport(null);
                    }}
                    className={cn(
                      'w-full rounded-md p-3 text-left transition-colors hover:bg-muted/50',
                      selectedReportId === report.id && !creatingReport && 'bg-muted'
                    )}
                  >
                    <div className="flex w-full items-start gap-3">
                      {report.isRelevant ? (
                        <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <FileText className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{report.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {report.status && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'h-2 w-2 rounded-full',
                                  report.status === 'Finalizado' ? 'bg-green-500' : 'bg-orange-500'
                                )}
                              />
                              <span>{report.status}</span>
                            </div>
                          )}
                          {horaValue && (
                            <span className="truncate">{String(horaValue)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredReports.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No se encontraron reportes.
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        <main className={cn(
          "flex-1 overflow-hidden",
          (!selectedReportId && !creatingReport) ? "hidden sm:block" : "block"
        )}>
          {/* Mobile Back Button */}
          {(selectedReportId || creatingReport) && (
            <div className="sm:hidden border-b p-2 bg-card">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedReportId(null);
                  setCreatingReport(null);
                }}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver a la lista
              </Button>
            </div>
          )}

          {creatingReport ? (
            <ReportGenerator
              key={creatingReport.id}
              template={creatingReport}
              config={(configs[creatingReport.id] || { fields: {}, sections: [], layout: [] }) as any}
              initialData={initialDraftData}
              onCancel={handleCancelCreation}
              onSave={handleSaveNewReport}
            />
          ) : selectedReport ? (
            <ReportViewer
              key={selectedReportId}
              report={selectedReport}
              onSave={updateReport}
              onDelete={(id) => setReportToDelete(id)}
            />
          ) : (
            <div className="hidden sm:flex h-full items-center justify-center text-muted-foreground p-6 text-center">
              <div className="max-w-xs space-y-2">
                <FileText className="h-12 w-12 mx-auto opacity-20" />
                <p>Selecciona un reporte de la lista para verlo o editarlo.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {reportToDelete === 'ALL'
                ? "Esta acción no se puede deshacer. Se eliminarán permanentemente TODOS los reportes guardados."
                : "Esta acción no se puede deshacer. El reporte será eliminado permanentemente."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => reportToDelete === 'ALL' ? handleClearAll() : handleDeleteReport(reportToDelete!)}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Novedad</DialogTitle>
            <DialogDescription>
              Selecciona una plantilla para empezar a generar un nuevo reporte.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-96 overflow-y-auto">
            {templates.filter(t => t.isActive).length > 0 ? templates.filter(t => t.isActive).map(template => (
              <button key={template.id} onClick={() => handleSelectTemplate(template.id)} className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="flex-1">{template.name}</span>
              </button>
            )) : (
              <div className="text-center text-muted-foreground py-10">
                <p>No has subido o activado ninguna plantilla.</p>
                <Button variant="link" onClick={() => { setIsCreateDialogOpen(false); router.push('/plantillas'); }}>Ir a Plantillas</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function NovedadesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-background">
        <aside className="h-full w-80 flex-col border-r bg-card flex animate-pulse">
          <div className="flex items-center justify-between border-b p-3">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="h-8 w-24 bg-muted rounded"></div>
          </div>
          <div className="p-3"><div className="h-10 w-full bg-muted rounded"></div></div>
          <div className="p-3 space-y-2">
            <div className="h-12 w-full bg-muted rounded"></div>
            <div className="h-12 w-full bg-muted rounded"></div>
            <div className="h-12 w-full bg-muted rounded"></div>
          </div>
        </aside>
        <main className="flex-1 p-6">
          <div className="h-full w-full bg-muted rounded-lg animate-pulse"></div>
        </main>
      </div>
    }>
      <NovedadesPageContent />
    </Suspense>
  )
}
