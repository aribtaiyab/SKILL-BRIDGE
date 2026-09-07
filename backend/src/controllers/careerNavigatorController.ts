import { Request, Response } from 'express'
import { CareerNavigatorService } from '../services/careerNavigatorService.js'

export async function analyzeCareer(req: Request, res: Response) {
  try {
    const { message, query, prompt, history, preferredFields, goal } = req.body || {}
    const queryText = (message || query || prompt || '').trim()

    if (!queryText) {
      return res.status(400).json({
        success: false,
        error: 'Query message is required',
      })
    }

    const userId = (req as any).user?.id || '00000000-0000-0000-0000-000000000001'

    const result = await CareerNavigatorService.analyze({
      query: queryText,
      userId,
      history,
      preferredFields,
      goal,
    })

    return res.json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    console.error('[CareerNavigatorController] Analyze error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to analyze career choices',
    })
  }
}

export async function getCareerHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id
    const history = await CareerNavigatorService.getHistory(userId)
    return res.json({
      success: true,
      data: history,
    })
  } catch (err: any) {
    console.error('[CareerNavigatorController] History error:', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to load career decision history',
    })
  }
}
