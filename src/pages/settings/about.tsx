import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_VERSION } from './about/data';
import { Info } from 'lucide-react';
import { AboutModuleList } from './about/components/about-module-list';

export default function SettingsAboutPage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Sticky Top Header */}
      <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              Acerca de
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Versión <span className="text-primary font-semibold">{APP_VERSION}</span> · Recursos e información de la plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          {/* Listado de Módulos */}
          <AboutModuleList />

          {/* Footer simple */}
          <div className="pt-4 text-center border-t border-dashed">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">
              Minutas Platform · © 2026
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
