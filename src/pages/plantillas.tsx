'use client';

import React from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { TemplateEditor } from '@/components/template/template-editor';
import { TemplateBuilder } from '@/components/template/template-builder';
import { usePlantillas } from '@/hooks/use-plantillas';

// Componentes extraídos (SOLID)
import { PlantillasHeader } from './plantillas/components/plantillas-header';
import { PlantillasSidebar } from './plantillas/components/plantillas-sidebar';
import { PlantillasModals } from './plantillas/components/plantillas-modals';

export default function PlantillasPage() {
  const hook = usePlantillas();
  const { 
    tabActiva, 
    setTabActiva, 
    estaAutenticado, 
    usuario, 
    cerrarSesion, 
    idPlantillaSeleccionada,
    setIdPlantillaSeleccionada,
    plantillaSeleccionada,
    plantillaEditando,
    manejarActualizarContenidoPlantilla,
    addTemplate,
    manejarCancelarEdicion,
    setEsDialogOpenInfo
  } = hook;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <Tabs
        value={tabActiva}
        onValueChange={setTabActiva}
        className="flex-1 flex flex-col min-h-0"
      >
        {/* Cabecera (SRP) */}
        <PlantillasHeader 
          estaAutenticado={estaAutenticado} 
          usuario={usuario} 
          cerrarSesion={cerrarSesion} 
        />

        <TabsContent
          value="editor"
          className="flex-1 h-full min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col animate-in fade-in duration-300"
        >
          <div className="flex flex-1 min-h-0 overflow-hidden h-full sm:p-4 sm:pt-0 gap-6">
            {/* Sidebar (SRP) */}
            <PlantillasSidebar hook={hook} />

            <main
              className={cn(
                'flex-1 h-full min-h-0 min-w-0 relative',
                !idPlantillaSeleccionada ? 'hidden sm:block' : 'block'
              )}
            >
              {/* Cabecera Móvil */}
              {idPlantillaSeleccionada && (
                <div className="sm:hidden border-b p-4 bg-card flex items-center justify-between h-16 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setIdPlantillaSeleccionada(null)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                  <span className="font-bold truncate max-w-[150px]">{plantillaSeleccionada?.name}</span>
                </div>
              )}
              
              {plantillaSeleccionada ? (
                <div className="absolute inset-0 p-4 sm:p-0">
                   <ScrollArea className="h-full w-full" type="always">
                      <div className="p-1">
                        <TemplateEditor
                          key={plantillaSeleccionada.id}
                          template={plantillaSeleccionada}
                          config={
                            (hook.configs[plantillaSeleccionada.id] || {
                              fields: {},
                              sections: [],
                              layout: [],
                            }) as any
                          }
                          onConfigChange={(config) => hook.updateTemplateConfig(plantillaSeleccionada.id, config)}
                          onTemplateChange={hook.updateTemplate}
                        />
                      </div>
                   </ScrollArea>
                </div>
              ) : (
                <Card className="h-full flex items-center justify-center sm:rounded-lg border-2 border-dashed">
                  <CardContent className="text-center space-y-4 p-12">
                    <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Sin selección</h3>
                      <p className="text-sm text-muted-foreground max-w-[280px] mx-auto mt-2">
                        Selecciona una plantilla de la lista o sube una nueva para comenzar a configurar sus campos.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent
          value="builder"
          className="flex-1 min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col animate-in fade-in duration-300"
        >
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 px-4 sm:px-6 lg:px-10 pb-32">
              <TemplateBuilder
                onOpenInfoDialog={() => setEsDialogOpenInfo(true)}
                initialTemplate={plantillaEditando}
                onUpdate={manejarActualizarContenidoPlantilla}
                onAdd={addTemplate}
                onCancel={manejarCancelarEdicion}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Capa de Modales (SRP) */}
      <PlantillasModals hook={hook} />
    </div>
  );
}
