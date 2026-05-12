import React, { useState } from 'react';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Info, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function AppVersionManager() {
  const { config, updateConfig } = useGlobalConfig();
  const [localVersion, setLocalVersion] = useState(config.app_version);

  const handleSave = async () => {
    if (!localVersion.trim()) {
      toast.error('La versión no puede estar vacía');
      return;
    }
    const success = await updateConfig('app_version', localVersion);
    if (success) {
      toast.success('Versión del sistema actualizada');
    }
  };

  const handleReset = () => {
    setLocalVersion(config.app_version);
  };

  return (
    <Card className="rounded-3xl border-muted/60 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Versión del Sistema</CardTitle>
            <CardDescription>Controla la etiqueta de versión que se muestra en toda la app.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-version">Versión Actual</Label>
          <div className="flex gap-2">
            <Input
              id="app-version"
              value={localVersion}
              onChange={(e) => setLocalVersion(e.target.value)}
              placeholder="Ej: v1.4.0-cloud"
              className="rounded-xl font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              disabled={localVersion === config.app_version}
              className="rounded-xl shrink-0"
              title="Restablecer"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={localVersion === config.app_version}
              className="rounded-xl shrink-0"
            >
              <Save className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-lg italic">
          Nota: Este cambio se reflejará instantáneamente en todos los dispositivos conectados mediante WebSockets.
        </p>
      </CardContent>
    </Card>
  );
}
