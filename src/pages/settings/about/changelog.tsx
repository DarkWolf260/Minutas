import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ArrowUpCircle, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CHANGELOG, CHANGE_TYPE_CONFIG, APP_VERSION } from './data';

export default function AboutChangelogPage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Sticky Top Header */}
      <div className="border-b shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/settings/about">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" />
                Historial de Cambios
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Novedades y correcciones por versión
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 min-h-0" type="always">
        <div className="max-w-4xl mx-auto w-full p-4 sm:px-6 lg:px-8 py-6 space-y-5 pb-32">
          {CHANGELOG.map((entry) => (
            <Card key={entry.version} className="shadow-xs border-muted/60 overflow-hidden">
              <CardHeader className="pb-3 bg-muted/10 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ArrowUpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">Versión {entry.version}</CardTitle>
                      <CardDescription className="text-xs">{entry.date}</CardDescription>
                    </div>
                  </div>
                  {entry.version === APP_VERSION && (
                    <Badge className="text-[10px] font-bold" variant="default">Actual</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {entry.changes.map((change, idx) => {
                  const { label, icon: ChangeIcon, className } = CHANGE_TYPE_CONFIG[change.type];
                  return (
                    <div key={idx} className="flex items-start gap-3 py-1.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide shrink-0 mt-0.5',
                        className
                      )}>
                        <ChangeIcon className="h-2.5 w-2.5" />
                        {label}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">{change.text}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
