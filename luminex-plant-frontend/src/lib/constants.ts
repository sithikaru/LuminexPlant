export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    STATS: '/users/stats',
  },
  SPECIES: {
    BASE: '/species',
    BY_ID: (id: string) => `/species/${id}`,
  },
  ZONES: {
    BASE: '/zones',
    BY_ID: (id: string) => `/zones/${id}`,
    BEDS: (id: string) => `/zones/${id}/beds`,
  },
  BEDS: {
    BASE: '/beds',
    BY_ID: (id: string) => `/beds/${id}`,
  },
  BATCHES: {
    BASE: '/batches',
    BY_ID: (id: string) => `/batches/${id}`,
    STAGE: (id: string) => `/batches/${id}/stage`,
    READY: (id: string) => `/batches/${id}/ready`,
    DELIVER: (id: string) => `/batches/${id}/deliver`,
  },
  MEASUREMENTS: {
    BASE: '/measurements',
    BY_ID: (id: string) => `/measurements/${id}`,
    BY_BATCH: (batchId: string) => `/measurements/batch/${batchId}`,
    RANGES: '/measurements/ranges',
  },
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    ZONES: '/analytics/zones',
    SPECIES: '/analytics/species',
    STAGES: '/analytics/stages',
    GROWTH: '/analytics/growth',
    PRODUCTION: '/analytics/production',
  },
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id: string) => `/tasks/${id}`,
    BY_USER: (userId: string) => `/tasks/user/${userId}`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_ID: (id: string) => `/notifications/${id}`,
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
} as const

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  FIELD_OFFICER: 'FIELD_OFFICER',
} as const

export const PATHWAY_TYPES = {
  PURCHASING: 'PURCHASING',
  SEED_GERMINATION: 'SEED_GERMINATION',
  CUTTING_GERMINATION: 'CUTTING_GERMINATION',
  OUT_SOURCING: 'OUT_SOURCING',
} as const

export const BATCH_STATUSES = {
  CREATED: 'CREATED',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const

export const BATCH_STAGES = {
  INITIAL: 'INITIAL',
  PROPAGATION: 'PROPAGATION',
  SHADE_60: 'SHADE_60',
  SHADE_80: 'SHADE_80',
  GROWING: 'GROWING',
  HARDENING: 'HARDENING',
  RE_POTTING: 'RE_POTTING',
  PHYTOSANITARY: 'PHYTOSANITARY',
} as const

export const NOTIFICATION_TYPES = {
  MEASUREMENT_DUE: 'MEASUREMENT_DUE',
  BATCH_READY: 'BATCH_READY',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
} as const

export const TASK_TYPES = {
  MEASUREMENT: 'MEASUREMENT',
  STAGE_TRANSITION: 'STAGE_TRANSITION',
  MAINTENANCE: 'MAINTENANCE',
  INSPECTION: 'INSPECTION',
} as const

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const

export const STATUS_COLORS = {
  [BATCH_STATUSES.CREATED]: 'bg-blue-100 text-blue-800',
  [BATCH_STATUSES.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [BATCH_STATUSES.READY]: 'bg-green-100 text-green-800',
  [BATCH_STATUSES.DELIVERED]: 'bg-gray-100 text-gray-800',
  [BATCH_STATUSES.CANCELLED]: 'bg-red-100 text-red-800',
} as const

export const STAGE_COLORS = {
  [BATCH_STAGES.INITIAL]: 'bg-purple-100 text-purple-800',
  [BATCH_STAGES.PROPAGATION]: 'bg-blue-100 text-blue-800',
  [BATCH_STAGES.SHADE_60]: 'bg-indigo-100 text-indigo-800',
  [BATCH_STAGES.SHADE_80]: 'bg-cyan-100 text-cyan-800',
  [BATCH_STAGES.GROWING]: 'bg-green-100 text-green-800',
  [BATCH_STAGES.HARDENING]: 'bg-yellow-100 text-yellow-800',
  [BATCH_STAGES.RE_POTTING]: 'bg-orange-100 text-orange-800',
  [BATCH_STAGES.PHYTOSANITARY]: 'bg-red-100 text-red-800',
} as const

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    'users:read',
    'users:write',
    'users:delete',
    'species:read',
    'species:write',
    'species:delete',
    'zones:read',
    'zones:write',
    'zones:delete',
    'batches:read',
    'batches:write',
    'batches:delete',
    'measurements:read',
    'measurements:write',
    'analytics:read',
    'tasks:read',
    'tasks:write',
    'notifications:read',
  ],
  [USER_ROLES.MANAGER]: [
    'users:read',
    'species:read',
    'species:write',
    'zones:read',
    'zones:write',
    'batches:read',
    'batches:write',
    'measurements:read',
    'measurements:write',
    'analytics:read',
    'tasks:read',
    'tasks:write',
    'notifications:read',
  ],
  [USER_ROLES.FIELD_OFFICER]: [
    'species:read',
    'zones:read',
    'batches:read',
    'batches:write',
    'measurements:read',
    'measurements:write',
    'tasks:read',
    'tasks:write',
    'notifications:read',
  ],
} as const

export const CHART_COLORS = {
  PRIMARY: '#8884d8',
  SECONDARY: '#82ca9d',
  TERTIARY: '#ffc658',
  DANGER: '#ff7300',
  SUCCESS: '#00ff00',
  WARNING: '#ffaa00',
  INFO: '#00aaff',
} as const
