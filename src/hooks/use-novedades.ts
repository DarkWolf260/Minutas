import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useReports } from '@/hooks/use-reports';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';
import { useTemplates } from '@/hooks/use-templates';
import { useDrafts } from '@/hooks/use-drafts';
import { useActiveGuard } from '@/hooks/use-active-guard';
import { sortReports, findValueInform_data } from '@/lib/report-sorter';
import { normalizeString } from '@/lib/utils';
import { useOrdenDelDiaDraft } from '@/hooks/use-orden-del-dia-draft';
import { renderFinalReport, parseTemplate } from '@/lib/template-parser';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useRoles } from '@/hooks/use-roles';
import { useAdmin } from '@/hooks/use-admin';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { LEADER_ROLES } from '@/lib/constants/roles';
import type { Report, Template, StaffMember } from '@/lib/types';
import type { ReportGeneratorRef } from '@/components/report/report-generator';

export function useNovedades() {
  const { reports, addReport, updateReport, removeReport, clearAllReports } = useReports();
  const { templates, configs } = useTemplates();
  const { draft, clearDraft, isLoaded: draftCargado } = useDrafts();
  const { isGuardOpen: guardiaAbierta, settings, activeGuard } = useActiveGuard();
  const { definitions } = useFieldDefinitions();
  const { roles } = useRoles();
  const { draft: cloudDraft } = useOrdenDelDiaDraft();
  const { isAdmin } = useAdmin();
  const { config: globalConfig } = useGlobalConfig();
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
  const [isConfirmExportOpen, setIsConfirmExportOpen] = useState(false);
  const [reporteADuplicar, setReporteADuplicar] = useState<string | null>(null);
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
    toast.success('Reporte eliminado.');
    if (idReporteSeleccionado === id) {
      navigate('/');
      setIdReporteSeleccionado(null);
    }
  }, [removeReport, idReporteSeleccionado, navigate]);

  const manejarDuplicarReporte = useCallback((id: string) => {
    setReporteADuplicar(id);
  }, []);

  const manejarConfirmarDuplicacion = useCallback(async () => {
    if (reporteADuplicar) {
      const original = reports.find(r => r.id === reporteADuplicar);
      if (original) {
        const newId = generateId();
        const duplicated: Report = {
          ...original,
          id: newId,
          timestamp: new Date().toISOString(),
          whatsapp_message_ids: undefined
        };
        await addReport(duplicated);
        toast.success('Reporte duplicado con éxito.');
        navigate(`/?selected=${newId}`);
        setIdReporteSeleccionado(newId);
      }
      setReporteADuplicar(null);
    }
  }, [reporteADuplicar, reports, addReport, navigate]);

  const manejarLimpiarTodo = useCallback(async () => {
    setReporteAEliminar(null);
    await clearAllReports();
  }, [clearAllReports]);

  const manejarSeleccionarPlantilla = useCallback((template_id: string) => {
    const plantilla = templates.find((t: Template) => t.id === template_id);
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

    if (draft && guardiaAbierta && !preSelectedId && !creandoReporte && !idReporteSeleccionado && !estaNavegandoAtras) {
      const template = templates.find((t: Template) => t.id === draft.template_id);
      if (template) {
        setDatosBorradorInicial(draft.form_data);
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

  // Handle auto-report creation from Kanban activities
  useEffect(() => {
    if (!estaMontado) return;
    if (searchParams.get('from_activity') !== 'true') return;
    if (creandoReporte) return;
    if (templates.length === 0) return;

    // Clean URL param immediately
    const sp = new URLSearchParams(searchParams);
    sp.delete('from_activity');
    const newUrl = sp.toString() ? `${window.location.pathname}?${sp.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);

    // Read activity data from sessionStorage
    let activityData: { time?: string; text?: string; category?: string; date?: string } | null = null;
    try {
      const raw = sessionStorage.getItem('minutas_activity_to_report');
      if (raw) {
        activityData = JSON.parse(raw);
        sessionStorage.removeItem('minutas_activity_to_report');
      }
    } catch (e) { /* ignore */ }

    if (!activityData || !activityData.category) return;

    // Map kanban category → template name keyword for fuzzy matching
    const CATEGORY_TO_TEMPLATE_KEYWORD: Record<string, string> = {
      'guardia': 'guardia preventiva',
      'apoyo': 'guardia preventiva', // fallback to guardia preventiva
      'inspeccion': 'inspecci', // partial match for "Inspección"
      'reunion': 'capacitaci', // partial match for "Capacitación"
      'monitoreo': 'guardia preventiva', // fallback
      'otro': 'guardia preventiva', // fallback
    };

    const keyword = CATEGORY_TO_TEMPLATE_KEYWORD[activityData.category] || 'guardia preventiva';

    // Find matching template (case-insensitive, partial match)
    const matchedTemplate = templates.find((t: Template) =>
      t.name.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!matchedTemplate) {
      // Fallback: open the template selector dialog
      window.dispatchEvent(new CustomEvent('open-novedades-create'));
      return;
    }

    // Parse the template to get default values for textarea fields
    const parsed = parseTemplate(matchedTemplate.content);
    const initialFormData: Record<string, any> = {};

    // Compute time-of-day period from the activity's time (HH:MM format or "HH:MM HLV")
    const getTimePeriodText = (timeStr: string): string => {
      const digits = timeStr.replace(/\D/g, '').slice(0, 4);
      const hour = digits.length >= 2 ? parseInt(digits.slice(0, 2), 10) : -1;
      if (hour >= 6 && hour < 12) return 'mañana';
      if (hour >= 12 && hour < 18) return 'tarde';
      if (hour >= 18 || (hour >= 0 && hour < 6)) return 'noche';
      return 'mañana'; // fallback
    };

    const timePeriod = activityData.time ? getTimePeriodText(activityData.time) : 'mañana';
    const activityName = activityData.text || '';

    // Pre-fill the Hora field
    if (activityData.time && parsed.fieldNames.has('Hora')) {
      initialFormData['Hora'] = activityData.time;
    }

    // Pre-fill the Fecha field
    if (activityData.date && parsed.fieldNames.has('Fecha')) {
      // Convert YYYY-MM-DD to DD/MM/YYYY
      const [y, m, d] = activityData.date.split('-');
      if (y && m && d) {
        initialFormData['Fecha'] = `${d}/${m}/${y}`;
      }
    }

    // Find textarea fields with default values containing "-------" and replace them
    parsed.defaultValues.forEach((defaultVal, fieldId) => {
      const fieldType = parsed.fieldTypes.get(fieldId);
      if (fieldType === 'textarea' && defaultVal.includes('-------')) {
        // Replace dashes: first occurrence with time period, second with activity name
        let replacementCount = 0;
        const filledText = defaultVal.replace(/-{3,}/g, (_match) => {
          replacementCount++;
          if (replacementCount === 1) return timePeriod;
          if (replacementCount === 2) return activityName;
          return _match; // leave additional dashes untouched
        });
        initialFormData[fieldId] = filledText;
      }
    });

    // Set initial data and start creating the report
    generatorRef.current?.cancel();
    setDatosBorradorInicial(Object.keys(initialFormData).length > 0 ? initialFormData : undefined);
    setIdReporteSeleccionado(null);
    setCreandoReporte(matchedTemplate);
    setEsDialogOpenCrear(false);
    navigate('/');
  }, [estaMontado, searchParams, creandoReporte, templates, navigate]);

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
    isConfirmExportOpen,
    setIsConfirmExportOpen,
    manejarExportarTodasWord: useCallback(async () => {
      if (reportesFiltrados.length === 0) {
        toast.info('No hay novedades para exportar');
        return;
      }
      setIsConfirmExportOpen(true);
    }, [reportesFiltrados.length]),

    ejecutarExportacionWord: useCallback(async () => {
      const { exportReportToWord } = await import('@/lib/export-word');
      const { format } = await import('date-fns');

      // 1. Preparar Configuraciones Globales (Director, Municipio, etc)
      const settingsMap: Record<string, string> = {};
      Object.keys(definitions).forEach((key) => {
        if (definitions[key]?.value) {
          settingsMap[key] = definitions[key]!.value!;
        }
      });

      const configuracionesGlobales = Object.values(configs).reduce(
        (acc: any, config: any) => {
          Object.keys(config.fields).forEach((fieldName) => {
            const field = config.fields[fieldName];
            if (field && field.type === 'predefined' && field.value) {
              acc[fieldName] = field.value;
            }
          });
          return acc;
        },
        settingsMap
      );

      const disabled_modules = [
        ...(settings.disabled_modules || []),
        ...(isAdmin ? (globalConfig.disabled_modules_admins || []) : [])
      ];
      const ordenDelDiaDeshabilitado = disabled_modules.includes('orden-del-dia');
      const borrador = !ordenDelDiaDeshabilitado 
        ? ((cloudDraft && cloudDraft.guard_id === settings.active_guard_id) ? cloudDraft : settings.orden_del_dia_draft)
        : undefined;
      const personalParaReporte = (borrador && borrador.guard_id === settings.active_guard_id)
        ? borrador.staff
        : activeGuard?.staff;

      const formatearMiembro = (member: StaffMember | string): string => {
        if (typeof member === 'string') return member;
        const parts: string[] = [];
        if (member.rank && member.rank !== 'Sin jerarquía') parts.push(member.rank);
        if (member.titulo) parts.push(member.titulo);
        parts.push(member.name);
        return parts.filter(Boolean).join(' ').trim();
      };

      const obtenerObjetoLider = (roleName: string) => {
        if (personalParaReporte) {
          const key = Object.keys(personalParaReporte).find(
            (k) => k.toLowerCase() === roleName.toLowerCase()
          );
          if (key) {
            const members = (personalParaReporte as any)[key];
            return members ? members[0] : undefined;
          }
        }
        return undefined;
      };

      const directorObj = obtenerObjetoLider(LEADER_ROLES.DIRECTOR);
      const jefeOpsObj = obtenerObjetoLider(LEADER_ROLES.JEFE_OPERACIONES);

      const director = directorObj ? formatearMiembro(directorObj).trim() : '';
      const jefeDeOperaciones = jefeOpsObj ? formatearMiembro(jefeOpsObj).trim() : '';

      const idGuardiaParaReporte = (borrador && borrador.guard_id === settings.active_guard_id)
        ? borrador.guard_id || ''
        : (activeGuard?.id || settings.active_guard_id || '');
      
      const obtenerFechaOrdenamiento = (novedad: Report): Date | null => {
        const fechaStr = findValueInform_data(novedad.form_data, 'Fecha') as string | undefined;
        const horaStr = findValueInform_data(novedad.form_data, 'Hora') as string | undefined;

        if (fechaStr && horaStr) {
          const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]!, 10);
            const minutes = parseInt(timeMatch[2]!, 10);
            
            let sortDate: Date;
            const dateMatch = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (dateMatch) {
              const [_, d, m, y] = dateMatch;
              sortDate = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
            } else {
              sortDate = new Date(`${fechaStr}T00:00:00`);
            }

            if (!isNaN(sortDate.getTime())) {
              sortDate.setHours(hours, minutes, 0, 0);
              return sortDate;
            }
          }
        }
        return new Date(novedad.timestamp);
      };

      const reportesParaExportar = [...reportesFiltrados].sort((a, b) => {
        const dateA = obtenerFechaOrdenamiento(a);
        const dateB = obtenerFechaOrdenamiento(b);
        if (dateA && dateB) return dateA.getTime() - dateB.getTime();
        return 0;
      });
      
      const lineasParaWord: any[] = [];
      let validIndex = 0;
      
      reportesParaExportar.forEach((r) => {
        const esFinalizado = r.status?.trim().toLowerCase() === 'finalizado';
        
        const template = templates.find(t => t.id === r.template_id);
        const config = configs[r.template_id];
        const borradorObj = (borrador as any);
        const esJefeEncargado = borradorObj?.es_jefe_encargado ?? borradorObj?.esJefeEncargado ?? settings.orden_del_dia_draft?.es_jefe_encargado ?? (settings as any).ordenDelDiaDraft?.esJefeEncargado;

        const rendered = (template && config) 
          ? renderFinalReport(template.content, r.form_data || {}, config, {}, false, { 
              ...configuracionesGlobales,
              Guardia: idGuardiaParaReporte,
              Estatus: esFinalizado ? 'Finalizado' : 'En proceso',
              Enc: !ordenDelDiaDeshabilitado && esJefeEncargado ? '(E)' : '',
              [LEADER_ROLES.DIRECTOR]: { 
                name: director, 
                sex: directorObj?.sex || '',
                toString() { return this.name; }
              } as any,
              [LEADER_ROLES.JEFE_OPERACIONES]: {
                name: jefeDeOperaciones,
                sex: jefeOpsObj?.sex || '',
                toString() { return this.name; }
              } as any,
            })
          : '';
        
        const contentToUse = (rendered || r.content || '').trim();
        if (!contentToUse) {
          return;
        }

        const colorEstado = esFinalizado ? '4EA72E' : 'FFFF00';
        
        lineasParaWord.push({
          text: `MINUTA ${validIndex + 1}`,
          color: colorEstado,
          bold: true,
          isSeparator: true,
          alignment: 'CENTER',
          pageBreakBefore: validIndex > 0
        });
        
        lineasParaWord.push({ text: '' });
        
        contentToUse.split('\n').forEach((line: string) => {
          lineasParaWord.push({ text: line });
        });
        
        lineasParaWord.push({ text: '' });
        validIndex++;
      });
      
      // Usar la fecha del período de guardia activo (Orden del día) en el nombre del archivo
      let fechaParaNombre: Date = new Date();
      if (settings.guard_period) {
        const parts = settings.guard_period.split(/ AL /i).map((p: string) => p.trim());
        const firstPart = parts[0];
        const match = firstPart?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [_, d, m, y] = match;
          const extracted = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
          if (!isNaN(extracted.getTime())) fechaParaNombre = extracted;
        }
      }
      const filename = `Minutas ${format(fechaParaNombre, 'dd.MM.yyyy')}`;
      await exportReportToWord(lineasParaWord, filename);
      toast.success('Todas las novedades han sido exportadas a Word');
    }, [reportesFiltrados, templates, configs, definitions, settings, activeGuard]),
    updateReport,
    navigate,
    reporteADuplicar,
    setReporteADuplicar,
    manejarDuplicarReporte,
    manejarConfirmarDuplicacion
  };
}

