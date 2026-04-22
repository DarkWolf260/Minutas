/**
 * Repositories barrel export.
 *
 * Import from here to access all repository factories and utilities.
 *
 * @example
 * ```ts
 * import { DbKeys, safeWrite, createConfigRepository } from '@/lib/repositories';
 * ```
 */

export { DbKeys } from './keys';
export { safeWrite, silentWrite } from './base.repository';

export { createConfigRepository } from './config.repository';
export type { ConfigRepository } from './config.repository';

export { createReportRepository } from './report.repository';
export type { ReportRepository } from './report.repository';

export { createPersonnelRepository } from './personnel.repository';
export type { PersonnelRepository } from './personnel.repository';

export { createLookupRepository } from './lookup.repository';
export type { LookupRepository } from './lookup.repository';

export { createHistoryRepository } from './history.repository';
export type { HistoryRepository } from './history.repository';

export { createTemplateRepository } from './template.repository';
export type { TemplateRepository } from './template.repository';
