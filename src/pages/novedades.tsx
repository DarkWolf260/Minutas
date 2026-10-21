import React, { Suspense, memo, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/ui';
import { useNovedades } from '@/hooks/novedades';
import { useSettings } from '@/hooks/configuracion';
import { useWhatsAppBot } from '@/hooks/whatsapp';
import { cn } from '@/lib/utils';
import { NoGuardBanner } from '@/components/guards/guard-selector';

// Componentes extraídos (SOLID)
import { NovedadSidebar } from './novedades/components/novedad-sidebar';
import { NovedadMainContent } from './novedades/components/novedad-main-content';
import { NovedadModals } from './novedades/components/novedad-modals';
import { MobileHeader } from './novedades/components/mobile-header';
import { WhatsAppChatView } from './novedades/components/whatsapp-chat/whatsapp-chat-view';

function NovedadesPageContent() {
  const isMobile = useIsMobile();
  const hook = useNovedades();
  const { 
    idReporteSeleccionado, 
    creandoReporte, 
    guardiaAbierta 
  } = hook;

  const { settings } = useSettings();
  const bot = useWhatsAppBot(settings?.whatsapp_local_url || 'http://localhost:3001');
  const isBotConnected = (bot.isAvailable && bot.status.isReady) || bot.isCloudActive;

  const [vistaSidebar, setVistaSidebar] = useState<'lista' | 'whatsapp'>(() => {
    return (localStorage.getItem('novedades_vista_sidebar') as 'lista' | 'whatsapp') || 'lista';
  });
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Si el bot no está conectado una vez cargado su estado, asegurar que la vista vuelva a la lista
  useEffect(() => {
    if (!bot.isLoading && !isBotConnected) {
      if (vistaSidebar !== 'lista') {
        setVistaSidebar('lista');
      }
      if (isChatExpanded) {
        setIsChatExpanded(false);
      }
    }
  }, [bot.isLoading, isBotConnected, vistaSidebar, isChatExpanded]);

  const handleCambiarVista = (vista: 'lista' | 'whatsapp') => {
    setVistaSidebar(vista);
    localStorage.setItem('novedades_vista_sidebar', vista);
    if (vista === 'lista') {
      setIsChatExpanded(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full w-full bg-background overflow-hidden sm:flex-row flex-1">
        {/* Sidebar Lateral */}
        <NovedadSidebar
          hook={hook}
          isMobile={isMobile}
          vistaSidebar={vistaSidebar}
          onCambiarVistaSidebar={handleCambiarVista}
          isChatExpanded={isChatExpanded}
          onToggleExpandChat={() => setIsChatExpanded(!isChatExpanded)}
        />

        {/* Área Principal */}
        <main
          className={cn(
            'flex-1 flex flex-col min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300',
            !idReporteSeleccionado && !creandoReporte && !(isChatExpanded && isBotConnected) ? 'hidden sm:flex' : 'flex'
          )}
        >
          <MobileHeader hook={hook} isMobile={isMobile} />

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {isChatExpanded && isBotConnected ? (
              <WhatsAppChatView
                reports={hook.reports || hook.reportesFiltrados}
                templates={hook.templates}
                selectedReportId={hook.idReporteSeleccionado}
                onSelectReport={hook.manejarSeleccionarReporte}
                guardiaAbierta={guardiaAbierta}
                isExpanded={true}
                onToggleExpand={() => setIsChatExpanded(false)}
                onOpenCreateDialog={() => hook.setEsDialogOpenCrear(true)}
              />
            ) : !guardiaAbierta && !idReporteSeleccionado && !creandoReporte ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 h-full">
                <NoGuardBanner
                  message="Para registrar nuevas novedades o gestionar reportes, primero debes abrir una nueva guardia."
                  allowOpenHere
                />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex-1 p-6">
                    <div className="h-full w-full bg-muted/20 rounded-lg animate-pulse"></div>
                  </div>
                }
              >
                <NovedadMainContent hook={hook} />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {/* Capa de Diálogos y Modales */}
      <NovedadModals 
        isMobile={isMobile}
        estaMontado={hook.estaMontado}
        reporteAEliminar={hook.reporteAEliminar}
        setReporteAEliminar={hook.setReporteAEliminar}
        manejarLimpiarTodo={hook.manejarLimpiarTodo}
        manejarEliminarReporte={hook.manejarEliminarReporte}
        esDialogOpenCrear={hook.esDialogOpenCrear}
        setEsDialogOpenCrear={hook.setEsDialogOpenCrear}
        templates={hook.templates}
        manejarSeleccionarPlantilla={hook.manejarSeleccionarPlantilla}
        navigate={hook.navigate}
        isConfirmExportOpen={hook.isConfirmExportOpen}
        setIsConfirmExportOpen={hook.setIsConfirmExportOpen}
        ejecutarExportacionWord={hook.ejecutarExportacionWord}
      />
    </>
  );
}

export default memo(NovedadesPageContent);
