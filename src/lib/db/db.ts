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

/**
 * Schema Definitions
 */

const personnelSchema = {
  title: 'personnel schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    personnelId: { type: 'string' },
    name: { type: 'string' },
    cedula: { type: 'string' },
    rank: { type: 'string' },
    roleId: { type: 'string' },
    status: { type: 'string' },
    department: { type: 'string' },
    specialties: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'name'],
};

const reportsSchema = {
  title: 'reports schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    templateId: { type: 'string' },
    title: { type: 'string' },
    timestamp: { type: 'string' },
    content: { type: 'string' },
    isRelevant: { type: 'boolean' },
    status: { type: 'string' },
    formData: { type: 'object' },
  },
  required: ['id', 'templateId', 'title', 'timestamp', 'content'],
};

const templatesSchema = {
  title: 'templates schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    content: { type: 'string' },
    type: { type: 'string' },
    isActive: { type: 'boolean' },
    statisticsCategory: { type: 'string' },
    statisticsRules: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fieldId: { type: 'string' },
          condition: { type: 'string' },
          value: { type: 'string' },
          category: { type: 'string' },
        },
      },
    },
  },
  required: ['id', 'name', 'content'],
};

const guardHistorySchema = {
  title: 'guard history schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    date: { type: 'string' },
    generatedAt: { type: 'string' },
    guardGroup: { type: 'string' },
    content: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['id', 'date', 'generatedAt', 'content'],
};

const attendanceSchema = {
  title: 'attendance schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    memberId: { type: 'string' },
    date: { type: 'string' },
    status: { type: 'string' },
    checkInTime: { type: 'string' },
    note: { type: 'string' },
    createdAt: { type: 'string' },
  },
  required: ['id', 'memberId', 'date', 'status', 'createdAt'],
};

const departmentsSchema = {
  title: 'departments schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    staff: { type: 'object' },
  },
  required: ['id', 'name'],
};

const settingsSchema = {
  title: 'settings schema',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 20 },
    activeGuardId: { type: 'string' },
    guardShiftDuration: { type: 'number' },
    finalReportStaffSnapshot: { type: 'object' },
    finalReportStartDate: { type: 'string' },
    finalReportEndDate: { type: 'string' },
    reportaRoleIds: { type: 'array', items: { type: 'string' } },
  },
  required: ['id'],
};

const rolesSchema = {
  title: 'roles schema',
  version: 0,
  primaryKey: 'name',
  type: 'object',
  properties: {
    name: { type: 'string', maxLength: 100 },
    isSingle: { type: 'boolean' },
    departmentScope: { type: 'array', items: { type: 'string' } },
    isHidden: { type: 'boolean' },
  },
  required: ['name', 'isSingle', 'departmentScope'],
};

const addressesSchema = {
  title: 'addresses schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    street: { type: 'string' },
    houseNumber: { type: 'string' },
    municipality: { type: 'string' },
    parish: { type: 'string' },
    sector: { type: 'string' },
    peaceQuadrant: { type: 'string' },
    latitude: { type: 'string' },
    longitude: { type: 'string' },
    details: { type: 'string' },
  },
  required: ['id', 'name', 'municipality', 'parish', 'peaceQuadrant'],
};

const guardsSchema = {
  title: 'guards schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 10 },
    staff: { type: 'object' },
  },
  required: ['id', 'staff'],
};

const unitsSchema = {
  title: 'units schema',
  version: 0,
  primaryKey: 'name',
  type: 'object',
  properties: {
    name: { type: 'string', maxLength: 100 },
  },
  required: ['name'],
};

const fieldDefinitionsSchema = {
  title: 'field definitions schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    config: { type: 'object' },
  },
  required: ['id', 'config'],
};

const draftsSchema = {
  title: 'drafts schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 20 }, // single draft for now as it was in localStorage
    templateId: { type: 'string' },
    formData: { type: 'object' },
    lastSaved: { type: 'string' },
  },
  required: ['id'],
};

const templateConfigsSchema = {
  title: 'template configs schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    config: { type: 'object' },
  },
  required: ['id', 'config'],
};

const personnelAssignmentHistorySchema = {
  title: 'personnel assignment history schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 150 }, // personnelId_date
    personnelId: { type: 'string', maxLength: 100 },
    date: { type: 'string', maxLength: 10 }, // YYYY-MM-DD
    guardId: { type: 'string', maxLength: 50 },
    roleName: { type: 'string', maxLength: 100 },
    timestamp: { type: 'string', maxLength: 50 },
  },
  required: ['id', 'personnelId', 'date', 'guardId', 'roleName', 'timestamp'],
  indexes: ['personnelId', 'date'],
};

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
    personnel: { schema: personnelSchema },
    reports: { schema: reportsSchema },
    templates: { schema: templatesSchema },
    guard_history: { schema: guardHistorySchema },
    attendance: { schema: attendanceSchema },
    departments: { schema: departmentsSchema },
    settings: {
      schema: settingsSchema,
      migrationStrategies: {
        1: (oldDoc: any) => {
          oldDoc.reportaRoleIds = oldDoc.reportaRoleId ? [oldDoc.reportaRoleId] : [];
          delete oldDoc.reportaRoleId;
          delete oldDoc.analistaRoleId;
          return oldDoc;
        },
      },
    },
    roles: { schema: rolesSchema },
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
