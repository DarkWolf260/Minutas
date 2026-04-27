import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useDrafts } from '@/hooks/use-drafts';
import { useActiveGuard } from '@/hooks/use-active-guard';
import { sortReports } from '@/lib/report-sorter';
import { normalizeString } from '@/lib/utils';
import type { Report, Template } from '@/lib/types';
import type { ReportGeneratorRef } from '@/components/report/report-generator';

export function useNovedades() {
  const { reports, addReport, updateReport, removeReport, clearAllReports } = useReports();
  const { templates, configs } = useTemplates();
  const { draft, clearDraft, isLoaded: draftCargado } = useDrafts();
  const { isGuardOpen: guardiaAbierta } = useActiveGuard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const generatorRef = useRef<ReportGeneratorRef>(null);

  const [estaMontado, setEstaMontado] = useState(false);
  const [idReporteSeleccionado, setIdReporteSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [reporteAEliminar, setReporteAEliminar] = useState<string | null>(null);
  const [esDialogOpenCrear, setEsDialogOpenCrear] = useState(false);
  const [creandoReporte, setCreandoReporte] = useState<Template | null>(null);
  const [datosBorradorInicial, setDatosBorradorInicial] = useState<Record<string, any> | undefined>(undefined);
  const [estaNavegandoAtras, setEstaNavegandoAtras] = useState(false);
  const [ordenamiento, setOrdenamiento] = useState<'asc' | 'desc'>('desc');
  const manualSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (estaNavegandoAtras) {
      const timer = setTimeout(() => setEstaNavegandoAtras(false), 300);
      return () => clearTimeout(timer);
    }
  }, [estaNavegandoAtras]);

  const reportesOrdenados = useMemo(() => {
    return sortReports(reports, ordenamiento);
  }, [reports, ordenamiento]);

  const reportesFiltrados = useMemo(() => {
    let resultado = reportesOrdenados;
    const query = normalizeString(busqueda);
    if (query) {
      resultado = resultado.filter(
        (report: Report) =>
          normalizeString(report.title).includes(query) ||
          normalizeString(report.content).includes(query)
      );
    }
    return resultado;
  }, [reportesOrdenados, busqueda]);

  useEffect(() => {
    if (!estaMontado) {
      setEstaMontado(true);
    }
    const abrirDialogoCrear = () => setEsDialogOpenCrear(true);
    window.addEventListener('open-novedades-create', abrirDialogoCrear);
    return () => window.removeEventListener('open-novedades-create', abrirDialogoCrear);
  }, [estaMontado]);

  const manejarEliminarReporte = useCallback(async (id: string) => {
    setReporteAEliminar(null);
    await removeReport(id);
    if (idReporteSeleccionado === id) {
      navigate('/');
      setIdReporteSeleccionado(null);
    }
  }, [removeReport, idReporteSeleccionado, navigate]);

  const manejarLimpiarTodo = useCallback(async () => {
    setReporteAEliminar(null);
    await clearAllReports();
  }, [clearAllReports]);

  const manejarSeleccionarPlantilla = useCallback((templateId: string) => {
    const plantilla = templates.find((t: Template) => t.id === templateId);
    if (plantilla) {
      generatorRef.current?.cancel();
      setDatosBorradorInicial(undefined);
      setIdReporteSeleccionado(null);
      setCreandoReporte(plantilla);
      setEsDialogOpenCrear(false);
      navigate('/');
    }
  }, [templates, navigate]);

  const manejarSeleccionarReporte = useCallback((id: string | null, isBack = false) => {
    manualSelectionRef.current = id || 'CLEAR';
    setEstaNavegandoAtras(isBack);
    setCreandoReporte(null);
    setIdReporteSeleccionado(id);
    if (id) navigate(`/?selected=${id}`);
    else navigate('/');
  }, [navigate]);

  const manejarGuardarNuevoReporte = useCallback(async (report: Report) => {
    setEstaNavegandoAtras(true);
    await clearDraft();
    await addReport(report);
    setDatosBorradorInicial(undefined);
    setCreandoReporte(null);
    manualSelectionRef.current = report.id;
    setIdReporteSeleccionado(report.id);
    navigate(`/?selected=${report.id}`);
  }, [clearDraft, addReport, navigate]);

  const manejarCancelarCreacion = useCallback(async () => {
    setEstaNavegandoAtras(true);
    generatorRef.current?.cancel();
    await clearDraft();
    setCreandoReporte(null);
    setDatosBorradorInicial(undefined);
    manualSelectionRef.current = 'CLEAR';
    setIdReporteSeleccionado(null);
    navigate('/');
  }, [clearDraft, navigate]);

  const reporteSeleccionado = useMemo(() => {
    if (creandoReporte) return null;
    return reports.find((report) => report.id === idReporteSeleccionado) ?? null;
  }, [idReporteSeleccionado, reports, creandoReporte]);

  // Sincronización con URL y Borradores
  useEffect(() => {
    if (!estaMontado || !draftCargado) return;
    const preSelectedId = searchParams.get('selected');

    if (draft && !preSelectedId && !creandoReporte && !idReporteSeleccionado && !estaNavegandoAtras) {
      const template = templates.find((t: Template) => t.id === draft.templateId);
      if (template) {
        setDatosBorradorInicial(draft.formData);
        setCreandoReporte(template);
      }
    }
  }, [estaMontado, draftCargado, draft, templates, searchParams, creandoReporte, idReporteSeleccionado, estaNavegandoAtras]);

  useEffect(() => {
    if (!estaMontado) return;
    if (searchParams.get('new') === 'true' && !creandoReporte) {
      const sp = new URLSearchParams(searchParams);
      sp.delete('new');
      window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`);
      window.dispatchEvent(new CustomEvent('open-novedades-create'));
    }
  }, [estaMontado, searchParams, creandoReporte]);

  useEffect(() => {
    if (!estaMontado) return;
    if (creandoReporte || estaNavegandoAtras) return;

    const urlId = searchParams.get('selected');
    
    // Si hay una selección manual en curso, esperamos a que la URL coincida antes de permitir sync externo
    if (manualSelectionRef.current !== null) {
      const targetId = manualSelectionRef.current === 'CLEAR' ? null : manualSelectionRef.current;
      if (urlId === targetId) {
        manualSelectionRef.current = null;
      }
      return;
    }

    if (urlId) {
      if (urlId !== idReporteSeleccionado) {
        const report = reports.find((r: Report) => r.id === urlId);
        if (report) {
          setIdReporteSeleccionado(urlId);
        }
      }
    } else if (idReporteSeleccionado) {
      setIdReporteSeleccionado(null);
    }
  }, [estaMontado, searchParams, idReporteSeleccionado, creandoReporte, reports, estaNavegandoAtras]);

  return {
    // Estado
    estaMontado,
    idReporteSeleccionado,
    setIdReporteSeleccionado,
    busqueda,
    setBusqueda,
    reporteAEliminar,
    setReporteAEliminar,
    esDialogOpenCrear,
    setEsDialogOpenCrear,
    creandoReporte,
    setCreandoReporte,
    datosBorradorInicial,
    setDatosBorradorInicial,
    estaNavegandoAtras,
    setEstaNavegandoAtras,
    ordenamiento,
    setOrdenamiento,
    reportesFiltrados,
    reporteSeleccionado,
    guardiaAbierta,
    templates,
    configs,
    reports,
    generatorRef,
    
    // Handlers
    manejarEliminarReporte,
    manejarLimpiarTodo,
    manejarSeleccionarPlantilla,
    manejarGuardarNuevoReporte,
    manejarCancelarCreacion,
    manejarSeleccionarReporte,
    updateReport,
    navigate,
  };
}
