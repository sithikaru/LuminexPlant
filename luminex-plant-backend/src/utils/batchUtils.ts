import { PathwayType } from '@prisma/client'
import prisma from '../config/database'

export const generateBatchNumber = async (pathway: PathwayType): Promise<string> => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')

  const pathwayCode: Record<PathwayType, string> = {
    PURCHASING: 'PU',
    SEED_GERMINATION: 'SG',
    CUTTING_GERMINATION: 'CG',
    OUT_SOURCING: 'OS'
  }

  const datePrefix = `${pathwayCode[pathway]}${year}${month}${day}`

  // Find the highest sequence number for today
  const lastBatch = await prisma.batch.findFirst({
    where: {
      batchNumber: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      batchNumber: 'desc'
    }
  })

  let sequence = 1
  if (lastBatch) {
    const lastSequence = parseInt(lastBatch.batchNumber.slice(-3))
    sequence = lastSequence + 1
  }

  return `${datePrefix}${sequence.toString().padStart(3, '0')}`
}

export const calculateReadyDate = async (batchId: string): Promise<Date | null> => {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      species: true,
      measurements: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!batch || batch.measurements.length < 2) {
    return null
  }

  const { species, measurements } = batch
  const targetGirth = species.targetGirth
  const targetHeight = species.targetHeight

  // Calculate growth rates
  const sortedMeasurements = measurements.sort((a, b) => 
    a.createdAt.getTime() - b.createdAt.getTime()
  )

  const firstMeasurement = sortedMeasurements[0]
  const lastMeasurement = sortedMeasurements[sortedMeasurements.length - 1]

  const daysDiff = Math.max(1, 
    (lastMeasurement.createdAt.getTime() - firstMeasurement.createdAt.getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  const girthGrowthRate = (lastMeasurement.girth - firstMeasurement.girth) / daysDiff
  const heightGrowthRate = (lastMeasurement.height - firstMeasurement.height) / daysDiff

  // Calculate days needed to reach targets
  const girthDaysNeeded = girthGrowthRate > 0 ? 
    Math.ceil((targetGirth - lastMeasurement.girth) / girthGrowthRate) : Infinity

  const heightDaysNeeded = heightGrowthRate > 0 ? 
    Math.ceil((targetHeight - lastMeasurement.height) / heightGrowthRate) : Infinity

  // Use the longer timeline
  const daysNeeded = Math.max(girthDaysNeeded, heightDaysNeeded)

  if (daysNeeded === Infinity || daysNeeded < 0) {
    return null
  }

  const readyDate = new Date()
  readyDate.setDate(readyDate.getDate() + daysNeeded)

  return readyDate
}

export const checkBatchReadiness = async (batchId: string): Promise<boolean> => {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      species: true,
      measurements: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!batch || batch.measurements.length === 0) {
    return false
  }

  const latestMeasurement = batch.measurements[0]
  const { species } = batch

  return latestMeasurement.girth >= species.targetGirth && 
         latestMeasurement.height >= species.targetHeight
}
