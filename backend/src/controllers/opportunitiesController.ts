import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { calculateProofCoverage } from '../intelligence/verification.js'
import { evaluateOpportunityReadiness } from '../intelligence/engine.js'

export async function getOpportunities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('opportunities')
      .select('*, industry_profiles(organization_name, location), opportunity_skills(*, skills(id, name))')
      .eq('status', 'published')

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
      .select('*, industry_profiles(organization_name, location, website), opportunity_skills(*, skills(id, name, category))')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ success: false, error: 'Opportunity not found' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getStudentOpportunityReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const id = String(req.params.id)
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(503).json({ success: false, error: 'Opportunity service is unavailable' })

    const [{ data: opportunity, error: opportunityError }, { data: studentSkills, error: skillsError }] = await Promise.all([
      supabase.from('opportunities').select('id, title, industry_profiles(organization_name), opportunity_skills(minimum_level, importance, skill_id, skills(id, name))').eq('id', id).single(),
      supabase.from('student_skills').select('skill_id, current_level, verification_status, skills(id, name)').eq('student_id', user.id),
    ])

    if (opportunityError || skillsError || !opportunity) return res.status(404).json({ success: false, error: 'Opportunity not found' })

    const result = evaluateOpportunityReadiness(
      {
        id: opportunity.id,
        title: opportunity.title,
        companyName: (opportunity.industry_profiles as any)?.organization_name || 'Organization',
        skills: (opportunity.opportunity_skills || []).map((skill: any) => ({
          skillId: skill.skill_id,
          skillName: skill.skills?.name || 'Skill',
          minimumLevel: skill.minimum_level,
          importance: skill.importance || 'Required',
        })),
      },
      (studentSkills || []).map((skill: any) => ({
        skillId: skill.skill_id,
        skillName: skill.skills?.name || 'Skill',
        currentLevel: skill.current_level,
        verificationStatus: skill.verification_status,
      })),
    )
    res.status(200).json({ success: true, data: result })
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
      .select('opportunity_skills(skill_id, minimum_level, importance, skills(name))')
      .eq('id', id)
      .single()

    const reqs = (opp?.opportunity_skills || []).map((r: any) => ({
      skillId: r.skill_id,
      skillName: r.skills?.name || 'Skill',
      minimumLevel: r.minimum_level || 70,
    }))

    const { data: studentSkills } = await supabase
      .from('student_skills')
      .select('skill_id, current_level, verification_status')
      .eq('student_id', user.id)

    const { data: evidence } = await supabase
      .from('evidence')
      .select('id, title, url, evidence_type, status')
      .eq('student_id', user.id)
      .eq('status', 'verified')

    const studentScores = (studentSkills || []).map((s: any) => ({
      skillId: s.skill_id,
      currentLevel: s.current_level || 0,
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
          skillId: '',
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
