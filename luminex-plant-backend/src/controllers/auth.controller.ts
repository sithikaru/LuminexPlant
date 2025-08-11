import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import prisma from '../config/database'
import { AuthRequest } from '../types'
import { logAuditAction } from '../utils/auditUtils'
import { asyncHandler } from '../middleware/errorHandler.middleware'

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
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

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true
    }
  })

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials or inactive account'
    })
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    })
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  // Log audit action
  await logAuditAction(
    user.id,
    'USER_LOGIN',
    undefined,
    undefined,
    { email: user.email, loginTime: new Date() }
  )

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token
    },
    message: 'Login successful'
  })
})

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated'
    })
  }

  const { firstName, lastName } = req.body

  const oldUser = await prisma.user.findUnique({
    where: { id: req.user.id }
  })

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName,
      lastName
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
  await logAuditAction(
    req.user.id,
    'PROFILE_UPDATED',
    undefined,
    { firstName: oldUser?.firstName, lastName: oldUser?.lastName },
    { firstName: updatedUser.firstName, lastName: updatedUser.lastName }
  )

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  })
})

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated'
    })
  }

  const { currentPassword, newPassword } = req.body

  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  })

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    })
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password)
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    })
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedNewPassword }
  })

  // Log audit action
  await logAuditAction(
    req.user.id,
    'PASSWORD_CHANGED',
    undefined,
    undefined,
    { changedAt: new Date() }
  )

  res.json({
    success: true,
    message: 'Password changed successfully'
  })
})

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated'
    })
  }

  // Generate new JWT token
  const token = jwt.sign(
    { 
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  res.json({
    success: true,
    data: { token },
    message: 'Token refreshed successfully'
  })
})
