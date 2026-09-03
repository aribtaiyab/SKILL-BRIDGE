import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'

export async function getIndustryOpportunities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('opportunities')
      .select('*, opportunity_skill_requirements(*, skills(id, name))')
      .eq('industry_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch industry opportunities' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function createIndustryOpportunity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const { title, description, opportunity_type, location, deadline, required_skills } = body

    if (!title || !opportunity_type) {
      return res.status(422).json({ success: false, error: 'Title and opportunity type are required' })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id: 'demo-opp-id', ...body, industry_id: user.id } })

    const { data: opp, error } = await supabase
      .from('opportunities')
      .insert({
        industry_id: user.id,
        title,
        description,
        opportunity_type,
        location,
        deadline,
        status: 'active',
      })
      .select()
      .single()

    if (error || !opp) return res.status(500).json({ success: false, error: 'Could not create opportunity' })

    // Insert skill requirements if provided
    if (Array.isArray(required_skills) && required_skills.length > 0) {
      const rows = required_skills.map((s: any) => ({
        opportunity_id: opp.id,
        skill_id: s.skill_id,
        required_level: s.required_level || 70,
        is_mandatory: s.is_mandatory ?? true,
      }))
      await supabase.from('opportunity_skill_requirements').insert(rows)
    }

    res.status(201).json({ data: opp })
  } catch (err) {
    next(err)
  }
}

export async function getIndustryCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data: students, error } = await supabase
      .from('student_profiles')
      .select('profile_id, education, graduation_year, profiles(full_name, email, avatar_url), student_skills(skill_id, current_score, verification_status, skills(name))')

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch candidates' })
    res.status(200).json({ data: students || [] })
  } catch (err) {
    next(err)
  }
}

export async function getIndustryApplications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('applications')
      .select('*, opportunities(title, industry_id), student_profiles(profile_id, profiles(full_name, email))')
      .eq('opportunities.industry_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch applications' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function updateApplicationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status } = req.body || {}

    if (!status) return res.status(422).json({ success: false, error: 'status is required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id, status } })

    const { data, error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not update application status' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getIndustryInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({
        data: {
          totalApplicants: 0,
          averageReadiness: 0,
          topSkillDemands: [],
        },
      })
    }

    const { count: totalApplicants } = await supabase.from('applications').select('*', { count: 'exact', head: true })
    const { count: totalOpportunities } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })

    res.status(200).json({
      data: {
        totalApplicants: totalApplicants || 0,
        totalOpportunities: totalOpportunities || 0,
        averageReadiness: 78,
      },
    })
  } catch (err) {
    next(err)
  }
}
