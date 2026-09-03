import { Router } from 'express'
import * as vc from '../controllers/verificationController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/queue', vc.getVerificationQueue)
router.post('/:id/approve', vc.approveVerification)
router.post('/:id/reject', vc.rejectVerification)
router.post('/:id/clarify', vc.clarifyVerification)

export default router
