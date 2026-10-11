import { DEFAULT_STATISTICS_CATEGORIES } from '@/lib/constants/statistics';
import { getReportDateTime, findValueInform_data } from '@/lib/report-sorter';
import type { Report, Template, TemplateConfig, GuardReport, Address } from '@/lib/types';
import { obtenerCategoriasReporte } from './categories';

/**
 * Estructura para la cuadrícula mensual: Categoría → Día (1-31) → Conteo
 */
export type MonthlyStats = Map<string, Map<number, number>>;

/**
 * Agrega reportes en una cuadrícula de estadísticas mensual, contando ocurrencias por día y categoría.
 * @param mode 'standard' usa 00:00-23:59, 'statistical' usa 03:00-03:00.
 */
export function calcularEstadisticasMensuales(
  reports: Report[],
  templates: Template[],
  configs: Record<string, TemplateConfig>,
  month: number,
  year: number,
  mode: 'standard' | 'statistical' = 'statistical',
  predefinedValues: Record<string, string> = {},
  savedReports: GuardReport[] = [],
  addresses: Address[] = []
): MonthlyStats {
  const stats: MonthlyStats = new Map();

  // Inicializar todas las categorías por defecto con mapas vacíos
  DEFAULT_STATISTICS_CATEGORIES.forEach((cat) => {
    stats.set(cat.toUpperCase(), new Map());
  });

  const parseDateSafe = (ts: string) => {
    if (!ts) return new Date(NaN);
    let d = new Date(ts);
    if (!isNaN(d.getTime())) return d;

    const match = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{1,2}))?/);
    if (match) {
      const dStr = match[1];
      const mStr = match[2];
      const yStr = match[3];
      const hStr = match[4];
      const minStr = match[5];

      if (dStr && mStr && yStr) {
        return new Date(
          parseInt(yStr),
          parseInt(mStr) - 1,
          parseInt(dStr),
          parseInt(hStr || '0'),
          parseInt(minStr || '0')
        );
      }
    }
    return new Date(NaN);
  };

  reports.forEach((report) => {
    if (report.status !== 'Finalizado') return;

    // Usar getReportDateTime para extraer la fecha lógica (de los campos Fecha/Hora)
    let date = getReportDateTime(report);

    if (!date) {
      if (!report.timestamp) return;
      date = parseDateSafe(report.timestamp);
    }

    if (isNaN(date.getTime())) return;

    // Aplicar lógica de corte de las 03:00 AM para determinar el "Día Estadístico"
    const hours = date.getHours();
    let statsYear = date.getFullYear();
    let statsMonth = date.getMonth();
    let statsDay = date.getDate();

    // En modo 'statistical', 00:00 - 02:59 pertenece al día anterior
    if (mode === 'statistical' && hours < 3) {
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      statsYear = prevDate.getFullYear();
      statsMonth = prevDate.getMonth();
      statsDay = prevDate.getDate();
    }

    // Filtrado final por mes/año (basado en la fecha lógica)
    if (statsMonth !== month || statsYear !== year) return;

    const template = templates.find((t) => t.id === report.template_id);

    // 1. Procesar todas las categorías para este reporte (General, Sub, Reglas, Secciones)
    const config = configs[report.template_id];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues, addresses);
    reportCategories.forEach(category => {
      if (!stats.has(category)) {
        stats.set(category, new Map());
      }
      const dayMap = stats.get(category)!;
      dayMap.set(statsDay, (dayMap.get(statsDay) || 0) + 1);
    });
  });

  // 4. Procesar Estadísticas Guardadas (Archivadas) de Reportes de Guardia
  savedReports.forEach((report) => {
    if (!report.statistics) return;
    
    // Usar la fecha en que se generó el reporte (fecha de archivo)
    const date = new Date(report.date);
    if (isNaN(date.getTime())) return;

    // Aplicar lógica de día estadístico (corte a las 3 AM)
    const hours = date.getHours();
    let statsYear = date.getFullYear();
    let statsMonth = date.getMonth();
    let statsDay = date.getDate();

    if (mode === 'statistical' && hours < 3) {
      const prev = new Date(date);
      prev.setDate(date.getDate() - 1);
      statsYear = prev.getFullYear();
      statsMonth = prev.getMonth();
      statsDay = prev.getDate();
    }

    // Solo agregar a la vista actual si coincide con el mes/año
    if (statsYear === year && statsMonth === month) {
      Object.entries(report.statistics).forEach(([cat, count]) => {
        if (typeof count !== 'number' || count <= 0) return;
        
        const catUpper = cat.toUpperCase();
        if (!stats.has(catUpper)) {
          stats.set(catUpper, new Map());
        }
        
        const dayMap = stats.get(catUpper)!;
        // Dado que estas se agregan de toda una guardia, SUMAMOS el conteo
        dayMap.set(statsDay, (dayMap.get(statsDay) || 0) + count);
      });
    }
  });

  return stats;
}

