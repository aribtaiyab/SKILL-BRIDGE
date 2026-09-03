import { Router } from 'express'
import * as apc from '../controllers/applicationsController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', apc.getApplications)
router.post('/', apc.submitApplication)

export default router
