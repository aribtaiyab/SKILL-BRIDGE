import { Router } from 'express'
import * as ac from '../controllers/academicianController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('academician', 'institution'))

// Dashboard & Notifications (ISSUE 1 FIX)
router.get('/dashboard', ac.getAcademiaDashboard)
router.get('/notifications', ac.getAcademiaNotifications)
router.patch('/notifications', ac.markNotificationsRead)

// Core Academia Hub Features
router.get('/students', ac.getCohortStudents)
router.get('/students/:id', ac.getStudentDetail)
router.get('/insights', ac.getAcademicianInsights)
router.get('/mentorship', ac.getMentorshipSessions)
router.get('/mentorships', ac.getMentorshipSessions)
router.post('/mentorship', ac.createMentorshipSession)
router.post('/mentorships', ac.createMentorshipSession)
router.get('/workshops', ac.getWorkshops)
router.post('/workshops', ac.createWorkshop)
router.get('/interventions', ac.getAcademiaInterventions)
router.get('/opportunities', ac.getAcademiaOpportunities)
router.get('/industry', ac.getAcademiaIndustryDemand)
router.get('/profile', ac.getAcademiaProfile)

export default router
