import { Request, Response, NextFunction } from 'express'

interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
    [key: string]: any
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        })
        return
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions. Required role: ' + allowedRoles.join(' or ')
        })
        return
      }

      next()
    } catch (error) {
      console.error('Role middleware error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}
