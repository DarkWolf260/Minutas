/**
 * RxDB Schema Definitions
 */

export const personnelSchema = {
    title: 'personnel schema',
    version: 1,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        workspaceId: { type: 'string', maxLength: 50 },
        personnelId: { type: 'string' },
        name: { type: 'string' },
        cedula: { type: 'string' },
        rank: { type: 'string' },
        cargo: { type: 'string' },
        titulo: { type: 'string' },
        roleId: { type: 'string' },
        status: { type: 'string' },
        department: { type: 'string' },
        sex: { type: 'string' },
        specialties: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'workspaceId', 'name'],
    indexes: ['workspaceId']
};

export const reportsSchema = {
    title: 'reports schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        workspaceId: { type: 'string', maxLength: 50 },
        templateId: { type: 'string' },
        title: { type: 'string' },
        timestamp: { type: 'string' },
        content: { type: 'string' },
        isRelevant: { type: 'boolean' },
        status: { type: 'string' },
        formData: { type: 'object' },
    },
    required: ['id', 'workspaceId', 'templateId', 'title', 'timestamp', 'content', 'isRelevant'],
    indexes: ['workspaceId']
};

export const templatesSchema = {
    title: 'templates schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        workspaceId: { type: 'string', maxLength: 50 },
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
    required: ['id', 'workspaceId', 'name', 'content', 'isActive'],
    indexes: ['workspaceId']
};

/**
 * Consolidated collection for small lookup items: roles, departments, addresses.
 */
export const lookupsSchema = {
    title: 'lookups schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 150 },
        workspaceId: { type: 'string', maxLength: 50 },
        type: { type: 'string', maxLength: 50 },
        name: { type: 'string' }, // Common field for search/display
        data: { type: 'object' },
    },
    required: ['id', 'workspaceId', 'type'],
    indexes: ['workspaceId', 'type']
};

/**
 * Consolidated collection for configuration items: settings, units, field_definitions, template_configs, guards, drafts.
 */
export const configsSchema = {
    title: 'configs schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 150 },
        workspaceId: { type: 'string', maxLength: 50 },
        type: { type: 'string', maxLength: 50 },
        name: { type: 'string' },
        data: { type: 'object' },
    },
    required: ['id', 'workspaceId', 'type', 'data'],
    indexes: ['workspaceId', 'type']
};

/**
 * Consolidated collection for historical transactional records: 
 * guard_history, attendance, personnel_assignment_history.
 */
export const historySchema = {
    title: 'history schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 150 },
        workspaceId: { type: 'string', maxLength: 50 },
        type: { type: 'string', maxLength: 50 },
        date: { type: 'string', maxLength: 20 },
        personnelId: { type: 'string', maxLength: 100 },
        data: { type: 'object' },
    },
    required: ['id', 'workspaceId', 'type', 'date', 'personnelId', 'data'],
    indexes: ['workspaceId', 'type', 'date', 'personnelId']
};

/**
 * Notifications collection for local-only persistent alerts.
 */
export const notificationsSchema = {
    title: 'notifications schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        workspaceId: { type: 'string', maxLength: 50 },
        title: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
        read: { type: 'boolean' },
        timestamp: { type: 'string', maxLength: 50 },
        metadata: { type: 'object' },
    },
    required: ['id', 'workspaceId', 'title', 'message', 'timestamp', 'read'],
    indexes: ['workspaceId', 'read', 'timestamp']
};
