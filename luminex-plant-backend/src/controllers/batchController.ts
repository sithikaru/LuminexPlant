import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { validationResult } from 'express-validator'

const prisma = new PrismaClient()

export const batchController = {
  // Get all batches
  async getBatches(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        speciesId, 
        zoneId, 
        bedId, 
        status, 
        stage, 
        isReady 
      } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      
      if (search) {
        where.OR = [
          { batchNumber: { contains: search as string, mode: 'insensitive' } },
          { customName: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      if (speciesId) where.speciesId = speciesId as string
      if (zoneId) where.zoneId = zoneId as string
      if (bedId) where.bedId = bedId as string
      if (status) where.status = status as string
      if (stage) where.stage = stage as string
      if (isReady !== undefined) where.isReady = isReady === 'true'

      const [batches, total] = await Promise.all([
        prisma.batch.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            species: true,
            zone: true,
            bed: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
              }
            },
            measurements: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            _count: {
              select: { measurements: true }
            }
          }
        }),
        prisma.batch.count({ where })
      ])

      res.json({
        success: true,
        data: {
          data: batches,
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
      console.error('Error fetching batches:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batches'
      })
    }
  },

  // Get batch by ID
  async getBatchById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
          species: true,
          zone: true,
          bed: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          },
          measurements: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true
                }
              }
            }
          },
          stageHistory: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        })
      }

      res.json({
        success: true,
        data: batch
      })
    } catch (error) {
      console.error('Error fetching batch:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch'
      })
    }
  },

  // Create new batch
  async createBatch(req: Request, res: Response): Promise<Response | void> {
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
        batchNumber, 
        customName, 
        pathway, 
        speciesId, 
        initialQty, 
        zoneId, 
        bedId 
      } = req.body
      const userId = (req as any).user.id

      // Check if batch number already exists
      const existingBatch = await prisma.batch.findFirst({
        where: { batchNumber: { equals: batchNumber, mode: 'insensitive' } }
      })

      if (existingBatch) {
        return res.status(400).json({
          success: false,
          message: 'Batch number already exists'
        })
      }

      // Verify species exists
      const species = await prisma.species.findUnique({
        where: { id: speciesId }
      })

      if (!species) {
        return res.status(400).json({
          success: false,
          message: 'Species not found'
        })
      }

      // Verify zone and bed if provided
      if (zoneId) {
        const zone = await prisma.zone.findUnique({
          where: { id: zoneId }
        })

        if (!zone) {
          return res.status(400).json({
            success: false,
            message: 'Zone not found'
          })
        }
      }

      if (bedId) {
        const bed = await prisma.bed.findUnique({
          where: { id: bedId }
        })

        if (!bed) {
          return res.status(400).json({
            success: false,
            message: 'Bed not found'
          })
        }

        // Check bed capacity
        const bedOccupancy = await prisma.batch.aggregate({
          where: {
            bedId,
            status: { in: ['CREATED', 'IN_PROGRESS'] }
          },
          _sum: { currentQty: true }
        })

        const currentOccupancy = bedOccupancy._sum.currentQty || 0
        if (currentOccupancy + initialQty > bed.capacity) {
          return res.status(400).json({
            success: false,
            message: 'Bed capacity exceeded'
          })
        }
      }

      const batch = await prisma.$transaction(async (tx: any) => {
        // Create batch
        const newBatch = await tx.batch.create({
          data: {
            batchNumber,
            customName,
            pathway,
            speciesId,
            initialQty,
            currentQty: initialQty,
            createdById: userId,
            zoneId,
            bedId,
            status: 'CREATED',
            stage: 'INITIAL'
          },
          include: {
            species: true,
            zone: true,
            bed: true,
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true
              }
            }
          }
        })

        // Create initial stage history
        await tx.stageHistory.create({
          data: {
            batchId: newBatch.id,
            toStage: 'INITIAL',
            quantity: initialQty,
            notes: 'Batch created'
          }
        })

        // Update bed occupancy if applicable
        if (bedId) {
          await tx.bed.update({
            where: { id: bedId },
            data: {
              occupied: {
                increment: initialQty
              }
            }
          })
        }

        return newBatch
      })

      res.status(201).json({
        success: true,
        data: batch,
        message: 'Batch created successfully'
      })
    } catch (error) {
      console.error('Error creating batch:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create batch'
      })
    }
  },

  // Update batch
  async updateBatch(req: Request, res: Response): Promise<Response | void> {
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
      const { customName, currentQty, status, isReady, readyDate, lossReason, lossQty } = req.body

      // Check if batch exists
      const existingBatch = await prisma.batch.findUnique({
        where: { id },
        include: { bed: true }
      })

      if (!existingBatch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        })
      }

      const batch = await prisma.batch.update({
        where: { id },
        data: {
          ...(customName !== undefined && { customName }),
          ...(currentQty !== undefined && { currentQty }),
          ...(status && { status }),
          ...(isReady !== undefined && { isReady }),
          ...(readyDate && { readyDate: new Date(readyDate) }),
          ...(lossReason && { lossReason }),
          ...(lossQty !== undefined && { lossQty })
        },
        include: {
          species: true,
          zone: true,
          bed: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: batch,
        message: 'Batch updated successfully'
      })
    } catch (error) {
      console.error('Error updating batch:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update batch'
      })
    }
  },

  // Update batch stage
  async updateBatchStage(req: Request, res: Response): Promise<Response | void> {
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
      const { toStage, quantity, notes } = req.body

      // Check if batch exists
      const batch = await prisma.batch.findUnique({
        where: { id }
      })

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        })
      }

      // Validate stage transition
      const validStages = ['INITIAL', 'PROPAGATION', 'SHADE_60', 'SHADE_80', 'GROWING', 'HARDENING', 'RE_POTTING', 'PHYTOSANITARY']
      if (!validStages.includes(toStage)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid stage'
        })
      }

      const updatedBatch = await prisma.$transaction(async (tx: any) => {
        // Update batch stage
        const updated = await tx.batch.update({
          where: { id },
          data: {
            stage: toStage,
            currentQty: quantity,
            status: 'IN_PROGRESS'
          },
          include: {
            species: true,
            zone: true,
            bed: true
          }
        })

        // Create stage history record
        await tx.stageHistory.create({
          data: {
            batchId: id,
            fromStage: batch.stage,
            toStage,
            quantity,
            notes
          }
        })

        return updated
      })

      res.json({
        success: true,
        data: updatedBatch,
        message: 'Batch stage updated successfully'
      })
    } catch (error) {
      console.error('Error updating batch stage:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update batch stage'
      })
    }
  },

  // Mark batch as ready
  async markBatchReady(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const batch = await prisma.batch.findUnique({
        where: { id }
      })

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        })
      }

      const updatedBatch = await prisma.batch.update({
        where: { id },
        data: {
          isReady: true,
          readyDate: new Date(),
          status: 'READY'
        },
        include: {
          species: true,
          zone: true,
          bed: true
        }
      })

      res.json({
        success: true,
        data: updatedBatch,
        message: 'Batch marked as ready'
      })
    } catch (error) {
      console.error('Error marking batch ready:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to mark batch as ready'
      })
    }
  },

  // Deliver batch
  async deliverBatch(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const batch = await prisma.batch.findUnique({
        where: { id },
        include: { bed: true }
      })

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        })
      }

      if (!batch.isReady) {
        return res.status(400).json({
          success: false,
          message: 'Batch is not ready for delivery'
        })
      }

      const updatedBatch = await prisma.$transaction(async (tx: any) => {
        // Update batch status
        const updated = await tx.batch.update({
          where: { id },
          data: {
            status: 'DELIVERED'
          },
          include: {
            species: true,
            zone: true,
            bed: true
          }
        })

        // Update bed occupancy
        if (batch.bedId && batch.bed) {
          await tx.bed.update({
            where: { id: batch.bedId },
            data: {
              occupied: {
                decrement: batch.currentQty
              }
            }
          })
        }

        return updated
      })

      res.json({
        success: true,
        data: updatedBatch,
        message: 'Batch delivered successfully'
      })
    } catch (error) {
      console.error('Error delivering batch:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to deliver batch'
      })
    }
  },

  // Delete batch
  async deleteBatch(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const batch = await prisma.batch.findUnique({
        where: { id },
        include: {
          _count: {
            select: { measurements: true }
          }
        }
      })

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        })
      }

      // Check if batch can be deleted
      if (batch.status === 'DELIVERED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete delivered batch'
        })
      }

      await prisma.$transaction(async (tx: any) => {
        // Delete measurements
        await tx.measurement.deleteMany({
          where: { batchId: id }
        })

        // Delete stage history
        await tx.stageHistory.deleteMany({
          where: { batchId: id }
        })

        // Update bed occupancy if applicable
        if (batch.bedId) {
          await tx.bed.update({
            where: { id: batch.bedId },
            data: {
              occupied: {
                decrement: batch.currentQty
              }
            }
          })
        }

        // Delete batch
        await tx.batch.delete({
          where: { id }
        })
      })

      res.json({
        success: true,
        message: 'Batch deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting batch:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete batch'
      })
    }
  }
}
