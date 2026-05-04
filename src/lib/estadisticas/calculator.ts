import { DEFAULT_STATISTICS_CATEGORIES } from '@/lib/constants/statistics';
import { getReportDateTime } from '@/lib/report-sorter';
import type { Report, Template, TemplateConfig, GuardReport } from '@/lib/types';
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
  savedReports: GuardReport[] = []
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

    const template = templates.find((t) => t.id === report.templateId);

    // 1. Procesar todas las categorías para este reporte (General, Sub, Reglas, Secciones)
    const config = configs[report.templateId];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues);
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
  predefinedValues: Record<string, string> = {}
): Map<string, number> {
  const stats = new Map<string, number>();

  reports.forEach((report) => {
    if (report.status !== 'Finalizado') return;
    
    const template = templates.find((t) => t.id === report.templateId);
    const config = configs[report.templateId];
    const reportCategories = obtenerCategoriasReporte(report, template, config, predefinedValues);
    
    reportCategories.forEach(category => {
      stats.set(category, (stats.get(category) || 0) + 1);
    });
  });

  return stats;
}
