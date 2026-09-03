import { Router } from 'express'
import * as ac from '../controllers/academicianController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/students', ac.getCohortStudents)
router.get('/students/:id', ac.getStudentDetail)
router.get('/insights', ac.getAcademicianInsights)
router.get('/mentorship', ac.getMentorshipSessions)
router.post('/mentorship', ac.createMentorshipSession)
router.get('/workshops', ac.getWorkshops)
router.post('/workshops', ac.createWorkshop)

export default router
