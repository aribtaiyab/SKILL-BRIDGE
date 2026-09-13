import { Router } from 'express'
import * as sc from '../controllers/studentController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// All student routes require authentication
router.use(requireAuth)

// Profile & Career Target
router.get('/profile', sc.getStudentProfile)
router.patch('/profile', sc.updateStudentProfile)
router.get('/career-target', sc.getCareerTarget)
router.get('/career-targets', sc.getCareerTargetsList)
router.get('/career-targets/:careerId/benchmark', sc.getCareerBenchmark)
router.get('/careers/:careerId/benchmark', sc.getCareerBenchmark)
router.patch('/career-target', sc.setCareerTarget)

// Career Target Skills (Self-declared baseline & diagnostic)
router.get('/career-target/skills', sc.getCareerTargetSkills)
router.post('/career-target/skills', sc.saveCareerTargetSkills)

// Skills & Readiness
router.get('/skills', sc.getStudentSkills)
router.get('/skills/:skillId/detail', sc.getStudentSkillDetail)
router.get('/skills/:skillId', sc.getStudentSkillDetail)
router.post('/skills', sc.addStudentSkill)
router.post('/skills/declare', sc.bulkDeclareStudentSkills)
router.get('/readiness', sc.getStudentReadiness)
router.get('/skill-gaps', sc.getStudentSkillGaps)
router.get('/opportunities', sc.getStudentOpportunities)
router.get('/opportunities/saved', sc.getSavedStudentOpportunities)
router.get('/saved-opportunities', sc.getSavedOpportunityIds)
router.post('/saved-opportunities', sc.toggleSavedOpportunity)

// Assessments
router.get('/assessments', sc.getStudentAssessments)
router.get('/assessments/history', sc.getStudentAssessmentHistory)
router.get('/assessments/history/:skillId', sc.getStudentAssessmentHistory)
router.get('/assessments/:id', sc.getStudentAssessmentById)
router.post('/assessments/:id/start', sc.startStudentAssessment)
router.post('/assessments/:id/submit', sc.submitStudentAssessment)

// Evidence
router.get('/evidence', sc.getStudentEvidence)
router.post('/evidence', sc.createStudentEvidence)
router.post('/evidence/:id/submit', sc.submitStudentEvidence)
router.delete('/evidence/:id', sc.deleteStudentEvidence)

// Projects
router.get('/projects', sc.getStudentProjects)
router.post('/projects', sc.createStudentProject)
router.patch('/projects/:id', sc.updateStudentProject)
router.delete('/projects/:id', sc.deleteStudentProject)

// Certifications
router.get('/certifications', sc.getStudentCertifications)
router.post('/certifications', sc.createStudentCertification)
router.delete('/certifications/:id', sc.deleteStudentCertification)

// Passport
router.get('/passport', sc.getStudentPassport)
router.patch('/passport/settings', sc.updateStudentPassportSettings)

// Progress
router.get('/progress', sc.getStudentProgress)

// Self-Ratings (Task 5) — stored in student_self_ratings, separate from skill_scores
router.post('/self-ratings', sc.saveSelfRatings)
router.get('/self-ratings/:career_target_id', sc.getSelfRatings)

export default router
