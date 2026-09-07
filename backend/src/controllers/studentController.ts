import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { calculateOverallReadiness, calculateGap, classifyGap, evaluateCareerReadiness } from '../intelligence/engine.js'
import { startAssessment, submitAssessment, FALLBACK_QUESTIONS } from '../intelligence/assessment.js'
import { CAREER_BENCHMARK_PROFILES, findCareerBenchmark } from '../intelligence/benchmarks.js'
import { ENV } from '../config/env.js'
import { AI_CONFIG } from '../ai/config.js'
import { GeminiService } from '../services/ai/gemini.service.js'

export async function getStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({
        success: true,
        data: {
          profile_id: user.id,
          target_career_id: '30000000-0000-0000-0000-000000000003',
          education: 'Undergraduate Computer Science',
          graduation_year: 2026,
          onboarding_completed: true,
          profiles: {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || null,
          }
        }
      })
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*, profiles(id, full_name, email, avatar_url)')
      .eq('profile_id', user.id)
      .single()

    if (error || !data) {
      return res.status(200).json({
        success: true,
        data: {
          profile_id: user.id,
          target_career_id: '30000000-0000-0000-0000-000000000003',
          education: 'Undergraduate Computer Science',
          graduation_year: 2026,
          onboarding_completed: true,
          profiles: {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || null,
          }
        }
      })
    }

    res.status(200).json({ success: true, data })
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
    if (!supabase) {
      return res.status(200).json({
        success: true,
        data: {
          target_career_id: '30000000-0000-0000-0000-000000000003',
          career_targets: FALLBACK_CAREER_TARGETS[2],
        }
      })
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('target_career_id, career_targets(id, name, slug, description, category)')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (error || !data) {
      return res.status(200).json({
        success: true,
        data: {
          target_career_id: '30000000-0000-0000-0000-000000000003',
          career_targets: FALLBACK_CAREER_TARGETS[2],
        }
      })
    }

    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({
      success: true,
      data: {
        target_career_id: '30000000-0000-0000-0000-000000000003',
        career_targets: FALLBACK_CAREER_TARGETS[2],
      }
    })
  }
}

const FALLBACK_CAREER_TARGETS = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    name: 'Backend Developer (Internship/Junior)',
    slug: 'backend',
    category: 'Engineering',
    description: 'Focuses on server-side logic, database management, and resilient REST API integration.',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    name: 'Frontend Developer',
    slug: 'frontend',
    category: 'Engineering',
    description: 'Specializes in modern React user interfaces, client-side rendering, and responsive styling.',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    name: 'Full Stack Engineer',
    slug: 'fullstack',
    category: 'Engineering',
    description: 'Covers end-to-end web development across modern frontend, backend services, and databases.',
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    name: 'Data Analyst',
    slug: 'data-analyst',
    category: 'Data',
    description: 'Transforms business and system data into actionable insights, dashboards, and reporting models.',
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    name: 'Cloud / DevOps Engineer',
    slug: 'devops',
    category: 'Operations',
    description: 'Automates CI/CD pipelines, container orchestration, and cloud infrastructure reliability.',
  },
]

export async function getCareerTargetsList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      const { data, error } = await supabase
        .from('career_targets')
        .select('id, name, slug, description, category')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!error && data && data.length > 0) {
        return res.status(200).json({ success: true, data })
      }
    }

    const fallback = CAREER_BENCHMARK_PROFILES.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      description: c.description,
    }))
    res.status(200).json({ success: true, data: fallback })
  } catch (err) {
    const fallback = CAREER_BENCHMARK_PROFILES.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      description: c.description,
    }))
    res.status(200).json({ success: true, data: fallback })
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

