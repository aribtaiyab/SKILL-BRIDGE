import { Router } from 'express'
import * as ic from '../controllers/industryController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('industry'))

router.get('/opportunities', ic.getIndustryOpportunities)
router.post('/opportunities', ic.createIndustryOpportunity)
router.get('/candidates', ic.getIndustryCandidates)
router.get('/applications', ic.getIndustryApplications)
router.patch('/applications/:id/status', ic.updateApplicationStatus)
router.get('/insights', ic.getIndustryInsights)

export default router
