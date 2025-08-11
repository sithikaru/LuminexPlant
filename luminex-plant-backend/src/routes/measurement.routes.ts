import { Router } from 'express'
import { body } from 'express-validator'
import { measurementController } from '../controllers/measurementController'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Validation rules
const createMeasurementValidation = [
  body('batchId')
    .isUUID()
    .withMessage('Valid batch ID is required'),
  body('girth')
    .isFloat({ min: 0 })
    .withMessage('Girth must be a positive number'),
  body('height')
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('sampleSize')
    .isInt({ min: 1 })
    .withMessage('Sample size must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
]

const createRangeMeasurementValidation = [
  body('batchId')
    .isUUID()
    .withMessage('Valid batch ID is required'),
  body('girthRange.min')
    .isFloat({ min: 0 })
    .withMessage('Minimum girth must be a positive number'),
  body('girthRange.max')
    .isFloat({ min: 0 })
    .withMessage('Maximum girth must be a positive number'),
  body('heightRange.min')
    .isFloat({ min: 0 })
    .withMessage('Minimum height must be a positive number'),
  body('heightRange.max')
    .isFloat({ min: 0 })
    .withMessage('Maximum height must be a positive number'),
  body('sampleSize')
    .isInt({ min: 1 })
    .withMessage('Sample size must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
]

const updateMeasurementValidation = [
  body('girth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Girth must be a positive number'),
  body('height')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('sampleSize')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sample size must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
]

// Routes
router.get('/', authenticateToken, measurementController.getMeasurements)
router.get('/ranges', authenticateToken, measurementController.getGrowthRanges)
router.get('/batch/:batchId', authenticateToken, measurementController.getBatchMeasurements)
router.get('/:id', authenticateToken, measurementController.getMeasurementById)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']), createMeasurementValidation, measurementController.createMeasurement)
router.post('/range', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']), createRangeMeasurementValidation, measurementController.createRangeMeasurement)
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']), updateMeasurementValidation, measurementController.updateMeasurement)
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']), measurementController.deleteMeasurement)

export default router
