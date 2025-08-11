import prisma from '../config/database'

export const logAuditAction = async (
  userId: string,
  action: string,
  batchId?: string,
  oldValues?: any,
  newValues?: any
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        batchId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      },
    })
  } catch (error) {
    console.error('Failed to log audit action:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

export const getAuditLogs = async (
  filters: {
    userId?: string
    batchId?: string
    action?: string
    dateFrom?: Date
    dateTo?: Date
  } = {},
  page: number = 1,
  limit: number = 50
) => {
  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.batchId) where.batchId = filters.batchId
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
    if (filters.dateTo) where.createdAt.lte = filters.dateTo
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        batch: {
          select: {
            batchNumber: true,
            customName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}