/**
 * Agrega una lista de reportes en un mapa simple de Categoría -> Conteo.
 * Útil para el reporte final diario.
 */
export function calcularEstadisticasDia(
  reports: Report[],
  templates: Template[],
  configs: Record<string, TemplateConfig>,
  predefinedValues: Record<string, string> = {},
  addresses: Address[] = []
): Map<string, number> {
  const stats = new Map<string, number>();

  reports.forEach((report) => {
    if (report.status !== 'Finalizado') return;
    
    const template = templates.find((t) => t.id === report.template_id);
    const config = configs[report.template_id];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues, addresses);
    
    reportCategories.forEach(category => {
      stats.set(category, (stats.get(category) || 0) + 1);
    });
  });

  return stats;
}

export interface DailyStatisticsGroup {
  dayNumber: number; // 1, 2, ...
  dateStr: string;   // "05/10/2026"
  label: string;     // "05/10/2026"
  stats: Map<string, number>;
}

export interface PeriodStatisticsResult {
  isMultiDay: boolean;
  durationHours: number;
  days: DailyStatisticsGroup[];
  totalStats: Map<string, number>;
}

/**
 * Agrega y calcula las estadísticas de una guardia, separando los reportes por cada fecha
 * si la guardia abarca múltiples días (por ejemplo, 48 horas).
 * Las estadísticas se calculan por día calendario respetando las horas de inicio y entrega:
 * - Primer día: desde la hora de inicio de la guardia hasta las 23:59:59.
 * - Días intermedios: desde las 00:00:00 hasta las 23:59:59.
 * - Último día: desde las 00:00:00 hasta la hora de entrega de la guardia.
 */
