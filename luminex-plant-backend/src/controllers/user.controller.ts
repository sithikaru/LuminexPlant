import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import prisma from '../config/database'
import { AuthRequest, PaginationParams, PaginatedResponse } from '../types'
import { logAuditAction } from '../utils/auditUtils'
import { asyncHandler } from '../middleware/errorHandler.middleware'

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as PaginationParams & {
    role?: UserRole
    isActive?: string
    search?: string
  }

  const where: any = {}

  // Add filters
  if (req.query.role) {
    where.role = req.query.role
  }
  
  if (req.query.isActive !== undefined) {
    where.isActive = req.query.isActive === 'true'
  }

  if (req.query.search) {
    where.OR = [
      { firstName: { contains: req.query.search as string, mode: 'insensitive' } },
      { lastName: { contains: req.query.search as string, mode: 'insensitive' } },
      { email: { contains: req.query.search as string, mode: 'insensitive' } }
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdBatches: true,
            measurements: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: ((page as number) - 1) * (limit as number),
      take: limit as number
    }),
    prisma.user.count({ where })
  ])

  const response: PaginatedResponse<any> = {
    data: users,
    pagination: {
      page: page as number,
      limit: limit as number,
      total,
      totalPages: Math.ceil(total / (limit as number)),
      hasNext: (page as number) * (limit as number) < total,
      hasPrev: (page as number) > 1
    }
  }

  res.json({
    success: true,
    ...response
  })
})

export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          createdBatches: true,
          measurements: true,
          tasks: true
        }
      }
    }
  })

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  res.json({
    success: true,
    data: user
  })
})

export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User with this email already exists'
    })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role as UserRole
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  })

  // Log audit action
  if (req.user) {
    await logAuditAction(
      req.user.id,
      'USER_CREATED',
      undefined,
      undefined,
      { userId: user.id, email: user.email, role: user.role }
    )
  }

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully'
  })
})

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { firstName, lastName, role, isActive } = req.body

  const existingUser = await prisma.user.findUnique({
    where: { id }
  })

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      firstName,
      lastName,
      role: role as UserRole,
      isActive
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })

  // Log audit action
  if (req.user) {
    await logAuditAction(
      req.user.id,
      'USER_UPDATED',
      undefined,
      {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        role: existingUser.role,
        isActive: existingUser.isActive
      },
      {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    )
  }

  res.json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully'
  })
})

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  // Prevent deleting own account
  if (req.user?.id === id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete your own account'
    })
  }

  const existingUser = await prisma.user.findUnique({
    where: { id }
  })

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  // Check if user has dependencies
  const dependencyCount = await prisma.user.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          createdBatches: true,
          measurements: true,
          auditLogs: true
        }
      }
    }
  })

  if (dependencyCount?._count.createdBatches || dependencyCount?._count.measurements || dependencyCount?._count.auditLogs) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete user with existing batches, measurements, or audit logs. Deactivate instead.'
    })
  }

  await prisma.user.delete({
    where: { id }
  })

  // Log audit action
  if (req.user) {
    await logAuditAction(
      req.user.id,
      'USER_DELETED',
      undefined,
      { userId: id, email: existingUser.email },
      undefined
    )
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  })
})

export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } }),
    prisma.user.count({ where: { role: UserRole.MANAGER } }),
    prisma.user.count({ where: { role: UserRole.FIELD_OFFICER } }),
    prisma.user.count({ 
      where: { 
        createdAt: { 
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        } 
      } 
    })
  ])

  const [
    totalUsers,
    activeUsers,
    superAdmins,
    managers,
    fieldOfficers,
    newUsersThisMonth
  ] = stats

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution: {
        superAdmins,
        managers,
        fieldOfficers
      },
      newUsersThisMonth
    }
  })
})
