import { Router } from 'express'
import * as cnc from '../controllers/careerNavigatorController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

router.post('/analyze', optionalAuth, cnc.analyzeCareer)
router.get('/history', optionalAuth, cnc.getCareerHistory)

export default router
