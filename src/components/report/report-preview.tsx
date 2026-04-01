'use client';

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
import { Copy } from 'lucide-react';

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
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6">
          <SheetHeader className="text-left">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Revisa el reporte generado.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 mt-4 border rounded-md bg-muted/50 overflow-hidden">
            <ScrollArea className="h-full w-full" type="always">
              <div className="p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            </ScrollArea>
          </div>
          <SheetFooter className="mt-4 flex-row gap-2">
            <Button className="flex-1" onClick={onCopy}>
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
        <DialogHeader className="pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Revisa el reporte generado.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 border rounded-md bg-muted/50 overflow-hidden">
          <ScrollArea className="h-full w-full" type="always">
            <div className="p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="mt-auto pt-6">
          <Button onClick={onCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            {copyButtonText}
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