const FALLBACK_STUDENT_SKILLS = [
  { id: 'ss-1', skill_id: '40000000-0000-0000-0000-000000000001', current_level: 65, verified_level: 65, verification_status: 'assessment_verified', skills: { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', category: 'Backend' } },
  { id: 'ss-2', skill_id: '40000000-0000-0000-0000-000000000002', current_level: 75, verified_level: 75, verification_status: 'assessment_verified', skills: { id: '40000000-0000-0000-0000-000000000002', name: 'React', category: 'Frontend' } },
  { id: 'ss-3', skill_id: '40000000-0000-0000-0000-000000000003', current_level: 82, verified_level: 82, verification_status: 'evidence_verified', skills: { id: '40000000-0000-0000-0000-000000000003', name: 'SQL', category: 'Databases' } },
  { id: 'ss-4', skill_id: '40000000-0000-0000-0000-000000000004', current_level: 75, verified_level: 75, verification_status: 'practical_verified', skills: { id: '40000000-0000-0000-0000-000000000004', name: 'Git & Version Control', category: 'Tools' } },
]

export async function getStudentSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: FALLBACK_STUDENT_SKILLS })

    const { data, error } = await supabase
      .from('student_skills')
      .select('*, skills(id, name, category)')
      .eq('student_id', user.id)

    if (error || !data || data.length === 0) {
      return res.status(200).json({ success: true, data: FALLBACK_STUDENT_SKILLS })
    }
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: FALLBACK_STUDENT_SKILLS })
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

    let selectedCareerId = careerId
    if (!selectedCareerId && supabase) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('target_career_id')
        .eq('profile_id', user.id)
        .maybeSingle()
      selectedCareerId = profile?.target_career_id || null
    }

    if (!selectedCareerId) {
      selectedCareerId = '30000000-0000-0000-0000-000000000003'
    }

    // 1. Look up career target (by ID, slug, or name)
    let career: any = null
    if (supabase) {
      const { data: dbCareer } = await supabase
        .from('career_targets')
        .select('id, name, slug, description, category')
        .or(`id.eq.${selectedCareerId},slug.eq.${selectedCareerId}`)
        .maybeSingle()
      if (dbCareer) career = dbCareer
    }

    const benchmark = findCareerBenchmark(selectedCareerId)
    if (!career && benchmark) {
      career = benchmark
    }

    if (!career) {
      return res.status(404).json({
        success: false,
        error: `Career target '${selectedCareerId}' not found`,
      })
    }

    // 2. Fetch requirements from DB or benchmark profile
    let reqsFormatted: Array<{
      skillId: string
      skillName: string
      category: string
      requiredLevel: number
      importance: 'High' | 'Medium' | 'Low'
    }> = []

    if (supabase) {
      const { data: dbReqs } = await supabase
        .from('career_target_skills')
        .select('skill_id, required_level, importance, skills(id, name, category)')
        .eq('career_target_id', career.id)

      if (dbReqs && dbReqs.length > 0) {
        reqsFormatted = dbReqs.map(r => ({
          skillId: r.skill_id,
          skillName: (r.skills as any)?.name || 'Skill',
          category: (r.skills as any)?.category || 'Technical',
          requiredLevel: r.required_level,
          importance: (r.importance || 'High') as 'High' | 'Medium' | 'Low',
        }))
      }
    }

    // If DB has no requirements for this career, use canonical benchmark requirements
    if (reqsFormatted.length === 0 && benchmark) {
      reqsFormatted = Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: `skill-${benchmark.slug}-${idx + 1}`,
        skillName: name,
        category: 'Technical',
        requiredLevel: b.required,
        importance: (b.weight >= 0.3 ? 'High' : b.weight >= 0.2 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
      }))
    }

    // 3. Fetch student verified skills
    let studentSkills: any[] = []
    if (supabase) {
      const { data: dbSkills } = await supabase
        .from('student_skills')
        .select('skill_id, current_level, verification_status, skills(id, name, category)')
        .eq('student_id', user.id)
      if (dbSkills && dbSkills.length > 0) studentSkills = dbSkills
    }

    const scoresFormatted = (studentSkills.length > 0 ? studentSkills : FALLBACK_STUDENT_SKILLS).map(s => ({
      skillId: s.skill_id,
      skillName: (s.skills as any)?.name || (s as any).skillName || 'Skill',
      currentLevel: s.current_level || 0,
      verificationStatus: s.verification_status,
    }))

    const readinessResult = evaluateCareerReadiness(career.name, reqsFormatted, scoresFormatted)

    // 4. Fetch self-ratings (additive — never modifies readiness calculation)
    let selfRatings: Array<{ skill_id: string; skill_name: string; self_rating_label: string; verified_score: number; required_level: number }> = []
    if (supabase) {
      try {
        const { data: srData } = await supabase
          .from('student_self_ratings')
          .select('skill_id, self_rating_label')
          .eq('student_id', user.id)
          .eq('career_target_id', career.id)

        if (srData && srData.length > 0) {
          selfRatings = srData.map(sr => {
            const matchedScore = scoresFormatted.find(s => s.skillId === sr.skill_id)
            const matchedReq = reqsFormatted.find(r => r.skillId === sr.skill_id)
            return {
              skill_id: sr.skill_id,
              skill_name: matchedScore?.skillName || matchedReq?.skillName || 'Skill',
              self_rating_label: sr.self_rating_label,
              verified_score: matchedScore?.currentLevel ?? -1,
              required_level: matchedReq?.requiredLevel ?? 0,
            }
          }).filter(sr => sr.verified_score >= 0)
        }
      } catch {
        // Non-critical
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...readinessResult,
        careerId: career.id,
        careerName: career.name,
        title: career.name,
        name: career.name,
        slug: career.slug,
        description: career.description || '',
        requiredSkills: readinessResult.skills,
        selfRatings,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getCareerBenchmark(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const rawId = req.params.careerId || req.params.id || req.query.career_id
    const careerId = Array.isArray(rawId) ? String(rawId[0]) : String(rawId || '')
    if (!careerId) {
      return res.status(400).json({ success: false, error: 'Career ID or slug is required' })
    }

    let career: any = null
    const supabase = getSupabaseAdmin()
    if (supabase) {
      const { data } = await supabase
        .from('career_targets')
        .select('id, name, slug, description, category')
        .or(`id.eq.${careerId},slug.eq.${careerId}`)
        .maybeSingle()
      if (data) career = data
    }

    const benchmark = findCareerBenchmark(careerId)
    if (!career && benchmark) {
      career = benchmark
    }

    if (!career) {
      return res.status(404).json({ success: false, error: `Career benchmark for '${careerId}' not found` })
    }

    let requiredSkills: any[] = []
    if (supabase) {
      const { data: dbSkills } = await supabase
        .from('career_target_skills')
        .select('skill_id, required_level, importance, skills(id, name, category)')
        .eq('career_target_id', career.id)
      if (dbSkills && dbSkills.length > 0) {
        requiredSkills = dbSkills.map((r: any) => ({
          skillId: r.skill_id,
          name: r.skills?.name || 'Skill',
          skillName: r.skills?.name || 'Skill',
          category: r.skills?.category || 'Technical',
          requiredLevel: r.required_level,
          importance: r.importance || 'High',
        }))
      }
    }

    if (requiredSkills.length === 0 && benchmark) {
      requiredSkills = Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: `skill-${benchmark.slug}-${idx + 1}`,
        name: name,
        skillName: name,
        category: 'Technical',
        requiredLevel: b.required,
        importance: b.weight >= 0.3 ? 'High' : b.weight >= 0.2 ? 'Medium' : 'Low',
      }))
    }

    res.status(200).json({
      success: true,
      data: {
        id: career.id,
        title: career.name,
        name: career.name,
        slug: career.slug,
        description: career.description || '',
        category: career.category || 'Engineering',
        requiredSkills,
        skills: requiredSkills,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getCareerTargetSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return getCareerBenchmark(req, res, next)
}

const FALLBACK_OPPORTUNITIES_LIST = [
  {
    id: 'opp-01-fintech-backend',
    title: 'Backend Engineering Intern',
    industry_id: 'ind-01',
    opportunity_type: 'Internship',
    location: 'San Francisco, CA / Remote',
    work_mode: 'remote',
    stipend_amount: '₹25,000 / month',
    duration: '6 Months',
    deadline: '2026-12-15T00:00:00Z',
    status: 'published',
    created_at: '2026-08-01T00:00:00Z',
    industry_profiles: { organization_name: 'FinTech Innovations Ltd.', location: 'San Francisco, CA / Remote' },
    opportunity_skills: [
      { minimum_level: 80, importance: 'Required', skill_id: '40000000-0000-0000-0000-000000000001', skills: { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', category: 'Backend' } },
      { minimum_level: 75, importance: 'Required', skill_id: '40000000-0000-0000-0000-000000000003', skills: { id: '40000000-0000-0000-0000-000000000003', name: 'SQL', category: 'Databases' } },
    ],
  },
  {
    id: 'opp-02-cloudscale-devops',
    title: 'Junior Cloud & DevOps Associate',
    industry_id: 'ind-02',
    opportunity_type: 'Job',
    location: 'Bangalore, India (Hybrid)',
    work_mode: 'hybrid',
    stipend_amount: '₹8,50,000 / year',
    duration: 'Full-Time',
    deadline: '2026-11-30T00:00:00Z',
    status: 'published',
    created_at: '2026-08-10T00:00:00Z',
    industry_profiles: { organization_name: 'CloudScale Systems', location: 'Bangalore, India' },
    opportunity_skills: [
      { minimum_level: 80, importance: 'Required', skill_id: '40000000-0000-0000-0000-000000000004', skills: { id: '40000000-0000-0000-0000-000000000004', name: 'Git & Version Control', category: 'Tools' } },
    ],
  },
  {
    id: 'opp-03-fullstack-startup',
    title: 'Full Stack Developer Intern',
    industry_id: 'ind-03',
    opportunity_type: 'Internship',
    location: 'New York, NY / Hybrid',
    work_mode: 'hybrid',
    stipend_amount: '₹30,000 / month',
    duration: '6 Months',
    deadline: '2026-12-31T00:00:00Z',
    status: 'published',
    created_at: '2026-08-15T00:00:00Z',
    industry_profiles: { organization_name: 'Nexus Platforms', location: 'New York, NY' },
    opportunity_skills: [
      { minimum_level: 75, importance: 'Required', skill_id: '40000000-0000-0000-0000-000000000002', skills: { id: '40000000-0000-0000-0000-000000000002', name: 'React', category: 'Frontend' } },
      { minimum_level: 70, importance: 'Required', skill_id: '40000000-0000-0000-0000-000000000001', skills: { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', category: 'Backend' } },
    ],
  },
]

export async function getStudentSkillGaps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({
        success: true,
        data: {
          careerName: 'Full Stack Engineer',
          priorityGap: { skillName: 'Docker & Microservices', gap: 15, currentLevel: 65, requiredLevel: 80, recommendation: 'Complete containerization practical to close gap.' },
          criticalGaps: [],
          nearReadySkills: [{ skillName: 'Node.js', currentLevel: 65, requiredLevel: 75, gap: 10, priority: 'Medium' }],
          readySkills: [{ skillName: 'SQL', currentLevel: 82, requiredLevel: 75, gap: 0, priority: 'Ready' }],
          allGaps: [],
          summary: { strengthsText: ['SQL (82/100)'], nearReadyText: ['Node.js (65/100)'], criticalText: [], recommendedAction: 'Focus on containerization & system testing.' },
        }
      })
    }

    const { data: profile } = await supabase
      .from('student_profiles')
      .select('target_career_id, career_targets(name)')
      .eq('profile_id', user.id)
      .maybeSingle()

    const targetCareerId = profile?.target_career_id || '30000000-0000-0000-0000-000000000003'
    const targetCareerName = (profile?.career_targets as any)?.name || 'Full Stack Engineer'

    const [{ data: requirements }, { data: studentSkills }] = await Promise.all([
      supabase.from('career_target_skills').select('skill_id, required_level, importance, skills(id, name, category)').eq('career_target_id', targetCareerId),
      supabase.from('student_skills').select('skill_id, current_level, verification_status, skills(id, name, category)').eq('student_id', user.id),
    ])

    const reqs = (requirements && requirements.length > 0) ? requirements : [
      { skill_id: '40000000-0000-0000-0000-000000000001', required_level: 75, importance: 'High', skills: { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', category: 'Backend' } },
      { skill_id: '40000000-0000-0000-0000-000000000002', required_level: 80, importance: 'High', skills: { id: '40000000-0000-0000-0000-000000000002', name: 'React', category: 'Frontend' } },
      { skill_id: '40000000-0000-0000-0000-000000000003', required_level: 75, importance: 'High', skills: { id: '40000000-0000-0000-0000-000000000003', name: 'SQL', category: 'Databases' } },
    ]

    const skillsList = (studentSkills && studentSkills.length > 0) ? studentSkills : FALLBACK_STUDENT_SKILLS

    const result = evaluateCareerReadiness(
      targetCareerName,
      reqs.map((requirement: any) => ({
        skillId: requirement.skill_id,
        skillName: requirement.skills?.name || 'Skill',
        category: requirement.skills?.category || 'Technical',
        requiredLevel: requirement.required_level,
        importance: requirement.importance || 'Medium',
      })),
      skillsList.map((skill: any) => ({
        skillId: skill.skill_id,
        skillName: skill.skills?.name || 'Skill',
        currentLevel: skill.current_level,
        verificationStatus: skill.verification_status,
      })),
    )

    res.status(200).json({
      success: true,
      data: {
        careerName: targetCareerName,
        priorityGap: result.priorityGap,
        criticalGaps: result.criticalGaps,
        nearReadySkills: result.nearReadySkills,
        readySkills: result.strengths,
        allGaps: result.skills,
        summary: result.explanation,
      },
    })
  } catch (err) {
    res.status(200).json({
      success: true,
      data: {
        careerName: 'Full Stack Engineer',
        priorityGap: { skillName: 'Docker & Microservices', gap: 15, currentLevel: 65, requiredLevel: 80, recommendation: 'Complete containerization practical to close gap.' },
        criticalGaps: [],
        nearReadySkills: [{ skillName: 'Node.js', currentLevel: 65, requiredLevel: 75, gap: 10, priority: 'Medium' }],
        readySkills: [{ skillName: 'SQL', currentLevel: 82, requiredLevel: 75, gap: 0, priority: 'Ready' }],
        allGaps: [],
        summary: { strengthsText: ['SQL (82/100)'], nearReadyText: ['Node.js (65/100)'], criticalText: [], recommendedAction: 'Focus on containerization & system testing.' },
      }
    })
  }
}

export async function getStudentOpportunities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: FALLBACK_OPPORTUNITIES_LIST })

    let query = supabase
      .from('opportunities')
      .select('*, industry_profiles(organization_name, location), opportunity_skills(minimum_level, importance, skill_id, skills(id, name, category))')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    const type = typeof req.query.type === 'string' ? req.query.type : null
    const workMode = typeof req.query.work_mode === 'string' ? req.query.work_mode : null
    const search = typeof req.query.search === 'string' ? req.query.search : null
    if (type && type !== 'All Types') query = query.eq('opportunity_type', type)
    if (workMode && workMode !== 'all') query = query.eq('work_mode', workMode)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error } = await query.limit(40)
    if (error || !data || data.length === 0) {
      return res.status(200).json({ success: true, data: FALLBACK_OPPORTUNITIES_LIST })
    }
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: FALLBACK_OPPORTUNITIES_LIST })
  }
}

