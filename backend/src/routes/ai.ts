import { Router } from 'express'
import * as aic from '../controllers/aiController.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/coach', optionalAuth, aic.chatCoach)
router.post('/diagnose', optionalAuth, aic.diagnose)
router.post('/learning-plan', optionalAuth, aic.learningPlan)
router.post('/practice', optionalAuth, aic.practice)
router.post('/feedback', optionalAuth, aic.feedback)
router.post('/explain-readiness', optionalAuth, aic.explainReadiness)
router.post('/evidence-guidance', optionalAuth, aic.evidenceGuidance)

export default router
