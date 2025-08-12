import { z } from 'zod'

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name must contain only letters'),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']),
})

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name must contain only letters')
    .optional(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']).optional(),
  isActive: z.boolean().optional(),
})

// Species validation schemas
export const speciesSchema = z.object({
  name: z
    .string()
    .min(2, 'Species name must be at least 2 characters')
    .max(100, 'Species name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Species name must contain only letters'),
  scientificName: z
    .string()
    .max(200, 'Scientific name must be less than 200 characters')
    .optional(),
  targetGirth: z
    .number()
    .min(0.1, 'Target girth must be at least 0.1 cm')
    .max(100, 'Target girth must be less than 100 cm'),
  targetHeight: z
    .number()
    .min(1, 'Target height must be at least 1 cm')
    .max(1000, 'Target height must be less than 1000 cm'),
})

// Zone validation schemas
export const zoneSchema = z.object({
  name: z
    .string()
    .min(2, 'Zone name must be at least 2 characters')
    .max(100, 'Zone name must be less than 100 characters'),
  capacity: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(100000, 'Capacity must be less than 100,000'),
})

// Bed validation schemas
export const bedSchema = z.object({
  name: z
    .string()
    .min(2, 'Bed name must be at least 2 characters')
    .max(100, 'Bed name must be less than 100 characters'),
  capacity: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity must be less than 10,000'),
  zoneId: z.string().uuid('Invalid zone ID'),
})

// Batch validation schemas
export const batchSchema = z.object({
  customName: z
    .string()
    .max(100, 'Custom name must be less than 100 characters')
    .optional(),
  speciesId: z.string().uuid('Invalid species ID'),
  initialQty: z
    .number()
    .min(1, 'Initial quantity must be at least 1')
    .max(10000, 'Initial quantity must be less than 10,000'),
  pathway: z.enum(['PURCHASING', 'SEED_GERMINATION', 'CUTTING_GERMINATION', 'OUT_SOURCING']),
})

export const batchStageUpdateSchema = z.object({
  stage: z.enum([
    'INITIAL',
    'PROPAGATION',
    'SHADE_60',
    'SHADE_80',
    'GROWING',
    'HARDENING',
    'RE_POTTING',
    'PHYTOSANITARY',
  ]),
  zoneId: z.string().uuid('Invalid zone ID').optional(),
  bedId: z.string().uuid('Invalid bed ID').optional(),
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(10000, 'Quantity must be less than 10,000'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

// Measurement validation schemas
export const measurementSchema = z.object({
  batchId: z.string().uuid('Invalid batch ID'),
  girth: z
    .number()
    .min(0.1, 'Girth must be at least 0.1 cm')
    .max(100, 'Girth must be less than 100 cm'),
  height: z
    .number()
    .min(1, 'Height must be at least 1 cm')
    .max(1000, 'Height must be less than 1000 cm'),
  sampleSize: z
    .number()
    .min(1, 'Sample size must be at least 1')
    .max(100, 'Sample size must be less than 100'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

export const rangeMeasurementSchema = z.object({
  batchId: z.string().uuid('Invalid batch ID'),
  girthRange: z.string().regex(/^\d+(\.\d+)?-\d+(\.\d+)?$/, 'Invalid girth range format'),
  heightRange: z.string().regex(/^\d+(\.\d+)?-\d+(\.\d+)?$/, 'Invalid height range format'),
  quantity: z
    .number()
    .min(1, 'Quantity must be at least 1')
    .max(10000, 'Quantity must be less than 10,000'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
})

// Task validation schemas
export const taskSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  type: z.enum(['MEASUREMENT', 'STAGE_TRANSITION', 'MAINTENANCE', 'INSPECTION']),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  dueDate: z.date(),
})

// Search and filter schemas
export const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const batchFilterSchema = searchParamsSchema.extend({
  stage: z
    .enum([
      'INITIAL',
      'PROPAGATION',
      'SHADE_60',
      'SHADE_80',
      'GROWING',
      'HARDENING',
      'RE_POTTING',
      'PHYTOSANITARY',
    ])
    .optional(),
  status: z.enum(['CREATED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  speciesId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
})

export const measurementFilterSchema = searchParamsSchema.extend({
  batchId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// Type inference
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type UpdateUserData = z.infer<typeof updateUserSchema>
export type SpeciesData = z.infer<typeof speciesSchema>
export type ZoneData = z.infer<typeof zoneSchema>
export type BedData = z.infer<typeof bedSchema>
export type BatchData = z.infer<typeof batchSchema>
export type BatchStageUpdateData = z.infer<typeof batchStageUpdateSchema>
export type MeasurementData = z.infer<typeof measurementSchema>
export type RangeMeasurementData = z.infer<typeof rangeMeasurementSchema>
export type TaskData = z.infer<typeof taskSchema>
export type SearchParams = z.infer<typeof searchParamsSchema>
export type BatchFilter = z.infer<typeof batchFilterSchema>
export type MeasurementFilter = z.infer<typeof measurementFilterSchema>
