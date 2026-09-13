import fs from 'fs'
import path from 'path'
import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { calculateOverallReadiness, calculateGap, classifyGap, evaluateCareerReadiness, evaluateDiagnosticSkills } from '../intelligence/engine.js'
import { startAssessment, submitAssessment, FALLBACK_QUESTIONS, sessionAssessmentAttempts, getAssessmentAttempts } from '../intelligence/assessment.js'
import { CAREER_BENCHMARK_PROFILES, findCareerBenchmark } from '../intelligence/benchmarks.js'
import { ENV } from '../config/env.js'
import { AI_CONFIG } from '../ai/config.js'
import { GroqService } from '../services/ai/groq.service.js'

// Persistent store on disk for reliable local and offline guarantees
export const sessionCareerTargets = new Map<string, string>()
export const sessionSkills = new Map<string, Map<string, any>>()
export const sessionSelfRatings = new Map<string, Map<string, string>>()
export const sessionProjects = new Map<string, any[]>()
export const sessionCertifications = new Map<string, any[]>()
export const sessionStudentProfiles = new Map<string, any>()

const PERSISTENT_STORE_PATH = path.resolve(process.cwd(), 'backend', 'data', 'persistent_store.json')

function loadPersistentStore() {
  try {
    const candidates = [
      PERSISTENT_STORE_PATH,
      path.resolve(process.cwd(), 'data', 'persistent_store.json'),
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8')
        const parsed = JSON.parse(raw)
        if (parsed.careerTargets) {
          for (const [k, v] of Object.entries(parsed.careerTargets)) sessionCareerTargets.set(k, v as string)
        }
        if (parsed.skills) {
          for (const [userId, skillMap] of Object.entries(parsed.skills)) {
            const map = new Map<string, any>()
            for (const [skillId, skillRecord] of Object.entries(skillMap as any)) {
              map.set(skillId, skillRecord)
            }
            sessionSkills.set(userId, map)
          }
        }
        if (parsed.selfRatings) {
          for (const [userId, ratingMap] of Object.entries(parsed.selfRatings)) {
            const map = new Map<string, string>()
            for (const [skillId, rating] of Object.entries(ratingMap as any)) {
              map.set(skillId, rating as string)
            }
            sessionSelfRatings.set(userId, map)
          }
        }
        if (parsed.assessmentAttempts) {
          for (const [userId, attemptsList] of Object.entries(parsed.assessmentAttempts)) {
            sessionAssessmentAttempts.set(userId, attemptsList as any[])
          }
        }
        if (parsed.projects) {
          for (const [userId, projList] of Object.entries(parsed.projects)) {
            sessionProjects.set(userId, projList as any[])
          }
        }
        if (parsed.certifications) {
          for (const [userId, certList] of Object.entries(parsed.certifications)) {
            sessionCertifications.set(userId, certList as any[])
          }
        }
        if (parsed.studentProfiles) {
          for (const [userId, profData] of Object.entries(parsed.studentProfiles)) {
            sessionStudentProfiles.set(userId, profData)
          }
        }
        break
      }
    }
  } catch (err) {
    console.warn('[PersistentStore] Could not load:', err)
  }
}

export function savePersistentStore() {
  try {
    const dir = path.dirname(PERSISTENT_STORE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const targetsObj: Record<string, string> = {}
    for (const [k, v] of sessionCareerTargets.entries()) targetsObj[k] = v

    const skillsObj: Record<string, Record<string, any>> = {}
    for (const [userId, skillMap] of sessionSkills.entries()) {
      skillsObj[userId] = {}
      for (const [skillId, record] of skillMap.entries()) {
        skillsObj[userId][skillId] = record
      }
    }

    const ratingsObj: Record<string, Record<string, string>> = {}
    for (const [userId, ratingMap] of sessionSelfRatings.entries()) {
      ratingsObj[userId] = {}
      for (const [skillId, rating] of ratingMap.entries()) {
        ratingsObj[userId][skillId] = rating
      }
    }

    const attemptsObj: Record<string, any[]> = {}
    for (const [userId, attempts] of sessionAssessmentAttempts.entries()) {
      attemptsObj[userId] = attempts
    }

    const projectsObj: Record<string, any[]> = {}
    for (const [userId, projs] of sessionProjects.entries()) {
      projectsObj[userId] = projs
    }

    const certsObj: Record<string, any[]> = {}
    for (const [userId, certs] of sessionCertifications.entries()) {
      certsObj[userId] = certs
    }

    const profilesObj: Record<string, any> = {}
    for (const [userId, prof] of sessionStudentProfiles.entries()) {
      profilesObj[userId] = prof
    }

    fs.writeFileSync(PERSISTENT_STORE_PATH, JSON.stringify({
      careerTargets: targetsObj,
      skills: skillsObj,
      selfRatings: ratingsObj,
      assessmentAttempts: attemptsObj,
      projects: projectsObj,
      certifications: certsObj,
      studentProfiles: profilesObj,
      updatedAt: new Date().toISOString(),
    }, null, 2))
  } catch (err) {
    console.warn('[PersistentStore] Could not save:', err)
  }
}

loadPersistentStore()

export async function getStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const storedProfile = sessionStudentProfiles.get(user.id) || {}
    const supabase = getSupabaseAdmin()

    let dbData: any = null
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*, profiles(id, full_name, email, avatar_url, bio, phone, location), career_targets(id, name, slug, description)')
          .eq('profile_id', user.id)
          .maybeSingle()
        if (!error && data) dbData = data
      } catch {}
    }

    const baseProfiles = dbData?.profiles || {}
    const targetCareer = dbData?.career_targets || null

    const resolved = {
      profile_id: user.id,
      full_name: storedProfile.full_name || baseProfiles.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
      email: user.email || baseProfiles.email || '',
      avatar_url: storedProfile.avatar_url || baseProfiles.avatar_url || user.user_metadata?.avatar_url || null,
      bio: storedProfile.bio !== undefined ? storedProfile.bio : (baseProfiles.bio || ''),
      phone: storedProfile.phone !== undefined ? storedProfile.phone : (baseProfiles.phone || ''),
      location: storedProfile.location !== undefined ? storedProfile.location : (baseProfiles.location || ''),
      college_name: storedProfile.college_name !== undefined ? storedProfile.college_name : (dbData?.college_name || ''),
      degree: storedProfile.degree !== undefined ? storedProfile.degree : (dbData?.degree || ''),
      branch: storedProfile.branch !== undefined ? storedProfile.branch : (dbData?.branch || ''),
      academic_year: storedProfile.academic_year !== undefined ? storedProfile.academic_year : (dbData?.academic_year || ''),
      education: storedProfile.education || dbData?.education || 'Undergraduate',
      graduation_year: storedProfile.graduation_year || dbData?.graduation_year || 2026,
      experience_level: storedProfile.experience_level || dbData?.experience_level || 'Student / Entry-level',
      linkedin_url: storedProfile.linkedin_url !== undefined ? storedProfile.linkedin_url : (dbData?.linkedin_url || ''),
      github_url: storedProfile.github_url !== undefined ? storedProfile.github_url : (dbData?.github_url || ''),
      portfolio_url: storedProfile.portfolio_url !== undefined ? storedProfile.portfolio_url : (dbData?.portfolio_url || ''),
      target_career_id: dbData?.target_career_id || sessionCareerTargets.get(user.id) || null,
      career_targets: targetCareer,
      onboarding_completed: true,
    }

    res.status(200).json({ success: true, data: resolved })
  } catch (err) {
    next(err)
  }
}

