import { Router } from 'express'
import { body } from 'express-validator'
import { zoneController } from '../controllers/zoneController'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Validation rules
const createZoneValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Zone name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Zone name must be between 2 and 100 characters'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  body('beds')
    .optional()
    .isArray()
    .withMessage('Beds must be an array'),
  body('beds.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Bed name is required'),
  body('beds.*.capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Bed capacity must be a positive integer')
]

const updateZoneValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Zone name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Zone name must be between 2 and 100 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
]

// Routes
router.get('/', auth, zoneController.getZones)
router.get('/:id', auth, zoneController.getZoneById)
router.get('/:zoneId/beds', auth, zoneController.getZoneBeds)
router.post('/', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), createZoneValidation, zoneController.createZone)
router.put('/:id', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), updateZoneValidation, zoneController.updateZone)
router.delete('/:id', auth, requireRole(['SUPER_ADMIN']), zoneController.deleteZone)

export default router
