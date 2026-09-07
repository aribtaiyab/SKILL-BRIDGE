import { Router } from 'express'
import { getCareerBenchmark, getCareerTargetSkills, getCareerTargetsList } from '../controllers/studentController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Public / auth-optional or authenticated benchmark lookup
router.get('/', getCareerTargetsList)
router.get('/:careerId/benchmark', getCareerBenchmark)
router.get('/:careerId', getCareerBenchmark)
router.get('/:careerId/skills', getCareerTargetSkills)

export default router
