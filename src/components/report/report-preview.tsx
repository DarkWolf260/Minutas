'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter, 
  SheetClose 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare, Code2 } from 'lucide-react';
import { WhatsAppMarkdown } from '@/features/whatsapp';
import { cn } from '@/lib/utils';

interface ReportPreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  copyButtonText: string;
  onCopy: () => void;
  isMobile: boolean;
  title?: string;
}

export function ReportPreview({
  isOpen,
  onOpenChange,
  content,
  copyButtonText,
  onCopy,
  isMobile,
  title = 'Vista Previa del Reporte'
}: ReportPreviewProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-4 sm:p-6" hideClose>
          <SheetHeader className="text-left flex-row items-center justify-between gap-2 pb-2">
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>Revisa el reporte generado.</SheetDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('formatted')}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5",
                  viewMode === 'formatted'
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Ver con formato de WhatsApp"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px]">Formato</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5",
                  viewMode === 'raw'
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Ver texto plano"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span className="text-[11px]">Plano</span>
              </button>
            </div>
          </SheetHeader>
          <div className="flex-1 min-h-0 mt-2 border rounded-md bg-muted/40 dark:bg-muted/20 overflow-hidden">
            <ScrollArea className="h-full w-full" type="always">
              {viewMode === 'formatted' ? (
                <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-foreground select-text font-sans">
                  <WhatsAppMarkdown text={content} className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm leading-relaxed" />
                </div>
              ) : (
                <pre className="p-4 sm:p-5 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words text-foreground select-text">
                  {content}
                </pre>
              )}
            </ScrollArea>
          </div>
          <SheetFooter className="mt-4 flex-row gap-2">
            <Button className="flex-1 gap-2" onClick={onCopy}>
              <Copy className="h-4 w-4" />
              {copyButtonText}
            </Button>
            <SheetClose asChild>
              <Button variant="secondary">Cerrar</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] max-h-[90vh] max-w-3xl flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 flex-row items-center justify-between gap-4">
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Revisa el reporte generado tal como se verá en WhatsApp.</DialogDescription>
          </div>
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border text-xs mr-6">
            <button
              type="button"
              onClick={() => setViewMode('formatted')}
              className={cn(
                "px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5",
                viewMode === 'formatted'
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Ver con formato de WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Formato WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={cn(
                "px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1.5",
                viewMode === 'raw'
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Ver texto plano con caracteres de formato"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Texto plano</span>
            </button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 border rounded-md bg-muted/40 dark:bg-muted/20 overflow-hidden">
          <ScrollArea className="h-full w-full" type="always">
            {viewMode === 'formatted' ? (
              <div className="p-6 sm:p-8 text-sm sm:text-base leading-relaxed text-foreground select-text font-sans max-w-none">
                <WhatsAppMarkdown text={content} className="space-y-2 text-sm sm:text-base leading-relaxed" />
              </div>
            ) : (
              <pre className="p-6 sm:p-8 font-mono text-sm whitespace-pre-wrap leading-relaxed break-words text-foreground select-text">
                {content}
              </pre>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="mt-auto pt-4 flex items-center justify-between sm:justify-between w-full">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {viewMode === 'formatted'
              ? 'Renderizado con sintaxis de WhatsApp (*negrita*, _cursiva_, etc.)'
              : 'Mostrando caracteres directos del template'}
          </span>
          <div className="flex items-center gap-2">
            <Button onClick={onCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              {copyButtonText}
            </Button>
            <DialogClose asChild>
              <Button variant="secondary">Cerrar vista previa</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
