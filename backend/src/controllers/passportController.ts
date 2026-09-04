import { Request, Response, NextFunction } from 'express'
import { getSupabaseAdmin } from '../config/supabase.js'
import { projectPublicPassport } from '../intelligence/verification.js'

export async function getPublicPassport(req: Request, res: Response, next: NextFunction) {
  try {
    const { shareToken } = req.params
    const supabase = getSupabaseAdmin()

    if (!supabase) return res.status(503).json({ success: false, error: 'Passport service is unavailable' })

    const { data: settings, error: setErr } = await supabase
      .from('passport_settings')
      .select('*')
      .eq('share_token', shareToken)
      .single()

    if (setErr || !settings || !settings.is_public) {
      return res.status(404).json({ success: false, error: 'Public passport not found or disabled' })
    }

    const studentId = settings.student_id

    const { data: student } = await supabase
      .from('student_profiles')
      .select('education, graduation_year, profiles(full_name, avatar_url), career_targets(name)')
      .eq('profile_id', studentId)
      .single()

    const { data: skills } = await supabase
      .from('student_skills')
      .select('current_level, verification_status, skills(name, category)')
      .eq('student_id', studentId)

    const { data: projects } = await supabase
      .from('projects')
      .select('title, description, project_url')
      .eq('student_id', studentId)

    const formattedSkills = (skills || []).map((s: any) => ({
      name: s.skills?.name || 'Skill',
      category: s.skills?.category || 'Technical',
      level: s.current_level || 0,
      verification_status: s.verification_status || 'self_declared',
      proof_count: 1,
    }))

    const formattedProjects = (projects || []).map((p: any) => ({
      title: p.title,
      description: p.description,
      evidence_type: 'github_repository',
      url: p.project_url,
      is_verified: true,
      skills: [],
    }))

    const tokenStr = Array.isArray(shareToken) ? shareToken[0] : (shareToken || '')
    const filtered = projectPublicPassport(
      { full_name: (student?.profiles as any)?.full_name || 'Student', institution_name: student?.education },
      {
        shareToken: tokenStr,
        headline: settings.headline,
        bio: settings.bio,
        show_skills: settings.show_skills ?? true,
        show_projects: settings.show_projects ?? true,
        show_certifications: settings.show_certifications ?? false,
        show_readiness: settings.show_readiness ?? true,
      },
      formattedSkills,
      formattedProjects,
      [],
      student?.career_targets ? { careerName: (student.career_targets as any).name, readinessPercentage: 85, category: 'near_ready' } : null
    )

    res.status(200).json({ data: filtered })
  } catch (err) {
    next(err)
  }
}