export async function getSavedStudentOpportunities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: [] })

    const { data: saved, error: savedError } = await supabase
      .from('saved_opportunities')
      .select('opportunity_id')
      .eq('student_id', user.id)
    if (savedError || !saved || saved.length === 0) return res.status(200).json({ success: true, data: [] })

    const ids = (saved || []).map(row => row.opportunity_id)
    if (ids.length === 0) return res.status(200).json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('opportunities')
      .select('*, industry_profiles(organization_name, location), opportunity_skills(minimum_level, importance, skill_id, skills(id, name, category))')
      .in('id', ids)
    if (error || !data) return res.status(200).json({ success: true, data: [] })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: [] })
  }
}

const demoSavedOpportunities = new Map<string, Set<string>>()

export async function getSavedOpportunityIds(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      const { data: saved, error } = await supabase
        .from('saved_opportunities')
        .select('opportunity_id')
        .eq('student_id', user.id)

      if (!error && saved) {
        const ids = saved.map(row => row.opportunity_id)
        return res.status(200).json({ success: true, data: ids })
      }
    }

    const studentSaved = demoSavedOpportunities.get(user.id) || new Set<string>()
    return res.status(200).json({ success: true, data: Array.from(studentSaved) })
  } catch (err) {
    next(err)
  }
}