export async function updateStudentProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const existing = sessionStudentProfiles.get(user.id) || {}
    const merged = { ...existing, ...body }
    sessionStudentProfiles.set(user.id, merged)
    savePersistentStore()

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        // Update profiles table
        const profileUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
        if (body.full_name !== undefined) profileUpdates.full_name = body.full_name
        if (body.bio !== undefined) profileUpdates.bio = body.bio
        if (body.phone !== undefined) profileUpdates.phone = body.phone
        if (body.location !== undefined) profileUpdates.location = body.location
        if (body.avatar_url !== undefined) profileUpdates.avatar_url = body.avatar_url

        if (Object.keys(profileUpdates).length > 1) {
          await supabase.from('profiles').update(profileUpdates).eq('id', user.id)
        }

        // Update student_profiles table
        const studentUpdates: Record<string, any> = { profile_id: user.id, updated_at: new Date().toISOString() }
        if (body.college_name !== undefined) studentUpdates.college_name = body.college_name
        if (body.degree !== undefined) studentUpdates.degree = body.degree
        if (body.branch !== undefined) studentUpdates.branch = body.branch
        if (body.academic_year !== undefined) studentUpdates.academic_year = body.academic_year
        if (body.education !== undefined) studentUpdates.education = body.education
        if (body.graduation_year !== undefined) studentUpdates.graduation_year = Number(body.graduation_year)
        if (body.experience_level !== undefined) studentUpdates.experience_level = body.experience_level
        if (body.linkedin_url !== undefined) studentUpdates.linkedin_url = body.linkedin_url
        if (body.github_url !== undefined) studentUpdates.github_url = body.github_url
        if (body.portfolio_url !== undefined) studentUpdates.portfolio_url = body.portfolio_url

        await supabase.from('student_profiles').upsert(studentUpdates, { onConflict: 'profile_id' })
      } catch (err) {
        console.warn('Database sync for profile notice:', err)
      }
    }

    res.status(200).json({ success: true, data: merged, message: 'Profile updated successfully' })
  } catch (err) {
    next(err)
  }
}

