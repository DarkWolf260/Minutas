'use client';

import React, { Suspense, useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, AlertTriangle, PlusCircle, ChevronLeft } from 'lucide-react';
import { ReportViewer } from '@/components/report/report-viewer';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useDrafts } from '@/hooks/use-drafts';
import { useIsMobile } from '@/hooks/use-mobile';
import { ReportGenerator, type ReportGeneratorRef } from '@/components/report/report-generator';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { sortReports } from '@/lib/report-sorter';
import { findValueInFormData } from '@/lib/report-sorter';

function NovedadesPageContent() {
  const { reports, addReport, updateReport, removeReport, clearAllReports } = useReports();
  const { templates, configs } = useTemplates();
  const { draft, clearDraft, isLoaded: draftIsLoaded } = useDrafts();
  const router = useRouter();
  const isMobile = useIsMobile();
  const generatorRef = useRef<ReportGeneratorRef>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creatingReport, setCreatingReport] = useState<Template | null>(null);
  const [initialDraftData, setInitialDraftData] = useState<Record<string, any> | undefined>(
    undefined
  );
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  useEffect(() => {
    if (isNavigatingBack) {
      const timer = setTimeout(() => setIsNavigatingBack(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isNavigatingBack]);

  const sortedReports = useMemo(() => {
    return sortReports(reports, 'asc');
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (!searchQuery) {
      return sortedReports;
    }
        return sortedReports.filter(
      (report: Report) =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedReports, searchQuery]);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [isMounted]);

  // No longer in NovedadesPageContent, moved to DashboardContent to handle hook suspension properly

  const selectedReport = useMemo(() => {
    if (!selectedReportId || creatingReport) return null;
    return reports.find((report) => report.id === selectedReportId) ?? null;
  }, [selectedReportId, reports, creatingReport]);

  const handleDeleteReport = useCallback(async (id: string) => {
    // Immediate state reset to stop flickers
    setReportToDelete(null);
    await removeReport(id);
    if (selectedReportId === id) {
      router.push('/');
      setSelectedReportId(null);
    }
  }, [removeReport, selectedReportId, router]);

  const handleClearAll = useCallback(async () => {
    setReportToDelete(null);
    await clearAllReports();
  }, [clearAllReports]);

  const handleSelectTemplate = useCallback((templateId: string) => {
    const template = templates.find((t: Template) => t.id === templateId);
    if (template) {
      generatorRef.current?.cancel();
      setInitialDraftData(undefined);
      setSelectedReportId(null);
      setCreatingReport(template);
      setIsCreateDialogOpen(false);
      // Clear URL to prevent it from re-opening the previous report
      router.push('/');
    }
  }, [templates, router]);

  const handleSaveNewReport = useCallback(async (report: Report) => {
    setIsNavigatingBack(true);
    await clearDraft();
    await addReport(report);
    
    // Perform state transition
    setInitialDraftData(undefined);
    setCreatingReport(null);
    setSelectedReportId(report.id);
    
    // Sync URL - effect will handle the rest but won't "clear" due to isNavigatingBack
    router.push(`/?selected=${report.id}`);
  }, [clearDraft, addReport, router]);

  const handleCancelCreation = useCallback(async () => {
    setIsNavigatingBack(true);
    generatorRef.current?.cancel();
    await clearDraft();
    setCreatingReport(null);
    setInitialDraftData(undefined);
    router.push('/');
  }, [clearDraft, router]);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-screen bg-background overflow-hidden sm:flex-row">
        {/* Sidebar / List - Hidden on mobile if a report is being viewed/created */}
        <aside
          className={cn(
            'h-full w-full sm:w-80 flex-col border-r bg-card flex',
            selectedReportId || creatingReport ? 'hidden sm:flex' : 'flex'
          )}
        >
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
              id="report-search"
              name="report-search"
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
                      setIsNavigatingBack(true);
                      setSelectedReportId(report.id);
                      setCreatingReport(null);
                      router.push(`/?selected=${report.id}`);
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
                          {horaValue && <span className="truncate">{String(horaValue)}</span>}
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

        <main
          className={cn(
            'flex-1 overflow-hidden flex flex-col min-h-0',
            !selectedReportId && !creatingReport ? 'hidden sm:block' : 'block'
          )}
        >
          <MobileHeader
            isMobile={isMobile}
            isMounted={isMounted}
            creatingReport={creatingReport}
            selectedReport={selectedReport}
            isNavigatingBack={isNavigatingBack}
            handleCancelCreation={handleCancelCreation}
            setIsNavigatingBack={setIsNavigatingBack}
            setSelectedReportId={setSelectedReportId}
          />

          {creatingReport || selectedReportId ? (
            <Suspense
              fallback={
                <div className="flex-1 p-6">
                  <div className="h-full w-full bg-muted/20 rounded-lg animate-pulse"></div>
                </div>
              }
            >
              <DashboardContent
                reports={reports}
                templates={templates}
                configs={configs}
                draft={draft}
                draftIsLoaded={draftIsLoaded}
                isMounted={isMounted}
                isMobile={isMobile}
                selectedReportId={selectedReportId}
                setSelectedReportId={setSelectedReportId}
                creatingReport={creatingReport}
                setCreatingReport={setCreatingReport}
                initialDraftData={initialDraftData}
                setInitialDraftData={setInitialDraftData}
                isNavigatingBack={isNavigatingBack}
                setIsNavigatingBack={setIsNavigatingBack}
                generatorRef={generatorRef}
                handleCancelCreation={handleCancelCreation}
                handleSaveNewReport={handleSaveNewReport}
                updateReport={updateReport}
                setReportToDelete={setReportToDelete}
              />
            </Suspense>
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

      <NovedadesDialogs
        isMounted={isMounted}
        isMobile={isMobile}
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        reportToDelete={reportToDelete}
        setReportToDelete={setReportToDelete}
        templates={templates}
        handleSelectTemplate={handleSelectTemplate}
        handleClearAll={handleClearAll}
        handleDeleteReport={handleDeleteReport}
        router={router}
      />
    </>
  );
}

// Separate memoized component for dialogs to prevent re-render loops
const NovedadesDialogs = memo(function NovedadesDialogs({
  isMounted,
  isMobile,
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  reportToDelete,
  setReportToDelete,
  templates,
  handleSelectTemplate,
  handleClearAll,
  handleDeleteReport,
  router,
}: {
  isMounted: boolean;
  isMobile: boolean;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
  reportToDelete: string | null;
  setReportToDelete: (id: string | null) => void;
  templates: Template[];
  handleSelectTemplate: (id: string) => void;
  handleClearAll: () => void;
  handleDeleteReport: (id: string) => void;
  router: any;
}) {
  if (!isMounted) return null;

  return (
    <>
      {/* Delete Confirmation - Responsive */}
      {isMobile ? (
        <Sheet
          open={!!reportToDelete}
          onOpenChange={(open) => !open && setReportToDelete(null)}
        >
          <SheetContent side="bottom" className="rounded-t-xl p-6">
            <SheetHeader className="text-left">
              <SheetTitle>¿Estás seguro?</SheetTitle>
              <SheetDescription>
                {reportToDelete === 'ALL'
                  ? 'Esta acción no se puede deshacer. Se eliminarán permanentemente TODOS los reportes guardados.'
                  : 'Esta acción no se puede deshacer. El reporte será eliminado permanentemente.'}
              </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-3">
              <Button
                variant="destructive"
                className="w-full h-12 text-base font-semibold"
                onClick={() => {
                  const id = reportToDelete;
                  setReportToDelete(null);
                  if (id === 'ALL') handleClearAll();
                  else if (id) handleDeleteReport(id);
                }}
              >
                Sí, eliminar
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => setReportToDelete(null)}
              >
                Cancelar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog
          open={!!reportToDelete}
          onOpenChange={(open) => !open && setReportToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                {reportToDelete === 'ALL'
                  ? 'Esta acción no se puede deshacer. Se eliminarán permanentemente TODOS los reportes guardados.'
                  : 'Esta acción no se puede deshacer. El reporte será eliminado permanentemente.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setReportToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const id = reportToDelete;
                  setReportToDelete(null);
                  if (id === 'ALL') handleClearAll();
                  else if (id) handleDeleteReport(id);
                }}
              >
                Sí, eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Selection of Template - Responsive with Hydration Guard */}
      {isMobile ? (
        <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <SheetContent side="bottom" className="rounded-t-xl p-6">
            <SheetHeader className="text-left">
              <SheetTitle>Crear Novedad</SheetTitle>
              <SheetDescription>
                Selecciona una plantilla para empezar a generar un nuevo reporte.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {templates.filter((t) => t.isActive).length > 0 ? (
                templates
                  .filter((t) => t.isActive)
                  .map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      className="w-full text-left p-4 rounded-xl border bg-card hover:bg-muted transition-colors flex items-center gap-4 active:scale-[0.98] transition-all"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-base">{template.name}</span>
                    </button>
                  ))
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <p>No has subido o activado ninguna plantilla.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      router.push('/plantillas');
                    }}
                  >
                    Ir a Plantillas
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Novedad</DialogTitle>
              <DialogDescription>
                Selecciona una plantilla para empezar a generar un nuevo reporte.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 max-h-96 overflow-y-auto">
              {templates.filter((t) => t.isActive).length > 0 ? (
                templates
                  .filter((t) => t.isActive)
                  .map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="flex-1">{template.name}</span>
                    </button>
                  ))
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <p>No has subido o activado ninguna plantilla.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      router.push('/plantillas');
                    }}
                  >
                    Ir a Plantillas
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

function DashboardContent({
  reports,
  templates,
  configs,
  draft,
  draftIsLoaded,
  isMounted,
  isMobile,
  selectedReportId,
  setSelectedReportId,
  creatingReport,
  setCreatingReport,
  initialDraftData,
  setInitialDraftData,
  isNavigatingBack,
  setIsNavigatingBack,
  generatorRef,
  handleCancelCreation,
  handleSaveNewReport,
  updateReport,
  setReportToDelete,
}: {
  reports: Report[];
  templates: Template[];
  configs: Record<string, any>;
  draft: any;
  draftIsLoaded: boolean;
  isMounted: boolean;
  isMobile: boolean;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  creatingReport: Template | null;
  setCreatingReport: (t: Template | null) => void;
  initialDraftData: any;
  setInitialDraftData: (d: any) => void;
  isNavigatingBack: boolean;
  setIsNavigatingBack: (b: boolean) => void;
  generatorRef: any;
  handleCancelCreation: () => void;
  handleSaveNewReport: (r: Report) => void;
  updateReport: any;
  setReportToDelete: (id: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('selected');

  // 1. Separate Draft Restoration (Only on mount/load)
  useEffect(() => {
    if (!isMounted || !draftIsLoaded) return;

    if (draft && !preSelectedId && !creatingReport && !selectedReportId && !isNavigatingBack) {
      const template = templates.find((t: Template) => t.id === draft.templateId);
      if (template) {
        setInitialDraftData(draft.formData);
        setCreatingReport(template);
      }
    }
  }, [
    isMounted,
    draftIsLoaded,
    draft,
    templates,
    preSelectedId,
    creatingReport,
    selectedReportId,
    isNavigatingBack,
    setInitialDraftData,
    setCreatingReport,
  ]);

  // 2. Focused URL Synchronization
  useEffect(() => {
    if (!isMounted) return;

    if (creatingReport || isNavigatingBack) {
      return;
    }

    if (preSelectedId) {
      if (preSelectedId !== selectedReportId) {
        const report = reports.find((r: Report) => r.id === preSelectedId);
        if (report) {
          setSelectedReportId(preSelectedId);
        }
      }
    } else if (selectedReportId) {
      setSelectedReportId(null);
    }
  }, [
    isMounted,
    preSelectedId,
    selectedReportId,
    creatingReport,
    reports,
    isNavigatingBack,
    setSelectedReportId,
  ]);

  const selectedReport = useMemo(() => {
    if (creatingReport) return null;
    return reports.find((report: Report) => report.id === selectedReportId) ?? null;
  }, [selectedReportId, reports, creatingReport]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background min-h-0">

      {creatingReport ? (
        <ReportGenerator
          ref={generatorRef}
          template={creatingReport}
          config={configs[creatingReport.id]}
          initialData={initialDraftData}
          onCancel={handleCancelCreation}
          onSave={handleSaveNewReport}
        />
      ) : selectedReport ? (
        <ReportViewer
          key={selectedReportId}
          report={selectedReport}
          onSave={updateReport}
          onDelete={(id: string) => setReportToDelete(id)}
        />
      ) : (
        <div className="hidden sm:flex h-full items-center justify-center text-muted-foreground p-6 text-center">
          <div className="max-w-xs space-y-2">
            <FileText className="h-12 w-12 mx-auto opacity-20" />
            <p>Selecciona un reporte de la lista para verlo o editarlo.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-added MobileHeader for structural stability
function MobileHeader({
  isMobile,
  isMounted,
  creatingReport,
  selectedReport,
  isNavigatingBack,
  handleCancelCreation,
  setIsNavigatingBack,
  setSelectedReportId,
}: {
  isMobile: boolean;
  isMounted: boolean;
  creatingReport: Template | null;
  selectedReport: Report | null;
  isNavigatingBack: boolean;
  handleCancelCreation: () => void;
  setIsNavigatingBack: (b: boolean) => void;
  setSelectedReportId: (id: string | null) => void;
}) {
  const router = useRouter();
  if (!isMobile || !isMounted) return null;
  if (!creatingReport && !selectedReport) return null;

  return (
    <div className="sm:hidden border-b p-3 bg-card flex items-center justify-between sticky top-0 z-10 h-14 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsNavigatingBack(true);
          if (creatingReport) {
            handleCancelCreation();
          } else {
            router.push('/');
            setSelectedReportId(null);
          }
        }}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver a la lista
      </Button>
      <div className="text-sm font-medium truncate ml-2">
        {creatingReport ? creatingReport.name : selectedReport?.title}
      </div>
    </div>
  );
}

export default function NovedadesPage() {
  return <NovedadesPageContent />;
}
