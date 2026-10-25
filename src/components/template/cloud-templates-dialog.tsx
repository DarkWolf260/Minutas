import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  CloudDownload,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Layers,
  Loader2
} from 'lucide-react';
import { useTemplates } from '@/hooks/plantillas';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { TemplateCloudService, type CloudTemplate } from '@/lib/template/cloud';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/ui';
import { useEffect, useCallback } from 'react';

interface CloudTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloudTemplatesDialog({ open, onOpenChange }: CloudTemplatesDialogProps) {
  const isMobile = useIsMobile();
  const db = useDatabase();
  const [loading, setLoading] = useState(false);
  const [cloudTemplates, setCloudTemplates] = useState<CloudTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { templates, error: fetchErr } = await TemplateCloudService.fetchCatalog();
      if (fetchErr) {
        setError(fetchErr);
        setCloudTemplates([]);
      } else {
        setCloudTemplates(templates);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const { templates: localTemplates } = useTemplates();
  const { currentWorkspace } = useWorkspaceManager();
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const handleDownload = async (cloudTemplate: any, silent = false) => {
    if (!currentWorkspace || !db) return;

    if (!silent) {
      setDownloadingIds(prev => new Set(prev).add(cloudTemplate.id));
    }

    try {
      const res = await TemplateCloudService.downloadTemplate(db, currentWorkspace, cloudTemplate, localTemplates);
      if (!silent) {
        if (res.success) {
          toast.success(
            res.action === 'updated'
              ? `Plantilla "${cloudTemplate.name}" actualizada.`
              : `Plantilla "${cloudTemplate.name}" descargada.`
          );
        } else {
          toast.error(res.error || `Error con "${cloudTemplate.name}"`);
        }
      }
    } finally {
      if (!silent) {
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(cloudTemplate.id);
          return next;
        });
      }
    }
  };

  const handleDownloadAll = async () => {
    if (!currentWorkspace || !db || cloudTemplates.length === 0) return;

    setIsBulkDownloading(true);
    toast.info(`Iniciando descarga de ${cloudTemplates.length} plantillas...`);

    try {
      const res = await TemplateCloudService.downloadBulk(db, currentWorkspace, cloudTemplates, localTemplates);
      if (res.success) {
        toast.success(`Se han procesado ${res.count} plantillas correctamente.`);
      } else {
        toast.error(res.error || 'Ocurrió un error durante la descarga masiva');
      }
    } catch {
      toast.error('Ocurrió un error durante la descarga masiva');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={cn(
        "p-6 pb-4 bg-gradient-to-br from-primary/10 via-background to-background border-b shrink-0",
        isMobile && "pt-8"
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-2xs shrink-0">
              <CloudDownload className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold tracking-tight truncate">
                Plantillas Cloud
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {cloudTemplates.length} diseños disponibles
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={loading || isBulkDownloading}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4", (loading || isBulkDownloading) && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-muted/30">
        {cloudTemplates.length > 0 && !error && (
          <div className="px-6 py-3 bg-background/50 border-b flex items-center justify-between backdrop-blur-sm sticky top-0 z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Plantillas
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-2"
              onClick={handleDownloadAll}
              disabled={isBulkDownloading || loading}
            >
              {isBulkDownloading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Layers className="h-3 w-3" />
              )}
              Descargar Todo
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 space-y-3">
            {error ? (
              <div className="empty-state-container py-16">
                <div className="empty-state-icon-box bg-destructive/10 text-destructive">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="empty-state-title">Error de conexión</div>
                <div className="empty-state-description max-w-[280px]">{error}</div>
                <Button variant="outline" onClick={() => refetch()} className="rounded-xl px-8 mt-2">
                  Reintentar
                </Button>
              </div>
            ) : loading && cloudTemplates.length === 0 ? (
              <div className="empty-state-container py-16">
                <div className="empty-state-icon-box">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
                <div className="empty-state-title">Sincronizando...</div>
                <div className="empty-state-description">Buscando plantillas en la nube</div>
              </div>
            ) : cloudTemplates.length === 0 ? (
              <div className="empty-state-container py-16">
                <div className="empty-state-icon-box">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="empty-state-title">No hay plantillas nuevas</div>
                <div className="empty-state-description">Todas las plantillas disponibles ya están instaladas o no hay registros</div>
              </div>
            ) : (
              <div className="grid gap-3">
                {cloudTemplates.map((template) => {
                  const localMatch = localTemplates.find(t => t.name === template.name);
                  const isDownloaded = !!localMatch;
                  const isDownloading = downloadingIds.has(template.id);

                  return (
                    <div
                      key={template.id}
                      className={cn(
                        "group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card transition-all duration-200 gap-4",
                        "hover:shadow-xs hover:border-primary/30",
                        isDownloaded && "border-green-500/20 bg-green-500/[0.02]"
                      )}
                    >
                      <div className="flex gap-3 items-start sm:items-center min-w-0">
                        <div className={cn(
                          "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0",
                          isDownloaded ? "bg-green-500/10" : "bg-primary/10"
                        )}>
                          <FileText className={cn(
                            "h-5 w-5 sm:h-6 sm:w-6",
                            isDownloaded ? "text-green-600" : "text-primary"
                          )} />
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                              {template.name}
                            </h4>
                            {template.type === 'relevante' && (
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-black uppercase tracking-tighter h-4">
                                PRO
                              </Badge>
                            )}
                          </div>
                          {isDownloaded && (
                            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-tight mt-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Ya disponible localmente
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isDownloaded ? "outline" : "default"}
                        disabled={isDownloading || isBulkDownloading}
                        className={cn(
                          "rounded-xl font-bold text-xs h-10 sm:h-9 px-6 sm:px-4 transition-all w-full sm:w-auto",
                          isDownloaded ? "border-green-500/30 text-green-700 hover:bg-green-500/10" : "shadow-2xs"
                        )}
                        onClick={() => handleDownload(template)}
                      >
                        {isDownloading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : isDownloaded ? (
                          <div className="flex items-center gap-2 justify-center">
                            <Download className="h-4 w-4" />
                            <span>Re-descargar</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-center">
                            <CloudDownload className="h-4 w-4" />
                            <span>Descargar</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 bg-background border-t shrink-0 flex justify-center">
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="rounded-xl w-full sm:w-auto px-10 font-bold text-muted-foreground"
        >
          Cerrar catálogo
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="p-0 h-[92vh] rounded-t-[2rem] overflow-hidden border-none shadow-2xl">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        {content}
      </DialogContent>
    </Dialog>
  );
}


