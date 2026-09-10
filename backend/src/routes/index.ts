import { Router } from 'express'
import healthRoutes from './health.js'
import profileRoutes from './profile.js'
import studentRoutes from './student.js'
import industryRoutes from './industry.js'
import academicianRoutes from './academician.js'
import institutionRoutes from './institution.js'
import opportunitiesRoutes from './opportunities.js'
import applicationsRoutes from './applications.js'
import verificationRoutes from './verification.js'
import passportRoutes from './passport.js'
import aiRoutes from './ai.js'
import careerNavigatorRoutes from './careerNavigator.js'
import careersRoutes from './careers.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/profile', profileRoutes)
router.use('/student', studentRoutes)
router.use('/careers', careersRoutes)
router.use('/career-targets', careersRoutes)
router.use('/industry', industryRoutes)
router.use('/academia', academicianRoutes)
router.use('/academician', academicianRoutes)
router.use('/institution', institutionRoutes)
router.use('/opportunities', opportunitiesRoutes)
router.use('/applications', applicationsRoutes)
router.use('/verification', verificationRoutes)
router.use('/passport', passportRoutes)
router.use('/ai', aiRoutes)
router.use('/career-navigator', careerNavigatorRoutes)

export default router
