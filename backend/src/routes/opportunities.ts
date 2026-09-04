import { Router } from 'express'
import * as oc from '../controllers/opportunitiesController.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalAuth, oc.getOpportunities)
router.get('/:id', optionalAuth, oc.getOpportunityById)
router.get('/:id/readiness', requireAuth, oc.getStudentOpportunityReadiness)
router.get('/:id/proof', requireAuth, oc.getOpportunityProof)
router.post('/:id/save', requireAuth, oc.saveOpportunity)
router.delete('/:id/save', requireAuth, oc.unsaveOpportunity)

export default router
