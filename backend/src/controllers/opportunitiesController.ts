import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { calculateProofCoverage } from '../intelligence/verification.js'

export async function getOpportunities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('opportunities')
      .select('*, industry_profiles(organization_name, location), opportunity_skill_requirements(*, skills(id, name))')
      .eq('status', 'active')

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch opportunities' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function getOpportunityById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(404).json({ success: false, error: 'Opportunity not found' })

    const { data, error } = await supabase
      .from('opportunities')
      .select('*, industry_profiles(organization_name, location, website), opportunity_skill_requirements(*, skills(id, name, category))')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ success: false, error: 'Opportunity not found' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getOpportunityProof(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    const { id } = req.params
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { proofCoveragePercentage: 100, verifiedCount: 3, totalRequired: 3 } })

    const { data: opp } = await supabase
      .from('opportunities')
      .select('opportunity_skill_requirements(skill_id, required_level, skills(name))')
      .eq('id', id)
      .single()

    const reqs = (opp?.opportunity_skill_requirements || []).map((r: any) => ({
      skillId: r.skill_id,
      skillName: r.skills?.name || 'Skill',
      minimumLevel: r.required_level || 70,
    }))

    const { data: studentSkills } = await supabase
      .from('student_skills')
      .select('skill_id, current_score, verification_status')
      .eq('student_id', user.id)

    const { data: evidence } = await supabase
      .from('student_evidence')
      .select('skill_id, title, url, status')
      .eq('student_id', user.id)
      .eq('status', 'approved')

    const studentScores = (studentSkills || []).map((s: any) => ({
      skillId: s.skill_id,
      currentLevel: s.current_score || 0,
      verificationStatus: s.verification_status,
    }))

    const formattedEvidence: any[] = (evidence || []).map((e: any) => ({
      id: e.id || 'ev-1',
      title: e.title || 'Project Evidence',
      url: e.url,
      evidenceType: 'project',
      status: 'verified',
      skillsClaimed: [
        {
          skillId: e.skill_id,
          skillName: 'Skill',
          verificationStatus: 'verified',
        },
      ],
    }))

    const coverage = calculateProofCoverage(reqs, studentScores, formattedEvidence)
    res.status(200).json({ data: coverage })
  } catch (err) {
    next(err)
  }
}

export async function saveOpportunity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const { id } = req.params

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ saved: true })

    await supabase.from('saved_opportunities').upsert({ student_id: user.id, opportunity_id: id })
    res.status(200).json({ saved: true })
  } catch (err) {
    next(err)
  }
}

export async function unsaveOpportunity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const { id } = req.params

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ saved: false })

    await supabase.from('saved_opportunities').delete().eq('student_id', user.id).eq('opportunity_id', id)
    res.status(200).json({ saved: false })
  } catch (err) {
    next(err)
  }
}
