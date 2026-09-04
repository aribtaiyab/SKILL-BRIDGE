import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { calculateOverallReadiness, calculateGap, classifyGap, evaluateCareerReadiness } from '../intelligence/engine.js'
import { startAssessment, submitAssessment } from '../intelligence/assessment.js'

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
    if (!supabase) return res.status(200).json({ success: true, data: null })

    const { data, error } = await supabase
      .from('student_profiles')
      .select('target_career_id, career_targets(id, name, slug, description, category)')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: 'Could not retrieve career target' })
    }

    res.status(200).json({ success: true, data: data || null })
  } catch (err) {
    next(err)
  }
}

export async function getCareerTargetsList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('career_targets')
      .select('id, name, slug, description, category')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      return res.status(500).json({ success: false, error: 'Could not retrieve careers' })
    }

    res.status(200).json({ success: true, data: data || [] })
  } catch (err) {
    next(err)
  }
}

export async function setCareerTarget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const careerId = body.target_career_id || body.career_id || body.role_id
    if (!careerId) return res.status(422).json({ success: false, error: 'target_career_id is required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: { target_career_id: careerId } })

    const { data: careerExists, error: careerCheckError } = await supabase
      .from('career_targets')
      .select('id')
      .eq('id', careerId)
      .maybeSingle()

    if (careerCheckError || !careerExists) {
      return res.status(404).json({ success: false, error: 'Invalid career target selected' })
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .upsert({
        profile_id: user.id,
        target_career_id: careerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' })
      .select('target_career_id, career_targets(id, name, slug, description, category)')
      .single()

    if (error) return res.status(500).json({ success: false, error: 'Could not update career target' })
    res.status(200).json({ success: true, data })
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

    const { skill_id, current_level, self_declared_level, verification_status = 'self_declared' } = req.body || {}
    if (!skill_id) return res.status(422).json({ success: false, error: 'skill_id is required' })
    const declaredLevel = Number(self_declared_level ?? current_level)
    if (!Number.isInteger(declaredLevel) || declaredLevel < 0 || declaredLevel > 100) {
      return res.status(422).json({ success: false, error: 'self_declared_level must be an integer from 0 to 100' })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(503).json({ success: false, error: 'Skill service is unavailable' })

    const { data, error } = await supabase
      .from('student_skills')
      .upsert({
        student_id: user.id,
        skill_id,
        self_declared_level: declaredLevel,
        current_level: declaredLevel,
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

    const careerId = (req.query.career_id as string) || null
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({ success: true, data: { careerName: 'Career not configured', readinessPercentage: 0, readinessCategory: 'Assessment Needed', readinessVariant: 'warning', skills: [], strengths: [], nearReadySkills: [], criticalGaps: [], priorityGap: null, explanation: { strengthsText: [], nearReadyText: [], criticalText: [], recommendedAction: 'Select a career target and complete an assessment to calculate readiness.' } } })
    }

    let selectedCareerId = careerId
    if (!selectedCareerId) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('target_career_id')
        .eq('profile_id', user.id)
        .maybeSingle()
      selectedCareerId = profile?.target_career_id || null
    }

    if (!selectedCareerId) {
      return res.status(200).json({
        success: true,
        data: {
          careerName: 'No Career Selected',
          readinessPercentage: 0,
          readinessCategory: 'Assessment Needed',
          readinessVariant: 'warning',
          skills: [],
          strengths: [],
          nearReadySkills: [],
          criticalGaps: [],
          priorityGap: null,
          explanation: {
            strengthsText: [],
            nearReadyText: [],
            criticalText: [],
            recommendedAction: 'Choose a target career to begin your readiness assessment.',
          },
        },
      })
    }

    const { data: career } = await supabase
      .from('career_targets')
      .select('id, name, description')
      .eq('id', selectedCareerId)
      .maybeSingle()

    const { data: requirements } = await supabase
      .from('career_target_skills')
      .select('skill_id, required_level, importance, skills(id, name, category)')
      .eq('career_target_id', selectedCareerId)

    const { data: studentSkills } = await supabase
      .from('student_skills')
      .select('skill_id, current_level, verification_status, skills(id, name, category)')
      .eq('student_id', user.id)

    const scoresFormatted = (studentSkills || []).map(s => ({
      skillId: s.skill_id,
      skillName: (s.skills as any)?.name || 'Skill',
      currentLevel: s.current_level || 0,
      verificationStatus: s.verification_status,
    }))

    const reqsFormatted = (requirements || []).map(r => ({
      skillId: r.skill_id,
      skillName: (r.skills as any)?.name || 'Skill',
      category: (r.skills as any)?.category || 'Technical',
      requiredLevel: r.required_level,
      importance: (r.importance || 'High') as 'High' | 'Medium' | 'Low',
    }))

    const readinessResult = evaluateCareerReadiness(career?.name || 'Career', reqsFormatted, scoresFormatted)
    res.status(200).json({ success: true, data: { ...readinessResult, careerId: selectedCareerId, careerName: career?.name || readinessResult.careerName || 'Career' } })
  } catch (err) {
    next(err)
  }
}

export async function getStudentSkillGaps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(503).json({ success: false, error: 'Skill intelligence is unavailable' })

    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('target_career_id, career_targets(name)')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (profileError) return res.status(500).json({ success: false, error: 'Could not load career target' })
    if (!profile?.target_career_id) {
      return res.status(200).json({ success: true, data: { careerName: 'No Career Selected', priorityGap: null, criticalGaps: [], nearReadySkills: [], readySkills: [], allGaps: [], summary: { strengthsText: [], nearReadyText: [], criticalText: [], recommendedAction: 'Choose a target career to calculate skill gaps.' } } })
    }

    const [{ data: requirements, error: requirementsError }, { data: studentSkills, error: skillsError }] = await Promise.all([
      supabase.from('career_target_skills').select('skill_id, required_level, importance, skills(id, name, category)').eq('career_target_id', profile.target_career_id),
      supabase.from('student_skills').select('skill_id, current_level, verification_status, skills(id, name, category)').eq('student_id', user.id),
    ])

    if (requirementsError || skillsError) return res.status(500).json({ success: false, error: 'Could not calculate skill gaps' })

    const result = evaluateCareerReadiness(
      (profile.career_targets as any)?.name || 'Career',
      (requirements || []).map((requirement: any) => ({
        skillId: requirement.skill_id,
        skillName: requirement.skills?.name || 'Skill',
        category: requirement.skills?.category || 'Technical',
        requiredLevel: requirement.required_level,
        importance: requirement.importance || 'Medium',
      })),
      (studentSkills || []).map((skill: any) => ({
        skillId: skill.skill_id,
        skillName: skill.skills?.name || 'Skill',
        currentLevel: skill.current_level,
        verificationStatus: skill.verification_status,
      })),
    )

    res.status(200).json({
      success: true,
      data: {
        careerName: (profile.career_targets as any)?.name || 'Career',
        priorityGap: result.priorityGap,
        criticalGaps: result.criticalGaps,
        nearReadySkills: result.nearReadySkills,
        readySkills: result.strengths,
        allGaps: result.skills,
        summary: result.explanation,
      },
    })
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
    const id = String(req.params.id)
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(404).json({ success: false, error: 'Assessment not found' })

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*, skills(id, name, category)')
      .eq('id', id)
      .single()

    const { data: questions, error: questionsError } = await supabase
      .from('assessment_questions')
      .select('id, question_text, question_type, points, order_index, assessment_options(id, option_text, order_index)')
      .eq('assessment_id', id)
      .order('order_index', { ascending: true })

    if (assessmentError || questionsError || !assessment) return res.status(404).json({ success: false, error: 'Assessment not found' })
    res.status(200).json({ success: true, data: { ...assessment, assessment_questions: questions || [] } })
  } catch (err) {
    next(err)
  }
}

export async function startStudentAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const id = String(req.params.id)

    const result = await startAssessment(user.id, id)
    if (!result.attemptId || result.attemptId.startsWith('attempt-')) {
      return res.status(503).json({ success: false, error: 'Could not start assessment' })
    }
    res.status(200).json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function submitStudentAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const id = String(req.params.id)
    const { answers, attempt_id, attemptId } = req.body || {}
    const resolvedAttemptId = attempt_id || attemptId
    if (!resolvedAttemptId || !Array.isArray(answers)) {
      return res.status(422).json({ success: false, error: 'attempt_id and answers are required' })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(503).json({ success: false, error: 'Assessment service is unavailable' })

    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .select('id, assessment_id, status')
      .eq('id', resolvedAttemptId)
      .eq('student_id', user.id)
      .eq('assessment_id', id)
      .single()

    if (attemptError || !attempt || attempt.status === 'completed') {
      return res.status(409).json({ success: false, error: 'Assessment attempt is invalid or already completed' })
    }

    const result = await submitAssessment(user.id, resolvedAttemptId, id, answers)
    res.status(200).json({ success: true, data: result })
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
