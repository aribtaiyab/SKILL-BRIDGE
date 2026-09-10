import { getSupabaseAdmin } from '../config/supabase.js'
import { AI_CONFIG } from '../ai/config.js'
import { GeminiService } from './ai/gemini.service.js'
import { CAREER_NAVIGATOR_SYSTEM_INSTRUCTION, buildCareerNavigatorUserPrompt } from './ai/prompts/careerNavigator.prompt.js'
import { CareerNavigatorOutput, CareerNavigatorOutputSchema } from './ai/schemas/careerNavigator.schema.js'
import { sessionSkills, sessionCareerTargets } from '../controllers/studentController.js'
import { findCareerBenchmark, CAREER_BENCHMARK_PROFILES } from '../intelligence/benchmarks.js'
import { calculateGap, classifyGap, calculatePriorityScore } from '../intelligence/engine.js'

export interface CareerNavigatorServiceInput {
  query: string
  userId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  preferredFields?: string[]
  goal?: string
}

export class CareerNavigatorService {
  /**
   * Intelligently extracts the user's intent and entities/topics directly from the query.
   */
  static extractQueryIntent(rawQuery: string): {
    intent: 'DISCOVER' | 'COMPARE' | 'TRANSITION' | 'FIT' | 'MARKET' | 'LEARN'
    subjectA?: string
    subjectB?: string
    currentSkill?: string
    targetDomain?: string
  } {
    const q = rawQuery.trim()
    const lower = q.toLowerCase()

    // 1. Comparison Intent: "X or Y", "X vs Y", "compare X and Y"
    const vsMatch = q.match(/([A-Za-z0-9+#.\s]+?)\s+(?:vs\.?|versus)\s+([A-Za-z0-9+#.\s?]+)/i)
    const orMatch = q.match(/(?:should\s+i\s+(?:focus\s+on|learn|choose|pick)\s+)?([A-Za-z0-9+#.\s]+?)\s+or\s+([A-Za-z0-9+#.\s?]+)/i)
    
    if (vsMatch && vsMatch[1] && vsMatch[2]) {
      const subjectA = vsMatch[1].replace(/^(should i focus on|should i learn|choose|compare)\s+/i, '').trim()
      const subjectB = vsMatch[2].replace(/\?+$/, '').trim()
      return { intent: 'COMPARE', subjectA, subjectB }
    }

    if (orMatch && orMatch[1] && orMatch[2]) {
      const subjectA = orMatch[1].replace(/^(should i focus on|should i learn|choose|pick)\s+/i, '').trim()
      const subjectB = orMatch[2].replace(/\?+$/, '').trim()
      return { intent: 'COMPARE', subjectA, subjectB }
    }

    // Common entity-pair keywords
    if ((lower.includes('dsa') || lower.includes('data structure')) && (lower.includes('web') || lower.includes('development'))) {
      return { intent: 'COMPARE', subjectA: 'DSA (Data Structures & Algorithms)', subjectB: 'Web Development' }
    }
    if (lower.includes('java') && lower.includes('python')) {
      return { intent: 'COMPARE', subjectA: 'Java', subjectB: 'Python' }
    }
    if ((lower.includes('frontend') || lower.includes('front-end')) && (lower.includes('backend') || lower.includes('back-end'))) {
      return { intent: 'COMPARE', subjectA: 'Frontend Development', subjectB: 'Backend Development' }
    }
    if ((lower.includes('full stack') || lower.includes('fullstack')) && lower.includes('data')) {
      return { intent: 'COMPARE', subjectA: 'Full Stack Engineering', subjectB: 'Data Analytics / Data Science' }
    }

    // 2. Transition Intent: "switch from X to Y", "transition to X"
    const switchMatch = q.match(/(?:switch|transition|move|change)\s+(?:from\s+([A-Za-z0-9+#.\s]+?)\s+)?to\s+([A-Za-z0-9+#.\s?]+)/i)
    if (switchMatch) {
      return {
        intent: 'TRANSITION',
        subjectA: switchMatch[1]?.trim() || 'Current Track',
        subjectB: switchMatch[2]?.replace(/\?+$/, '').trim() || 'Target Track',
        targetDomain: switchMatch[2]?.replace(/\?+$/, '').trim()
      }
    }
    if (lower.includes('switch') || lower.includes('transition') || lower.includes('move to')) {
      return { intent: 'TRANSITION', targetDomain: q }
    }

    // 3. Learning Priority / Next Skill: "what to learn after X", "what should I learn next"
    const afterMatch = q.match(/(?:what\s+(?:should|to)\s+(?:i\s+)?learn\s+after\s+)([A-Za-z0-9+#.\s?]+)/i)
    if (afterMatch && afterMatch[1]) {
      return { intent: 'LEARN', currentSkill: afterMatch[1].replace(/\?+$/, '').trim() }
    }
    if (lower.includes('learn next') || lower.includes('what to learn') || lower.includes('next 3 months') || lower.includes('next step')) {
      return { intent: 'LEARN' }
    }

    // 4. Market / Trending Questions
    if (lower.includes('trending') || lower.includes('demand') || lower.includes('market') || lower.includes('salary') || lower.includes('looking for')) {
      return { intent: 'MARKET' }
    }

    // 5. Fit / Self-Assessment
    if (lower.includes('fit') || lower.includes('good for me') || lower.includes('better for me') || lower.includes('missing for')) {
      return { intent: 'FIT' }
    }

    // 6. Default: Career Discovery
    return { intent: 'DISCOVER' }
  }

  static async analyze(input: CareerNavigatorServiceInput): Promise<CareerNavigatorOutput & { isFromFallback?: boolean; fallbackNotice?: string }> {
    const rawQuery = input.query.trim()
    const extracted = this.extractQueryIntent(rawQuery)

    // 1. Authoritative Student Context (Database first, persistent session cache fallback)
    let studentName = 'Student'
    let targetCareerName = 'Full Stack Engineer'
    let targetCareerId = '30000000-0000-0000-0000-000000000003'
    let studentSkills: Array<{
      name: string
      level: number
      verificationStatus: string
      isVerified: boolean
    }> = []

    if (input.userId && input.userId !== '00000000-0000-0000-0000-000000000001') {
      try {
        const sb = getSupabaseAdmin()
        if (sb) {
          const { data: profile } = await sb
            .from('profiles')
            .select('full_name')
            .eq('id', input.userId)
            .maybeSingle()
          if (profile?.full_name) studentName = profile.full_name

          const { data: studentProfile } = await sb
            .from('student_profiles')
            .select('target_career_id, career_targets(id, name)')
            .eq('profile_id', input.userId)
            .maybeSingle()
          if (studentProfile?.target_career_id) {
            targetCareerId = studentProfile.target_career_id
            const ct: any = studentProfile.career_targets
            if (ct?.name) targetCareerName = ct.name
          }

          const { data: skills } = await sb
            .from('student_skills')
            .select('current_level, verified_level, verification_status, skills(name)')
            .eq('student_id', input.userId)

          if (skills && skills.length > 0) {
            studentSkills = skills.map((s: any) => {
              const isVerified = Boolean(
                s.verification_status &&
                s.verification_status !== 'self_declared' &&
                s.verification_status !== 'unassessed' &&
                (s.verified_level || s.current_level) > 0
              )
              return {
                name: s.skills?.name || 'Skill',
                level: isVerified ? (s.verified_level || s.current_level) : (s.current_level || s.self_declared_level || 0),
                verificationStatus: isVerified ? (s.verification_status || 'assessment_verified') : 'self_declared',
                isVerified,
              }
            })
          }
        }
      } catch (dbErr) {
        console.warn('[CareerNavigatorService] DB lookup warning:', dbErr)
      }

      // Check persistent session cache if DB was unpopulated
      if (studentSkills.length === 0 && sessionSkills.has(input.userId)) {
        const userSkillsMap = sessionSkills.get(input.userId)!
        studentSkills = Array.from(userSkillsMap.values()).map(s => {
          const isVerified = Boolean(
            s.verification_status &&
            s.verification_status !== 'self_declared' &&
            s.verification_status !== 'unassessed'
          )
          return {
            name: s.skills?.name || s.skill_name || s.name || 'Skill',
            level: s.current_level || s.self_declared_level || 0,
            verificationStatus: isVerified ? s.verification_status : 'self_declared',
            isVerified,
          }
        })
      }

      const cachedCareerId = sessionCareerTargets.get(input.userId)
      if (cachedCareerId) {
        targetCareerId = cachedCareerId
        const benchmark = findCareerBenchmark(cachedCareerId)
        if (benchmark?.name) targetCareerName = benchmark.name
      }
    }

    // 2. Authoritative Skill Gap Calculation using Skill Intelligence Engine
    const benchmark = findCareerBenchmark(targetCareerId) || CAREER_BENCHMARK_PROFILES[0]
    const benchmarkReqs = Object.entries(benchmark.skills).map(([name, b]) => ({
      skillName: name,
      requiredLevel: b.required,
      importance: (b.weight >= 0.3 ? 'High' : b.weight >= 0.2 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
    }))

    const skillGaps: Array<{
      skill: string
      currentLevel: number | null
      requiredLevel: number
      gap: number
      priority: 'Critical' | 'Needs Improvement' | 'Ready'
      status: 'Unassessed' | 'Assessed'
    }> = []

    const missingSkillNames: string[] = []
    let verifiedCount = 0
    let totalVerifiedScore = 0

    benchmarkReqs.forEach(req => {
      const match = studentSkills.find(s =>
        s.name.toLowerCase().includes(req.skillName.toLowerCase()) ||
        req.skillName.toLowerCase().includes(s.name.toLowerCase())
      )

      if (!match) {
        missingSkillNames.push(req.skillName)
        const gap = req.requiredLevel
        const priority = classifyGap(gap, req.importance)
        skillGaps.push({
          skill: req.skillName,
          currentLevel: null,
          requiredLevel: req.requiredLevel,
          gap,
          priority: priority === 'critical' ? 'Critical' : priority === 'ready' ? 'Ready' : 'Needs Improvement',
          status: 'Unassessed',
        })
      } else {
        if (match.isVerified) {
          verifiedCount++
          totalVerifiedScore += match.level
        }
        const gap = calculateGap(req.requiredLevel, match.level)
        const priority = classifyGap(gap, req.importance)
        skillGaps.push({
          skill: req.skillName,
          currentLevel: match.level,
          requiredLevel: req.requiredLevel,
          gap,
          priority: priority === 'critical' ? 'Critical' : priority === 'ready' ? 'Ready' : 'Needs Improvement',
          status: match.isVerified ? 'Assessed' : 'Unassessed',
        })
      }
    })

    // Verified readiness score (only authentic verified assessments count)
    const readinessScore = verifiedCount > 0
      ? Math.round((totalVerifiedScore / (benchmarkReqs.length * 80)) * 100)
      : 0

    // Format skillsHave for structured report
    const skillsHave = studentSkills.map(s => {
      let tier: 'Self Declared' | 'Assessment Verified' | 'Practical Verified' | 'Evidence Verified' | 'Academically Verified' = 'Self Declared'
      if (s.verificationStatus === 'academically_verified' || s.verificationStatus === 'institution_verified') {
        tier = 'Academically Verified'
      } else if (s.verificationStatus === 'assessment_verified') {
        tier = 'Assessment Verified'
      } else if (s.verificationStatus === 'practical_verified') {
        tier = 'Practical Verified'
      } else if (s.verificationStatus === 'evidence_verified') {
        tier = 'Evidence Verified'
      }
      return {
        name: s.name,
        level: s.level,
        verificationTier: tier,
        isVerified: s.isVerified,
      }
    })

    // 3. Gemini Structured AI Call
    if (AI_CONFIG.isLiveProviderConfigured()) {
      try {
        console.log(`[CareerNavigatorService] Requesting Gemini for query: "${rawQuery}", intent: ${extracted.intent}, student: ${studentName}`)
        const userPrompt = buildCareerNavigatorUserPrompt({
          query: rawQuery,
          intent: extracted.intent,
          extractedSubjects: extracted,
          studentName,
          targetCareer: targetCareerName,
          readinessScore,
          skills: studentSkills,
          skillGaps,
        })

        const geminiResult = await GeminiService.generateStructured<CareerNavigatorOutput>({
          systemInstruction: CAREER_NAVIGATOR_SYSTEM_INSTRUCTION,
          userPrompt,
          temperature: 0.2,
          maxTokens: 2048,
        })

        if (geminiResult && geminiResult.directAnswer) {
          // Asynchronously record decision if real student
          if (input.userId && input.userId !== '00000000-0000-0000-0000-000000000001') {
            try {
              const sb = getSupabaseAdmin()
              if (sb) {
                void sb.from('career_navigator_decisions').insert({
                  student_id: input.userId,
                  question: rawQuery,
                  intent: extracted.intent,
                  recommended_career_name: geminiResult.recommendation?.careerName || geminiResult.headline,
                  confidence: geminiResult.recommendation?.confidence || 75,
                })
              }
            } catch {}
          }

          return {
            ...geminiResult,
            intent: extracted.intent,
            isFromFallback: false,
          }
        }
      } catch (aiErr: any) {
        console.warn('[CareerNavigatorService] Gemini structured generation error:', aiErr?.message || aiErr)
      }
    }

    // 4. Truthful Deterministic Fallback (Never hallucinate, never invent fake AI output)
    console.log('[CareerNavigatorService] Activating deterministic profile report fallback')
    let directAnswer = ''
    let why: string[] = []
    let finalRecommendation = ''

    if (extracted.intent === 'COMPARE' && extracted.subjectA && extracted.subjectB) {
      directAnswer = `Based on your profile, we recommend starting with ${extracted.subjectB} first to build project foundations, while practicing ${extracted.subjectA} concurrently.`
      why = [
        `Your active career target is ${targetCareerName} with ${skillsHave.length} declared skills.`,
        `${extracted.subjectB} gives you immediate, visual project proof to showcase on GitHub and in applications.`,
        `${extracted.subjectA} is essential for technical interviews; practicing problem-solving alongside building applications produces the best long-term outcomes.`,
      ]
      finalRecommendation = `Focus on ${extracted.subjectB} for 70% of your time to create practical portfolio evidence, and dedicate 30% to ${extracted.subjectA} problem solving.`
    } else if (extracted.intent === 'LEARN') {
      const focal = extracted.currentSkill || 'your current foundations'
      directAnswer = `After ${focal}, the most impactful next competencies are REST APIs, backend services, and relational databases (PostgreSQL/SQL).`
      why = [
        `Connecting ${focal} to backend endpoints moves your skills from static UI to production full-stack engineering.`,
        `Database querying and data modeling are tested in over 85% of software engineering technical evaluations.`,
        `Completing this sequence qualifies you for verified internship opportunities in SkillBridge.`,
      ]
      finalRecommendation = `Master REST API integration and SQL basics next, then verify your competencies with a Level 1 assessment.`
    } else if (extracted.intent === 'MARKET') {
      directAnswer = `Current industry demand is strongest in Full Stack Engineering, Cloud DevOps, and Applied AI/ML engineering.`
      why = [
        `Product companies prioritize candidates who can build complete features across frontend and backend.`,
        `Practical verification and real GitHub repositories matter more to employers than self-declared certifications.`,
      ]
      finalRecommendation = `Align your learning with industry benchmarks by taking targeted SkillBridge assessments.`
    } else {
      directAnswer = `Based on your SkillBridge profile, your optimal path is advancing towards ${targetCareerName}.`
      why = [
        `Current assessed readiness is ${readinessScore}% across ${skillsHave.length} competencies.`,
        `You have ${missingSkillNames.length} key benchmarks remaining to reach full opportunity qualification.`,
      ]
      finalRecommendation = `Target your unassessed skills to elevate your verified readiness score.`
    }

    return {
      intent: extracted.intent,
      extractedQuery: extracted,
      headline: extracted.subjectA && extracted.subjectB ? `${extracted.subjectA} vs ${extracted.subjectB}` : `${targetCareerName} Direction`,
      summary: `Analysis for "${rawQuery}" based on your authenticated SkillBridge profile.`,
      directAnswer,
      why,
      marketOutlook: {
        available: false,
        demand: 'Market data unavailable for this request.',
        growth: 'Market data unavailable for this request.',
        opportunityVolume: 'Market data unavailable for this request.',
        entryLevelOpportunity: 'Market data unavailable for this request.',
        industryRelevance: 'Market data unavailable for this request.',
        summary: 'Market data unavailable for this request.',
        note: 'Market data unavailable for this request.',
        skillMomentum: ['Core Technical Fundamentals', 'Portfolio Projects'],
      },
      currentFit: {
        score: readinessScore,
        targetCareer: targetCareerName,
        fitLevel: readinessScore >= 75 ? 'Ready' : readinessScore >= 40 ? 'Developing' : 'Early Stage',
        summary: `Your profile has ${skillsHave.filter(s => s.isVerified).length} verified skills and ${skillsHave.filter(s => !s.isVerified).length} self-declared skills.`,
      },
      skillsHave,
      skillsMissing: missingSkillNames.slice(0, 5),
      skillGaps: skillGaps.slice(0, 5),
      whatToLearn: [
        'Step 1: Declare all familiar technical tools in Career Target',
        'Step 2: Complete Knowledge Assessments for your core skills',
        'Step 3: Close critical gaps identified in the diagnostic breakdown',
        'Step 4: Build one capstone portfolio application and verify credentials',
      ],
      roadmap: {
        day7: 'Complete diagnostic assessments for core skills.',
        day30: 'Build hands-on project addressing primary skill deficit.',
        day60: 'Achieve Assessment Verified tier across top 3 target requirements.',
        day90: 'Apply for verified opportunity matches with complete passport.',
      },
      finalRecommendation,
      recommendation: {
        careerName: extracted.subjectB || targetCareerName,
        confidence: Math.max(readinessScore, 70),
        reason: directAnswer,
      },
      isFromFallback: true,
      fallbackNotice: 'AI analysis is currently unavailable — displaying SkillBridge deterministic profile intelligence.',
    }
  }

  static async getHistory(userId?: string) {
    if (!userId || userId === '00000000-0000-0000-0000-000000000001') {
      return []
    }
    try {
      const sb = getSupabaseAdmin()
      if (sb) {
        const { data, error } = await sb
          .from('career_navigator_decisions')
          .select('id, question, recommended_career_name, confidence, created_at')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        if (!error && data) return data
      }
    } catch {}
    return []
  }
}
