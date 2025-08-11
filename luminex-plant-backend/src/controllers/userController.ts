import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const userController = {
  // Get all users
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      
      if (search) {
        where.OR = [
          { username: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      if (role) where.role = role as string
      if (isActive !== undefined) where.isActive = isActive === 'true'

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.user.count({ where })
      ])

      res.json({
        success: true,
        data: {
          data: users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: skip + Number(limit) < total,
            hasPrev: Number(page) > 1
          }
        }
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      })
    }
  },

  // Get user by ID
  async getUserById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              batchesCreated: true,
              measurements: true
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      console.error('Error fetching user:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      })
    }
  },

  // Create new user
  async createUser(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { username, email, password, firstName, lastName, role } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username, mode: 'insensitive' } },
            { email: { equals: email, mode: 'insensitive' } }
          ]
        }
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this username or email already exists'
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      })

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      })
    } catch (error) {
      console.error('Error creating user:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      })
    }
  },

  // Update user
  async updateUser(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { id } = req.params
      const { username, email, firstName, lastName, role, isActive } = req.body

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Check for username/email conflicts
      if (username || email) {
        const conflict = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  ...(username ? [{ username: { equals: username, mode: 'insensitive' } }] : []),
                  ...(email ? [{ email: { equals: email, mode: 'insensitive' } }] : [])
                ]
              }
            ]
          }
        })

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: 'User with this username or email already exists'
          })
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(username && { username }),
          ...(email && { email }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(role && { role }),
          ...(isActive !== undefined && { isActive })
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      })

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      })
    } catch (error) {
      console.error('Error updating user:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      })
    }
  },

  // Delete user
  async deleteUser(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              batchesCreated: true,
              measurements: true
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Check if user has associated data
      if (user._count.batchesCreated > 0 || user._count.measurements > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete user with associated batches or measurements. Please deactivate the user instead.'
        })
      }

      await prisma.user.delete({
        where: { id }
      })

      res.json({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      })
    }
  },

  // Get user statistics
  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        usersByRole
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        })
      ])

      const roleStats = usersByRole.reduce((acc: any, item: any) => {
        acc[item.role] = item._count.role
        return acc
      }, {
        SUPER_ADMIN: 0,
        MANAGER: 0,
        FIELD_OFFICER: 0
      })

      const stats = {
        totalUsers,
        activeUsers,
        usersByRole: roleStats
      }

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      })
    }
  }
}
