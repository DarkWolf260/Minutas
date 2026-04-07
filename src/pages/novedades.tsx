import React, { Suspense, useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, AlertTriangle, PlusCircle, ChevronLeft, CheckCircle2, Clock, Newspaper, Lock } from 'lucide-react';
import { ReportViewer } from '@/components/report/report-viewer';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useDrafts } from '@/hooks/use-drafts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/hooks/use-settings';
import { ReportGenerator, type ReportGeneratorRef } from '@/components/report/report-generator';
import type { Report, Template } from '@/lib/types';
import { cn, getTemplateIcon, normalizeString } from '@/lib/utils';
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
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const generatorRef = useRef<ReportGeneratorRef>(null);

  const isGuardOpen = settings.isGuardOpen || false;

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
    let result = sortedReports;

    const query = normalizeString(searchQuery);
    if (query) {
      result = result.filter(
        (report: Report) =>
          normalizeString(report.title).includes(query) ||
          normalizeString(report.content).includes(query)
      );
    }

    return result;
  }, [sortedReports, searchQuery]);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }

    const openCreateDialog = () => setIsCreateDialogOpen(true);
    window.addEventListener('open-novedades-create', openCreateDialog);
    return () => window.removeEventListener('open-novedades-create', openCreateDialog);
  }, [isMounted]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId || creatingReport) return null;
    return reports.find((report) => report.id === selectedReportId) ?? null;
  }, [selectedReportId, reports, creatingReport]);

  const handleDeleteReport = useCallback(async (id: string) => {
    setReportToDelete(null);
    await removeReport(id);
    if (selectedReportId === id) {
      navigate('/');
      setSelectedReportId(null);
    }
  }, [removeReport, selectedReportId, navigate]);

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
      navigate('/');
    }
  }, [templates, navigate]);

  const handleSaveNewReport = useCallback(async (report: Report) => {
    setIsNavigatingBack(true);
    await clearDraft();
    await addReport(report);
    setInitialDraftData(undefined);
    setCreatingReport(null);
    setSelectedReportId(report.id);
    navigate(`/?selected=${report.id}`);
  }, [clearDraft, addReport, navigate]);

  const handleCancelCreation = useCallback(async () => {
    setIsNavigatingBack(true);
    generatorRef.current?.cancel();
    await clearDraft();
    setCreatingReport(null);
    setInitialDraftData(undefined);
    navigate('/');
  }, [clearDraft, navigate]);

  return (
    <>
      <div className="flex flex-col h-full w-full bg-background overflow-hidden sm:flex-row flex-1">
        {/* Sidebar / List */}
        <aside
          className={cn(
            'h-full w-full sm:w-80 lg:w-96 flex-col border-r bg-card flex gap-0 animate-in fade-in slide-in-from-left-4 duration-300 sm:animate-none',
            selectedReportId || creatingReport ? 'hidden sm:flex' : 'flex'
          )}
        >
          <div className="flex items-center justify-between border-b p-4 min-h-[73px]">
            <h2 className="text-xl font-bold tracking-tight">Novedades</h2>
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!isGuardOpen}
              className="shadow-sm gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo
            </Button>
          </div>

          <div className="p-4 space-y-4 border-b bg-muted/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="report-search"
                name="report-search"
                placeholder="Buscar reportes..."
                className="pl-9 bg-background border-none shadow-sm focus-visible:ring-primary/20 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full w-full" type="always">
              <div className="space-y-1 p-3 pt-3 pb-32 sm:pb-3">
                {filteredReports.map((report) => {
                  const horaValue = findValueInFormData(report.formData, 'Hora');
                  return (
                    <button
                      key={report.id}
                      onClick={() => {
                        setIsNavigatingBack(true);
                        setSelectedReportId(report.id);
                        setCreatingReport(null);
                        navigate(`/?selected=${report.id}`);
                      }}
                      className={cn(
                        'w-full rounded-2xl p-3.5 text-left transition-all duration-200 group',
                        selectedReportId === report.id && !creatingReport
                          ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm'
                          : 'hover:bg-muted/50 border-transparent'
                      )}
                    >
                      <div className="flex w-full items-start gap-3.5">
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "font-semibold leading-tight mb-1 truncate",
                            selectedReportId === report.id && !creatingReport ? "text-primary" : "text-foreground"
                          )}>
                            {report.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground/80">
                            {report.status && (
                              <div className="flex items-center gap-1.5 bg-muted/30 px-1.5 py-0.5 rounded">
                                <span
                                  className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    report.status === 'Finalizado' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                                  )}
                                />
                                <span className="font-bold text-[10px] uppercase tracking-tighter">{report.status}</span>
                              </div>
                            )}
                            {horaValue && (
                              <div className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                <Clock className="h-3 w-3 text-muted-foreground/50" />
                                <span>{String(horaValue)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredReports.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-500">
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-muted-foreground/10 opacity-60">
                      <Search className="h-7 w-7 opacity-20" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground/70 tracking-tight">Sin resultados</h3>
                      <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                        No se encontraron reportes registrados.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>

        <main
          className={cn(
            'flex-1 flex flex-col min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300',
            !selectedReportId && !creatingReport ? 'hidden sm:flex' : 'flex'
          )}
        >
          {/* Mobile back header — shrinks to its natural height */}
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

          {/* Content area — takes remaining height and allows inner scroll */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {!isGuardOpen && !selectedReportId && !creatingReport ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center animate-in fade-in duration-500 bg-muted/5 h-full">
                <div className="max-w-md space-y-6">
                  <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2 border-2 border-dashed border-amber-500/20">
                    <AlertTriangle className="h-9 w-9 text-amber-500/40" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Guardia no Iniciada</h3>
                    <p className="text-sm max-w-[280px] mx-auto text-muted-foreground/60 leading-relaxed">
                      Para registrar nuevas novedades o gestionar reportes, primero debes abrir una nueva guardia en la sección de orden del día.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/orden-del-dia')}
                    variant="outline"
                    size="sm"
                    className="h-10 px-8 text-xs font-bold gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 shadow-sm"
                  >
                    <Newspaper className="h-4 w-4" />
                    Ir a Orden del Día
                  </Button>
                </div>
              </div>
            ) : creatingReport || selectedReportId ? (
              <Suspense
                fallback={
                  <div className="flex-1 p-6">
                    <div className="h-full w-full bg-muted/20 rounded-lg animate-pulse"></div>
                  </div>
                }
              >
                <ReportContentHandler
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
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center animate-in fade-in duration-500 bg-muted/5 h-full">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-2 border-2 border-dashed border-muted-foreground/10 opacity-60">
                    <FileText className="h-9 w-9 opacity-20" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Sin reporte seleccionado</h3>
                    <p className="text-sm max-w-[280px] mx-auto text-muted-foreground/60 leading-relaxed">
                      Selecciona un reporte de la lista lateral para visualizar sus detalles o realizar ediciones administrativas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FAB - Mobile Only */}

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
      />
    </>
  );
}

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
}) {
  const navigate = useNavigate();
  if (!isMounted) return null;

  return (
    <>
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

      {isMobile ? (
        <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <SheetContent side="bottom" className="rounded-t-xl p-6">
            <SheetHeader className="text-left">
              <SheetTitle>Crear Novedad</SheetTitle>
              <SheetDescription>
                Selecciona una plantilla para empezar a generar un nuevo reporte.
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 w-full" type="always">
              <div className="p-4 pb-24 sm:pb-4">
                <div className="max-w-3xl mx-auto">
                {templates.filter((t) => t.isActive).length > 0 ? (
                  templates
                    .filter((t) => t.isActive)
                    .map((template) => {
                      const Icon = getTemplateIcon(template.name);
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template.id)}
                          className="w-full text-left p-4 rounded-xl border bg-card hover:bg-muted transition-colors flex items-center gap-4 active:scale-[0.98] transition-all"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-base">{template.name}</span>
                        </button>
                      );
                    })
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    <p>No has subido o activado ninguna plantilla.</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        navigate('/plantillas');
                      }}
                    >
                      Ir a Plantillas
                    </Button>
                  </div>
                )}
                </div>
              </div>
            </ScrollArea>
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
            <ScrollArea className="max-h-96 w-full" type="always">
              <div className="py-4 px-1 space-y-2">
                {templates.filter((t) => t.isActive).length > 0 ? (
                  templates
                    .filter((t) => t.isActive)
                    .map((template) => {
                      const Icon = getTemplateIcon(template.name);
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template.id)}
                          className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors flex items-center gap-3"
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="flex-1">{template.name}</span>
                        </button>
                      );
                    })
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    <p>No has subido o activado ninguna plantilla.</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        navigate('/plantillas');
                      }}
                    >
                      Ir a Plantillas
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

