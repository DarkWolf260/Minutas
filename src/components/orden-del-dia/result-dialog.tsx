import React from 'react';
import { Link } from 'react-router-dom';
import { Copy, CheckIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';

interface ResultDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
  generatedOrder: string;
  copyButtonText: string;
  onCopy: () => void;
}

export const ResultDialog: React.FC<ResultDialogProps> = ({
  isOpen,
  onOpenChange,
  isMobile,
  generatedOrder,
  copyButtonText,
  onCopy,
}) => {
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-xl flex flex-col p-6">
          <SheetHeader className="text-left">
            <SheetTitle>Orden del Día Generada</SheetTitle>
            <SheetDescription>
              Revisa la orden generada. Puedes copiar el texto para usarlo donde necesites.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 mt-4 border rounded-md bg-muted/50 overflow-hidden">
            <ScrollArea className="h-[60vh] w-full" type="always">
              <div className="p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {generatedOrder}
              </div>
            </ScrollArea>
          </div>
          <SheetFooter className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              asChild
              className="w-full"
            >
              <Link to="/reporte-final">
                Ir a Reporte Final
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button className="flex-1" type="button" onClick={onCopy}>
                {copyButtonText === 'Copiar' ? (
                  <Copy className="mr-2 h-4 w-4" />
                ) : (
                  <CheckIcon className="mr-2 h-4 w-4" />
                )}
                {copyButtonText}
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-3xl flex flex-col p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>Orden del Día Generada</DialogTitle>
          <DialogDescription>
            Revisa la orden generada. Puedes copiar el texto para usarlo donde necesites o guardarlo para el reporte final.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 border rounded-md bg-muted/50 overflow-hidden">
          <ScrollArea className="h-[70vh] w-full" type="always">
            <div className="p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {generatedOrder}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="mt-auto pt-6 flex-wrap gap-2">
          <div className="flex-1 flex gap-2 flex-wrap sm:flex-nowrap">
            <Button
              type="button"
              variant="outline"
              asChild
              className="flex-1 sm:flex-none"
            >
              <Link to="/reporte-final">
                Ir a Reporte Final
              </Link>
            </Button>
          </div>
          <Button type="button" onClick={onCopy} className="w-full sm:w-auto gap-2">
            {copyButtonText === 'Copiar' ? (
              <Copy className="h-4 w-4" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
            {copyButtonText}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