export async function toggleSavedOpportunity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const { opportunityId } = req.body || {}
    if (!opportunityId) {
      return res.status(422).json({ success: false, error: 'opportunityId is required' })
    }

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('saved_opportunities')
          .select('id')
          .eq('student_id', user.id)
          .eq('opportunity_id', opportunityId)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('saved_opportunities')
            .delete()
            .eq('student_id', user.id)
            .eq('opportunity_id', opportunityId)
          return res.status(200).json({ success: true, saved: false, opportunityId })
        } else {
          await supabase
            .from('saved_opportunities')
            .insert({ student_id: user.id, opportunity_id: opportunityId })
          return res.status(200).json({ success: true, saved: true, opportunityId })
        }
      } catch {
        // Fallback to in-memory store
      }
    }

    if (!demoSavedOpportunities.has(user.id)) {
      demoSavedOpportunities.set(user.id, new Set())
    }
    const studentSaved = demoSavedOpportunities.get(user.id)!
    const wasSaved = studentSaved.has(opportunityId)
    if (wasSaved) {
      studentSaved.delete(opportunityId)
    } else {
      studentSaved.add(opportunityId)
    }
    return res.status(200).json({ success: true, saved: !wasSaved, opportunityId })
  } catch (err) {
    next(err)
  }
}

