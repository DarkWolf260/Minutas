/**
 * Formatea un mapa de estadísticas en una cadena legible para el reporte final.
 */
export function formatearEstadisticasDia(stats: Map<string, number>): string {
  if (stats.size === 0) return '';
  
  return Array.from(stats.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
    .map(([category, count]) => {
      // Extraer la parte de la etiqueta (sin el código)
      const labelPart = category.replace(/^[\d.]+\s*/, '');
      
      // Heurística para sub-ítems: comienza con una preposición indicando sub-clasificación
      const preposicionesSub = ['EN ', 'DE ', 'POR ', 'AL ', 'A ', 'CON ', 'PARA ', 'HACIA ', 'DURANTE '];
      const esSub = preposicionesSub.some(p => labelPart.toUpperCase().startsWith(p));
      
      // Limpiar y formatear la categoría
      let cleanCategory = labelPart.toLowerCase();
      
      // Capitalizar la primera letra
      if (cleanCategory.length > 0) {
        cleanCategory = cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1);
      }
      
      const displayCount = count < 10 ? `0${count}` : String(count);
      const prefix = esSub ? '\t- ' : '- ';
      return `${prefix}${cleanCategory} ${displayCount}`;
    })
    .join('\n');
}
