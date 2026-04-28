import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { LoginDialog } from '@/components/auth/login-dialog';
import { CloudTemplatesDialog } from '@/components/template/cloud-templates-dialog';

interface PlantillasModalsProps {
  hook: any;
}

export const PlantillasModals = ({ hook }: PlantillasModalsProps) => {
  const { 
    plantillaAEliminar, 
    setPlantillaAEliminar, 
    manejarConfirmarEliminacion,
    esDialogOpenNube,
    setEsDialogOpenNube,
    esDialogOpenLogin,
    setEsDialogOpenLogin,
    plantillaParaSubir,
    setPlantillaParaSubir,
    subirAPlantillaNube,
    esDialogOpenInfo,
    setEsDialogOpenInfo
  } = hook;

  return (
    <>
      <ConfirmDialog
        open={!!plantillaAEliminar}
        onOpenChange={(open) => !open && setPlantillaAEliminar(null)}
        onConfirm={manejarConfirmarEliminacion}
        title="¿Eliminar plantilla?"
        message={plantillaAEliminar === 'ALL'
          ? 'Esta acción no se puede deshacer. Se eliminarán permanentemente TODAS las plantillas.'
          : 'Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.'}
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      <CloudTemplatesDialog 
        open={esDialogOpenNube} 
        onOpenChange={setEsDialogOpenNube} 
      />
      
      <LoginDialog
        open={esDialogOpenLogin}
        onOpenChange={setEsDialogOpenLogin}
        onSuccess={() => {
          if (plantillaParaSubir) {
            subirAPlantillaNube(plantillaParaSubir);
            setPlantillaParaSubir(null);
          }
        }}
      />

      <Dialog open={esDialogOpenInfo} onOpenChange={setEsDialogOpenInfo}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Guía de Plantillas</DialogTitle>
            <DialogDescription>Aprende a usar la sintaxis para crear formularios dinámicos.</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-0" type="always">
            <div className="p-6 pt-2 space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-base mb-2">1. Campos Básicos</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Usa llaves para definir variables: <code>{`{Nombre del Campo}`}</code>.
                  </p>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs">
                    El incidente ocurrió en {`{Lugar}`} a las {`{Hora}`}.
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-base mb-2">2. Secciones</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Usa corchetes para agrupar: <code>[&quot;Nombre Sección&quot;]</code>.
                  </p>
                  <div className="bg-muted p-3 rounded-md font-mono text-xs">
                    [&quot;Datos del Vehículo&quot; {`{Placa}`} {`{Color}`}]
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    * Añade un asterisco al final para secciones repetibles: <code>[&quot;Título&quot;]*</code>
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-bold text-base mb-2">3. Tipos de Datos</h4>
                  <p className="text-sm text-muted-foreground mb-2">Puedes forzar el tipo de entrada:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs font-mono">
                    <li>{`{Descripción:textarea}`}</li>
                    <li>{`{Fecha:date}`}</li>
                    <li>{`{Ubicación:dropdown(Pto 1|Pto 2)}`}</li>
                  </ul>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-bold text-primary text-sm mb-1">💡 Pro Tip</h4>
                  <p className="text-xs text-muted-foreground">
                    Si dejas una sección vacía como <code>[&quot;&quot;]</code> creará un separador visual en el reporte final.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-2 border-t">
            <DialogClose asChild>
              <Button className="w-full sm:w-auto">Entendido</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
