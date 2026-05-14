'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/components/providers/theme-provider';
import { useIsMobile } from '@/hooks/use-mobile';

export function Toaster() {
  const { theme = 'system' } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      position={isMobile ? 'top-center' : 'bottom-right'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  );
}

