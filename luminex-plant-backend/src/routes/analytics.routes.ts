import { Router } from 'express'
import { analyticsController } from '../controllers/analyticsController'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'

const router = Router()

// Routes
router.get('/dashboard', auth, analyticsController.getDashboardStats)
router.get('/zones', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getZoneUtilization)
router.get('/species', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getSpeciesDistribution)
router.get('/stages', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getStagePipeline)
router.get('/growth', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getGrowthTrends)
router.get('/production', auth, requireRole(['SUPER_ADMIN', 'MANAGER']), analyticsController.getProductionMetrics)

export default router
