import { Router } from 'express'
import * as ac from '../controllers/academicianController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('academician'))

router.get('/students', ac.getCohortStudents)
router.get('/students/:id', ac.getStudentDetail)
router.get('/insights', ac.getAcademicianInsights)
router.get('/mentorship', ac.getMentorshipSessions)
router.post('/mentorship', ac.createMentorshipSession)
router.get('/workshops', ac.getWorkshops)
router.post('/workshops', ac.createWorkshop)

export default router
