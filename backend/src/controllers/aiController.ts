import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import {
  interactWithCoach,
  diagnoseSkillGap,
  getOrGenerateLearningPlan,
  generatePracticeChallenge,
  evaluatePractice,
  explainCareerReadiness,
} from '../ai/coach-service.js'

export async function chatCoach(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001'
    const { message, history = [], targetCareerId, opportunityId } = req.body || {}

    if (!message || !message.trim()) {
      return res.status(422).json({ success: false, error: 'Message is required' })
    }

    const result = await interactWithCoach(studentId, message.trim(), history, {
      targetCareerId,
      opportunityId,
    })

    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function diagnose(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001'
    const { skillName, targetCareerId, opportunityId } = req.body || {}

    const result = await diagnoseSkillGap(studentId, skillName, {
      targetCareerId,
      opportunityId,
    })

    res.status(200).json({ data: result.diagnosis })
  } catch (err) {
    next(err)
  }
}

export async function learningPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001'
    const { skillName, targetCareerId } = req.body || {}

    const result = await getOrGenerateLearningPlan(studentId, skillName, {
      targetCareerId,
    })

    res.status(200).json({ data: result.plan })
  } catch (err) {
    next(err)
  }
}

export async function practice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001'
    const { skillName, difficulty } = req.body || {}

    const question = await generatePracticeChallenge(studentId, skillName, difficulty)
    res.status(200).json({ data: question })
  } catch (err) {
    next(err)
  }
}

export async function feedback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001'
    const { skillName, practiceId, studentAnswer } = req.body || {}

    if (!studentAnswer) {
      return res.status(422).json({ success: false, error: 'studentAnswer is required' })
    }

    const evaluation = await evaluatePractice(studentId, skillName, practiceId, studentAnswer)
    res.status(200).json({ data: evaluation })
  } catch (err) {
    next(err)
  }
}

export async function explainReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.id || '00000000-0000-0000-0000-000000000001'
    const { targetCareerId } = req.body || {}

    const result = await explainCareerReadiness(studentId, { targetCareerId })
    res.status(200).json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function evidenceGuidance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { skillName } = req.body || {}
    res.status(200).json({
      data: {
        skill: skillName || 'General',
        recommendedEvidenceType: 'github_repository',
        tips: [
          'Include a clear README with architectural overview and setup guide',
          'Ensure commit history is clean and demonstrates incremental development',
          'Add unit and integration tests with high code coverage',
        ],
      },
    })
  } catch (err) {
    next(err)
  }
}
