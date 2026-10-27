'use client';

import React from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { TemplateEditor } from '@/components/template/template-editor';
import { TemplateBuilder } from '@/components/template/template-builder';
import { usePlantillas } from '@/hooks/plantillas';

// Componentes extraídos (SOLID)
import { PlantillasHeader } from './plantillas/components/plantillas-header';
import { PlantillasSidebar } from './plantillas/components/plantillas-sidebar';
import { PlantillasModals } from './plantillas/components/plantillas-modals';

export default function PlantillasPage() {
  const hook = usePlantillas();
  const { 
    tabActiva, 
    setTabActiva, 
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
    <div className="flex flex-col bg-background relative min-h-screen md:h-full overflow-y-auto md:overflow-hidden">
      <Tabs
        value={tabActiva}
        onValueChange={(v) => setTabActiva(v as 'editor' | 'builder')}
        className="flex-1 flex flex-col h-full md:overflow-hidden"
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-32 sm:pb-10 flex flex-col md:flex-1 md:min-h-0">
          {/* Cabecera */}
          <PlantillasHeader />

          <TabsContent
            value="editor"
            className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col sm:data-[state=active]:flex-row md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 ease-in-out gap-6"
          >
            {/* Sidebar de Selección y Acciones */}
            <PlantillasSidebar hook={hook} />

            <main
              className={cn(
                'flex-1 min-h-[400px] md:h-full min-w-0 relative',
                !idPlantillaSeleccionada ? 'hidden sm:block' : 'block'
              )}
            >
              {/* Cabecera Móvil */}
              {idPlantillaSeleccionada && (
                <div className="sm:hidden border-b p-4 bg-card flex items-center justify-between h-16 shrink-0 rounded-t-lg">
                  <Button variant="ghost" size="sm" onClick={() => setIdPlantillaSeleccionada(null)}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                  <span className="font-bold truncate max-w-[150px]">{plantillaSeleccionada?.name}</span>
                </div>
              )}
              
              {plantillaSeleccionada ? (
                <div className="h-full">
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
                    isReadOnly={hook.isCloud && !hook.isAdmin}
                    onTemplateChange={hook.updateTemplate}
                    onOpenBuilder={() => {
                      hook.setPlantillaEditando(plantillaSeleccionada);
                      setTabActiva('builder');
                    }}
                  />
                </div>
              ) : (
                <div className="empty-state-container border rounded-xl bg-card min-h-[400px]">
                  <div className="max-w-md">
                    <div className="empty-state-icon-box">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="empty-state-title text-lg sm:text-xl">Sin plantilla seleccionada</h3>
                    <p className="empty-state-desc max-w-xs mt-2">
                      Selecciona una plantilla de la lista o sube una nueva para comenzar a configurar sus campos.
                    </p>
                  </div>
                </div>
              )}
            </main>
          </TabsContent>

          <TabsContent
            value="builder"
            className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-right-4 duration-500 ease-in-out"
          >
            <TemplateBuilder
              onOpenInfoDialog={() => setEsDialogOpenInfo(true)}
              initialTemplate={plantillaEditando}
              onUpdate={manejarActualizarContenidoPlantilla}
              onAdd={addTemplate}
              onCancel={manejarCancelarEdicion}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Modales y Diálogos */}
      <PlantillasModals hook={hook} />
    </div>
  );
}
