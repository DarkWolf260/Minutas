import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/id';
import { findValueInform_data } from '@/lib/report-sorter';
import { renderFinalReport } from '@/lib/template-parser';
import { LEADER_ROLES } from '@/lib/constants/roles';
import { calcularEstadisticasDia } from '@/lib/estadisticas-utils';
import type { StaffMember, Report } from '@/lib/types';
import { useOrdenDelDiaDraft } from '@/hooks/use-orden-del-dia-draft';

interface UseReporteFinalGeneratorProps {
  reportesFinalizados: any[];
  novedadesManuales: any[];
  estadisticasLocal: string;
  activeGuard: any;
  settings: any;
  saveSettings: (settings: any) => Promise<void>;
  saveGuardReport: (report: any) => Promise<void>;
  clearAllReports: () => Promise<void>;
  templates: any[];
  configs: any;
  configuracionesGlobales: any;
  roles: any[];
  setTabActiva: (tab: string) => void;
  setEstadisticasLocal: (stats: string) => void;
}

const formatearMiembroPersonalParaReporte = (member: StaffMember | string): string => {
  if (typeof member === 'string') return member;
  const parts: string[] = [];
  if (member.rank && member.rank !== 'Sin jerarquía') parts.push(member.rank);
  if (member.titulo) parts.push(member.titulo);
  parts.push(member.name);
  return parts.filter(Boolean).join(' ').trim();
};

const buscarInsensible = (obj: Record<string, string>, key: string): string => {
  const keyLower = key.toLowerCase();
  const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === keyLower);
  return foundKey ? (obj[foundKey] ?? '') : '';
};

