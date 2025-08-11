import { Router } from 'express'
import { body } from 'express-validator'
import { batchController } from '../controllers/batchController'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Validation rules
const createBatchValidation = [
  body('batchNumber')
    .trim()
    .notEmpty()
    .withMessage('Batch number is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Batch number must be between 3 and 50 characters'),
  body('customName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Custom name must not exceed 100 characters'),
  body('pathway')
    .isIn(['PURCHASING', 'SEED_GERMINATION', 'CUTTING_GERMINATION', 'OUT_SOURCING'])
    .withMessage('Invalid pathway'),
  body('speciesId')
    .isUUID()
    .withMessage('Valid species ID is required'),
  body('initialQty')
    .isInt({ min: 1 })
    .withMessage('Initial quantity must be a positive integer'),
  body('zoneId')
    .optional()
    .isUUID()
    .withMessage('Valid zone ID is required'),
  body('bedId')
    .optional()
    .isUUID()
    .withMessage('Valid bed ID is required')
]

const updateBatchValidation = [
  body('customName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Custom name must not exceed 100 characters'),
  body('currentQty')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current quantity must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['CREATED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid status'),
  body('isReady')
    .optional()
    .isBoolean()
    .withMessage('isReady must be a boolean'),
  body('lossReason')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Loss reason must not exceed 255 characters'),
  body('lossQty')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Loss quantity must be a non-negative integer')
]

const updateStageValidation = [
  body('toStage')
    .isIn(['INITIAL', 'PROPAGATION', 'SHADE_60', 'SHADE_80', 'GROWING', 'HARDENING', 'RE_POTTING', 'PHYTOSANITARY'])
    .withMessage('Invalid stage'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
]

// Routes
router.get('/', authenticateToken, batchController.getBatches)
router.get('/:id', authenticateToken, batchController.getBatchById)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']), createBatchValidation, batchController.createBatch)
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']), updateBatchValidation, batchController.updateBatch)
router.post('/:id/stage', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER']), updateStageValidation, batchController.updateBatchStage)
router.post('/:id/ready', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), batchController.markBatchReady)
router.post('/:id/deliver', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), batchController.deliverBatch)
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), batchController.deleteBatch)

export default router