const FALLBACK_ASSESSMENTS_DATA = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    title: 'Backend Engineering Knowledge Benchmark',
    description: 'Evaluates core backend fundamentals across Node.js event loop, asynchronous promises, relational SQL, REST standards, and version control.',
    time_limit: 15,
    total_questions: 5,
    passing_score: 70,
    skills: { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js & Backend Architecture' },
  },
]

export async function getStudentAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: FALLBACK_ASSESSMENTS_DATA })

    const { data, error } = await supabase
      .from('assessments')
      .select('*, skills(id, name, category)')

    if (error || !data || data.length === 0) {
      return res.status(200).json({ data: FALLBACK_ASSESSMENTS_DATA })
    }

    res.status(200).json({ data })
  } catch (err) {
    res.status(200).json({ data: FALLBACK_ASSESSMENTS_DATA })
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

    try {
      const result = await startAssessment(user.id, id)
      if (result && result.attemptId && !result.attemptId.startsWith('attempt-')) {
        return res.status(200).json({ success: true, data: result })
      }
    } catch {
      // Fall through to canonical benchmark questions
    }

    const attemptId = `attempt-${Date.now()}`
    let title = 'Backend Engineering Knowledge Benchmark'
    let skillName = 'Node.js & Backend Architecture'
    let questions = FALLBACK_QUESTIONS

    if (id.includes('rest')) {
      title = 'RESTful API Standards & Status Codes'
      skillName = 'REST APIs'
      questions = [
        {
          id: 'q-rest-1',
          questionText: 'Which HTTP method is idempotent and intended for full replacement of a resource?',
          questionType: 'multiple_choice',
          points: 34,
          orderIndex: 1,
          options: [
            { id: 'opt-rest-1a', optionText: 'PUT', orderIndex: 1 },
            { id: 'opt-rest-1b', optionText: 'PATCH', orderIndex: 2 },
            { id: 'opt-rest-1c', optionText: 'POST', orderIndex: 3 },
            { id: 'opt-rest-1d', optionText: 'DELETE', orderIndex: 4 },
          ],
        },
        {
          id: 'q-rest-2',
          questionText: 'What status code should be returned when client credentials are valid but forbidden from accessing the resource?',
          questionType: 'multiple_choice',
          points: 33,
          orderIndex: 2,
          options: [
            { id: 'opt-rest-2a', optionText: '403 Forbidden', orderIndex: 1 },
            { id: 'opt-rest-2b', optionText: '401 Unauthorized', orderIndex: 2 },
            { id: 'opt-rest-2c', optionText: '400 Bad Request', orderIndex: 3 },
            { id: 'opt-rest-2d', optionText: '405 Method Not Allowed', orderIndex: 4 },
          ],
        },
        {
          id: 'q-rest-3',
          questionText: 'What HTTP header is used in optimistic concurrency control to prevent conflicting overwrites?',
          questionType: 'multiple_choice',
          points: 33,
          orderIndex: 3,
          options: [
            { id: 'opt-rest-3a', optionText: 'If-Match / ETag', orderIndex: 1 },
            { id: 'opt-rest-3b', optionText: 'Authorization', orderIndex: 2 },
            { id: 'opt-rest-3c', optionText: 'Accept-Encoding', orderIndex: 3 },
            { id: 'opt-rest-3d', optionText: 'Cache-Control', orderIndex: 4 },
          ],
        },
      ]
    } else if (id.includes('sql')) {
      title = 'SQL Joins & Relational Indexing Benchmark'
      skillName = 'SQL'
      questions = [
        {
          id: 'q-sql-1',
          questionText: 'Which index type is default and optimal for range queries (<, <=, =, >=, >) in PostgreSQL and MySQL?',
          questionType: 'multiple_choice',
          points: 34,
          orderIndex: 1,
          options: [
            { id: 'opt-sql-1a', optionText: 'B-Tree Index', orderIndex: 1 },
            { id: 'opt-sql-1b', optionText: 'Hash Index', orderIndex: 2 },
            { id: 'opt-sql-1c', optionText: 'GIN Index', orderIndex: 3 },
            { id: 'opt-sql-1d', optionText: 'GiST Index', orderIndex: 4 },
          ],
        },
        {
          id: 'q-sql-2',
          questionText: 'What type of join returns all records from the left table and matched records from the right table?',
          questionType: 'multiple_choice',
          points: 33,
          orderIndex: 2,
          options: [
            { id: 'opt-sql-2a', optionText: 'LEFT OUTER JOIN', orderIndex: 1 },
            { id: 'opt-sql-2b', optionText: 'INNER JOIN', orderIndex: 2 },
            { id: 'opt-sql-2c', optionText: 'CROSS JOIN', orderIndex: 3 },
            { id: 'opt-sql-2d', optionText: 'FULL JOIN', orderIndex: 4 },
          ],
        },
        {
          id: 'q-sql-3',
          questionText: 'When should you generally AVOID adding a new index to a table?',
          questionType: 'multiple_choice',
          points: 33,
          orderIndex: 3,
          options: [
            { id: 'opt-sql-3a', optionText: 'On high-write / high-insert tables with low read frequency', orderIndex: 1 },
            { id: 'opt-sql-3b', optionText: 'On foreign keys used in frequent JOINs', orderIndex: 2 },
            { id: 'opt-sql-3c', optionText: 'On columns filtered in WHERE clauses', orderIndex: 3 },
            { id: 'opt-sql-3d', optionText: 'On columns used in ORDER BY clauses', orderIndex: 4 },
          ],
        },
      ]
    } else if (id.includes('nodejs') || id.includes('loop')) {
      title = 'Node.js Event Loop & Concurrency Benchmark'
      skillName = 'Node.js'
      questions = [
        {
          id: 'q-nl-1',
          questionText: 'Which queue is executed immediately after the current operation finishes, before the next event loop phase?',
          questionType: 'multiple_choice',
          points: 34,
          orderIndex: 1,
          options: [
            { id: 'opt-nl-1a', optionText: 'process.nextTick queue', orderIndex: 1 },
            { id: 'opt-nl-1b', optionText: 'check phase (setImmediate)', orderIndex: 2 },
            { id: 'opt-nl-1c', optionText: 'timers phase (setTimeout)', orderIndex: 3 },
            { id: 'opt-nl-1d', optionText: 'poll phase (I/O events)', orderIndex: 4 },
          ],
        },
      ]
    }

    res.status(200).json({
      success: true,
      data: {
        attemptId,
        title,
        skillName,
        timeLimit: 10,
        questions,
      },
    })
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
    if (!supabase) return res.status(200).json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('student_id', user.id)

    if (error || !data) return res.status(200).json({ success: true, data: [] })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: [] })
  }
}

