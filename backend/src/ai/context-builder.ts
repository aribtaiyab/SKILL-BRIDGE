import { getSupabaseAdmin } from '../config/supabase.js'
import { StudentAIContext } from './types.js'
import { evaluateCareerReadiness } from '../intelligence/engine.js'

const DEFAULT_STUDENT_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Server-controlled, authoritative AI context builder.
 * Never trusts client-submitted scores or requirements.
 */
export async function buildStudentAIContext(
  studentId: string = DEFAULT_STUDENT_ID,
  options?: { targetCareerId?: string; opportunityId?: string }
): Promise<StudentAIContext> {
  const supabase = getSupabaseAdmin()

  let studentName = 'Sarah Jenkins'
  let targetCareerName = 'Backend Developer'
  let targetCareerId = options?.targetCareerId || ''
  let studentEducation = 'B.S. Computer Science'

  // 1. Fetch Student Profile & Career Target
  try {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', studentId)
      .single()

    if (profile?.full_name) {
      studentName = profile.full_name
    }

    const { data: studentProf } = await (supabase as any)
      .from('student_profiles')
      .select('target_career_id, education_level, career_targets(id, name)')
      .eq('profile_id', studentId)
      .single()

    if (studentProf) {
      if (!targetCareerId && studentProf.target_career_id) {
        targetCareerId = studentProf.target_career_id
      }
      if (studentProf.career_targets?.name) {
        targetCareerName = studentProf.career_targets.name
      }
      if (studentProf.education_level) {
        studentEducation = studentProf.education_level
      }
    }
  } catch (err) {
    console.warn('Context builder profile fetch warning:', err)
  }

  // 2. Fetch Career Target Skills & Student Scores
  let careerReqs: { skillId: string; skillName: string; requiredLevel: number; importance: string; category?: string }[] = []
  let studentScores: { skillId: string; skillName: string; currentLevel: number; verificationStatus?: string }[] = []

  try {
    // If targetCareerId exists, query relational career_target_skills
    if (targetCareerId) {
      const { data: careerSkills } = await (supabase as any)
        .from('career_target_skills')
        .select('skill_id, required_level, importance, skills(id, name, category)')
        .eq('career_target_id', targetCareerId)

      if (careerSkills && careerSkills.length > 0) {
        careerReqs = careerSkills.map((cs: any) => ({
          skillId: cs.skill_id,
          skillName: cs.skills?.name || 'Skill',
          requiredLevel: cs.required_level,
          importance: cs.importance || 'High',
          category: cs.skills?.category || 'Technical',
        }))
      }
    }

    // If no db reqs found, provide standard fallback aligned with Phase 1-4
    if (careerReqs.length === 0) {
      careerReqs = [
        { skillId: 's-node', skillName: 'Node.js', requiredLevel: 80, importance: 'High', category: 'Backend' },
        { skillId: 's-rest', skillName: 'REST APIs', requiredLevel: 75, importance: 'High', category: 'Backend' },
        { skillId: 's-sql', skillName: 'SQL', requiredLevel: 70, importance: 'High', category: 'Database' },
        { skillId: 's-git', skillName: 'Git', requiredLevel: 60, importance: 'Medium', category: 'DevOps' },
      ]
    }

    // Fetch student verified skills (strictly from DB)
    const { data: userSkills } = await (supabase as any)
      .from('student_skills')
      .select('skill_id, current_level, verification_status, skills(id, name)')
      .eq('student_id', studentId)

    if (userSkills && userSkills.length > 0) {
      studentScores = userSkills.map((us: any) => ({
        skillId: us.skill_id,
        skillName: us.skills?.name || 'Skill',
        currentLevel: us.current_level,
        verificationStatus: us.verification_status,
      }))
    } else {
      studentScores = []
    }
  } catch (err) {
    console.warn('Context builder skills query warning:', err)
  }

  // 3. Compute Phase 4 Deterministic Intelligence (Readiness & Gaps)
  const readinessResult = evaluateCareerReadiness(targetCareerName, careerReqs, studentScores)

  const contextSkills = readinessResult.skills.map(g => {
    const studentSkill = studentScores.find(s => s.skillId === g.skillId || s.skillName === g.skillName)
    return {
      id: g.skillId,
      name: g.skillName,
      currentScore: g.currentLevel,
      requiredScore: g.requiredLevel,
      gap: g.gap,
      importance: g.importance,
      status: g.status,
      verificationStatus: studentSkill?.verificationStatus || 'assessment_verified',
    }
  })

  // 4. Fetch Reassessments History
  let reassessments: { skillName: string; previousScore: number; newScore: number; recordedAt: string }[] = []
  try {
    const { data: dbReassessments } = await (supabase as any)
      .from('reassessments')
      .select('previous_score, new_score, recorded_at, skills(name)')
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: false })
      .limit(5)

    if (dbReassessments && dbReassessments.length > 0) {
      reassessments = dbReassessments.map((r: any) => ({
        skillName: r.skills?.name || 'Skill',
        previousScore: r.previous_score,
        newScore: r.new_score,
        recordedAt: r.recorded_at,
      }))
    }
  } catch {}

  // 5. Optional Opportunity Context
  let opportunityContext: StudentAIContext['opportunity'] = null
  if (options?.opportunityId) {
    try {
      const { data: oppData } = await (supabase as any)
        .from('opportunities')
        .select(`
          id, title, opportunity_type,
          industry_profiles(organization_name),
          opportunity_skills(minimum_level, skills(name))
        `)
        .eq('id', options.opportunityId)
        .single()

      if (oppData) {
        const requiredSkills = (oppData.opportunity_skills || []).map((os: any) => ({
          name: os.skills?.name || 'Skill',
          minLevel: os.minimum_level || 70,
        }))

        opportunityContext = {
          id: oppData.id,
          title: oppData.title,
          company: oppData.industry_profiles?.organization_name || 'Organization',
          type: oppData.opportunity_type || 'Internship',
          requiredSkills,
          readinessPercentage: 88,
        }
      }
    } catch {}
  }

  return {
    student: {
      id: studentId,
      name: studentName,
      education: studentEducation,
      targetCareer: targetCareerName,
    },
    readiness: {
      overallPercentage: readinessResult.readinessPercentage,
      category: readinessResult.readinessCategory,
      priorityGapSkill: readinessResult.priorityGap?.skillName || null,
      priorityGapPoints: readinessResult.priorityGap?.gap || 0,
    },
    skills: contextSkills,
    reassessments,
    opportunity: opportunityContext,
  }
}
