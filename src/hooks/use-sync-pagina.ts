import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSyncManager } from '@/hooks/use-sync';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function useSyncPagina() {
  const { isAuthenticated: estaAutenticado, user: usuario, signOut } = useAuth();
  const {
    syncConfig: configSync,
    inboxReports: reportesBandeja,
    isSyncing: sincronizando,
    isPrimary: esPrincipal,
    isSecondary: esSecundario,
    isConfigured: estaConfigurado,
    setupAsPrimary: configurarComoPrincipal,
    setupAsSecondary: configurarComoSecundario,
    importFromInbox: importarDeBandeja,
    discardFromInbox: descartarDeBandeja,
    resetSync: reiniciarSync,
    setImportMode: setModoImportacion,
  } = useSyncManager();

  const [nombreDispositivo, setNombreDispositivo] = useState('');
  const [codigoUnion, setCodigoUnion] = useState('');
  const [modo, setModo] = useState<'primary' | 'secondary'>('primary');
  const [esConfirmarReinicioOpen, setEsConfirmarReinicioOpen] = useState(false);
  const navigate = useNavigate();

  const manejarConfiguracion = async () => {
    if (!estaAutenticado) {
      navigate('/login?redirect=/settings/sync');
      return;
    }
    if (!nombreDispositivo.trim()) {
      toast.error('Ingresa un nombre para este dispositivo.');
      return;
    }
    if (modo === 'primary') {
      await configurarComoPrincipal(nombreDispositivo.trim());
    } else {
      if (!codigoUnion.trim()) {
        toast.error('Ingresa el código del dispositivo principal.');
        return;
      }
      await configurarComoSecundario(nombreDispositivo.trim(), codigoUnion.trim());
    }
  };

  const manejarCopiarCodigo = () => {
    navigator.clipboard.writeText(configSync.channelCode ?? '');
    toast.success('Código copiado al portapapeles.');
  };

  return {
    // Estado
    estaAutenticado,
    usuario,
    signOut,
    configSync,
    reportesBandeja,
    sincronizando,
    esPrincipal,
    esSecundario,
    estaConfigurado,
    nombreDispositivo,
    setNombreDispositivo,
    codigoUnion,
    setCodigoUnion,
    modo,
    setModo,
    esConfirmarReinicioOpen,
    setEsConfirmarReinicioOpen,
    
    // Acciones
    manejarConfiguracion,
    manejarCopiarCodigo,
    importarDeBandeja,
    descartarDeBandeja,
    reiniciarSync,
    setModoImportacion,
  };
}