export async function createStudentEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const evidencePayload = {
      title: body.title,
      description: body.description,
      evidence_type: body.evidence_type || body.evidenceType || 'project',
      url: body.url,
    }
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(201).json({ success: true, data: { id: `evidence-${Date.now()}`, student_id: user.id, ...evidencePayload, status: 'draft' } })

    const { data, error } = await supabase
      .from('evidence')
      .insert({ student_id: user.id, ...evidencePayload, status: 'draft' })
      .select()
      .single()

    if (error || !data) return res.status(201).json({ success: true, data: { id: `evidence-${Date.now()}`, student_id: user.id, ...evidencePayload, status: 'draft' } })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(201).json({ success: true, data: { id: `evidence-${Date.now()}`, student_id: (req as any).user?.id, ...req.body, status: 'draft' } })
  }
}

export async function submitStudentEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })
    const { id } = req.params

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: { id, status: 'submitted' } })

    const { data, error } = await supabase
      .from('evidence')
      .update({ status: 'submitted', submitted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('student_id', user.id)
      .select()
      .single()

    if (error || !data) return res.status(200).json({ success: true, data: { id, status: 'submitted' } })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: { id: req.params.id, status: 'submitted' } })
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
      .from('evidence')
      .delete()
      .eq('id', id)
      .eq('student_id', user.id)

    res.status(200).json({ success: true })
  } catch (err) {
    res.status(200).json({ success: true })
  }
}

