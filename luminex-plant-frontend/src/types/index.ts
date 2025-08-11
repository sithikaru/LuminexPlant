export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Species {
  id: string
  name: string
  scientificName?: string
  targetGirth: number
  targetHeight: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Zone {
  id: string
  name: string
  capacity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  beds?: Bed[]
  _count?: {
    beds: number
    batches: number
  }
}

export interface Bed {
  id: string
  name: string
  capacity: number
  occupied: number
  zoneId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  zone?: Zone
  batches?: Batch[]
}

export interface Batch {
  id: string
  batchNumber: string
  customName?: string
  pathway: PathwayType
  speciesId: string
  initialQty: number
  currentQty: number
  status: BatchStatus
  stage: BatchStage
  isReady: boolean
  readyDate?: string
  lossReason?: string
  lossQty: number
  createdById: string
  zoneId?: string
  bedId?: string
  createdAt: string
  updatedAt: string
  species?: Species
  createdBy?: User
  zone?: Zone
  bed?: Bed
  measurements?: Measurement[]
  stageHistory?: StageHistory[]
}

export interface Measurement {
  id: string
  batchId: string
  userId: string
  girth: number
  height: number
  sampleSize: number
  notes?: string
  createdAt: string
  batch?: Batch
  user?: User
}

export interface StageHistory {
  id: string
  batchId: string
  fromStage?: BatchStage
  toStage: BatchStage
  quantity: number
  notes?: string
  createdAt: string
  batch?: Batch
}

export interface Task {
  id: string
  userId: string
  type: TaskType
  title: string
  description: string
  dueDate: string
  isCompleted: boolean
  createdAt: string
  completedAt?: string
  user?: User
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  user?: User
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  FIELD_OFFICER = 'FIELD_OFFICER'
}

export enum PathwayType {
  PURCHASING = 'PURCHASING',
  SEED_GERMINATION = 'SEED_GERMINATION',
  CUTTING_GERMINATION = 'CUTTING_GERMINATION',
  OUT_SOURCING = 'OUT_SOURCING'
}

export enum BatchStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum BatchStage {
  INITIAL = 'INITIAL',
  PROPAGATION = 'PROPAGATION',
  SHADE_60 = 'SHADE_60',
  SHADE_80 = 'SHADE_80',
  GROWING = 'GROWING',
  HARDENING = 'HARDENING',
  RE_POTTING = 'RE_POTTING',
  PHYTOSANITARY = 'PHYTOSANITARY'
}

export enum NotificationType {
  MEASUREMENT_DUE = 'MEASUREMENT_DUE',
  BATCH_READY = 'BATCH_READY',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum TaskType {
  MEASUREMENT = 'MEASUREMENT',
  STAGE_TRANSITION = 'STAGE_TRANSITION',
  MAINTENANCE = 'MAINTENANCE',
  INSPECTION = 'INSPECTION'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Array<{
    field: string
    message: string
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface DashboardStats {
  totalBatches: number
  totalPlants: number
  readyBatches: number
  activeBatches: number
  totalSpecies: number
  totalZones: number
  recentActivity: Array<{
    id: string
    type: string
    message: string
    createdAt: string
  }>
}

export interface ZoneUtilization {
  zoneId: string
  zoneName: string
  capacity: number
  occupied: number
  utilizationPercentage: number
}

export interface SpeciesDistribution {
  speciesId: string
  speciesName: string
  batchCount: number
  plantCount: number
}

export interface StagePipeline {
  stage: BatchStage
  batchCount: number
  plantCount: number
}

export interface GrowthTrend {
  date: string
  averageGirth: number
  averageHeight: number
  measurementCount: number
}

export interface GrowthRange {
  label: string
  value: string
  min: number
  max: number
}

export interface FormData {
  [key: string]: any
}

export interface FilterOptions {
  [key: string]: any
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}
