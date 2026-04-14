import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CloudDownload, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCommunityTemplates } from '@/hooks/use-community-templates';
import { useTemplates } from '@/hooks/use-templates';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { generateId } from '@/lib/utils/id';
import { Template } from '@/lib/types';
import { toast } from 'sonner';

interface CloudTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloudTemplatesDialog({ open, onOpenChange }: CloudTemplatesDialogProps) {
  const { templates: cloudTemplates, loading, error, refetch } = useCommunityTemplates();
  const { templates: localTemplates, addTemplate, updateTemplate } = useTemplates();
  const { currentWorkspace } = useWorkspaceManager();
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (cloudTemplate: any) => {
    if (!currentWorkspace) return;

    const existing = localTemplates.find(t => t.name === cloudTemplate.name);
    
    setDownloadingIds(prev => new Set(prev).add(cloudTemplate.id));
    
    try {
      if (existing) {
        // Replace existing template content
        await updateTemplate({
          ...existing,
          content: cloudTemplate.content,
          type: cloudTemplate.type || existing.type || 'normal',
        });
        toast.success(`Plantilla "${cloudTemplate.name}" actualizada con la versión de la nube.`);
      } else {
        // Create new template
        const newTemplate: Template = {
          id: generateId('template'),
          workspaceId: currentWorkspace,
          name: cloudTemplate.name,
          content: cloudTemplate.content,
          type: cloudTemplate.type || 'normal',
          isActive: true,
        };

        await addTemplate(newTemplate);
      }
    } catch (err) {
      console.error('Error downloading template:', err);
      toast.error('Error al procesar la plantilla');
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(cloudTemplate.id);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <CloudDownload className="h-6 w-6 text-primary" />
              Plantillas de la Comunidad
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <DialogDescription>
            Explora y descarga plantillas verificadas para tus reportes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[400px] flex flex-col">
          {error ? (
            <div className="flex-1 p-12 text-center flex flex-col items-center justify-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">Error de conexión</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : loading && cloudTemplates.length === 0 ? (
            <div className="flex-1 p-12 text-center flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-12 w-12 text-primary opacity-20 animate-spin" />
              <p className="text-sm text-muted-foreground">Cargando plantillas desde la nube...</p>
            </div>
          ) : cloudTemplates.length === 0 ? (
            <div className="flex-1 p-12 text-center flex flex-col items-center justify-center gap-4">
              <FileText className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">No hay plantillas disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid gap-4 p-6 pt-0 animate-in fade-in duration-500">
              {cloudTemplates.map((template) => {
                const isDownloaded = localTemplates.some(t => t.name === template.name);
                const isDownloading = downloadingIds.has(template.id);

                return (
                  <div
                    key={template.id}
                    className="flex items-start justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors shadow-sm"
                  >
                    <div className="flex gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base truncate">{template.name}</h4>
                          {template.type === 'relevante' && (
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider h-5 shrink-0">
                              Relevante
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        {isDownloaded && (
                          <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Ya disponible localmente
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isDownloaded ? "outline" : "default"}
                      disabled={isDownloading}
                      className="shrink-0"
                      onClick={() => handleDownload(template)}
                    >
                      {isDownloading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : isDownloaded ? (
                        "Descargar de nuevo"
                      ) : (
                        <>
                          <CloudDownload className="mr-2 h-4 w-4" />
                          Descargar
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
