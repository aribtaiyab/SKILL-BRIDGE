import { Router } from 'express'
import * as vc from '../controllers/verificationController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// All verification routes require authentication
router.use(requireAuth)

// 1. Available Academicians for student selection
router.get('/academicians', vc.getAvailableAcademicians)

// 2. Student Request Operations
router.post('/requests', vc.createVerificationRequest)
router.get('/student/requests', vc.getStudentVerificationRequests)

// 3. Academician Queue & Decision Operations
router.get('/academician/requests', vc.getAcademicianVerificationRequests)
router.post('/requests/:id/accept', vc.acceptVerificationRequest)
router.post('/requests/:id/schedule', vc.scheduleVerificationSession)
router.post('/requests/:id/notes', vc.saveVerificationNotes)

// 4. Academic Skill Test
router.get('/requests/:id/test', vc.getAcademicTest)
router.post('/requests/:id/test/submit', vc.submitAcademicTest)

// 5. Final Verification Decision (Verify, Reject, Reassessment)
router.post('/requests/:id/decision', vc.completeVerificationDecision)

export default router
