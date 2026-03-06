/**
 * RxDB Schema Definitions
 */

export const personnelSchema = {
    title: 'personnel schema',
    version: 2,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        personnelId: { type: 'string' },
        name: { type: 'string' },
        cedula: { type: 'string' },
        rank: { type: 'string' },
        cargo: { type: 'string' },
        titulo: { type: 'string' },
        roleId: { type: 'string' },
        status: { type: 'string' },
        department: { type: 'string' },
        specialties: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'name'],
};

export const reportsSchema = {
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

export const templatesSchema = {
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

export const guardHistorySchema = {
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

export const attendanceSchema = {
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

export const departmentsSchema = {
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

export const settingsSchema = {
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

export const rolesSchema = {
    title: 'roles schema',
    version: 1,
    primaryKey: 'name',
    type: 'object',
    properties: {
        name: { type: 'string', maxLength: 100 },
        isSingle: { type: 'boolean' },
        departmentScope: { type: 'array', items: { type: 'string' } },
        isHidden: { type: 'boolean' },
        order: { type: 'number' },
    },
    required: ['name', 'isSingle', 'departmentScope'],
};

export const addressesSchema = {
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

export const guardsSchema = {
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

export const unitsSchema = {
    title: 'units schema',
    version: 0,
    primaryKey: 'name',
    type: 'object',
    properties: {
        name: { type: 'string', maxLength: 100 },
    },
    required: ['name'],
};

export const fieldDefinitionsSchema = {
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

export const draftsSchema = {
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

export const templateConfigsSchema = {
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

export const personnelAssignmentHistorySchema = {
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