export async function getCareerTarget(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('target_career_id, career_targets(id, name, slug, description, category)')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (!error && data && data.target_career_id) {
          return res.status(200).json({ success: true, data })
        }
      } catch {}
    }

    const cachedCareerId = sessionCareerTargets.get(user.id)
    if (cachedCareerId) {
      const benchmark = findCareerBenchmark(cachedCareerId)
      const fallbackCareer = FALLBACK_CAREER_TARGETS.find(c => c.id === cachedCareerId || c.slug === cachedCareerId) || {
        id: cachedCareerId,
        name: benchmark?.name || 'Career Target',
        slug: benchmark?.slug || 'career',
        category: benchmark?.category || 'Engineering',
        description: benchmark?.description || ''
      }

      return res.status(200).json({
        success: true,
        data: {
          target_career_id: cachedCareerId,
          career_targets: fallbackCareer,
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: null
    })
  } catch (err) {
    const cachedCareerId = sessionCareerTargets.get(req.user?.id || '')
    if (cachedCareerId) {
      return res.status(200).json({
        success: true,
        data: {
          target_career_id: cachedCareerId,
          career_targets: FALLBACK_CAREER_TARGETS.find(c => c.id === cachedCareerId) || FALLBACK_CAREER_TARGETS[0],
        }
      })
    }
    res.status(200).json({
      success: true,
      data: null
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

export const FALLBACK_STUDENT_SKILLS = [
  { id: 'ss-1', skill_id: '40000000-0000-0000-0000-000000000001', current_level: 65, verified_level: 65, verification_status: 'assessment_verified', skills: { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', category: 'Backend' } },
  { id: 'ss-2', skill_id: '40000000-0000-0000-0000-000000000002', current_level: 75, verified_level: 75, verification_status: 'assessment_verified', skills: { id: '40000000-0000-0000-0000-000000000002', name: 'React', category: 'Frontend' } },
  { id: 'ss-3', skill_id: '40000000-0000-0000-0000-000000000003', current_level: 82, verified_level: 82, verification_status: 'evidence_verified', skills: { id: '40000000-0000-0000-0000-000000000003', name: 'SQL', category: 'Databases' } },
  { id: 'ss-4', skill_id: '40000000-0000-0000-0000-000000000004', current_level: 75, verified_level: 75, verification_status: 'practical_verified', skills: { id: '40000000-0000-0000-0000-000000000004', name: 'Git & Version Control', category: 'Tools' } },
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
    const careerId = body.target_career_id || body.careerTarget || body.targetCareerId || body.career_id || body.role_id
    if (!careerId) return res.status(422).json({ success: false, error: 'target_career_id is required' })

    sessionCareerTargets.set(user.id, careerId)
    savePersistentStore()

    const benchmark = findCareerBenchmark(careerId)
    const fallbackCareer = FALLBACK_CAREER_TARGETS.find(c => c.id === careerId || c.slug === careerId) || {
      id: careerId,
      name: benchmark?.name || 'Frontend Developer',
      slug: benchmark?.slug || 'frontend',
      category: benchmark?.category || 'Engineering',
      description: benchmark?.description || ''
    }

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .upsert({
            profile_id: user.id,
            target_career_id: careerId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'profile_id' })
          .select('target_career_id, career_targets(id, name, slug, description, category)')
          .maybeSingle()

        if (!error && data) {
          savePersistentStore()
          return res.status(200).json({ success: true, data })
        }
      } catch {
        // Fall back to persistent cache
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        target_career_id: careerId,
        career_targets: fallbackCareer
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function getStudentSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_skills')
          .select('*, skills(id, name, category)')
          .eq('student_id', user.id)

        if (!error && data && data.length > 0) {
          return res.status(200).json({ success: true, data })
        }
      } catch {}
    }

    const userSkillsMap = sessionSkills.get(user.id)
    if (userSkillsMap && userSkillsMap.size > 0) {
      return res.status(200).json({ success: true, data: Array.from(userSkillsMap.values()) })
    }

    return res.status(200).json({ success: true, data: [] })
  } catch (err) {
    const userSkillsMap = sessionSkills.get(req.user?.id || '')
    if (userSkillsMap && userSkillsMap.size > 0) {
      return res.status(200).json({ success: true, data: Array.from(userSkillsMap.values()) })
    }
    res.status(200).json({ success: true, data: [] })
  }
}

export async function addStudentSkill(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    // If request contains a declaredSkills or skills array, delegate to bulk declaration
    if (Array.isArray(body.declaredSkills) || Array.isArray(body.skills) || Array.isArray(body.declarations)) {
      return bulkDeclareStudentSkills(req, res, next)
    }

    const skillId = body.skill_id || body.skillId
    if (!skillId) return res.status(422).json({ success: false, error: 'skill_id is required' })

    let rawDeclared = Number(body.self_declared_level ?? body.selfDeclaredLevel ?? body.current_level ?? body.level ?? 50)
    const declaredLevel = (rawDeclared > 0 && rawDeclared <= 5) ? Math.round(rawDeclared * 20) : Math.round(rawDeclared)
    if (!Number.isInteger(declaredLevel) || declaredLevel < 0 || declaredLevel > 100) {
      return res.status(422).json({ success: false, error: 'self_declared_level must be an integer from 0 to 100' })
    }

    if (!sessionSkills.has(user.id)) sessionSkills.set(user.id, new Map())
    const userSkills = sessionSkills.get(user.id)!
    const existing = userSkills.get(skillId)

    const verificationStatus = body.verification_status || body.verificationStatus || 'self_declared'
    const isVerified = verificationStatus !== 'self_declared' && verificationStatus !== 'unassessed'
    const finalVerifiedLevel = isVerified
      ? Number(body.verified_level ?? body.verifiedLevel ?? body.current_level ?? (existing?.verified_level && existing.verified_level > 0 ? existing.verified_level : declaredLevel))
      : 0
    const finalCurrentLevel = isVerified ? Number(body.current_level ?? finalVerifiedLevel) : declaredLevel

    const newSkillRecord = {
      id: existing?.id || `ss-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      student_id: user.id,
      skill_id: skillId,
      self_declared_level: declaredLevel,
      current_level: finalCurrentLevel,
      verified_level: finalVerifiedLevel,
      verification_status: isVerified ? verificationStatus : 'self_declared',
      skills: {
        id: skillId,
        name: body.skill_name || body.skillName || existing?.skills?.name || skillId,
        category: existing?.skills?.category || 'Technical'
      }
    }
    userSkills.set(skillId, newSkillRecord)
    savePersistentStore()

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_skills')
          .upsert({
            student_id: user.id,
            skill_id: skillId,
            self_declared_level: declaredLevel,
            current_level: newSkillRecord.current_level,
            verified_level: newSkillRecord.verified_level,
            verification_status: newSkillRecord.verification_status,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,skill_id' })
          .select('*, skills(id, name, category)')
          .maybeSingle()

        if (!error && data) return res.status(200).json({ success: true, data })
      } catch {}
    }

    res.status(200).json({ success: true, data: newSkillRecord })
  } catch (err) {
    next(err)
  }
}

export async function bulkDeclareStudentSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const rawList: any[] = Array.isArray(body.declaredSkills)
      ? body.declaredSkills
      : Array.isArray(body.skills)
      ? body.skills
      : Array.isArray(body.declarations)
      ? body.declarations
      : (body.skill_id || body.skillId)
      ? [body]
      : []

    if (rawList.length === 0) {
      return res.status(400).json({ success: false, error: 'declaredSkills or skills array is required' })
    }

    if (!sessionSkills.has(user.id)) sessionSkills.set(user.id, new Map())
    const userSkills = sessionSkills.get(user.id)!
    const results: any[] = []

    for (const item of rawList) {
      const skillId = item.skill_id || item.skillId
      if (!skillId) continue
      let rawLevel = Number(item.self_declared_level ?? item.selfDeclaredLevel ?? item.current_level ?? item.level ?? 50)
      const declaredLevel = (rawLevel > 0 && rawLevel <= 5) ? Math.round(rawLevel * 20) : Math.max(0, Math.min(100, Math.round(rawLevel)))
      const skillName = item.skill_name || item.skillName || item.name
      const existing = userSkills.get(skillId)

      const isVerified = existing && existing.verification_status !== 'self_declared' && existing.verification_status !== 'unassessed'
      const record = {
        id: existing?.id || `ss-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        student_id: user.id,
        skill_id: skillId,
        self_declared_level: declaredLevel,
        current_level: isVerified ? existing.current_level : declaredLevel,
        verified_level: isVerified ? existing.verified_level : 0,
        verification_status: isVerified ? existing.verification_status : 'self_declared',
        skills: {
          id: skillId,
          name: skillName || existing?.skills?.name || skillId,
          category: existing?.skills?.category || 'Technical'
        }
      }
      userSkills.set(skillId, record)
      results.push(record)

      const supabase = getSupabaseAdmin()
      if (supabase) {
        try {
          await supabase.from('student_skills').upsert({
            student_id: user.id,
            skill_id: skillId,
            self_declared_level: declaredLevel,
            current_level: record.current_level,
            verified_level: record.verified_level,
            verification_status: record.verification_status,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,skill_id' })
        } catch {}
      }
    }

    savePersistentStore()
    res.status(200).json({ success: true, data: results, count: results.length })
  } catch (err) {
    next(err)
  }
}

export async function getStudentReadiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const careerId = (req.query.career_id as string) || (req.query.careerId as string) || (req.query.careerTarget as string) || (req.query.target_career_id as string) || null
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
      selectedCareerId = sessionCareerTargets.get(user.id) || null
    }

    if (!selectedCareerId) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No career target selected yet'
      })
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

    if (sessionSkills.has(user.id)) {
      const userSkillsMap = sessionSkills.get(user.id)!
      if (userSkillsMap.size > 0) {
        const inMemoryList = Array.from(userSkillsMap.values())
        const existingIds = new Set(studentSkills.map(s => s.skill_id))
        inMemoryList.forEach(memSkill => {
          if (!existingIds.has(memSkill.skill_id)) {
            studentSkills.push(memSkill)
          } else {
            const idx = studentSkills.findIndex(s => s.skill_id === memSkill.skill_id)
            if (idx >= 0 && memSkill.verification_status === 'assessment_verified') {
              studentSkills[idx] = memSkill
            }
          }
        })
      }
    }

    const scoresFormatted = studentSkills.map(s => ({
      skillId: s.skill_id,
      skillName: (s.skills as any)?.name || (s as any).skillName || s.skill_name || 'Skill',
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

    if (selfRatings.length === 0) {
      const sessionKey = `${user.id}:${career.id}`
      const userRatingMap = sessionSelfRatings.get(sessionKey)
      if (userRatingMap && userRatingMap.size > 0) {
        selfRatings = Array.from(userRatingMap.entries()).map(([skill_id, self_rating_label]) => {
          const matchedScore = scoresFormatted.find(s => s.skillId === skill_id)
          const matchedReq = reqsFormatted.find(r => r.skillId === skill_id)
          return {
            skill_id,
            skill_name: matchedScore?.skillName || matchedReq?.skillName || 'Skill',
            self_rating_label,
            verified_score: matchedScore?.currentLevel ?? -1,
            required_level: matchedReq?.requiredLevel ?? 0,
          }
        }).filter(sr => sr.verified_score >= 0)
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...readinessResult,
        overallReadiness: readinessResult.readinessPercentage,
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

export function getAssessmentForSkillName(skillName?: string) {
  const norm = (skillName || '').toLowerCase()
  if (norm.includes('react')) return { id: 'assess-l1-react-basics', skill: 'React', title: 'React Component Architecture & Hooks Benchmark' }
  if (norm.includes('mongo')) return { id: 'assess-l1-mongodb-core', skill: 'MongoDB', title: 'MongoDB Aggregations & Document Modeling Benchmark' }
  if (norm.includes('express')) return { id: 'assess-l1-express-core', skill: 'Express.js', title: 'Express.js Middleware Architecture & Routing Benchmark' }
  if (norm.includes('auth') || norm.includes('security')) return { id: 'assess-l1-auth-security', skill: 'Authentication', title: 'Authentication, JWT & Web Security Benchmark' }
  if (norm.includes('deploy') || norm.includes('cloud') || norm.includes('docker')) return { id: 'assess-l1-deployment-cloud', skill: 'Deployment', title: 'Containerization, Cloud Deployment & CI/CD Benchmark' }
  if (norm.includes('dsa') || norm.includes('problem') || norm.includes('algorithm')) return { id: 'assess-l1-dsa-core', skill: 'Problem Solving / DSA', title: 'Data Structures & Algorithmic Problem Solving Benchmark' }
  if (norm.includes('html')) return { id: 'assess-l1-html-basics', skill: 'HTML', title: 'Semantic HTML5 & Web Standards Benchmark' }
  if (norm.includes('css')) return { id: 'assess-l1-css-layouts', skill: 'CSS', title: 'Modern CSS, Flexbox & Responsive Layouts Benchmark' }
  if (norm.includes('sql') || norm.includes('database')) return { id: 'assess-l1-sql-indexing', skill: 'SQL', title: 'SQL Joins & Relational Indexing Benchmark' }
  if (norm.includes('rest') || norm.includes('api')) return { id: 'assess-l1-rest-design', skill: 'REST APIs', title: 'RESTful API Standards & Status Codes Benchmark' }
  if (norm.includes('git') || norm.includes('version')) return { id: 'assess-l1-git-workflows', skill: 'Git & Version Control', title: 'Git Workflows & Version Control Mastery' }
  if (norm.includes('js') || norm.includes('javascript')) return { id: 'assess-l1-javascript-core', skill: 'JavaScript', title: 'JavaScript Language Knowledge Benchmark' }
  if (norm.includes('node') || norm.includes('backend')) return { id: 'assess-l1-nodejs-loop', skill: 'Node.js', title: 'Node.js Event Loop & Concurrency Benchmark' }
  return { id: 'assess-l1-nodejs-loop', skill: skillName || 'Core Fundamentals', title: 'Knowledge Benchmark' }
}

export async function getCareerTargetSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
          requiredScore: r.required_level,
          weight: r.importance === 'High' ? 10 : r.importance === 'Medium' ? 8 : 6,
          priority: (r.importance || 'High').toLowerCase(),
          importance: r.importance || 'High',
        }))
      }
    }

    if (requiredSkills.length === 0 && benchmark) {
      requiredSkills = Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: b.skillId || `skill-${benchmark.slug}-${idx + 1}`,
        name: name,
        skillName: name,
        category: b.category || 'Technical',
        requiredLevel: b.required,
        requiredScore: b.required,
        weight: Math.round(b.weight * 100),
        priority: (b.priority || (b.weight >= 0.25 ? 'High' : b.weight >= 0.15 ? 'Medium' : 'Low')).toLowerCase(),
        importance: b.priority || (b.weight >= 0.25 ? 'High' : b.weight >= 0.15 ? 'Medium' : 'Low'),
      }))
    }

    const user = req.user
    const userSkills = user ? sessionSkills.get(user.id) : null

    const enrichedSkills = requiredSkills.map(s => {
      let existing = userSkills?.get(s.skillId)
      if (!existing && userSkills) {
        for (const [_, record] of userSkills.entries()) {
          if (record.skills?.name?.toLowerCase() === s.skillName?.toLowerCase() ||
              record.skill_name?.toLowerCase() === s.skillName?.toLowerCase() ||
              record.skills?.name?.toLowerCase() === s.name?.toLowerCase()) {
            existing = record
            break
          }
        }
      }

      const isVerified = Boolean(
        existing &&
        existing.verification_status !== 'self_declared' &&
        existing.verification_status !== 'unassessed' &&
        existing.verified_level > 0
      )

      const selfDeclaredScore = existing?.self_declared_level ?? 0
      const verifiedScore = isVerified ? existing.verified_level : 0
      const deficit = Math.max(s.requiredLevel - verifiedScore, 0)
      const attempts = user ? getAssessmentAttempts(user.id, s.skillId) : []

      return {
        ...s,
        selfDeclaredScore,
        verifiedScore,
        verificationStatus: existing?.verification_status || (selfDeclaredScore > 0 ? 'self_declared' : 'unassessed'),
        status: isVerified && deficit === 0 ? 'ready' : deficit > 20 ? 'critical' : 'improve',
        isAssessed: isVerified,
        attemptCount: attempts.length,
        latestScore: attempts.length > 0 ? attempts[attempts.length - 1].score : null,
      }
    })

    return res.status(200).json({
      success: true,
      career: {
        id: career.id,
        name: career.name,
        slug: career.slug,
        description: career.description || '',
        category: career.category || 'Engineering',
      },
      skills: enrichedSkills,
      data: enrichedSkills,
    })
  } catch (err) {
    next(err)
  }
}

