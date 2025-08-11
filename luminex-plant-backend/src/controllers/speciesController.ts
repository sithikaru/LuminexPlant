import { Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { validationResult } from 'express-validator'

const prisma = new PrismaClient()

export const speciesController = {
  // Get all species
  async getSpecies(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, isActive } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { scientificName: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true'
      }

      const [species, total] = await Promise.all([
        prisma.species.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { batches: true }
            }
          }
        }),
        prisma.species.count({ where })
      ])

      res.json({
        success: true,
        data: {
          data: species,
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
      console.error('Error fetching species:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch species'
      })
    }
  },

  // Get species by ID
  async getSpeciesById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      const species = await prisma.species.findUnique({
        where: { id },
        include: {
          batches: {
            include: {
              zone: true,
              bed: true
            }
          },
          _count: {
            select: { batches: true }
          }
        }
      })

      if (!species) {
        return res.status(404).json({
          success: false,
          message: 'Species not found'
        })
      }

      res.json({
        success: true,
        data: species
      })
    } catch (error) {
      console.error('Error fetching species:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch species'
      })
    }
  },

  // Create new species
  async createSpecies(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const { name, scientificName, targetGirth, targetHeight } = req.body

      // Check if species with same name already exists
      const existingSpecies = await prisma.species.findFirst({
        where: {
          OR: [
            { name: { equals: name } },
            ...(scientificName ? [{ scientificName: { equals: scientificName } }] : [])
          ]
        }
      })

      if (existingSpecies) {
        return res.status(400).json({
          success: false,
          message: 'Species with this name or scientific name already exists'
        })
      }

      const species = await prisma.species.create({
        data: {
          name,
          scientificName,
          targetGirth,
          targetHeight
        }
      })

      res.status(201).json({
        success: true,
        data: species,
        message: 'Species created successfully'
      })
    } catch (error) {
      console.error('Error creating species:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create species'
      })
    }
  },

  // Update species
  async updateSpecies(req: Request, res: Response): Promise<Response | void> {
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
      const { name, scientificName, targetGirth, targetHeight, isActive } = req.body

      // Check if species exists
      const existingSpecies = await prisma.species.findUnique({
        where: { id }
      })

      if (!existingSpecies) {
        return res.status(404).json({
          success: false,
          message: 'Species not found'
        })
      }

      // Check for name conflicts
      if (name || scientificName) {
        const nameConflict = await prisma.species.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  ...(name ? [{ name: { equals: name } }] : []),
                  ...(scientificName ? [{ scientificName: { equals: scientificName } }] : [])
                ]
              }
            ]
          }
        })

        if (nameConflict) {
          return res.status(400).json({
            success: false,
            message: 'Species with this name or scientific name already exists'
          })
        }
      }

      const species = await prisma.species.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(scientificName && { scientificName }),
          ...(targetGirth && { targetGirth }),
          ...(targetHeight && { targetHeight }),
          ...(isActive !== undefined && { isActive })
        }
      })

      res.json({
        success: true,
        data: species,
        message: 'Species updated successfully'
      })
    } catch (error) {
      console.error('Error updating species:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update species'
      })
    }
  },

  // Delete species
  async deleteSpecies(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params

      // Check if species exists
      const species = await prisma.species.findUnique({
        where: { id },
        include: {
          _count: {
            select: { batches: true }
          }
        }
      })

      if (!species) {
        return res.status(404).json({
          success: false,
          message: 'Species not found'
        })
      }

      // Check if species has active batches
      if (species._count.batches > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete species with existing batches. Please remove or transfer batches first.'
        })
      }

      await prisma.species.delete({
        where: { id }
      })

      res.json({
        success: true,
        message: 'Species deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting species:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete species'
      })
    }
  }
}
