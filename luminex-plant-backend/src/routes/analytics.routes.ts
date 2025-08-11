import { Router } from 'express'
import { analyticsController } from '../controllers/analyticsController'
import { authenticateToken } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Routes
router.get('/dashboard', authenticateToken, analyticsController.getDashboardStats)
router.get('/zones', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getZoneUtilization)
router.get('/species', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getSpeciesDistribution)
router.get('/stages', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getStagePipeline)
router.get('/growth', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getGrowthTrends)
router.get('/production', authenticateToken, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getProductionMetrics)

export default router
