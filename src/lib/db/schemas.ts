/**
 * RxDB Schema Definitions
 */

export const personnelSchema = {
    title: 'personnel schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        workspace_id: { type: 'string', maxLength: 50 },
        personnel_id: { type: 'string' },
        name: { type: 'string' },
        cedula: { type: 'string' },
        rank: { type: 'string' },
        cargo: { type: 'string' },
        titulo: { type: 'string' },
        role_id: { type: 'string' },
        status: { type: 'string' },
        department: { type: 'string' },
        sex: { type: 'string' },
        specialties: { type: 'array', items: { type: 'string' } },
        order: { type: 'number' },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'workspace_id', 'name'],
    indexes: ['workspace_id']
};

export const reportsSchema = {
    title: 'reports schema',
    version: 2,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        workspace_id: { type: 'string', maxLength: 50 },
        template_id: { type: 'string' },
        title: { type: 'string' },
        timestamp: { type: 'string' },
        content: { type: 'string' },
        is_relevant: { type: 'boolean' },
        status: { type: 'string' },
        form_data: { type: 'object' },
        sections: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    fields: { type: 'object' }
                }
            }
        },
        photos: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    url: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' }
                }
            }
        },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'workspace_id', 'template_id', 'title', 'timestamp', 'content', 'is_relevant'],
    indexes: ['workspace_id']
};

export const templatesSchema = {
    title: 'templates schema',
    version: 3,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        workspace_id: { type: ['string', 'null'], maxLength: 50 },
        name: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string' },
        is_active: { type: 'boolean' },
        statistics_category: { type: ['string', 'null'] },
        statistics_sub_categories: {
            type: ['array', 'null'],
            items: { type: 'string' }
        },
        statistics_rules: {
            type: ['array', 'null'],
            items: {
                type: ['object', 'null'],
                properties: {
                    field_id: { type: ['string', 'null'] },
                    operator: { type: ['string', 'null'] },
                    condition: { type: ['string', 'null'] },
                    category: { type: ['string', 'null'] },
                    disable_on_apoyo: { type: ['boolean', 'null'] },
                    disable_main_stat_on_apoyo: { type: ['boolean', 'null'] },
                    disabled_sub_categories_on_apoyo: {
                        type: ['array', 'null'],
                        items: { type: 'string' }
                    },
                    categories: {
                        type: ['array', 'null'],
                        items: { type: 'string' }
                    },
                    conditions: {
                        type: ['array', 'null'],
                        items: {
                            type: 'object',
                            properties: {
                                field_id: { type: ['string', 'null'] },
                                operator: { type: ['string', 'null'] },
                                condition: { type: ['string', 'null'] },
                            }
                        }
                    },
                    or_conditions: {
                        type: ['array', 'null'],
                        items: {
                            type: 'object',
                            properties: {
                                field_id: { type: ['string', 'null'] },
                                operator: { type: ['string', 'null'] },
                                condition: { type: ['string', 'null'] },
                            }
                        }
                    },
                },
            },
        },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'name', 'content', 'is_active'],
    indexes: []
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
        workspace_id: { type: 'string', maxLength: 50 },
        type: { type: 'string', maxLength: 50 },
        name: { type: 'string' }, // Common field for search/display
        data: { type: 'object' },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'workspace_id', 'type'],
    indexes: ['workspace_id', 'type']
};

/**
 * Consolidated collection for configuration items: settings, units, field_definitions, guards, drafts.
 */
export const configsSchema = {
    title: 'configs schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 150 },
        workspace_id: { type: 'string', maxLength: 50 },
        type: { type: 'string', maxLength: 50 },
        name: { type: 'string' },
        data: { type: 'object' },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'workspace_id', 'type', 'data'],
    indexes: ['workspace_id', 'type']
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
        workspace_id: { type: 'string', maxLength: 50 },
        type: { type: 'string', maxLength: 50 },
        date: { type: 'string', maxLength: 20 },
        personnel_id: { type: 'string', maxLength: 100 },
        data: { type: 'object' },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'workspace_id', 'type', 'date', 'personnel_id', 'data'],
    indexes: ['workspace_id', 'type', 'date', 'personnel_id']
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
        workspace_id: { type: 'string', maxLength: 50 },
        title: { type: 'string' },
        message: { type: 'string' },
        type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
        read: { type: 'boolean' },
        timestamp: { type: 'string', maxLength: 50 },
        metadata: { type: 'object' },
    },
};

/**
 * Collection for pending activities / Kanban tasks.
 */
export const pendingActivitiesSchema = {
    title: 'pending activities schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 150 },
        workspace_id: { type: 'string', maxLength: 50 },
        date: { type: 'string', maxLength: 20 },
        time: { type: 'string' },
        text: { type: 'string' },
        category: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], maxLength: 50 },
        completed: { type: 'boolean' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        subtasks: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                    completed: { type: 'boolean' }
                }
            }
        },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'workspace_id', 'date', 'time', 'text', 'category', 'status'],
    indexes: ['workspace_id', 'status', 'date']
};

/**
 * Collection for WhatsApp scheduled messages.
 */
export const scheduledMessagesSchema = {
    title: 'scheduled messages schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 150 },
        workspace_id: { type: 'string', maxLength: 50 },
        chatId: { type: 'string', maxLength: 100 },
        message: { type: ['string', 'null'] },
        title: { type: 'string' },
        scheduledTime: { type: 'string', maxLength: 50 },
        status: { type: 'string', enum: ['pending', 'sent', 'failed'], maxLength: 50 },
        error: { type: ['string', 'null'] },
        media: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    url: { type: 'string' },
                    name: { type: ['string', 'null'] },
                    description: { type: ['string', 'null'] }
                }
            }
        },
        modified: { type: ['string', 'null'] },
        _deleted: { type: 'boolean' }
    },
    required: ['id', 'workspace_id', 'chatId', 'title', 'scheduledTime', 'status'],
    indexes: ['workspace_id', 'status', 'scheduledTime']
};




