import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ResponsiveModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

/**
 * A reusable component that renders a Sheet on mobile and a Dialog on desktop.
 * Follows the "Mobile-First" approach for consistent UX.
 */
export function ResponsiveModal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = 'sm:max-w-[700px]'
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className={cn(
            "rounded-t-3xl border-t-2 border-primary/20 p-6 pb-12 focus-visible:outline-none flex flex-col max-h-[92vh]",
            className
          )}
        >
          <SheetHeader className="text-left mb-4 shrink-0">
            <SheetTitle className="text-xl font-bold">{title}</SheetTitle>
            {description && <SheetDescription className="text-sm">{description}</SheetDescription>}
          </SheetHeader>
          <ScrollArea className="flex-1 overflow-y-auto pr-1">
            <div className="py-2">
              {children}
            </div>
          </ScrollArea>
          {footer && (
            <SheetFooter className="mt-6 flex flex-col gap-3 shrink-0">
              {footer}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90vh] flex flex-col p-0 overflow-hidden", maxWidth, className)}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="flex-1 w-full" type="always">
          <div className="p-6 pt-4">
            {children}
          </div>
        </ScrollArea>
        {footer && (
          <DialogFooter className="p-6 pt-0">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