function ReportContentHandler({
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
  const [searchParams] = useSearchParams();
  const preSelectedId = searchParams.get('selected');

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

  useEffect(() => {
    if (!isMounted) return;

    // Handle ?new=true to open creation dialog from BottomNav or elsewhere
    if (searchParams.get('new') === 'true' && !creatingReport) {
      const sp = new URLSearchParams(searchParams);
      sp.delete('new');
      window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`);
      // Dispatch an event or directly open the dialog
      // Actually we don't have setIsCreateDialogOpen here, it's in the parent.
      // We can dispatch a custom event.
      window.dispatchEvent(new CustomEvent('open-novedades-create'));
    }
  }, [isMounted, searchParams, creatingReport]);

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
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden h-full">
      {creatingReport ? (
        <div key="generator" className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ReportGenerator
            ref={generatorRef}
            template={creatingReport}
            config={configs[creatingReport.id]}
            initialData={initialDraftData}
            onCancel={handleCancelCreation}
            onSave={handleSaveNewReport}
          />
        </div>
      ) : selectedReport ? (
        <div key={selectedReportId} className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ReportViewer
            report={selectedReport}
            onSave={updateReport}
            onDelete={(id: string) => setReportToDelete(id)}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground p-6 text-center animate-in fade-in duration-500 w-full h-full">
          <div className="max-w-md space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-2 border-2 border-dashed border-muted-foreground/10 opacity-60">
              <FileText className="h-9 w-9 opacity-20" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Sin reporte seleccionado</h3>
              <p className="text-sm max-w-[280px] mx-auto text-muted-foreground/60 leading-relaxed">
                Selecciona un reporte de la lista lateral para visualizar sus detalles o realizar ediciones administrativas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const navigate = useNavigate();
  if (!isMobile || !isMounted) return null;
  if (!creatingReport && !selectedReport) return null;

  return (
    <div className="sm:hidden border-b p-3 bg-card flex items-center justify-between sticky top-0 z-10 h-16 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsNavigatingBack(true);
          if (creatingReport) {
            handleCancelCreation();
          } else {
            navigate('/');
            setSelectedReportId(null);
          }
        }}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>
      <div className="text-sm font-medium truncate ml-2">
        {creatingReport ? creatingReport.name : selectedReport?.title}
      </div>
    </div>
  );
}

export default memo(NovedadesPageContent);
