import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { getAllCombinedOpportunities } from '@/lib/opportunities-seed'
import { getAllApplications } from '@/lib/database/applications-store'

export interface CandidateSkill {
  name: string
  met: boolean
  currentLevel: number
  requiredLevel: number
}

export interface CandidateInfo {
  id: string
  name: string
  institution: string
}

export interface CandidateOpportunity {
  id: string
  title: string
  type: string
}

export interface CandidateReadiness {
  matchPercentage: number
  readinessCategory: string
  skillsMetCount: number
  totalSkillsCount: number
  mainBlocker: string | null
  skills: CandidateSkill[]
}

export interface CandidateResult {
  applicationId: string
  applicationStatus: string
  appliedAt: string
  candidate: CandidateInfo
  opportunity: CandidateOpportunity
  readiness: CandidateReadiness
}

interface RawIntermediateCandidate {
  applicationId: string
  applicationStatus: string
  appliedAt: string
  candidate: CandidateInfo | null
  opportunity: CandidateOpportunity | null
  readiness: CandidateReadiness | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const oppFilter = searchParams.get('opportunity_id') || ''
    const minMatchStr = searchParams.get('min_match') || '0'
    const minMatch = parseInt(minMatchStr, 10) || 0

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const rawResults: RawIntermediateCandidate[] = []
    const seenAppIds = new Set<string>()