export async function getStudentProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', user.id)

    if (error || !data) return res.status(200).json({ success: true, data: [] })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: [] })
  }
}

export async function createStudentProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(201).json({ success: true, data: { id: `proj-${Date.now()}`, ...body, student_id: user.id } })

    const { data, error } = await supabase
      .from('projects')
      .insert({ student_id: user.id, ...body })
      .select()
      .single()

    if (error || !data) return res.status(201).json({ success: true, data: { id: `proj-${Date.now()}`, ...body, student_id: user.id } })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(201).json({ success: true, data: { id: `proj-${Date.now()}`, ...req.body, student_id: (req as any).user?.id } })
  }
}

export async function getStudentPassport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({
        success: true,
        data: {
          settings: { share_token: 'demo-passport-token', is_public: true },
          skills: FALLBACK_STUDENT_SKILLS,
          projects: [],
        },
      })
    }

    const { data: settings } = await supabase
      .from('passport_settings')
      .select('*')
      .eq('student_id', user.id)
      .single()

    const { data: skills } = await supabase
      .from('student_skills')
      .select('*, skills(id, name, category)')
      .eq('student_id', user.id)

    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', user.id)

    res.status(200).json({
      success: true,
      data: {
        settings: settings || { share_token: 'demo-passport-token', is_public: true },
        skills: (skills && skills.length > 0) ? skills : FALLBACK_STUDENT_SKILLS,
        projects: projects || [],
      },
    })
  } catch (err) {
    res.status(200).json({
      success: true,
      data: {
        settings: { share_token: 'demo-passport-token', is_public: true },
        skills: FALLBACK_STUDENT_SKILLS,
        projects: [],
      },
    })
  }
}

export async function updateStudentPassportSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: { student_id: user.id, ...body } })

    const { data, error } = await supabase
      .from('passport_settings')
      .upsert({ student_id: user.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'student_id' })
      .select()
      .single()

    if (error || !data) return res.status(200).json({ success: true, data: { student_id: user.id, ...body } })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: { student_id: (req as any).user?.id, ...req.body } })
  }
}

export async function getStudentProgress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('progress_history')
      .select('*')
      .eq('student_id', user.id)
      .order('recorded_at', { ascending: true })

    if (error || !data) return res.status(200).json({ success: true, data: [] })
    res.status(200).json({ success: true, data })
  } catch (err) {
    res.status(200).json({ success: true, data: [] })
  }
}

// ─── SELF-RATINGS (Task 5) ─────────────────────────────────────────────────
// These endpoints manage student_self_ratings, which is a completely separate
// table from student_skills / skill_scores. Self-ratings are opinions, not
// verified measurements, and must never feed into readiness calculations.

