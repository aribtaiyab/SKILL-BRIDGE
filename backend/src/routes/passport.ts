import { Router } from 'express'
import { getPublicPassport } from '../controllers/passportController.js'

const router = Router()

router.get('/:shareToken', getPublicPassport)

export default router