    // 1. Fetch live database applications and join relationships
    try {
      const admin = createSupabaseAdminClient()

      let appQuery = (admin as any)
        .from('applications')
        .select(`
          id,
          opportunity_id,
          student_id,
          status,
          cover_letter,
          created_at,
          updated_at,
          opportunities(
            id,
            title,
            type,
            opportunity_type,
            company_name,
            industry_id
          ),
          profiles:student_id(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (oppFilter) {
        appQuery = appQuery.eq('opportunity_id', oppFilter)
      }

      // If logged in as an industry user, restrict to their opportunities
      if (user?.id) {
        appQuery = appQuery.eq('opportunities.industry_id', user.id)
      }

      const { data: dbApps, error: dbErr } = await appQuery

      if (dbErr) {
        console.warn('[Candidates API] Supabase query warning:', dbErr.message)
      }

      if (dbApps && Array.isArray(dbApps) && dbApps.length > 0) {
        const studentIds = Array.from(new Set(dbApps.map((a: any) => a.student_id).filter(Boolean)))
        const oppIds = Array.from(new Set(dbApps.map((a: any) => a.opportunity_id).filter(Boolean)))

        // Fetch student profiles & institutions
        const { data: studentProfiles } = await (admin as any)
          .from('student_profiles')
          .select(`
            profile_id,
            education,
            institution_id,
            institutions(
              id,
              name
            )
          `)
          .in('profile_id', studentIds)

        const studentProfileMap = new Map<string, { education?: string; institutionName?: string }>()
        if (studentProfiles && Array.isArray(studentProfiles)) {
          studentProfiles.forEach((sp: any) => {
            studentProfileMap.set(sp.profile_id, {
              education: sp.education || undefined,
              institutionName: sp.institutions?.name || sp.education || undefined,
            })
          })
        }

        // Fetch opportunity required skills
        const { data: oppSkills } = await (admin as any)
          .from('opportunity_skills')
          .select(`
            opportunity_id,
            skill_name,
            required_score,
            minimum_level,
            skills(name)
          `)
          .in('opportunity_id', oppIds)

        const oppSkillsMap = new Map<string, { name: string; required: number }[]>()
        if (oppSkills && Array.isArray(oppSkills)) {
          oppSkills.forEach((os: any) => {
            const list = oppSkillsMap.get(os.opportunity_id) || []
            list.push({
              name: os.skill_name || os.skills?.name || 'Skill',
              required: os.required_score || os.minimum_level || 75,
            })
            oppSkillsMap.set(os.opportunity_id, list)
          })
        }

        // Fetch student skills / scores
        const { data: studentSkills } = await (admin as any)
          .from('student_skills')
          .select(`
            student_id,
            verified_score,
            self_rating,
            skills(name)
          `)
          .in('student_id', studentIds)

        const studentScoresMap = new Map<string, Record<string, number>>()
        if (studentSkills && Array.isArray(studentSkills)) {
          studentSkills.forEach((ss: any) => {
            const scores = studentScoresMap.get(ss.student_id) || {}
            const sName = ss.skills?.name
            if (sName) {
              scores[sName] = ss.verified_score || ss.self_rating || 70
            }
            studentScoresMap.set(ss.student_id, scores)
          })
        }

        // Process each database application row
        for (const app of dbApps) {
          const appId = String(app.id)
          seenAppIds.add(appId)

          // Strict validation: Check whether real student profile exists
          const profile = app.profiles
          if (!profile || !profile.id || !profile.full_name) {
            console.warn(`[Candidates API] Skipping application ${appId} with missing/deleted student profile (${app.student_id})`)
            rawResults.push({
              applicationId: appId,
              applicationStatus: app.status || 'applied',
              appliedAt: app.created_at || new Date().toISOString(),
              candidate: null,
              opportunity: null,
              readiness: null,
            })
            continue
          }

          const spInfo = studentProfileMap.get(profile.id)
          const institutionName = spInfo?.institutionName || spInfo?.education || 'SkillBridge Academic Partner'

          const opp = app.opportunities || {}
          const oppId = String(opp.id || app.opportunity_id || '')
          const oppTitle = opp.title || 'Opportunity'
          const oppTypeRaw = opp.type || opp.opportunity_type || 'internship'
          const oppTypeFormatted = oppTypeRaw.charAt(0).toUpperCase() + oppTypeRaw.slice(1)

          // Resolve required skills
          let requiredSkills = oppSkillsMap.get(oppId) || []
          if (requiredSkills.length === 0) {
            const seedOpp = getAllCombinedOpportunities().find(o => o.id === oppId)
            if (seedOpp && seedOpp.requiredSkills) {
              requiredSkills = seedOpp.requiredSkills.map(s => ({
                name: s.name,
                required: s.benchmark,
              }))
            } else {
              requiredSkills = [
                { name: 'Core Problem Solving', required: 75 },
                { name: 'Technical Competency', required: 70 },
              ]
            }
          }

          // Calculate deterministic match against student's verified skills
          const studentScores = studentScoresMap.get(profile.id) || {}
          let totalScoreRatio = 0
          let skillsMetCount = 0
          let mainBlocker: string | null = null

          const skillsBreakdown: CandidateSkill[] = requiredSkills.map(req => {
            const currentLevel = studentScores[req.name] || 75
            const met = currentLevel >= req.required
            if (met) {
              skillsMetCount++
            } else if (!mainBlocker) {
              const gap = req.required - currentLevel
              mainBlocker = `${req.name} (${gap} pts gap)`
            }
            const ratio = Math.min(100, Math.round((currentLevel / req.required) * 100))
            totalScoreRatio += ratio

            return {
              name: req.name,
              met,
              currentLevel,
              requiredLevel: req.required,
            }
          })

          const matchPercentage = requiredSkills.length > 0
            ? Math.round(totalScoreRatio / requiredSkills.length)
            : 80

          const readinessCategory = matchPercentage >= 85
            ? 'High Readiness'
            : matchPercentage >= 70
              ? 'Moderate Readiness'
              : 'Developing'

          rawResults.push({
            applicationId: appId,
            applicationStatus: app.status || 'applied',
            appliedAt: app.created_at || new Date().toISOString(),
            candidate: {
              id: String(profile.id),
              name: String(profile.full_name),
              institution: institutionName,
            },
            opportunity: {
              id: oppId,
              title: oppTitle,
              type: oppTypeFormatted,
            },
            readiness: {
              matchPercentage,
              readinessCategory,
              skillsMetCount,
              totalSkillsCount: requiredSkills.length,
              mainBlocker,
              skills: skillsBreakdown,
            },
          })
        }
      }
    } catch (dbError) {
      console.warn('[Candidates API] Supabase candidates query error:', dbError)
    }

    // 2. Merge in-memory applications store
    const inMemApps = getAllApplications()
    if (inMemApps.length > 0) {
      const allCombinedOpps = getAllCombinedOpportunities()

      for (const memApp of inMemApps) {
        if (seenAppIds.has(memApp.id)) continue
        seenAppIds.add(memApp.id)

        // Filter by opportunity if specified
        if (oppFilter && memApp.opportunity_id !== oppFilter) {
          continue
        }

        // Validate student presence
        if (!memApp.student_id || !memApp.student_name) {
          console.warn(`[Candidates API] Skipping in-memory application ${memApp.id} due to missing student data`)
          continue
        }

        const matchedOpp = allCombinedOpps.find(o => o.id === memApp.opportunity_id)
        const oppTitle = matchedOpp?.title || 'Software Engineering Role'
        const oppTypeFormatted = matchedOpp?.type || 'Internship'
        const reqSkills = matchedOpp?.requiredSkills || [
          { name: 'Core Problem Solving', benchmark: 75, importance: 'Required' as const },
          { name: 'Technical Competency', benchmark: 70, importance: 'Required' as const },
        ]

        let totalScoreRatio = 0
        let skillsMetCount = 0
        let mainBlocker: string | null = null

        const skillsBreakdown: CandidateSkill[] = reqSkills.map(req => {
          const currentLevel = 80
          const met = currentLevel >= req.benchmark
          if (met) {
            skillsMetCount++
          } else if (!mainBlocker) {
            const gap = req.benchmark - currentLevel
            mainBlocker = `${req.name} (${gap} pts gap)`
          }
          const ratio = Math.min(100, Math.round((currentLevel / req.benchmark) * 100))
          totalScoreRatio += ratio

          return {
            name: req.name,
            met,
            currentLevel,
            requiredLevel: req.benchmark,
          }
        })

        const matchPercentage = reqSkills.length > 0
          ? Math.round(totalScoreRatio / reqSkills.length)
          : 85

        const readinessCategory = matchPercentage >= 85
          ? 'High Readiness'
          : matchPercentage >= 70
            ? 'Moderate Readiness'
            : 'Developing'

        rawResults.push({
          applicationId: memApp.id,
          applicationStatus: memApp.status || 'applied',
          appliedAt: memApp.created_at || new Date().toISOString(),
          candidate: {
            id: memApp.student_id,
            name: memApp.student_name,
            institution: 'Dr. Akhilesh Das Gupta Institute of Professional Studies',
          },
          opportunity: {
            id: memApp.opportunity_id,
            title: oppTitle,
            type: oppTypeFormatted,
          },
          readiness: {
            matchPercentage,
            readinessCategory,
            skillsMetCount,
            totalSkillsCount: reqSkills.length,
            mainBlocker,
            skills: skillsBreakdown,
          },
        })
      }
    }

    // 3. Filter out any records with missing/null candidate objects (Rule 4 & 5)
    const validCandidates: CandidateResult[] = rawResults
      .filter((item): item is CandidateResult => {
        return (
          item.candidate !== null &&
          typeof item.candidate.id === 'string' &&
          typeof item.candidate.name === 'string' &&
          item.candidate.name.trim().length > 0 &&
          item.opportunity !== null &&
          item.readiness !== null
        )
      })
      // 4. Apply minimum match percentage filter if requested
      .filter(item => {
        if (minMatch > 0) {
          return item.readiness.matchPercentage >= minMatch
        }
        return true
      })
      // 5. Sort descending by match percentage, then appliedAt
      .sort((a, b) => {
        if (b.readiness.matchPercentage !== a.readiness.matchPercentage) {
          return b.readiness.matchPercentage - a.readiness.matchPercentage
        }
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      })

    return NextResponse.json({
      success: true,
      data: validCandidates,
    })
  } catch (err: any) {
    console.error('[Industry Candidates API Error]:', err)
    return NextResponse.json({
      success: false,
      error: { message: err?.message || 'Failed to fetch candidate discovery data' },
    }, { status: 500 })
  }
}
