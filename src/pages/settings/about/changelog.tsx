import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CHANGELOG, CHANGE_TYPE_CONFIG, APP_VERSION } from './data';

export default function AboutChangelogPage() {
  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/settings/about" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Historial de Cambios</h1>
            <p className="text-muted-foreground text-sm">Novedades y correcciones por versión.</p>
          </div>
        </div>

        <div className="space-y-5">
          {CHANGELOG.map((entry) => (
            <Card key={entry.version} className="shadow-lg border-muted/50 overflow-hidden">
              <CardHeader className="pb-3 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ArrowUpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Versión {entry.version}</CardTitle>
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
      </div>
    </ScrollArea>
  );
}
