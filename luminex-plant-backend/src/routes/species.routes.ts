import { Router } from 'express'
import { body } from 'express-validator'
import { speciesController } from '../controllers/speciesController'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Validation rules
const createSpeciesValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Species name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Species name must be between 2 and 100 characters'),
  body('scientificName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Scientific name must be between 2 and 150 characters'),
  body('targetGirth')
    .isFloat({ min: 0 })
    .withMessage('Target girth must be a positive number'),
  body('targetHeight')
    .isFloat({ min: 0 })
    .withMessage('Target height must be a positive number')
]

const updateSpeciesValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Species name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Species name must be between 2 and 100 characters'),
  body('scientificName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Scientific name must be between 2 and 150 characters'),
  body('targetGirth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Target girth must be a positive number'),
  body('targetHeight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Target height must be a positive number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
]

// Routes
router.get('/', auth, speciesController.getSpecies)
router.get('/:id', auth, speciesController.getSpeciesById)
router.post('/', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), createSpeciesValidation, speciesController.createSpecies)
router.put('/:id', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), updateSpeciesValidation, speciesController.updateSpecies)
router.delete('/:id', auth, requireRole(['SUPER_ADMIN']), speciesController.deleteSpecies)

export default router