export async function saveCareerTargetSkills(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const { careerTargetId, career_target_id, careerId, career_id, skills } = req.body || {}
    const targetCareerId = careerTargetId || career_target_id || careerId || career_id
    if (!targetCareerId) {
      return res.status(400).json({ success: false, error: 'careerTargetId is required' })
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, error: 'skills array is required and must not be empty' })
    }

    // 1. Validate career exists
    const benchmark = findCareerBenchmark(targetCareerId)
    const fallback = FALLBACK_CAREER_TARGETS.find(c => c.id === targetCareerId || c.slug === targetCareerId)
    const career = benchmark || fallback
    if (!career) {
      return res.status(404).json({ success: false, error: `Target career '${targetCareerId}' not found` })
    }

    // 2. Fetch legitimate required skills for this career
    let careerReqs: Array<{ skillId: string; skillName: string; requiredScore: number; weight: number; priority: string; category?: string }> = []
    if (benchmark) {
      careerReqs = Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: b.skillId || `skill-${benchmark.slug}-${idx + 1}`,
        skillName: name,
        requiredScore: b.required,
        weight: b.weight,
        priority: b.priority || (b.weight >= 0.25 ? 'High' : b.weight >= 0.15 ? 'Medium' : 'Low'),
        category: b.category || 'Technical',
      }))
    }

    const allowedSkillIds = new Set(careerReqs.map(r => r.skillId.toLowerCase()))
    const allowedSkillNames = new Set(careerReqs.map(r => r.skillName.toLowerCase()))

    // 3. Validate each submitted skill
    for (const item of skills) {
      const skillId = item.skillId || item.skill_id
      if (!skillId) {
        return res.status(400).json({ success: false, error: 'Each skill item must have a skillId' })
      }

      // Check skill belongs to selected career
      const matchesId = allowedSkillIds.has(skillId.toLowerCase())
      const matchesName = allowedSkillNames.has((item.skillName || item.name || skillId).toLowerCase())
      if (!matchesId && !matchesName) {
        return res.status(400).json({
          success: false,
          error: `Skill '${skillId}' does not belong to the selected career '${career.name}'`,
        })
      }

      // Validate score between 0 and 100
      const rawScore = Number(item.selfScore ?? item.selfDeclaredScore ?? item.self_declared_level ?? item.score ?? item.level)
      if (isNaN(rawScore) || !Number.isInteger(rawScore) || rawScore < 0 || rawScore > 100) {
        return res.status(400).json({
          success: false,
          error: `Score for skill '${skillId}' must be an integer between 0 and 100`,
        })
      }
    }

    // 4. Save to session and persistent store
    if (!sessionSkills.has(user.id)) sessionSkills.set(user.id, new Map())
    const userSkills = sessionSkills.get(user.id)!
    sessionCareerTargets.set(user.id, targetCareerId)

    const savedRecords: any[] = []
    const declaredMap = new Map<string, number>()

    for (const item of skills) {
      const skillId = item.skillId || item.skill_id
      const rawScore = Math.round(Number(item.selfScore ?? item.selfDeclaredScore ?? item.self_declared_level ?? item.score ?? item.level))
      const declaredScore = Math.max(0, Math.min(100, rawScore))

      const matchingReq = careerReqs.find(r =>
        r.skillId.toLowerCase() === skillId.toLowerCase() ||
        r.skillName.toLowerCase() === (item.skillName || item.name || skillId).toLowerCase()
      )
      const canonicalSkillId = matchingReq?.skillId || skillId
      const skillName = matchingReq?.skillName || item.skillName || item.name || skillId

      declaredMap.set(canonicalSkillId, declaredScore)
      declaredMap.set(skillName.toLowerCase(), declaredScore)

      const existing = userSkills.get(canonicalSkillId)
      const isVerified = Boolean(
        existing &&
        existing.verification_status !== 'self_declared' &&
        existing.verification_status !== 'unassessed' &&
        existing.verified_level > 0
      )

      const record = {
        id: existing?.id || `ss-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        student_id: user.id,
        skill_id: canonicalSkillId,
        self_declared_level: declaredScore,
        current_level: isVerified ? existing.current_level : declaredScore,
        verified_level: isVerified ? existing.verified_level : 0,
        verification_status: isVerified ? existing.verification_status : 'self_declared',
        skills: {
          id: canonicalSkillId,
          name: skillName,
          category: matchingReq?.category || existing?.skills?.category || 'Technical',
        },
        updated_at: new Date().toISOString(),
      }

      userSkills.set(canonicalSkillId, record)
      savedRecords.push(record)

      // Dual write to Supabase if connected
      const supabase = getSupabaseAdmin()
      if (supabase) {
        try {
          await supabase.from('student_skills').upsert({
            student_id: user.id,
            skill_id: canonicalSkillId,
            self_declared_level: declaredScore,
            current_level: record.current_level,
            verified_level: record.verified_level,
            verification_status: record.verification_status,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,skill_id' })
        } catch {}
      }
    }

    savePersistentStore()

    // 5. Initial Diagnostic Analysis
    const reqsForDiagnostic = careerReqs.map(r => ({
      skillId: r.skillId,
      skillName: r.skillName,
      category: r.category,
      requiredLevel: r.requiredScore,
      importance: r.priority,
    }))

    const diagnosticResult = evaluateDiagnosticSkills(career.name, reqsForDiagnostic, declaredMap)

    return res.status(200).json({
      success: true,
      diagnostic: diagnosticResult,
      data: {
        careerId: targetCareerId,
        careerName: career.name,
        savedSkills: savedRecords,
        diagnostic: diagnosticResult,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getStudentSkillDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const rawSkillId = req.params.skillId || req.params.id
    const skillId = Array.isArray(rawSkillId) ? String(rawSkillId[0]) : String(rawSkillId || '')
    if (!skillId) return res.status(400).json({ success: false, error: 'skillId is required' })

    // Find student's skill record
    const userSkills = sessionSkills.get(user.id)
    const existing = userSkills?.get(skillId) ||
      (userSkills ? Array.from(userSkills.values()).find(s =>
        s.skill_id?.toLowerCase() === skillId.toLowerCase() ||
        s.skills?.name?.toLowerCase() === skillId.toLowerCase()
      ) : null)

    // Find career target requirement
    const targetCareerId = sessionCareerTargets.get(user.id)
    const benchmark = targetCareerId ? findCareerBenchmark(targetCareerId) : CAREER_BENCHMARK_PROFILES[0]
    let matchingReq: any = null
    if (benchmark) {
      const foundEntry = Object.entries(benchmark.skills).find(([name, b]) =>
        b.skillId === skillId || name.toLowerCase() === skillId.toLowerCase() || b.skillId === existing?.skill_id
      )
      if (foundEntry) {
        matchingReq = {
          skillName: foundEntry[0],
          requiredScore: foundEntry[1].required,
          weight: Math.round(foundEntry[1].weight * 100),
          priority: foundEntry[1].priority || (foundEntry[1].weight >= 0.25 ? 'High' : 'Medium'),
          category: foundEntry[1].category || 'Technical',
        }
      }
    }

    const skillName = existing?.skills?.name || matchingReq?.skillName || skillId
    const isVerified = Boolean(
      existing &&
      existing.verification_status !== 'self_declared' &&
      existing.verification_status !== 'unassessed' &&
      existing.verified_level > 0
    )
    const verifiedScore = isVerified ? existing.verified_level : 0
    const selfDeclaredScore = existing?.self_declared_level ?? 0
    const requiredScore = matchingReq?.requiredScore || 75
    const gap = Math.max(requiredScore - (isVerified ? (verifiedScore || 0) : 0), 0)

    // Fetch attempts
    const attempts = getAssessmentAttempts(user.id, skillId)
    const targetAssessment = getAssessmentForSkillName(skillName)

    return res.status(200).json({
      success: true,
      data: {
        skillId,
        skillName,
        category: matchingReq?.category || existing?.skills?.category || 'Technical',
        selfDeclaredScore,
        verifiedScore,
        verificationStatus: existing?.verification_status || (selfDeclaredScore > 0 ? 'self_declared' : 'unassessed'),
        requiredScore,
        requiredLevel: requiredScore,
        targetCareer: benchmark?.name || 'Full Stack Developer',
        weight: matchingReq?.weight || 10,
        priority: matchingReq?.priority || 'High',
        gap,
        isVerified,
        isAssessed: isVerified,
        status: isVerified ? (gap === 0 ? 'Verified Ready' : 'Almost Ready') : 'Needs Verification',
        whyItMatters: `Critical competency for ${benchmark?.name || 'modern software engineering'}. Employers evaluate this skill for production reliability.`,
        whatIsTested: `Foundational theory, practical design patterns, syntax, error handling, and performance optimization in ${skillName}.`,
        testCurriculum: [
          `Core architectural concepts and syntax in ${skillName}`,
          `Practical implementation and common design patterns`,
          `Production debugging, error handling and resilience`,
          `Performance optimization and resource efficiency`,
        ],
        attempts,
        improvement: attempts.length > 1 ? (attempts[attempts.length - 1].score - attempts[0].score) : 0,
        assessment: targetAssessment,
        targetAssessment,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getStudentAssessmentHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const rawSkillId = req.params.skillId || (req.query.skillId as any)
    const skillId = rawSkillId ? (Array.isArray(rawSkillId) ? String(rawSkillId[0]) : String(rawSkillId)) : undefined
    const attempts = getAssessmentAttempts(user.id, skillId)

    return res.status(200).json({
      success: true,
      data: attempts,
      count: attempts.length,
    })
  } catch (err) {
    next(err)
  }
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
  {
    id: 'opp-04-modern-frontend',
    title: 'Junior React & Frontend Engineer',
    industry_id: 'ind-04',
    opportunity_type: 'Job',
    location: 'Remote',
    work_mode: 'remote',
    stipend_amount: '₹9,00,000 / year',
    duration: 'Full-Time',
    deadline: '2026-12-31T00:00:00Z',
    status: 'published',
    created_at: '2026-08-20T00:00:00Z',
    industry_profiles: { organization_name: 'Vanguard Digital Labs', location: 'Remote' },
    opportunity_skills: [
      { minimum_level: 75, importance: 'Required', skill_id: '40000000-0000-0000-0000-000000000002', skills: { id: '40000000-0000-0000-0000-000000000002', name: 'React', category: 'Frontend' } },
      { minimum_level: 80, importance: 'Required', skill_id: 'skill-frontend-js', skills: { id: 'skill-frontend-js', name: 'JavaScript', category: 'Frontend' } },
      { minimum_level: 75, importance: 'Required', skill_id: 'skill-frontend-css', skills: { id: 'skill-frontend-css', name: 'CSS', category: 'Frontend' } },
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

    const result = await startAssessment(user.id, id)
    return res.status(200).json({ success: true, data: result })
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
    const resolvedAttemptId = attempt_id || attemptId || `attempt-${Date.now()}`
    if (!Array.isArray(answers)) {
      return res.status(422).json({ success: false, error: 'answers array is required' })
    }

    const result = await submitAssessment(user.id, resolvedAttemptId, id, answers)

    // Mirror to sessionSkills cache
    if (!sessionSkills.has(user.id)) sessionSkills.set(user.id, new Map())
    const userSkills = sessionSkills.get(user.id)!
    const targetSkillId = result.skillId || `skill-${result.assessmentId}`
    const existing = userSkills.get(targetSkillId)
    const priorScore = existing?.verified_level ?? (existing?.verification_status === 'assessment_verified' ? existing.current_level : null)
    if (result.previousScore === null && priorScore !== null) {
      result.previousScore = priorScore
      result.improvement = result.score - priorScore
    }

    const verifiedRecord = {
      id: existing?.id || `ss-${Date.now()}-${targetSkillId}`,
      student_id: user.id,
      skill_id: targetSkillId,
      self_declared_level: existing?.self_declared_level ?? result.score,
      current_level: result.score,
      verified_level: result.score,
      verification_status: 'assessment_verified',
      skills: {
        id: result.skillId,
        name: result.skillName,
        category: 'Technical'
      }
    }
    userSkills.set(targetSkillId, verifiedRecord)

    // Also upgrade any existing matching skill in sessionSkills (e.g. self-declared under benchmark ID or skill name)
    for (const [key, skillRecord] of userSkills.entries()) {
      const matchByName = (skillRecord.skills?.name?.toLowerCase() === result.skillName?.toLowerCase()) ||
                          (skillRecord.skill_name?.toLowerCase() === result.skillName?.toLowerCase())
      if (matchByName) {
        userSkills.set(key, {
          ...skillRecord,
          current_level: result.score,
          verified_level: result.score,
          verification_status: 'assessment_verified',
          skills: {
            ...(skillRecord.skills || {}),
            id: result.skillId,
            name: result.skillName,
            category: 'Technical'
          }
        })
      }
    }

    savePersistentStore()
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) return res.status(200).json({ success: true, data })
      } catch {}
    }

    const userProjects = sessionProjects.get(user.id) || []
    res.status(200).json({ success: true, data: userProjects })
  } catch (err) {
    const userProjects = sessionProjects.get(req.user?.id || '') || []
    res.status(200).json({ success: true, data: userProjects })
  }
}

export async function createStudentProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const newProject = {
      id: body.id || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      student_id: user.id,
      title: body.title || 'Untitled Project',
      description: body.description || '',
      technologies: Array.isArray(body.technologies) ? body.technologies : typeof body.technologies === 'string' ? body.technologies.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      github_url: body.github_url || body.githubUrl || '',
      project_url: body.project_url || body.projectUrl || body.liveUrl || '',
      created_at: new Date().toISOString()
    }

    if (!sessionProjects.has(user.id)) sessionProjects.set(user.id, [])
    const list = sessionProjects.get(user.id)!
    list.unshift(newProject)
    savePersistentStore()

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase.from('projects').insert(newProject)
      } catch {}
    }

    res.status(201).json({ success: true, data: newProject })
  } catch (err) {
    next(err)
  }
}

export async function updateStudentProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const projectId = req.params.id
    const body = req.body || {}

    const list = sessionProjects.get(user.id) || []
    const idx = list.findIndex(p => p.id === projectId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...body, updated_at: new Date().toISOString() }
      savePersistentStore()
    }

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase.from('projects').update(body).eq('id', projectId).eq('student_id', user.id)
      } catch {}
    }

    res.status(200).json({ success: true, message: 'Project updated successfully' })
  } catch (err) {
    next(err)
  }
}

export async function deleteStudentProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const projectId = req.params.id

    const list = sessionProjects.get(user.id) || []
    const filtered = list.filter(p => p.id !== projectId)
    sessionProjects.set(user.id, filtered)
    savePersistentStore()

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase.from('projects').delete().eq('id', projectId).eq('student_id', user.id)
      } catch {}
    }

    res.status(200).json({ success: true, message: 'Project deleted successfully' })
  } catch (err) {
    next(err)
  }
}

export async function getStudentCertifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('certifications')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) return res.status(200).json({ success: true, data })
      } catch {}
    }

    const userCerts = sessionCertifications.get(user.id) || []
    res.status(200).json({ success: true, data: userCerts })
  } catch (err) {
    const userCerts = sessionCertifications.get(req.user?.id || '') || []
    res.status(200).json({ success: true, data: userCerts })
  }
}

export async function createStudentCertification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const body = req.body || {}
    const newCert = {
      id: body.id || `cert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      student_id: user.id,
      name: body.name || 'Certification',
      issuing_organization: body.issuing_organization || body.issuer || 'Issuing Body',
      issue_date: body.issue_date || new Date().toISOString().split('T')[0],
      credential_url: body.credential_url || body.credentialUrl || '',
      created_at: new Date().toISOString()
    }

    if (!sessionCertifications.has(user.id)) sessionCertifications.set(user.id, [])
    const list = sessionCertifications.get(user.id)!
    list.unshift(newCert)
    savePersistentStore()

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase.from('certifications').insert(newCert)
      } catch {}
    }

    res.status(201).json({ success: true, data: newCert })
  } catch (err) {
    next(err)
  }
}

