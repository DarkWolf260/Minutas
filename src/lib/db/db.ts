/**
 * RxDB Database initialization and schema definitions
 */

import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateIsMyJsonValidStorage } from 'rxdb/plugins/validate-is-my-json-valid';

// Types from our application
import {
  StaffMember,
  Report,
  Template,
  TemplateConfig,
  GuardReport,
  AttendanceRecord,
  Department,
  AppSettings,
  StaffRole,
  Address,
  Guard,
  FieldConfig,
  ReportDraft,
  PersonnelAssignment,
} from '@/types';

// Add necessary plugins
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

// Development mode plugin
if (process.env.NODE_ENV === 'development') {
  import('rxdb/plugins/dev-mode').then((module) => {
    addRxPlugin(module.RxDBDevModePlugin);
  });
}

// Collection Types
export type PersonnelCollection = RxCollection<StaffMember>;
export type ReportsCollection = RxCollection<Report>;
export type TemplatesCollection = RxCollection<Template>;
export type GuardHistoryCollection = RxCollection<GuardReport>;
export type AttendanceCollection = RxCollection<AttendanceRecord>;
export type DepartmentsCollection = RxCollection<Department>;
export type SettingsCollection = RxCollection<AppSettings>;
export type RolesCollection = RxCollection<StaffRole>;
export type AddressesCollection = RxCollection<Address>;
export type GuardsCollection = RxCollection<Guard>;
export type UnitsCollection = RxCollection<{ name: string }>;
export type FieldDefinitionsCollection = RxCollection<{ id: string; config: FieldConfig }>;
export type DraftsCollection = RxCollection<ReportDraft>;
export type TemplateConfigsCollection = RxCollection<{ id: string; config: TemplateConfig }>;
export type PersonnelAssignmentHistoryCollection = RxCollection<PersonnelAssignment>;

// Database Type
export type MinutasDatabaseCollections = {
  personnel: PersonnelCollection;
  reports: ReportsCollection;
  templates: TemplatesCollection;
  guard_history: GuardHistoryCollection;
  attendance: AttendanceCollection;
  departments: DepartmentsCollection;
  settings: SettingsCollection;
  roles: RolesCollection;
  addresses: AddressesCollection;
  guards: GuardsCollection;
  units: UnitsCollection;
  field_definitions: FieldDefinitionsCollection;
  drafts: DraftsCollection;
  template_configs: TemplateConfigsCollection;
  personnel_assignment_history: PersonnelAssignmentHistoryCollection;
};

export type MinutasDatabase = RxDatabase<MinutasDatabaseCollections>;

import {
  personnelSchema,
  reportsSchema,
  templatesSchema,
  guardHistorySchema,
  attendanceSchema,
  departmentsSchema,
  settingsSchema,
  rolesSchema,
  addressesSchema,
  guardsSchema,
  unitsSchema,
  fieldDefinitionsSchema,
  draftsSchema,
  templateConfigsSchema,
  personnelAssignmentHistorySchema,
} from './schemas';


/**
 * Database creation
 */
let dbPromise: Promise<MinutasDatabase> | null = null;

const createDatabase = async (): Promise<MinutasDatabase> => {
  const database: MinutasDatabase = await createRxDatabase<MinutasDatabaseCollections>({
    name: 'minutasdb',
    storage: wrappedValidateIsMyJsonValidStorage({
      storage: getRxStorageDexie(),
    }),
  });

  await database.addCollections({
    personnel: {
      schema: personnelSchema,
      migrationStrategies: {
        1: (oldDoc: Record<string, unknown>) => {
          // v0 → v1: add cargo field
          oldDoc.cargo = oldDoc.cargo ?? '';
          return oldDoc;
        },
        2: (oldDoc: Record<string, unknown>) => {
          // v1 → v2: add titulo field
          oldDoc.titulo = oldDoc.titulo ?? '';
          return oldDoc;
        },
      },
    },
    reports: { schema: reportsSchema },
    templates: { schema: templatesSchema },
    guard_history: { schema: guardHistorySchema },
    attendance: { schema: attendanceSchema },
    departments: { schema: departmentsSchema },
    settings: {
      schema: settingsSchema,
      migrationStrategies: {
        1: (oldDoc: Record<string, unknown>) => {
          oldDoc.reportaRoleIds = oldDoc.reportaRoleId ? [oldDoc.reportaRoleId] : [];
          delete oldDoc.reportaRoleId;
          delete oldDoc.analistaRoleId;
          return oldDoc;
        },
      },
    },
    roles: {
      schema: rolesSchema,
      migrationStrategies: {
        1: (oldDoc: Record<string, unknown>) => {
          oldDoc.order = 0;
          return oldDoc;
        },
      },
    },
    addresses: { schema: addressesSchema },
    guards: { schema: guardsSchema },
    units: { schema: unitsSchema },
    field_definitions: { schema: fieldDefinitionsSchema },
    drafts: { schema: draftsSchema },
    template_configs: { schema: templateConfigsSchema },
    personnel_assignment_history: { schema: personnelAssignmentHistorySchema },
  });

  return database;
};

export const getDatabase = (): Promise<MinutasDatabase> => {
  if (!dbPromise) {
    dbPromise = createDatabase();
  }
  return dbPromise;
};
