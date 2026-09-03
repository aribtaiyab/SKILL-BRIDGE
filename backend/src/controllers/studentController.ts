import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { calculateOverallReadiness, calculateGap, classifyGap } from '../intelligence/engine.js'

export async function getStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({ data: { profile_id: user.id, education: null, onboarding_completed: true } })
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*, profiles(id, full_name, email, avatar_url)')
      .eq('profile_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: 'Could not retrieve student profile' })
    }

    res.status(200).json({ data: data || null })
  } catch (err) {
    next(err)
  }
}

export async function updateStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    const body = req.body || {}

    if (!supabase) {
      return res.status(200).json({ data: { profile_id: user.id, ...body } })
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .upsert({ profile_id: user.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'profile_id' })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not update student profile' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getCareerTarget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: null })

    const { data, error } = await supabase
      .from('student_profiles')
      .select('target_career_id, career_targets(id, name, slug, description, category)')
      .eq('profile_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: 'Could not retrieve career target' })
    }

    res.status(200).json({ data: data || null })
  } catch (err) {
    next(err)
  }
}

export async function setCareerTarget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const careerId = body.target_career_id || body.role_id
    if (!careerId) return res.status(422).json({ success: false, error: 'target_career_id is required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { target_career_id: careerId } })

    const { data, error } = await supabase
      .from('student_profiles')
      .upsert({
        profile_id: user.id,
        target_career_id: careerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not update career target' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getStudentSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('student_skills')
      .select('*, skills(id, name, category)')
      .eq('student_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not retrieve student skills' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function addStudentSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const { skill_id, current_score = 50, verification_status = 'self_declared' } = req.body || {}
    if (!skill_id) return res.status(422).json({ success: false, error: 'skill_id is required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { skill_id, current_score, verification_status } })

    const { data, error } = await supabase
      .from('student_skills')
      .upsert({
        student_id: user.id,
        skill_id,
        current_score,
        verification_status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,skill_id' })
      .select('*, skills(id, name, category)')
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not add skill' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getStudentReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { readinessScore: 0, gaps: [], verifiedCount: 0 } })

    // Fetch target career requirements
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('target_career_id')
      .eq('profile_id', user.id)
      .single()

    if (!profile?.target_career_id) {
      return res.status(200).json({ data: { readinessScore: 0, gaps: [], verifiedCount: 0 } })
    }

    const { data: requirements } = await supabase
      .from('career_skill_requirements')
      .select('skill_id, required_level, importance, skills(name)')
      .eq('career_id', profile.target_career_id)

    const { data: studentSkills } = await supabase
      .from('student_skills')
      .select('skill_id, current_score, verification_status')
      .eq('student_id', user.id)

    const scoresFormatted = (studentSkills || []).map(s => ({
      skillId: s.skill_id,
      currentLevel: s.current_score || 0,
      verificationStatus: s.verification_status,
    }))

    const reqsFormatted = (requirements || []).map(r => ({
      skillId: r.skill_id,
      skillName: (r.skills as any)?.name || 'Unknown Skill',
      requiredLevel: r.required_level,
      importance: (r.importance || 'High') as 'High' | 'Medium' | 'Low',
    }))

    const readinessResult = calculateOverallReadiness(reqsFormatted, scoresFormatted)
    res.status(200).json({ data: readinessResult })
  } catch (err) {
    next(err)
  }
}

export async function getStudentSkillGaps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('student_skill_gaps')
      .select('*, skills(id, name, category)')
      .eq('student_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch skill gaps' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function getStudentAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('assessments')
      .select('*, skills(id, name, category)')

    if (error) return res.status(500).json({ success: false, error: 'Could not retrieve assessments' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function getStudentAssessmentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(404).json({ success: false, error: 'Assessment not found' })

    const { data, error } = await supabase
      .from('assessments')
      .select('*, skills(id, name, category), questions(*)')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ success: false, error: 'Assessment not found' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function startStudentAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const { id } = req.params

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { attemptId: 'demo-attempt-id', assessmentId: id } })

    const { data, error } = await supabase
      .from('assessment_attempts')
      .insert({
        student_id: user.id,
        assessment_id: id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not start assessment' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function submitStudentAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const { id } = req.params
    const { answers, attempt_id } = req.body || {}

    const score = Math.min(100, Math.max(0, parseInt(req.body.score ?? '80', 10)))

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({ data: { score, passed: score >= 70, feedback: 'Assessment completed successfully.' } })
    }

    // Update attempt
    if (attempt_id) {
      await supabase
        .from('assessment_attempts')
        .update({
          score,
          status: 'completed',
          completed_at: new Date().toISOString(),
          answers,
        })
        .eq('id', attempt_id)
    }

    // Get skill associated with assessment
    const { data: assessment } = await supabase
      .from('assessments')
      .select('skill_id')
      .eq('id', id)
      .single()

    if (assessment?.skill_id) {
      await supabase
        .from('student_skills')
        .upsert({
          student_id: user.id,
          skill_id: assessment.skill_id,
          current_score: score,
          verification_status: score >= 70 ? 'assessment_verified' : 'self_declared',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'student_id,skill_id' })
    }

    res.status(200).json({ data: { score, passed: score >= 70, feedback: 'Assessment score recorded.' } })
  } catch (err) {
    next(err)
  }
}

export async function getStudentEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('student_evidence')
      .select('*, skills(id, name)')
      .eq('student_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch evidence' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function createStudentEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id: 'demo-ev-id', ...body, student_id: user.id } })

    const { data, error } = await supabase
      .from('student_evidence')
      .insert({ student_id: user.id, ...body, status: 'draft' })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not save evidence' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function submitStudentEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const { id } = req.params

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id, status: 'pending' } })

    const { data, error } = await supabase
      .from('student_evidence')
      .update({ status: 'pending', submitted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('student_id', user.id)
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not submit evidence' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteStudentEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const { id } = req.params

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true })

    const { error } = await supabase
      .from('student_evidence')
      .delete()
      .eq('id', id)
      .eq('student_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not delete evidence' })
    res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function getStudentProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('student_projects')
      .select('*')
      .eq('student_id', user.id)

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch projects' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function createStudentProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { id: 'demo-proj-id', ...body, student_id: user.id } })

    const { data, error } = await supabase
      .from('student_projects')
      .insert({ student_id: user.id, ...body })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not create project' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getStudentPassport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: { share_token: 'demo-share-token', show_skills: true, show_projects: true } })

    const { data: settings } = await supabase
      .from('student_passport_settings')
      .select('*')
      .eq('student_id', user.id)
      .single()

    const { data: skills } = await supabase
      .from('student_skills')
      .select('*, skills(id, name, category)')
      .eq('student_id', user.id)

    const { data: projects } = await supabase
      .from('student_projects')
      .select('*')
      .eq('student_id', user.id)

    res.status(200).json({
      data: {
        settings: settings || { share_token: 'token-' + user.id, is_public: true },
        skills: skills || [],
        projects: projects || [],
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function updateStudentPassportSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: body })

    const { data, error } = await supabase
      .from('student_passport_settings')
      .upsert({ student_id: user.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'student_id' })
      .select()
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not update passport settings' })
    res.status(200).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function getStudentProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('student_progress_history')
      .select('*')
      .eq('student_id', user.id)
      .order('recorded_at', { ascending: true })

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch progress history' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}