export async function deleteStudentCertification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const certId = req.params.id

    const list = sessionCertifications.get(user.id) || []
    const filtered = list.filter(c => c.id !== certId)
    sessionCertifications.set(user.id, filtered)
    savePersistentStore()

    const supabase = getSupabaseAdmin()
    if (supabase) {
      try {
        await supabase.from('certifications').delete().eq('id', certId).eq('student_id', user.id)
      } catch {}
    }

    res.status(200).json({ success: true, message: 'Certification deleted successfully' })
  } catch (err) {
    next(err)
  }
}

export async function getStudentPassport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required' })

    const supabase = getSupabaseAdmin()
    let dbSkills: any[] = []
    let dbProjects: any[] = []
    let dbCerts: any[] = []
    let dbSettings: any = null

    if (supabase) {
      try {
        const [sRes, pRes, cRes, setRes] = await Promise.all([
          supabase.from('student_skills').select('*, skills(id, name, category)').eq('student_id', user.id),
          supabase.from('projects').select('*').eq('student_id', user.id).order('created_at', { ascending: false }),
          supabase.from('certifications').select('*').eq('student_id', user.id).order('created_at', { ascending: false }),
          supabase.from('passport_settings').select('*').eq('student_id', user.id).maybeSingle()
        ])
        if (sRes.data) dbSkills = sRes.data
        if (pRes.data) dbProjects = pRes.data
        if (cRes.data) dbCerts = cRes.data
        if (setRes.data) dbSettings = setRes.data
      } catch {}
    }

    const memorySkills = sessionSkills.get(user.id) ? Array.from(sessionSkills.get(user.id)!.values()) : []
    const memoryProjects = sessionProjects.get(user.id) || []
    const memoryCerts = sessionCertifications.get(user.id) || []

    const finalSkills = dbSkills.length > 0 ? dbSkills : memorySkills
    const finalProjects = dbProjects.length > 0 ? dbProjects : memoryProjects
    const finalCerts = dbCerts.length > 0 ? dbCerts : memoryCerts

    res.status(200).json({
      success: true,
      data: {
        settings: dbSettings || { share_token: `sp-${user.id.substring(0, 8)}`, is_public: true },
        skills: finalSkills,
        projects: finalProjects,
        certifications: finalCerts,
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

    // Cache in-memory session ratings
    const sessionKey = `${user.id}:${career_target_id}`
    if (!sessionSelfRatings.has(sessionKey)) {
      sessionSelfRatings.set(sessionKey, new Map())
    }
    const userRatingMap = sessionSelfRatings.get(sessionKey)!
    ratings.forEach((r: { skill_id: string; self_rating_label: string }) => {
      userRatingMap.set(r.skill_id, r.self_rating_label)
    })

    const supabase = getSupabaseAdmin()
    let persisted = false
    const isDemoMode =
      req.headers['x-demo-mode'] === 'true' ||
      (typeof user.id === 'string' && user.id.startsWith('demo-'))

    if (!isDemoMode && supabase) {
      try {
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

        if (!error) {
          persisted = true
        } else {
          console.warn('[studentController] Could not persist self-ratings to Supabase table (using session cache):', error.message)
        }
      } catch (err: any) {
        console.warn('[studentController] Error upserting self-ratings to Supabase:', err.message)
      }
    }

    // ─── Groq AI Integration for Self-Rating Narrative Analysis ───
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
        const result = await GroqService.generateText({
          systemInstruction: 'You are a career development mentor for SkillBridge Connect. Give a concise, encouraging 2-sentence narrative summary of the student\'s self-declared baseline profile relative to their target role. Do NOT generate or calculate numerical scores or percentages.',
          userPrompt: promptText,
          temperature: 0.3,
        })
        if (result) {
          insightText = result
        }
      } catch (err) {
        console.warn('[Groq AI] Error in self-rating insight call:', err)
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
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('student_self_ratings')
          .select('skill_id, self_rating_label, updated_at')
          .eq('student_id', user.id)
          .eq('career_target_id', careerTargetId)

        if (!error && data && data.length > 0) {
          return res.status(200).json({ success: true, data })
        }
      } catch {}
    }

    const sessionKey = `${user.id}:${careerTargetId}`
    const userRatingMap = sessionSelfRatings.get(sessionKey)
    if (userRatingMap && userRatingMap.size > 0) {
      const formatted = Array.from(userRatingMap.entries()).map(([skill_id, self_rating_label]) => ({
        skill_id,
        self_rating_label,
        updated_at: new Date().toISOString()
      }))
      return res.status(200).json({ success: true, data: formatted })
    }

    return res.status(200).json({ success: true, data: [] })
  } catch (err) {
    next(err)
  }
}
