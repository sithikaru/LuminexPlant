import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { validationResult } from 'express-validator'

const prisma = new PrismaClient()

export const zoneController = {
  // Get all zones
  async getZones(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, isActive } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      
      if (search) {
        where.name = { contains: search as string, mode: 'insensitive' }
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true'
      }

      const [zones, total] = await Promise.all([
        prisma.zone.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' },
          include: {
            beds: {
              include: {
                batches: {
                  where: { status: { in: ['CREATED', 'IN_PROGRESS'] } }
                }
              }
            },
            _count: {
              select: { 
                beds: true,
                batches: true
              }
            }
          }
        }),
        prisma.zone.count({ where })
      ])

      // Calculate occupancy for each zone
      const zonesWithOccupancy = zones.map((zone: any) => {
        const totalOccupied = zone.beds.reduce((sum: number, bed: any) => {
          return sum + bed.batches.reduce((bedSum: number, batch: any) => bedSum + batch.currentQty, 0)
        }, 0)
        
        return {
          ...zone,
          currentOccupancy: totalOccupied,
          utilizationPercentage: zone.capacity > 0 ? Math.round((totalOccupied / zone.capacity) * 100) : 0
        }
      })

      res.json({
        success: true,
        data: {
          data: zonesWithOccupancy,
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
      console.error('Error fetching zones:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch zones'
      })
    }
  },

  // Get zone by ID
  async getZoneById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const zone = await prisma.zone.findUnique({
        where: { id },
        include: {
          beds: {
            include: {
              batches: {
                include: {
                  species: true,
                  createdBy: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          batches: {
            include: {
              species: true,
              bed: true
            }
          },
          _count: {
            select: { 
              beds: true,
              batches: true
            }
          }
        }
      })

      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Zone not found'
        })
      }

      // Calculate occupancy
      const zoneWithBeds = zone as any; // Type assertion to access included relations
      const totalOccupied = zoneWithBeds.beds.reduce((sum: number, bed: any) => {
        return sum + bed.batches.reduce((bedSum: number, batch: any) => bedSum + batch.currentQty, 0)
      }, 0)

      const zoneWithOccupancy = {
        ...zone,
        currentOccupancy: totalOccupied,
        utilizationPercentage: zone.capacity > 0 ? Math.round((totalOccupied / zone.capacity) * 100) : 0
      }

      res.json({
        success: true,
        data: zoneWithOccupancy
      })
    } catch (error) {
      console.error('Error fetching zone:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch zone'
      })
    }
  },

  // Create new zone
  async createZone(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { name, capacity, beds = [] } = req.body

      // Check if zone with same name already exists
      const existingZone = await prisma.zone.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      })

      if (existingZone) {
        return res.status(400).json({
          success: false,
          message: 'Zone with this name already exists'
        })
      }

      // Create zone with beds in a transaction
      const zone = await prisma.$transaction(async (tx: any) => {
        const newZone = await tx.zone.create({
          data: {
            name,
            capacity
          }
        })

        // Create beds if provided
        if (beds.length > 0) {
          await tx.bed.createMany({
            data: beds.map((bed: any) => ({
              name: bed.name,
              capacity: bed.capacity,
              zoneId: newZone.id,
              occupied: 0
            }))
          })
        }

        return tx.zone.findUnique({
          where: { id: newZone.id },
          include: {
            beds: true,
            _count: {
              select: { beds: true, batches: true }
            }
          }
        })
      })

      res.status(201).json({
        success: true,
        data: zone,
        message: 'Zone created successfully'
      })
    } catch (error) {
      console.error('Error creating zone:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create zone'
      })
    }
  },

  // Update zone
  async updateZone(req: Request, res: Response): Promise<Response | void> {
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
      const { name, capacity, isActive } = req.body

      // Check if zone exists
      const existingZone = await prisma.zone.findUnique({
        where: { id }
      })

      if (!existingZone) {
        return res.status(404).json({
          success: false,
          message: 'Zone not found'
        })
      }

      // Check for name conflicts
      if (name) {
        const nameConflict = await prisma.zone.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              { name: { equals: name, mode: 'insensitive' } }
            ]
          }
        })

        if (nameConflict) {
          return res.status(400).json({
            success: false,
            message: 'Zone with this name already exists'
          })
        }
      }

      const zone = await prisma.zone.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(capacity && { capacity }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          beds: true,
          _count: {
            select: { beds: true, batches: true }
          }
        }
      })

      res.json({
        success: true,
        data: zone,
        message: 'Zone updated successfully'
      })
    } catch (error) {
      console.error('Error updating zone:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update zone'
      })
    }
  },

  // Delete zone
  async deleteZone(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      // Check if zone exists
      const zone = await prisma.zone.findUnique({
        where: { id },
        include: {
          _count: {
            select: { 
              beds: true,
              batches: true
            }
          }
        }
      })

      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Zone not found'
        })
      }

      // Check if zone has active batches
      if (zone._count.batches > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete zone with existing batches. Please move or complete batches first.'
        })
      }

      // Delete zone and associated beds
      await prisma.$transaction(async (tx: any) => {
        // Delete beds first
        await tx.bed.deleteMany({
          where: { zoneId: id }
        })
        
        // Delete zone
        await tx.zone.delete({
          where: { id }
        })
      })

      res.json({
        success: true,
        message: 'Zone deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting zone:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete zone'
      })
    }
  },

  // Get zone beds
  async getZoneBeds(req: Request, res: Response): Promise<Response | void> {
    try {
      const { zoneId } = req.params
      const { page = 1, limit = 10, isActive } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = { zoneId }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true'
      }

      const [beds, total] = await Promise.all([
        prisma.bed.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' },
          include: {
            zone: true,
            batches: {
              where: { status: { in: ['CREATED', 'IN_PROGRESS'] } },
              include: {
                species: true
              }
            }
          }
        }),
        prisma.bed.count({ where })
      ])

      res.json({
        success: true,
        data: {
          data: beds,
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
      console.error('Error fetching zone beds:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch zone beds'
      })
    }
  }
}
