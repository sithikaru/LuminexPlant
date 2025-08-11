import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const analyticsController = {
  // Get dashboard statistics
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalBatches,
        activeBatches,
        readyBatches,
        totalPlants,
        totalSpecies,
        totalZones,
        measurementsToday,
        measurementsThisWeek,
        recentActivity
      ] = await Promise.all([
        // Total batches
        prisma.batch.count(),
        
        // Active batches
        prisma.batch.count({
          where: { status: { in: ['CREATED', 'IN_PROGRESS'] } }
        }),
        
        // Ready batches
        prisma.batch.count({
          where: { isReady: true, status: { not: 'DELIVERED' } }
        }),
        
        // Total plants (sum of current quantities)
        prisma.batch.aggregate({
          _sum: { currentQty: true },
          where: { status: { not: 'DELIVERED' } }
        }).then((result: any) => result._sum.currentQty || 0),
        
        // Total species
        prisma.species.count({ where: { isActive: true } }),
        
        // Total zones
        prisma.zone.count({ where: { isActive: true } }),
        
        // Measurements today
        prisma.measurement.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // Measurements this week
        prisma.measurement.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Recent activity (last 10 batch updates)
        prisma.batch.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            batchNumber: true,
            status: true,
            stage: true,
            updatedAt: true,
            species: {
              select: { name: true }
            }
          }
        })
      ])

      const stats = {
        totalBatches,
        activeBatches,
        readyBatches,
        totalPlants,
        totalSpecies,
        totalZones,
        measurementsToday,
        measurementsThisWeek,
        recentActivity: recentActivity.map((batch: any) => ({
          id: batch.id,
          type: 'batch_update',
          message: `Batch ${batch.batchNumber} (${batch.species.name}) updated to ${batch.stage}`,
          createdAt: batch.updatedAt.toISOString()
        }))
      }

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics'
      })
    }
  },

  // Get zone utilization
  async getZoneUtilization(req: Request, res: Response): Promise<void> {
    try {
      const zones = await prisma.zone.findMany({
        where: { isActive: true },
        include: {
          beds: {
            include: {
              batches: {
                where: { status: { in: ['CREATED', 'IN_PROGRESS'] } }
              }
            }
          }
        }
      })

      const utilization = zones.map((zone: any) => {
        const totalOccupied = zone.beds.reduce((sum: number, bed: any) => {
          return sum + bed.batches.reduce((bedSum: number, batch: any) => bedSum + batch.currentQty, 0)
        }, 0)

        return {
          zoneId: zone.id,
          zoneName: zone.name,
          capacity: zone.capacity,
          occupied: totalOccupied,
          utilizationPercentage: zone.capacity > 0 ? Math.round((totalOccupied / zone.capacity) * 100) : 0
        }
      })

      res.json({
        success: true,
        data: utilization
      })
    } catch (error) {
      console.error('Error fetching zone utilization:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch zone utilization'
      })
    }
  },

  // Get species distribution
  async getSpeciesDistribution(req: Request, res: Response): Promise<void> {
    try {
      const distribution = await prisma.species.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              batches: {
                where: { status: { not: 'DELIVERED' } }
              }
            }
          },
          batches: {
            where: { status: { not: 'DELIVERED' } },
            select: { currentQty: true }
          }
        }
      })

      const speciesData = distribution.map((species: any) => ({
        speciesId: species.id,
        speciesName: species.name,
        batchCount: species._count.batches,
        plantCount: species.batches.reduce((sum: number, batch: any) => sum + batch.currentQty, 0)
      }))

      res.json({
        success: true,
        data: speciesData
      })
    } catch (error) {
      console.error('Error fetching species distribution:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch species distribution'
      })
    }
  },

  // Get stage pipeline
  async getStagePipeline(req: Request, res: Response): Promise<void> {
    try {
      const stages = ['INITIAL', 'PROPAGATION', 'SHADE_60', 'SHADE_80', 'GROWING', 'HARDENING', 'RE_POTTING', 'PHYTOSANITARY']
      
      const pipeline = await Promise.all(
        stages.map(async stage => {
          const batchCount = await prisma.batch.count({
            where: { 
              stage,
              status: { in: ['CREATED', 'IN_PROGRESS'] }
            }
          })

          const plantCount = await prisma.batch.aggregate({
            _sum: { currentQty: true },
            where: { 
              stage,
              status: { in: ['CREATED', 'IN_PROGRESS'] }
            }
          }).then((result: any) => result._sum.currentQty || 0)

          return {
            stage,
            batchCount,
            plantCount
          }
        })
      )

      res.json({
        success: true,
        data: pipeline
      })
    } catch (error) {
      console.error('Error fetching stage pipeline:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stage pipeline'
      })
    }
  },

  // Get growth trends
  async getGrowthTrends(req: Request, res: Response): Promise<void> {
    try {
      const { speciesId, startDate, endDate } = req.query
      
      const where: any = {}
      if (speciesId) {
        where.batch = { speciesId: speciesId as string }
      }
      
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate as string)
        if (endDate) where.createdAt.lte = new Date(endDate as string)
      } else {
        // Default to last 30 days
        where.createdAt = {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }

      const measurements = await prisma.measurement.findMany({
        where,
        include: {
          batch: {
            select: {
              species: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      // Group measurements by date
      const trendData = measurements.reduce((acc: any, measurement: any) => {
        const date = measurement.createdAt.toISOString().split('T')[0]
        
        if (!acc[date]) {
          acc[date] = {
            date,
            girthSum: 0,
            heightSum: 0,
            count: 0
          }
        }
        
        acc[date].girthSum += measurement.girth
        acc[date].heightSum += measurement.height
        acc[date].count += 1
        
        return acc
      }, {})

      const trends = Object.values(trendData).map((day: any) => ({
        date: day.date,
        averageGirth: Number((day.girthSum / day.count).toFixed(2)),
        averageHeight: Number((day.heightSum / day.count).toFixed(2)),
        measurementCount: day.count
      }))

      res.json({
        success: true,
        data: trends
      })
    } catch (error) {
      console.error('Error fetching growth trends:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch growth trends'
      })
    }
  },

  // Get production metrics
  async getProductionMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query
      
      const dateFilter: any = {}
      if (startDate || endDate) {
        if (startDate) dateFilter.gte = new Date(startDate as string)
        if (endDate) dateFilter.lte = new Date(endDate as string)
      } else {
        // Default to last 30 days
        dateFilter.gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }

      const [
        batchesCreated,
        batchesCompleted,
        plantsProduced,
        averageProcessingTime,
        lossAnalysis
      ] = await Promise.all([
        // Batches created in period
        prisma.batch.count({
          where: { createdAt: dateFilter }
        }),
        
        // Batches completed in period
        prisma.batch.count({
          where: { 
            status: 'DELIVERED',
            updatedAt: dateFilter
          }
        }),
        
        // Total plants produced (delivered)
        prisma.batch.aggregate({
          _sum: { currentQty: true },
          where: { 
            status: 'DELIVERED',
            updatedAt: dateFilter
          }
        }).then((result: any) => result._sum.currentQty || 0),
        
        // Average processing time (for completed batches)
        prisma.batch.findMany({
          where: { 
            status: 'DELIVERED',
            updatedAt: dateFilter
          },
          select: {
            createdAt: true,
            readyDate: true
          }
        }).then((batches: any[]) => {
          if (batches.length === 0) return 0
          
          const totalDays = batches.reduce((sum: number, batch: any) => {
            if (batch.readyDate) {
              const days = Math.ceil((new Date(batch.readyDate).getTime() - new Date(batch.createdAt).getTime()) / (1000 * 60 * 60 * 24))
              return sum + days
            }
            return sum
          }, 0)
          
          return Math.round(totalDays / batches.length)
        }),
        
        // Loss analysis
        prisma.batch.aggregate({
          _sum: { lossQty: true },
          where: { 
            lossQty: { gt: 0 },
            updatedAt: dateFilter
          }
        }).then((result: any) => result._sum.lossQty || 0)
      ])

      const metrics = {
        batchesCreated,
        batchesCompleted,
        plantsProduced,
        averageProcessingTime,
        totalLoss: lossAnalysis,
        completionRate: batchesCreated > 0 ? Math.round((batchesCompleted / batchesCreated) * 100) : 0
      }

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      console.error('Error fetching production metrics:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch production metrics'
      })
    }
  }
}
