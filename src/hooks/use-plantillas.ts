import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
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
    updateTemplate: hookUpdateTemplate,
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
  const { isAdmin } = useAdmin();
  const { uploadTemplate: subirAPlantillaNube, isUploading: estaSubiendo } = useUploadTemplate();
  const { syncFromCloud: sincronizarDesdeNube, isSyncing: estaSincronizando } = useSyncTemplates();

  const manejarCambioArchivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = event.target.files;
    if (archivos && archivos.length > 0) {
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        if (!archivo) continue;
        
        await new Promise<void>((resolve) => {
          const lector = new FileReader();
          lector.onload = async (e) => {
            const contenido = e.target?.result as string;
            
            if (archivo.name.endsWith('.json')) {
              try {
                const parsed = JSON.parse(contenido);
                const plantillasAAgregar = Array.isArray(parsed) ? parsed : [parsed];
                
                for (const p of plantillasAAgregar) {
                  if (p && typeof p === 'object' && p.name && p.content) {
                    const existente = templates.find(t => t.name.toLowerCase() === p.name.toLowerCase());
                    if (existente) {
                      await updateTemplate({
                        ...existente,
                        content: p.content,
                        type: p.type || existente.type || 'normal',
                      });
                      if (p.config) {
                        await updateTemplateConfig(existente.id, p.config);
                      }
                    } else {
                      const newId = generateId('template');
                      const nuevaPlantilla: Template = {
                        id: newId,
                        workspace_id: currentWorkspace,
                        name: p.name,
                        content: p.content,
                        type: p.type || 'normal',
                      };
                      await addTemplate(nuevaPlantilla);
                      if (p.config) {
                        await updateTemplateConfig(newId, p.config);
                      }
                    }
                  }
                }
              } catch (err) {
                console.error("Error al parsear el archivo JSON de copia de seguridad", err);
              }
            } else {
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
            }
            resolve();
          };
          lector.readAsText(archivo);
        });
      }
      // Reset input value to allow uploading same files again
      event.target.value = '';
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

  const manejarDescargarTodasTXT = () => {
    templates.forEach((plantilla) => {
      const blob = new Blob([plantilla.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${plantilla.name}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const manejarDescargarBackupJSON = () => {
    if (templates.length === 0) return;
    const dataToExport = templates.map((plantilla) => ({
      name: plantilla.name,
      content: plantilla.content,
      type: plantilla.type,
      config: configs[plantilla.id] || null,
    }));
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `copia-seguridad-plantillas.json`);
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

  const updateTemplate = useCallback(async (updatedTemplate: Template) => {
    const nextId = await hookUpdateTemplate(updatedTemplate);
    if (nextId && nextId !== updatedTemplate.id) {
      setIdPlantillaSeleccionada(nextId);
    }
  }, [hookUpdateTemplate]);

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
    isAdmin,
    usuario,
    estaSubiendo,
    plantillaSeleccionada,
    
    // Acciones
    manejarCambioArchivo,
    manejarClickSubirLocal,
    manejarClickEliminar,
    manejarDescargarPlantilla,
    manejarDescargarTodasTXT,
    manejarDescargarBackupJSON,
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

