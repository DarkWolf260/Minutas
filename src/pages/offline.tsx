'use client';

import { WifiOff, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 pt-10">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WifiOff className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Sin Conexión</CardTitle>
          <CardDescription>Parece que no tienes acceso a internet en este momento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center pt-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              La aplicación puede funcionar sin conexión si ya has visitado las páginas
              anteriormente (se guardan en caché).
            </p>
            <p className="mt-2 text-primary font-medium">
              Tus reportes y personal se guardan localmente y se sincronizarán cuando vuelvas a
              estar en línea.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="default" className="flex-1" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => (window.location.href = '/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