export function useReporteFinalGenerator({
  reportesFinalizados,
  novedadesManuales,
  estadisticasLocal,
  activeGuard,
  settings,
  saveSettings,
  saveGuardReport,
  clearAllReports,
  templates,
  configs,
  configuracionesGlobales,
  roles,
  setTabActiva,
  setEstadisticasLocal
}: UseReporteFinalGeneratorProps) {
  const { draft: cloudDraft } = useOrdenDelDiaDraft();
  const [reporteGenerado, setReporteGenerado] = useState('');
  const [esDialogOpenResultado, setEsDialogOpenResultado] = useState(false);
  const [esDialogOpenConfirmarGuardar, setEsDialogOpenConfirmarGuardar] = useState(false);
  const [textoBotonCopiar, setTextoBotonCopiar] = useState('Copiar');

  const obtenerFechaOrdenamiento = (novedad: Report | any): Date | null => {
    if ('template_id' in novedad) {
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
    } else {
      const sortDate = new Date(novedad.date);
      const timeMatch = novedad.time.match(/(\d{2}):(\d{2})/);
      
      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          sortDate.setHours(hours, minutes, 0, 0);
        }
      }
      return sortDate;
    }
  };

  const manejarGenerarReporte = useCallback(() => {
    if (reportesFinalizados.length === 0 && !estadisticasLocal.trim() && novedadesManuales.length === 0) {
      setReporteGenerado('No hay novedades finalizadas ni estadísticas para reportar.');
      setEsDialogOpenResultado(true);
      return;
    }

    const ordenDelDiaDeshabilitado = (settings.disabled_modules || []).includes('orden-del-dia');
    const borrador = !ordenDelDiaDeshabilitado 
      ? ((cloudDraft && cloudDraft.guard_id === settings.active_guard_id) ? cloudDraft : (settings.orden_del_dia_draft || settings.ordenDelDiaDraft))
      : undefined;

    const personalParaReporte = (borrador && (borrador.guard_id ?? borrador.guardId) === settings.active_guard_id)
      ? borrador.staff
      : activeGuard?.staff;

    const idGuardiaParaReporte = (borrador && (borrador.guard_id ?? borrador.guardId) === settings.active_guard_id)
      ? (borrador.guard_id ?? borrador.guardId) || ''
      : (activeGuard?.id || settings.active_guard_id || '');

    const obtenerNombreLider = (roleName: string) => {
      if (personalParaReporte) {
        const key = Object.keys(personalParaReporte).find(
          (k) => k.toLowerCase() === roleName.toLowerCase()
        );
        if (key) {
          const members = (personalParaReporte as any)[key];
          const firstMember = members ? members[0] : undefined;
          if (firstMember) {
            return formatearMiembroPersonalParaReporte(firstMember).trim();
          }
        }
      }
      return '';
    };

    const director = obtenerNombreLider(LEADER_ROLES.DIRECTOR);
    const jefeDeOperaciones = obtenerNombreLider(LEADER_ROLES.JEFE_OPERACIONES);
    const municipio = buscarInsensible(configuracionesGlobales, 'Municipio');

    const rangoFechasTexto = (() => {
      if (settings.guard_period) {
        const periodStr = settings.guard_period.toUpperCase().trim();
        if (periodStr.includes(' AL ')) {
          const parts = periodStr.split(' AL ');
          const formatearParteFecha = (part: string) => {
            const dateMatch = part.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (dateMatch) {
              const [_, d, m, y] = dateMatch;
              const dateObj = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
              if (!isNaN(dateObj.getTime())) {
                return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit' }).format(dateObj).replace(',', '').toUpperCase();
              }
            }
            return part;
          };
          
          const startStr = formatearParteFecha(parts[0] || '');
          const endStr = formatearParteFecha(parts[1] || '');
          const endDateRaw = parts[1]?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (endDateRaw) {
             const [_, d, m, y] = endDateRaw;
             const dateObj = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
             const mesLargo = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(dateObj).toUpperCase();
             return `DESDE EL ${startStr} HASTA EL ${endStr} DE ${mesLargo} DE ${y}`;
          }
          return `DESDE EL ${startStr} HASTA EL ${endStr}`;
        }
        return periodStr;
      }

      const now = new Date();
      const shiftStart = new Date(now);
      if (now.getHours() < 8) shiftStart.setDate(now.getDate() - 1);
      shiftStart.setHours(8, 0, 0, 0);

      const shiftEnd = new Date(shiftStart);
      shiftEnd.setDate(shiftEnd.getDate() + 1);
      shiftEnd.setHours(8, 0, 0, 0);

      const dayStart = new Intl.DateTimeFormat('es-ES', { 
        weekday: 'long', 
        day: '2-digit',
        month: shiftStart.getMonth() !== shiftEnd.getMonth() ? 'long' : undefined
      }).format(shiftStart).replace(',', '');
      
      const dayEnd = new Intl.DateTimeFormat('es-ES', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long' 
      }).format(shiftEnd).replace(',', '');
      
      return `DESDE EL ${dayStart.toUpperCase()} HASTA EL ${dayEnd.toUpperCase()} DE ${shiftEnd.getFullYear()}`;
    })();

    const headerParts = [
      `*INSTITUTO AUTÓNOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES MUNICIPIO ${(municipio || '').toUpperCase()}*`,
      ``,
    ];

    if (director) headerParts.push(`*DIRECTOR-PRESIDENTE*`, director, ``);
    if (jefeDeOperaciones) headerParts.push(`*JEFE DE OPERACIONES*`, jefeDeOperaciones, ``);

    headerParts.push(`*REPORTE DE NOVEDADES ${rangoFechasTexto}*`, ``);

    if (personalParaReporte) {
      if (idGuardiaParaReporte && idGuardiaParaReporte !== '“”') {
        headerParts.push(`- *EQUIPO DE GUARDIA:* Grupo “${idGuardiaParaReporte}”`);
      }

      const rolesOrdenados = [...roles].sort(
        (a, b) => (a.hierarchy_order ?? a.order ?? 0) - (b.hierarchy_order ?? b.order ?? 0)
      );

      rolesOrdenados
        .filter((r) => !r.is_hidden)
        .forEach((role) => {
          if (
            role.name.toLowerCase() === LEADER_ROLES.DIRECTOR.toLowerCase() ||
            role.name.toLowerCase() === LEADER_ROLES.JEFE_OPERACIONES.toLowerCase()
          ) return;

          const staffKey = Object.keys(personalParaReporte).find(
            (k) => k.toLowerCase() === role.name.toLowerCase()
          );
          const staffList = staffKey ? (personalParaReporte as any)[staffKey] : undefined;
          
          if (staffList && staffList.length > 0 && staffList.some((s: any) => {
            const name = typeof s === 'string' ? s : s?.name;
            return name && name.trim() !== '';
          })) {
            const names = staffList
                .map((member: any) => formatearMiembroPersonalParaReporte(member))
                .join(' / ');
            
            const esJefeServicios = role.name.toLowerCase() === 'jefe de los servicios';
            const displayRole = esJefeServicios && !ordenDelDiaDeshabilitado && (borrador?.es_jefe_encargado ?? borrador?.esJefeEncargado)
              ? `${role.name.toUpperCase()} (E)`
              : role.name.toUpperCase();

            headerParts.push(`- *${displayRole}:* ${names}`);
          }
        });
    }

    const todasNovedades = [
      ...reportesFinalizados.map((report) => ({
        type: 'report',
        data: report,
        sortDate: obtenerFechaOrdenamiento(report),
      })),
      ...novedadesManuales.map((novedad) => ({
        type: 'manual',
        data: novedad,
        sortDate: obtenerFechaOrdenamiento(novedad),
      })),
    ];

    const todasNovedadesOrdenadas = todasNovedades
      .filter((item) => item.sortDate)
      .sort((a, b) => a.sortDate!.getTime() - b.sortDate!.getTime());

    const contenidoReporte = todasNovedadesOrdenadas
      .map((item) => {
        if (item.type === 'report') {
          const report = item.data as Report;
          const sortDate = item.sortDate!;
          const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(sortDate);
          
          const horaStr = findValueInform_data(report.form_data, 'Hora') as string | undefined;
          const timestampText = `${fechaFormateada} ${horaStr || format(sortDate, 'HH:mm')}`.trim();
          const template = templates.find((t) => t.id === report.template_id);
          const config = configs[report.template_id];

          let textoContenido = '';
          if (template && config) {
            const valoresPredefinidosDinamicos = {
              ...configuracionesGlobales,
              Guardia: idGuardiaParaReporte,
              Estatus: (report.status?.trim().toLowerCase() === 'finalizado') ? 'Finalizado' : 'En proceso',
              Enc: !ordenDelDiaDeshabilitado && (borrador?.es_jefe_encargado ?? borrador?.esJefeEncargado) ? '(E)' : '',
              [LEADER_ROLES.DIRECTOR]: director,
              [LEADER_ROLES.JEFE_OPERACIONES]: jefeDeOperaciones,
            };
            textoContenido = renderFinalReport(
              template.content,
              report.form_data || {},
              config,
              {},
              true,
              valoresPredefinidosDinamicos
            );
          }

          const textoTitulo = ` - *${timestampText}* - *${report.title}*`;
          return textoContenido ? `${textoTitulo}\n\n${textoContenido}` : textoTitulo;
        } else {
          const novedad = item.data;
          const sortDate = item.sortDate!;
          const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(sortDate);
          const timestampText = `${fechaFormateada} ${novedad.time}`;
          return ` - *${timestampText}* - *${novedad.text}*`;
        }
      })
      .filter(Boolean)
      .join('\n\n');

    const partesReporteFinal = [...headerParts];
    if (estadisticasLocal.trim())
      partesReporteFinal.push(``, `*ESTADÍSTICAS DE LA GUARDIA*`, ``, estadisticasLocal.trim());
  
    if (contenidoReporte.trim()) partesReporteFinal.push(``, `*NOVEDADES DE LA GUARDIA*`, ``, contenidoReporte);
    partesReporteFinal.push(``, `*PROTECCIÓN CIVIL ${(municipio || '').toUpperCase()}*`);

    setReporteGenerado(partesReporteFinal.join('\n').trim());
    setEsDialogOpenResultado(true);
    setTextoBotonCopiar('Copiar');
  }, [
    reportesFinalizados, 
    novedadesManuales, 
    estadisticasLocal, 
    settings, 
    activeGuard, 
    configuracionesGlobales, 
    roles, 
    templates, 
    configs,
    cloudDraft
  ]);

  const manejarCopiarAlPortapapeles = useCallback(() => {
    navigator.clipboard.writeText(reporteGenerado);
    setTextoBotonCopiar('¡Copiado!');
    setTimeout(() => setTextoBotonCopiar('Copiar'), 2000);
  }, [reporteGenerado]);

  const manejarExportarWord = useCallback(async () => {
    if (!reporteGenerado) return;
    const { exportReportToWord } = await import('@/lib/export-word');
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
    const filename = `Reporte de Cierre - ${format(fechaParaNombre, 'dd.MM.yyyy')}`;
    await exportReportToWord(reporteGenerado, filename);
    toast.success('Reporte exportado a Word con éxito');
  }, [reporteGenerado, activeGuard, settings.guard_period]);

  const manejarFinalizarYGuardar = async () => {
    if (!reporteGenerado || !activeGuard) {
      toast.error('No hay contenido de reporte o guardia activa para finalizar.');
      return;
    }

    try {
      const reportId = generateId();
      const now = new Date();
      let archiveDate = now;
      if (settings.guard_period) {
        const parts = settings.guard_period.split(/ AL /i).map((p: string) => p.trim());
        const firstPart = parts[0];
        const match = firstPart?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [_, d, m, y] = match;
          const extracted = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10), 8, 0, 0);
          if (!isNaN(extracted.getTime())) archiveDate = extracted;
        }
      }

      const isoDate20 = archiveDate.toISOString().split('.')[0] + 'Z';
      const fullIsoDate = now.toISOString();

      const dayStats = calcularEstadisticasDia(reportesFinalizados, templates, configs, configuracionesGlobales);
      const statsObj = Object.fromEntries(dayStats.entries());
      
      await saveGuardReport({
        id: reportId,
        date: isoDate20,
        generated_at: fullIsoDate,
        summary: settings.guard_period || `Reporte de Guardia ${activeGuard.id}`,
        content: reporteGenerado,
        guard_group: activeGuard.id.split(' ')[0] || '',
        workspace_id: '', 
        statistics: statsObj,
      });

      await saveSettings({ 
        is_guard_open: false,
        guard_period: '', 
        active_guard_id: '',
        final_report_manual_novedades: [], 
        final_report_statistics: '', 
        orden_del_dia_draft: null, 
      });

      await clearAllReports();
      setEsDialogOpenConfirmarGuardar(false);
      setEsDialogOpenResultado(false);
      setTabActiva('history'); 
      setEstadisticasLocal('');
      toast.success('Guardia finalizada y reporte archivado con éxito.');
    } catch (error) {
      console.error('Error al finalizar y guardar', error);
      toast.error('Error al finalizar la guardia.');
    }
  };

  return {
    reporteGenerado,
    esDialogOpenResultado,
    setEsDialogOpenResultado,
    esDialogOpenConfirmarGuardar,
    setEsDialogOpenConfirmarGuardar,
    textoBotonCopiar,
    manejarGenerarReporte,
    manejarCopiarAlPortapapeles,
    manejarExportarWord,
    manejarFinalizarYGuardar
  };
}