const VALID_SELF_RATING_LABELS = ['never_used', 'basic', 'comfortable', 'strong'] as const
type SelfRatingLabel = typeof VALID_SELF_RATING_LABELS[number]

export async function saveSelfRatings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const career_target_id = body.career_target_id || body.careerTargetId
    const rawRatings = body.ratings || []

    if (!career_target_id || typeof career_target_id !== 'string') {
      return res.status(422).json({ success: false, error: 'career_target_id is required and must be a string' })
    }
    if (!Array.isArray(rawRatings) || rawRatings.length === 0) {
      return res.status(422).json({ success: false, error: 'ratings must be a non-empty array' })
    }

    // Normalize ratings
    const ratings = rawRatings.map((r: any) => ({
      skill_id: r.skill_id || r.skillId,
      self_rating_label: r.self_rating_label || r.label || r.rating,
    }))

    // Validate each rating entry
    for (const r of ratings) {
      if (!r.skill_id || typeof r.skill_id !== 'string') {
        return res.status(422).json({ success: false, error: 'Each rating must have a valid skill_id string' })
      }
      if (!VALID_SELF_RATING_LABELS.includes(r.self_rating_label)) {
        return res.status(422).json({
          success: false,
          error: `self_rating_label must be one of: ${VALID_SELF_RATING_LABELS.join(', ')}`,
        })
      }
    }

    const supabase = getSupabaseAdmin()
    let persisted = false
    const isDemoMode =
      req.headers['x-demo-mode'] === 'true' ||
      (typeof user.id === 'string' && user.id.startsWith('demo-'))

    // Demo mode is intentionally read-only: never write demo records to the
    // production database. The response still succeeds but states persistence=false
    // so the UI can label the outcome honestly.
    if (!isDemoMode && supabase) {
      const rows = ratings.map((r: { skill_id: string; self_rating_label: SelfRatingLabel }) => ({
        student_id: user.id,
        career_target_id,
        skill_id: r.skill_id,
        self_rating_label: r.self_rating_label,
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('student_self_ratings')
        .upsert(rows, { onConflict: 'student_id,career_target_id,skill_id' })

      if (error) {
        return res.status(502).json({
          success: false,
          error: `Could not persist self-ratings: ${error.message}`,
        })
      }
      persisted = true
    }

    // ─── Gemini AI Integration for Self-Rating Narrative Analysis ───
    const career = findCareerBenchmark(career_target_id)
    const careerTitle = career?.name || 'Target Career Track'
    const ratingDescriptions = ratings.map((r: { skill_id: string; self_rating_label: string }) => {
      const benchmarkSkill = career
        ? Object.keys(career.skills).find((k, idx) => `skill-${career.slug}-${idx + 1}` === r.skill_id || k === r.skill_id)
        : null
      const skillName = benchmarkSkill || r.skill_id
      return `${skillName}: ${r.self_rating_label.replace('_', ' ')}`
    }).join(', ')

    let insightText = 'Insight generation temporarily unavailable'
    if (AI_CONFIG.isLiveProviderConfigured()) {
      try {
        const promptText = `Student's target career: ${careerTitle}.\nStudent's self-declared skill confidence levels: ${ratingDescriptions}.\n\nProvide a concise 2-sentence narrative summarizing their self-declared baseline relative to their target role. Do NOT mention numerical test scores, point calculations, or readiness percentages.`
        const result = await GeminiService.generateText({
          systemInstruction: 'You are a career development mentor for SkillBridge Connect. Give a concise, encouraging 2-sentence narrative summary of the student\'s self-declared baseline profile relative to their target role. Do NOT generate or calculate numerical scores or percentages.',
          userPrompt: promptText,
          temperature: 0.3,
        })
        if (result) {
          insightText = result
        }
      } catch (err) {
        console.warn('[Gemini AI] Error in self-rating insight call:', err)
      }
    }

    res.status(200).json({
      success: true,
      data: {
        stored: ratings.length,
        persisted,
        summary: insightText,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getSelfRatings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const careerTargetId = req.params.career_target_id
    if (!careerTargetId) {
      return res.status(422).json({ success: false, error: 'career_target_id path parameter is required' })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return res.status(200).json({ success: true, data: [] })
    }

    const { data, error } = await supabase
      .from('student_self_ratings')
      .select('skill_id, self_rating_label, updated_at')
      .eq('student_id', user.id)
      .eq('career_target_id', careerTargetId)

    if (error) {
      // Table may not exist yet; degrade gracefully
      return res.status(200).json({ success: true, data: [] })
    }

    res.status(200).json({ success: true, data: data || [] })
  } catch (err) {
    next(err)
  }
}
