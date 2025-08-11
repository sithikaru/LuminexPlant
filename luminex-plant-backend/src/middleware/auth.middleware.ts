import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import prisma from '../config/database'
import { AuthRequest, AuthenticatedUser } from '../types'

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        firstName: true,
        lastName: true,
        isActive: true 
      }
    })

    if (!user || !user.isActive) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid or inactive user' 
      })
      return
    }

    req.user = user as AuthenticatedUser
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(403).json({ 
      success: false, 
      error: 'Invalid token' 
    })
  }
}

export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      })
      return
    }
    next()
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { 
          id: true, 
          email: true, 
          role: true, 
          firstName: true,
          lastName: true,
          isActive: true 
        }
      })

      if (user && user.isActive) {
        req.user = user as AuthenticatedUser
      }
    }

    next()
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    next()
  }
}
