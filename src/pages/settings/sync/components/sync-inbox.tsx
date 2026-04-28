import React from 'react';
import { Inbox, X, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SyncInboxProps {
  hook: any;
}

export const SyncInbox = ({ hook }: SyncInboxProps) => {
  const { configSync, setModoImportacion, reportesBandeja, importarDeBandeja, descartarDeBandeja, sincronizando } = hook;

  return (
    <div className="space-y-6">
      {/* Configuración de Importación */}
      <Card className="border-muted/60">
        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-bold tracking-tight">Importación automática</p>
            <p className="text-xs text-muted-foreground max-w-[250px] leading-snug">
              {configSync.importMode === 'auto'
                ? 'Los reportes entran directamente a Novedades.'
                : 'Los reportes van a la bandeja para aprobación manual.'}
            </p>
          </div>
          <Switch
            checked={configSync.importMode === 'auto'}
            onCheckedChange={(v) => setModoImportacion(v ? 'auto' : 'inbox')}
          />
        </CardContent>
      </Card>

      {/* Listado de Bandeja */}
      {configSync.importMode === 'inbox' && (
        <Card className="animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3 border-b bg-muted/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary" />
                Bandeja de Entrada
                {reportesBandeja.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[10px] h-5 rounded-full px-2 font-black">
                    {reportesBandeja.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">Reportes recibidos pendientes de revisión.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {reportesBandeja.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-10" />
                <p className="font-medium">No hay reportes pendientes</p>
                <p className="text-[10px] uppercase mt-1 tracking-widest opacity-60">Todo al día</p>
              </div>
            ) : (
              <div className="divide-y">
                {reportesBandeja.map((sr: any) => (
                  <div
                    key={sr.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                      <Inbox className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate leading-tight">{sr.reportData.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-bold text-foreground/70">{sr.sourceDevice}</span> ·{' '}
                        {format(new Date(sr.sentAt), "d MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                        onClick={() => descartarDeBandeja(sr)}
                        title="Descartar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-green-600 hover:bg-green-500/10 border border-transparent hover:border-green-500/20"
                        onClick={() => importarDeBandeja(sr)}
                        disabled={sincronizando}
                        title="Importar"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
