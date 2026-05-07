import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useUploadTemplate } from '@/hooks/use-upload-template';
import { useTemplates } from '@/hooks/use-templates';
import { useSyncTemplates } from '@/hooks/use-sync-templates';
import type { Template } from '@/lib/types';
import { generateId } from '@/lib/utils/id';
import { useWorkspaceManager } from '@/lib/db/db-context';

export function usePlantillas() {
  const {
    templates,
    addTemplate,
    removeTemplate,
    updateTemplate,
    configs,
    updateTemplateConfig,
    clearAllTemplates,
  } = useTemplates();
  const { currentWorkspace } = useWorkspaceManager();
  
  const [idPlantillaSeleccionada, setIdPlantillaSeleccionada] = useState<string | null>(null);
  const [plantillaAEliminar, setPlantillaAEliminar] = useState<string | null>(null);
  const [esDialogOpenInfo, setEsDialogOpenInfo] = useState(false);
  const [plantillaEditando, setPlantillaEditando] = useState<Template | null>(null);
  const [tabActiva, setTabActiva] = useState('editor');
  const [esDialogOpenNube, setEsDialogOpenNube] = useState(false);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { isAuthenticated: estaAutenticado, user: usuario, signOut: cerrarSesion } = useAuth();
  const { uploadTemplate: subirAPlantillaNube, isUploading: estaSubiendo } = useUploadTemplate();
  const { syncFromCloud: sincronizarDesdeNube, isSyncing: estaSincronizando } = useSyncTemplates();

  const manejarCambioArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (archivo) {
      const lector = new FileReader();
      lector.onload = (e) => {
        const contenido = e.target?.result as string;
        const nombre = archivo.name.replace(/\.txt$/, '');
        
        const existente = templates.find(t => t.name.toLowerCase() === nombre.toLowerCase());
        
        if (existente) {
          updateTemplate({
            ...existente,
            content: contenido,
          });
        } else {
          const nuevaPlantilla: Template = {
            id: generateId('template'),
            workspace_id: currentWorkspace,
            name: nombre,
            content: contenido,
            type: 'normal',
          };
          addTemplate(nuevaPlantilla);
        }
      };
      lector.readAsText(archivo);
    }
  };

  const manejarClickSubirLocal = () => {
    inputArchivoRef.current?.click();
  };

  const manejarClickEliminar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPlantillaAEliminar(id);
  };

  const manejarDescargarPlantilla = (e: React.MouseEvent, plantilla: Template) => {
    e.stopPropagation();
    const blob = new Blob([plantilla.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${plantilla.name}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const manejarClickEditarContenido = (e: React.MouseEvent, plantilla: Template) => {
    e.stopPropagation();
    setPlantillaEditando(plantilla);
    setTabActiva('builder');
  };

  const manejarSubirANube = async (e: React.MouseEvent, plantilla: Template) => {
    e.stopPropagation();
    if (!estaAutenticado) {
      navigate('/login?redirect=/plantillas');
      return;
    }
    await subirAPlantillaNube(plantilla);
  };

  const manejarConfirmarEliminacion = () => {
    if (!plantillaAEliminar) return;

    if (plantillaAEliminar === 'ALL') {
      clearAllTemplates();
      setIdPlantillaSeleccionada(null);
    } else {
      if (idPlantillaSeleccionada === plantillaAEliminar) {
        setIdPlantillaSeleccionada(null);
      }
      removeTemplate(plantillaAEliminar);
    }
    setPlantillaAEliminar(null);
  };

  const manejarActualizarContenidoPlantilla = (id: string, updates: Partial<Template>) => {
    const plantillaActual = templates.find((t) => t.id === id);
    if (plantillaActual) {
      updateTemplate({ ...plantillaActual, ...updates });
    }
    setPlantillaEditando(null);
  };

  const manejarCancelarEdicion = () => {
    setPlantillaEditando(null);
  };

  const plantillaSeleccionada = templates.find((t) => t.id === idPlantillaSeleccionada) || null;

  return {
    // Estado
    templates,
    configs,
    idPlantillaSeleccionada,
    setIdPlantillaSeleccionada,
    plantillaAEliminar,
    setPlantillaAEliminar,
    esDialogOpenInfo,
    setEsDialogOpenInfo,
    plantillaEditando,
    setPlantillaEditando,
    tabActiva,
    setTabActiva,
    esDialogOpenNube,
    setEsDialogOpenNube,
    inputArchivoRef,
    estaAutenticado,
    usuario,
    estaSubiendo,
    plantillaSeleccionada,
    
    // Acciones
    manejarCambioArchivo,
    manejarClickSubirLocal,
    manejarClickEliminar,
    manejarDescargarPlantilla,
    manejarClickEditarContenido,
    manejarSubirANube,
    manejarConfirmarEliminacion,
    manejarActualizarContenidoPlantilla,
    manejarCancelarEdicion,
    updateTemplate,
    updateTemplateConfig,
    addTemplate,
    cerrarSesion,
    subirAPlantillaNube,
    sincronizarDesdeNube,
    estaSincronizando,
  };
}