export function calcularEstadisticasPeriodo(
  reports: Report[],
  templates: Template[],
  configs: Record<string, TemplateConfig>,
  predefinedValues: Record<string, string> = {},
  addresses: Address[] = [],
  periodoStr?: string,
  durationHours?: number
): PeriodStatisticsResult {
  const totalStats = new Map<string, number>();

  let d1Str = '';
  let dEndStr = '';
  let isMultiDay = false;
  let durHours = durationHours || 24;

  let startObj: Date | null = null;
  let endObj: Date | null = null;
  const calDays: { dayNumber: number; dateStr: string; label: string; date: Date }[] = [];

  if (periodoStr) {
    const matches = periodoStr.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
    if (matches && matches.length >= 2) {
      d1Str = matches[0]!;
      dEndStr = matches[matches.length - 1]!;
      const [d1, m1, y1] = d1Str.split('/').map(Number);
      const [dEnd, mEnd, yEnd] = dEndStr.split('/').map(Number);

      const timeMatches = periodoStr.match(/(\d{1,2}):(\d{2})/g);
      let startHour = 8, startMin = 0;
      let endHour = 8, endMin = 0;
      if (timeMatches && timeMatches.length >= 2) {
        const [sh, sm] = timeMatches[0]!.split(':').map(Number);
        const [eh, em] = timeMatches[1]!.split(':').map(Number);
        startHour = sh!; startMin = sm!;
        endHour = eh!; endMin = em!;
      } else if (timeMatches && timeMatches.length === 1) {
        const [sh, sm] = timeMatches[0]!.split(':').map(Number);
        startHour = sh!; startMin = sm!;
        endHour = sh!; endMin = sm!;
      }

      startObj = new Date(y1!, m1! - 1, d1!, startHour, startMin, 0, 0);
      endObj = new Date(yEnd!, mEnd! - 1, dEnd!, endHour, endMin, 0, 0);

      const calStart = new Date(y1!, m1! - 1, d1!);
      const calEnd = new Date(yEnd!, mEnd! - 1, dEnd!);
      const diffDays = Math.round((calEnd.getTime() - calStart.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 2 || durationHours === 48) {
        isMultiDay = true;
        durHours = durationHours || 48;

        for (let i = 0; i <= diffDays; i++) {
          const curDate = new Date(y1!, m1! - 1, d1! + i);
          const dateFormatted = `${String(curDate.getDate()).padStart(2, '0')}/${String(curDate.getMonth() + 1).padStart(2, '0')}/${curDate.getFullYear()}`;
          calDays.push({
            dayNumber: i + 1,
            dateStr: dateFormatted,
            label: dateFormatted,
            date: curDate,
          });
        }
      }
    }
  }

  if (durationHours === 48 && !isMultiDay) {
    isMultiDay = true;
    durHours = 48;
    let minDate: Date | null = null;
    reports.forEach((rep) => {
      const d = getReportDateTime(rep);
      if (d && (!minDate || d.getTime() < minDate.getTime())) minDate = d;
    });
    const base = minDate || new Date();
    const y = base.getFullYear();
    const m = base.getMonth();
    const d = base.getDate();

    startObj = new Date(y, m, d, 8, 0, 0, 0);
    endObj = new Date(y, m, d + 2, 8, 0, 0, 0);

    for (let i = 0; i <= 2; i++) {
      const curDate = new Date(y, m, d + i);
      const dateFormatted = `${String(curDate.getDate()).padStart(2, '0')}/${String(curDate.getMonth() + 1).padStart(2, '0')}/${curDate.getFullYear()}`;
      calDays.push({
        dayNumber: i + 1,
        dateStr: dateFormatted,
        label: dateFormatted,
        date: curDate,
      });
    }
    d1Str = calDays[0]?.dateStr || '';
  }

  if (!isMultiDay) {
    const stats = calcularEstadisticasDia(reports, templates, configs, predefinedValues, addresses);
    return {
      isMultiDay: false,
      durationHours: 24,
      days: [
        {
          dayNumber: 1,
          dateStr: d1Str || 'Día 1',
          label: d1Str || 'Día 1',
          stats,
        },
      ],
      totalStats: stats,
    };
  }

  const dayStatsList = calDays.map(() => new Map<string, number>());

  reports.forEach((report) => {
    if (report.status !== 'Finalizado') return;

    let repDate = getReportDateTime(report);
    if (!repDate && report.timestamp) {
      const parsed = new Date(report.timestamp);
      if (!isNaN(parsed.getTime())) repDate = parsed;
    }

    const fechaVal = findValueInform_data(report.form_data, 'Fecha') as string | undefined;

    let targetIndex = -1;

    if (repDate) {
      // Fuera del rango de la guardia (antes del inicio o después de la entrega)
      if (startObj && repDate.getTime() < startObj.getTime()) {
        return;
      }
      if (endObj && repDate.getTime() > endObj.getTime()) {
        return;
      }

      const repDateStr = `${String(repDate.getDate()).padStart(2, '0')}/${String(repDate.getMonth() + 1).padStart(2, '0')}/${repDate.getFullYear()}`;
      targetIndex = calDays.findIndex((d) => d.dateStr === repDateStr);
    } else if (fechaVal) {
      targetIndex = calDays.findIndex((d) => fechaVal.includes(d.dateStr));
    }

    if (targetIndex === -1) {
      if (!repDate && !fechaVal) {
        targetIndex = 0;
      } else {
        return;
      }
    }

    const template = templates.find((t) => t.id === report.template_id);
    const config = configs[report.template_id];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues, addresses);

    reportCategories.forEach((category) => {
      totalStats.set(category, (totalStats.get(category) || 0) + 1);
      const dayStats = dayStatsList[targetIndex]!;
      dayStats.set(category, (dayStats.get(category) || 0) + 1);
    });
  });

  return {
    isMultiDay: true,
    durationHours: durHours,
    days: calDays.map((d, idx) => ({
      dayNumber: d.dayNumber,
      dateStr: d.dateStr,
      label: d.label,
      stats: dayStatsList[idx]!,
    })),
    totalStats,
  };
}


