import { NextRequest, NextResponse } from 'next/server'
import { getAllCombinedOpportunities, addDynamicOpportunity, calculateOpportunityMatch, OpportunityItem } from '@/lib/opportunities-seed'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'

interface SkillInput {
  name?: string
  skill_name?: string
  level?: number
  required_score?: number
}

/**
 * Optional AI Match Enhancement via Groq
 */
async function calculateGroqAiMatch(
  jobDescription: string,
  requiredSkills: Array<{ name: string; score: number }>,
  studentSkills: Record<string, number>
): Promise<{ matchScore: number; matchReason: string } | null> {
  const apiKey = (process.env.GROQ_API_KEY || '').trim()
  if (!apiKey) return null

  const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

  const prompt = `Analyze how well a student matches a job opportunity.
Job Description: "${jobDescription}"
Required Skills: ${JSON.stringify(requiredSkills)}
Student's Current Skills: ${JSON.stringify(studentSkills)}

Return ONLY a valid JSON object matching:
{
  "matchScore": <number between 0 and 100>,
  "matchReason": "<1-2 sentence concise explanation of why the student matches or what gap exists>"
}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)
    if (typeof parsed.matchScore === 'number' && typeof parsed.matchReason === 'string') {
      return {
        matchScore: Math.min(100, Math.max(0, Math.round(parsed.matchScore))),
        matchReason: parsed.matchReason.trim(),
      }
    }
  } catch {
    // Non-fatal fallback
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const typeFilter = searchParams.get('type')
    const searchFilter = searchParams.get('search')?.toLowerCase()
    const workModeFilter = searchParams.get('work_mode') || searchParams.get('work_setting')

    // Baseline student verified skills (fallback if student table not populated)
    const studentScores: Record<string, number> = {
      "Node.js": 80,
      "REST APIs": 75,
      "SQL": 82,
      "PostgreSQL": 78,
      "Git & Version Control": 75,
      "Git": 75,
      "React.js": 60,
      "React": 60,
      "HTML": 80,
      "CSS": 80,
      "JavaScript": 85,
      "Java": 75,
      "Java/C++": 75,
      "C++": 70,
      "DSA": 80,
      "Data Structures": 80,
      "Algorithms": 75,
      "Problem Solving": 75,
      "OOP": 75,
      "Docker": 50,
      "Linux": 65,
      "Python / Pandas": 70,
      "Python": 75,
      "Machine Learning": 60,
      "Linear Algebra": 65,
      "NumPy": 65,
      "Excel": 75,
      "Communication": 75,
    }

    let allOpps = getAllCombinedOpportunities()

    // 1. Fetch live opportunities from Supabase with opportunity_skills
    try {
      const supabase = await createSupabaseServerClient()
      
      // Try fetching student's actual skills if logged in
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: studentSkillsData } = await (supabase as any)
            .from('student_skills')
            .select('skills(name), verified_score, self_score')
            .eq('student_id', user.id)

          if (studentSkillsData && studentSkillsData.length > 0) {
            studentSkillsData.forEach((ss: any) => {
              const skillName = ss.skills?.name
              if (skillName) {
                studentScores[skillName] = ss.verified_score || ss.self_score || 70
              }
            })
          }
        }
      } catch {
        // Use default student baseline
      }

      // Query both opportunities schema variants for max compatibility
      const { data: dbOpps } = await (supabase as any)
        .from('opportunities')
        .select(`
          id,
          title,
          company_name,
          description,
          type,
          opportunity_type,
          location,
          work_setting,
          work_mode,
          duration,
          deadline,
          status,
          created_at,
          opportunity_skills(
            id,
            skill_name,
            required_score
          )
        `)
        .or('status.eq.published,status.is.null')
        .order('created_at', { ascending: false })

      if (dbOpps && dbOpps.length > 0) {
        const mappedDbOpps: OpportunityItem[] = dbOpps.map((o: any) => {
          const oppType = (o.type || o.opportunity_type || 'internship').toLowerCase()
          const oppTypeFormatted = oppType === 'internship' ? 'Internship' : oppType === 'mentorship' ? 'Mentorship' : oppType === 'training' ? 'Training' : 'Job'
          const workModeVal = (o.work_setting || o.work_mode || 'hybrid').toLowerCase()

          const skillsArray: Array<{ name: string; benchmark: number; importance: 'Required' | 'Preferred' }> =
            Array.isArray(o.opportunity_skills) && o.opportunity_skills.length > 0
              ? o.opportunity_skills.map((os: any) => ({
                  name: os.skill_name || 'Core Skill',
                  benchmark: os.required_score || 70,
                  importance: 'Required' as const,
                }))
              : [
                  { name: 'Node.js', benchmark: 75, importance: 'Required' as const },
                  { name: 'REST APIs', benchmark: 70, importance: 'Required' as const },
                ]

          return {
            id: String(o.id),
            title: o.title || 'Software Engineering Role',
            company: o.company_name || 'Enterprise Partner',
            type: oppTypeFormatted as any,
            location: o.location || 'Remote',
            workMode: workModeVal as any,
            duration: o.duration || '6 Months',
            deadline: o.deadline ? o.deadline.split('T')[0] : '2026-12-31',
            deadlineLabel: o.deadline ? new Date(o.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling',
            description: o.description || '',
            requiredSkills: skillsArray,
          }
        })

        // Merge DB opportunities on top of local seed items
        const existingIds = new Set(allOpps.map(o => o.id))
        mappedDbOpps.forEach(m => {
          if (!existingIds.has(m.id)) {
            allOpps.unshift(m)
          }
        })
      }
    } catch (dbErr) {
      console.warn('[Opportunities API] Supabase fetch fallback to in-memory store:', dbErr)
    }

    let filtered = allOpps

    if (typeFilter && typeFilter !== 'All' && typeFilter !== 'All Types') {
      filtered = filtered.filter(opp =>
        opp.type.toLowerCase() === typeFilter.toLowerCase()
      )
    }

    if (workModeFilter && workModeFilter !== 'all') {
      filtered = filtered.filter(opp =>
        opp.workMode.toLowerCase() === workModeFilter.toLowerCase()
      )
    }

    if (searchFilter) {
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(searchFilter) ||
        opp.company.toLowerCase().includes(searchFilter) ||
        opp.description.toLowerCase().includes(searchFilter)
      )
    }

    const results = filtered.map(opp => {
      const match = calculateOpportunityMatch(opp, studentScores)
      return {
        id: opp.id,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        location: opp.location,
        workMode: opp.workMode,
        stipend: opp.stipend,
        duration: opp.duration,
        deadline: opp.deadline,
        deadlineLabel: opp.deadlineLabel,
        description: opp.description,
        matchPercentage: match.matchPercentage,
        skillsMetCount: match.skillsMetCount,
        totalSkillsCount: match.totalSkillsCount,
        mainBlocker: match.mainBlocker,
        skills: match.skills,
        isSaved: false,
        hasApplied: false,
      }
    })

    // Sort descending by match percentage
    results.sort((a, b) => b.matchPercentage - a.matchPercentage)

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (err: any) {
    console.error('[Opportunities API GET Error]:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to fetch opportunities',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company_name,
      company,
      title,
      description,
      type = 'internship',
      location = 'Remote',
      work_setting,
      work_mode,
      duration = '6 Months',
      deadline,
      application_deadline,
      stipend,
      skills = [],
    } = body

    const finalTitle = (title || '').trim()
    const finalDescription = (description || '').trim()
    const finalCompany = (company_name || company || 'TechNova Solutions').trim()
    const finalWorkSetting = (work_setting || work_mode || 'hybrid').toLowerCase()
    const finalDeadline = deadline || application_deadline || null

    if (!finalTitle || !finalDescription) {
      return NextResponse.json({
        success: false,
        error: 'Title and description are required',
      }, { status: 400 })
    }

    const oppTypeFormatted = type === 'internship' ? 'Internship' : type === 'mentorship' ? 'Mentorship' : type === 'training' ? 'Training' : 'Job'

    // Format skills array
    const rawSkills: SkillInput[] = Array.isArray(skills) ? skills : []
    const parsedSkills = rawSkills.map(s => {
      const name = (typeof s === 'string' ? s : s.skill_name || s.name || 'Technical Skill').trim()
      const score = typeof s === 'object' && s !== null
        ? Number(s.required_score || s.level || 70)
        : 70
      return { skill_name: name, required_score: score }
    })

    const finalSkillsList = parsedSkills.length > 0
      ? parsedSkills
      : [
          { skill_name: 'Node.js', required_score: 80 },
          { skill_name: 'REST APIs', required_score: 75 },
        ]

    let newOpportunityId = `opp-${Date.now()}`

    // 1. Insert into Supabase
    try {
      const admin = createSupabaseAdminClient()
      
      const insertPayload: Record<string, any> = {
        company_name: finalCompany,
        title: finalTitle,
        type: type.toLowerCase(),
        location,
        work_setting: finalWorkSetting,
        duration: duration || '6 Months',
        deadline: finalDeadline ? new Date(finalDeadline).toISOString() : null,
        description: finalDescription,
        status: 'published',
      }

      const { data: createdOpp, error: oppError } = await (admin as any)
        .from('opportunities')
        .insert(insertPayload)
        .select('id')
        .single()

      if (!oppError && createdOpp?.id) {
        newOpportunityId = String(createdOpp.id)

        // Insert required skills
        const skillsPayload = finalSkillsList.map(s => ({
          opportunity_id: createdOpp.id,
          skill_name: s.skill_name,
          required_score: s.required_score,
        }))

        await (admin as any).from('opportunity_skills').insert(skillsPayload)
      } else if (oppError) {
        console.warn('[Opportunities API] Supabase opportunity insert error, maintaining fallback:', oppError.message)
      }
    } catch (supabaseErr: any) {
      console.warn('[Opportunities API] Supabase connection error:', supabaseErr.message)
    }

    // 2. Keep in-memory store synchronized for instant UI availability
    const newSeedItem: OpportunityItem = {
      id: newOpportunityId,
      title: finalTitle,
      company: finalCompany,
      type: oppTypeFormatted as any,
      location,
      workMode: finalWorkSetting as any,
      stipend: stipend ? `$${stipend}/mo` : undefined,
      duration: duration || '6 Months',
      deadline: finalDeadline ? String(finalDeadline).split('T')[0] : '2026-12-31',
      deadlineLabel: finalDeadline ? new Date(finalDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling',
      description: finalDescription,
      requiredSkills: finalSkillsList.map(s => ({
        name: s.skill_name,
        benchmark: s.required_score,
        importance: 'Required' as const,
      })),
    }

    addDynamicOpportunity(newSeedItem)

    return NextResponse.json({
      success: true,
      data: {
        id: newOpportunityId,
        title: finalTitle,
        company: finalCompany,
        message: 'Opportunity published successfully',
      },
    })
  } catch (err: any) {
    console.error('[Opportunities API POST Error]:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to create opportunity',
    }, { status: 500 })
  }
}

