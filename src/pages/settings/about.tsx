'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_VERSION } from './about/data';

// Componentes extraídos (SOLID)
import { AboutHeader } from './about/components/about-header';
import { AboutModuleList } from './about/components/about-module-list';

export default function SettingsAboutPage() {
  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header (SRP) */}
        <AboutHeader version={APP_VERSION} />

        {/* Listado de Módulos (SRP) */}
        <AboutModuleList />

        {/* Footer simple */}
        <div className="pt-8 text-center border-t border-dashed">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">
            Minutas Platform · © 2026
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
