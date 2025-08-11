import { Request } from 'express'
import { UserRole } from '@prisma/client'

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser
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

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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

export interface BatchFilters {
  status?: string
  stage?: string
  pathway?: string
  speciesId?: string
  zoneId?: string
  bedId?: string
  isReady?: boolean
  createdById?: string
  dateFrom?: string
  dateTo?: string
}

export interface GrowthData {
  date: string
  girth: number
  height: number
  sampleSize: number
}

export interface UnitConversion {
  value: number
  fromUnit: string
  toUnit: string
}

export interface AnalyticsData {
  totalBatches: number
  totalPlants: number
  readyBatches: number
  zoneUtilization: Array<{
    zoneId: string
    zoneName: string
    capacity: number
    occupied: number
    utilizationPercentage: number
  }>
  speciesDistribution: Array<{
    speciesId: string
    speciesName: string
    batchCount: number
    plantCount: number
  }>
  stagePipeline: Array<{
    stage: string
    batchCount: number
    plantCount: number
  }>
}
