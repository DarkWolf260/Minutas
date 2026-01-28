import { ResolutionResult } from './integration-engine';
import { AuditRecord } from '../types/semantic';
import { logger } from './logger';

/**
 * Motor de Auditoría y Trazabilidad
 * Registra el origen y transformación de cada dato inyectado.
 */
const AUDIT_STORAGE: AuditRecord[] = [];

/**
 * Registra la generación de un reporte para auditoría.
 */
export function recordReportAudit(reportId: string, results: ResolutionResult[]): void {
  const auditRecord: AuditRecord = {
    reportId,
    timestamp: new Date().toISOString(),
    mappings: results.map((r) => ({
      concept: r.trace.concept,
      dataId: r.trace.dataId,
      version: r.trace.version,
      appliedValue: r.value,
      confidence: r.trace.confidence,
    })),
  };

  AUDIT_STORAGE.push(auditRecord);
  logger.info(`Reporte ${reportId} generado con ${results.length} datos semánticos.`);
}

/**
 * Obtiene el historial de auditoría de un reporte específico.
 */
export function getReportAudit(reportId: string): AuditRecord | null {
  return AUDIT_STORAGE.find((a) => a.reportId === reportId) || null;
}

/**
 * Genera un "Sello de Confianza" basado en los metadatos del dato.
 */
export function getTrustSeal(result: ResolutionResult): string {
  if (result.trace.dataId === 'N/A') return '⚠️ Dato no verificado';

  const confidencePercent = (result.trace.confidence * 100).toFixed(0);
  let seal = `🛡️ Origen: ${result.trace.source} | Confianza: ${confidencePercent}%`;

  if (result.trace.fallbackUsed) {
    seal += ' (Basado en fallback)';
  }

  return seal;
}
