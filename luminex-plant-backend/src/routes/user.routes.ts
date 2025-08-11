import { Router } from 'express'
import { body } from 'express-validator'
import { userController } from '../controllers/userController'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Validation rules
const createUserValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .isIn(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER'])
    .withMessage('Invalid role')
]

const updateUserValidation = [
  body('username')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Username cannot be empty')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
]

// Routes
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), userController.getUsers)
router.get('/stats', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), userController.getUserStats)
router.get('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), userController.getUserById)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), createUserValidation, userController.createUser)
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), updateUserValidation, userController.updateUser)
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), userController.deleteUser)

export default router
