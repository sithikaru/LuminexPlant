import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { validationResult } from 'express-validator'

const prisma = new PrismaClient()

export const measurementController = {
  // Get all measurements
  async getMeasurements(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        batchId, 
        userId, 
        startDate, 
        endDate 
      } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      
      if (batchId) where.batchId = batchId as string
      if (userId) where.userId = userId as string
      
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate as string)
        if (endDate) where.createdAt.lte = new Date(endDate as string)
      }

      const [measurements, total] = await Promise.all([
        prisma.measurement.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            batch: {
              include: {
                species: true,
                zone: true,
                bed: true
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        prisma.measurement.count({ where })
      ])

      res.json({
        success: true,
        data: {
          data: measurements,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: skip + Number(limit) < total,
            hasPrev: Number(page) > 1
          }
        }
      })
    } catch (error) {
      console.error('Error fetching measurements:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch measurements'
      })
    }
  },

  // Get measurement by ID
  async getMeasurementById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const measurement = await prisma.measurement.findUnique({
        where: { id },
        include: {
          batch: {
            include: {
              species: true,
              zone: true,
              bed: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      if (!measurement) {
        return res.status(404).json({
          success: false,
          message: 'Measurement not found'
        })
      }

      res.json({
        success: true,
        data: measurement
      })
    } catch (error) {
      console.error('Error fetching measurement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch measurement'
      })
    }
  },

  // Create new measurement
  async createMeasurement(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { batchId, girth, height, sampleSize, notes } = req.body
      const userId = (req as any).user.id

      // Verify batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { species: true }
      })

      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'Batch not found'
        })
      }

      // Validate sample size doesn't exceed batch quantity
      if (sampleSize > batch.currentQty) {
        return res.status(400).json({
          success: false,
          message: 'Sample size cannot exceed batch quantity'
        })
      }

      const measurement = await prisma.measurement.create({
        data: {
          batchId,
          userId,
          girth,
          height,
          sampleSize,
          notes
        },
        include: {
          batch: {
            include: {
              species: true,
              zone: true,
              bed: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      res.status(201).json({
        success: true,
        data: measurement,
        message: 'Measurement created successfully'
      })
    } catch (error) {
      console.error('Error creating measurement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create measurement'
      })
    }
  },

  // Create range measurement (multiple measurements for batch)
  async createRangeMeasurement(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { 
        batchId, 
        girthRange, 
        heightRange, 
        sampleSize, 
        notes 
      } = req.body
      const userId = (req as any).user.id

      // Verify batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: batchId }
      })

      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'Batch not found'
        })
      }

      // Validate sample size
      if (sampleSize > batch.currentQty) {
        return res.status(400).json({
          success: false,
          message: 'Sample size cannot exceed batch quantity'
        })
      }

      // Calculate average values from ranges
      const avgGirth = (girthRange.min + girthRange.max) / 2
      const avgHeight = (heightRange.min + heightRange.max) / 2

      const measurement = await prisma.measurement.create({
        data: {
          batchId,
          userId,
          girth: avgGirth,
          height: avgHeight,
          sampleSize,
          notes: `Range measurement - Girth: ${girthRange.min}-${girthRange.max}cm, Height: ${heightRange.min}-${heightRange.max}cm${notes ? '. ' + notes : ''}`
        },
        include: {
          batch: {
            include: {
              species: true,
              zone: true,
              bed: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      res.status(201).json({
        success: true,
        data: measurement,
        message: 'Range measurement created successfully'
      })
    } catch (error) {
      console.error('Error creating range measurement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create range measurement'
      })
    }
  },

  // Update measurement
  async updateMeasurement(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { id } = req.params
      const { girth, height, sampleSize, notes } = req.body
      const userId = (req as any).user.id

      // Check if measurement exists and user has permission
      const existingMeasurement = await prisma.measurement.findUnique({
        where: { id },
        include: { user: true }
      })

      if (!existingMeasurement) {
        return res.status(404).json({
          success: false,
          message: 'Measurement not found'
        })
      }

      // Only allow creator or admin to update
      const userRole = (req as any).user.role
      if (existingMeasurement.userId !== userId && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this measurement'
        })
      }

      const measurement = await prisma.measurement.update({
        where: { id },
        data: {
          ...(girth !== undefined && { girth }),
          ...(height !== undefined && { height }),
          ...(sampleSize !== undefined && { sampleSize }),
          ...(notes !== undefined && { notes })
        },
        include: {
          batch: {
            include: {
              species: true,
              zone: true,
              bed: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: measurement,
        message: 'Measurement updated successfully'
      })
    } catch (error) {
      console.error('Error updating measurement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update measurement'
      })
    }
  },

  // Delete measurement
  async deleteMeasurement(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params
      const userId = (req as any).user.id

      // Check if measurement exists and user has permission
      const measurement = await prisma.measurement.findUnique({
        where: { id },
        include: { user: true }
      })

      if (!measurement) {
        return res.status(404).json({
          success: false,
          message: 'Measurement not found'
        })
      }

      // Only allow creator or admin to delete
      const userRole = (req as any).user.role
      if (measurement.userId !== userId && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this measurement'
        })
      }

      await prisma.measurement.delete({
        where: { id }
      })

      res.json({
        success: true,
        message: 'Measurement deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting measurement:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete measurement'
      })
    }
  },

  // Get batch measurements
  async getBatchMeasurements(req: Request, res: Response): Promise<Response | void> {
    try {
      const { batchId } = req.params

      // Verify batch exists
      const batch = await prisma.batch.findUnique({
        where: { id: batchId }
      })

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        })
      }

      const measurements = await prisma.measurement.findMany({
        where: { batchId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: measurements
      })
    } catch (error) {
      console.error('Error fetching batch measurements:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch measurements'
      })
    }
  },

  // Get growth ranges for form validation
  async getGrowthRanges(req: Request, res: Response): Promise<void> {
    try {
      const ranges = [
        {
          label: 'Seedling (0-10cm)',
          value: 'seedling',
          min: 0,
          max: 10
        },
        {
          label: 'Young (10-30cm)',
          value: 'young',
          min: 10,
          max: 30
        },
        {
          label: 'Juvenile (30-60cm)',
          value: 'juvenile',
          min: 30,
          max: 60
        },
        {
          label: 'Mature (60-100cm)',
          value: 'mature',
          min: 60,
          max: 100
        },
        {
          label: 'Large (100cm+)',
          value: 'large',
          min: 100,
          max: 200
        }
      ]

      res.json({
        success: true,
        data: ranges
      })
    } catch (error) {
      console.error('Error fetching growth ranges:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch growth ranges'
      })
    }
  }
}
