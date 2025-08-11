import { Router } from 'express'
import {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
} from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth.middleware'
import { authLimiter } from '../middleware/rateLimiter.middleware'
import {
  validateUserLogin,
  validateUserRegistration
} from '../middleware/validation.middleware'

const router = Router()

// Public routes (with auth rate limiting disabled for development)
router.post('/login', validateUserLogin, login)

// Protected routes (require authentication)
router.use(authenticateToken)

router.post('/register', validateUserRegistration, register)
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post('/change-password', changePassword)
router.post('/refresh-token', refreshToken)

export default router
