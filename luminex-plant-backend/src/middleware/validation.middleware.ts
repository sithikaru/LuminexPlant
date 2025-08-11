import { Request, Response, NextFunction } from 'express'
import { body, validationResult, param, query } from 'express-validator'
import validator from 'validator'

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array()
    })
    return
  }
  next()
}

// Sanitize and validate common inputs
export const sanitizeInput = (value: string): string => {
  return validator.escape(validator.trim(value))
}

// User validation rules
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('First name must be 2-50 characters, letters only'),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('Last name must be 2-50 characters, letters only'),
  body('role')
    .isIn(['SUPER_ADMIN', 'MANAGER', 'FIELD_OFFICER'])
    .withMessage('Valid role is required'),
  handleValidationErrors
]

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
]

// Species validation rules
export const validateSpecies = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s\-\.]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('Species name must be 2-100 characters, letters only'),
  body('scientificName')
    .optional()
    .isLength({ max: 150 })
    .customSanitizer(sanitizeInput),
  body('targetGirth')
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Target girth must be between 0.1 and 100 cm'),
  body('targetHeight')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Target height must be between 1 and 1000 cm'),
  handleValidationErrors
]

// Zone validation rules
export const validateZone = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('Zone name must be 2-100 characters'),
  body('capacity')
    .isInt({ min: 1, max: 50000 })
    .withMessage('Capacity must be between 1 and 50,000'),
  handleValidationErrors
]

// Bed validation rules
export const validateBed = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('Bed name must be 2-50 characters'),
  body('capacity')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Bed capacity must be between 1 and 10,000'),
  body('zoneId')
    .isUUID()
    .withMessage('Valid zone ID is required'),
  handleValidationErrors
]

// Batch validation rules
export const validateBatch = [
  body('customName')
    .optional()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeInput),
  body('speciesId')
    .isUUID()
    .withMessage('Valid species ID is required'),
  body('initialQty')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Initial quantity must be between 1 and 10,000'),
  body('pathway')
    .isIn(['PURCHASING', 'SEED_GERMINATION', 'CUTTING_GERMINATION', 'OUT_SOURCING'])
    .withMessage('Valid pathway is required'),
  body('zoneId')
    .optional()
    .isUUID()
    .withMessage('Valid zone ID required if provided'),
  body('bedId')
    .optional()
    .isUUID()
    .withMessage('Valid bed ID required if provided'),
  handleValidationErrors
]

// Measurement validation rules
export const validateMeasurement = [
  body('batchId')
    .isUUID()
    .withMessage('Valid batch ID is required'),
  body('girth')
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Girth must be between 0.1 and 100 cm'),
  body('height')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Height must be between 1 and 1000 cm'),
  body('sampleSize')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Sample size must be between 1 and 1000'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .customSanitizer(sanitizeInput),
  handleValidationErrors
]

// Range-based measurement validation
export const validateRangeMeasurement = [
  body('batchId')
    .isUUID()
    .withMessage('Valid batch ID is required'),
  body('girthRange')
    .matches(/^\d+\.?\d*-\d+\.?\d*$|^\d+\.?\d*\+$/)
    .withMessage('Valid girth range is required (e.g., "1.0-1.5" or "10.0+")'),
  body('heightRange')
    .matches(/^\d+\.?\d*-\d+\.?\d*$|^\d+\.?\d*\+$/)
    .withMessage('Valid height range is required (e.g., "15-20" or "100+")'),
  body('sampleSize')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Sample size must be between 1 and 1000'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .customSanitizer(sanitizeInput),
  handleValidationErrors
]

// Batch update validation
export const validateBatchUpdate = [
  body('customName')
    .optional()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeInput),
  body('currentQty')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Current quantity must be between 0 and 10,000'),
  body('status')
    .optional()
    .isIn(['CREATED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'])
    .withMessage('Valid status is required'),
  body('stage')
    .optional()
    .isIn(['INITIAL', 'PROPAGATION', 'SHADE_60', 'SHADE_80', 'GROWING', 'HARDENING', 'RE_POTTING', 'PHYTOSANITARY'])
    .withMessage('Valid stage is required'),
  body('isReady')
    .optional()
    .isBoolean()
    .withMessage('isReady must be a boolean'),
  body('lossReason')
    .optional()
    .isLength({ max: 200 })
    .customSanitizer(sanitizeInput),
  body('lossQty')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Loss quantity must be between 0 and 10,000'),
  body('zoneId')
    .optional()
    .isUUID()
    .withMessage('Valid zone ID required if provided'),
  body('bedId')
    .optional()
    .isUUID()
    .withMessage('Valid bed ID required if provided'),
  handleValidationErrors
]

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isAlpha()
    .withMessage('Sort field must contain only letters'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be "asc" or "desc"'),
  handleValidationErrors
]

// ID parameter validation
export const validateId = [
  param('id')
    .isUUID()
    .withMessage('Valid ID is required'),
  handleValidationErrors
]
