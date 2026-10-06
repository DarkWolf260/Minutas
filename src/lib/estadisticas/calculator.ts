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
  label: string;     // "DÍA 1 (05/10/2026)"
  stats: Map<string, number>;
}

export interface PeriodStatisticsResult {
  isMultiDay: boolean;
  durationHours: number;
  days: DailyStatisticsGroup[];
  totalStats: Map<string, number>;
}

/**
 * Agrega y calcula las estadísticas de una guardia, separando los reportes por cada día
 * operativo si la guardia abarca múltiples días (por ejemplo, 48 horas).
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

  // Analizar fechas del periodo
  let d1Str = '';
  let d2Str = '';
  let d3Str = '';
  let day2Start: Date | null = null;
  let day3Start: Date | null = null;
  let isMultiDay = false;
  let durHours = durationHours || 24;

  if (periodoStr) {
    const matches = periodoStr.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
    if (matches && matches.length >= 2) {
      d1Str = matches[0]!;
      const [d1, m1, y1] = d1Str.split('/').map(Number);
      const [dEnd, mEnd, yEnd] = matches[1]!.split('/').map(Number);
      const startObj = new Date(y1!, m1! - 1, d1!, 8, 0, 0);
      const endObj = new Date(yEnd!, mEnd! - 1, dEnd!, 8, 0, 0);
      const diffDays = Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 2 || durationHours === 48) {
        isMultiDay = true;
        durHours = 48;
        const day2Date = new Date(y1!, m1! - 1, d1! + 1);
        const day3Date = new Date(yEnd!, mEnd! - 1, dEnd!);

        d2Str = `${String(day2Date.getDate()).padStart(2, '0')}/${String(day2Date.getMonth() + 1).padStart(2, '0')}/${day2Date.getFullYear()}`;
        d3Str = `${String(day3Date.getDate()).padStart(2, '0')}/${String(day3Date.getMonth() + 1).padStart(2, '0')}/${day3Date.getFullYear()}`;

        day2Start = new Date(day2Date.getFullYear(), day2Date.getMonth(), day2Date.getDate(), 0, 0, 0, 0);
        day3Start = new Date(day3Date.getFullYear(), day3Date.getMonth(), day3Date.getDate(), 0, 0, 0, 0);
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
    const day1Date = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const day2Date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
    const day3Date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 2);

    d1Str = `${String(day1Date.getDate()).padStart(2, '0')}/${String(day1Date.getMonth() + 1).padStart(2, '0')}/${day1Date.getFullYear()}`;
    d2Str = `${String(day2Date.getDate()).padStart(2, '0')}/${String(day2Date.getMonth() + 1).padStart(2, '0')}/${day2Date.getFullYear()}`;
    d3Str = `${String(day3Date.getDate()).padStart(2, '0')}/${String(day3Date.getMonth() + 1).padStart(2, '0')}/${day3Date.getFullYear()}`;

    day2Start = new Date(day2Date.getFullYear(), day2Date.getMonth(), day2Date.getDate(), 0, 0, 0, 0);
    day3Start = new Date(day3Date.getFullYear(), day3Date.getMonth(), day3Date.getDate(), 0, 0, 0, 0);
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
          label: d1Str ? `DÍA 1 (${d1Str})` : 'DÍA 1',
          stats,
        },
      ],
      totalStats: stats,
    };
  }

  // Guardia de 48 horas (multi-día: Día 1, Día 2 y Cierre de guardia desde las 00:00)
  const day1Stats = new Map<string, number>();
  const day2Stats = new Map<string, number>();
  const day3Stats = new Map<string, number>();

  reports.forEach((report) => {
    if (report.status !== 'Finalizado') return;

    let repDate = getReportDateTime(report);
    if (!repDate && report.timestamp) {
      const parsed = new Date(report.timestamp);
      if (!isNaN(parsed.getTime())) repDate = parsed;
    }

    let targetDay = 1;
    if (repDate && day2Start && day3Start) {
      if (repDate.getTime() >= day3Start.getTime()) {
        targetDay = 3;
      } else if (repDate.getTime() >= day2Start.getTime()) {
        targetDay = 2;
      } else {
        targetDay = 1;
      }
    } else {
      const fechaVal = findValueInform_data(report.form_data, 'Fecha') as string | undefined;
      if (fechaVal && d3Str && fechaVal.includes(d3Str)) {
        targetDay = 3;
      } else if (fechaVal && d2Str && fechaVal.includes(d2Str)) {
        targetDay = 2;
      } else {
        targetDay = 1;
      }
    }

    const template = templates.find((t) => t.id === report.template_id);
    const config = configs[report.template_id];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues, addresses);

    reportCategories.forEach((category) => {
      totalStats.set(category, (totalStats.get(category) || 0) + 1);
      if (targetDay === 1) {
        day1Stats.set(category, (day1Stats.get(category) || 0) + 1);
      } else if (targetDay === 2) {
        day2Stats.set(category, (day2Stats.get(category) || 0) + 1);
      } else {
        day3Stats.set(category, (day3Stats.get(category) || 0) + 1);
      }
    });
  });

  return {
    isMultiDay: true,
    durationHours: durHours,
    days: [
      {
        dayNumber: 1,
        dateStr: d1Str,
        label: d1Str ? `DÍA 1 (${d1Str})` : 'DÍA 1',
        stats: day1Stats,
      },
      {
        dayNumber: 2,
        dateStr: d2Str,
        label: d2Str ? `DÍA 2 (${d2Str})` : 'DÍA 2',
        stats: day2Stats,
      },
      {
        dayNumber: 3,
        dateStr: d3Str,
        label: d3Str ? `CIERRE DE GUARDIA (${d3Str} - 00:00 A ENTREGA)` : 'CIERRE DE GUARDIA (00:00 A ENTREGA)',
        stats: day3Stats,
      },
    ],
    totalStats,
  };
}


