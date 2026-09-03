import { Router } from 'express'
import * as inc from '../controllers/institutionController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/insights', inc.getInstitutionInsights)
router.get('/students', inc.getInstitutionStudents)

export default router
