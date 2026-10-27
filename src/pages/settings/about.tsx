import { ScrollArea } from '@/components/ui/scroll-area';
import { AboutModuleList } from './about/components/about-module-list';

export default function SettingsAboutPage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-32">
          {/* Listado de Módulos */}
          <AboutModuleList />

          {/* Footer simple */}
          <div className="pt-4 text-center border-t border-border/60">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-widest">
              Minutas Platform · © 2026
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
