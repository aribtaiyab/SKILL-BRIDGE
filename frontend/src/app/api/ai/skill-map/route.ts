import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { defaultAIProvider } from '@/lib/ai/provider'

const RequestSchema = z.object({
  text: z.string().min(3).max(1500),
  career_target_id: z.string().optional(),
})

const SkillMappingOutputSchema = z.object({
  skills: z.array(z.object({
    skillId: z.string(),
    skillName: z.string(),
    confidence: z.number().min(0).max(1),
    evidenceFromInput: z.string(),
    suggestedFamiliarity: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  })),
  summary: z.string().default(''),
})

// Canonical skills lexicon for deterministic semantic extraction
const CANONICAL_SKILL_SYNONYMS: Array<{
  id: string
  name: string
  synonyms: string[]
  category: string
}> = [
  {
    id: '40000000-0000-0000-0000-000000000006',
    name: 'React',
    synonyms: ['react', 'react.js', 'reactjs', 'jsx', 'next.js', 'nextjs', 'redux', 'hooks', 'frontend ui'],
    category: 'Frontend Basics',
  },
  {
    id: '40000000-0000-0000-0000-000000000015',
    name: 'JavaScript',
    synonyms: ['javascript', 'js', 'es6', 'typescript', 'ts', 'ecmascript'],
    category: 'Frontend Basics',
  },
  {
    id: '40000000-0000-0000-0000-000000000007',
    name: 'HTML/CSS',
    synonyms: ['html', 'css', 'tailwind', 'bootstrap', 'responsive', 'flexbox', 'grid', 'dom'],
    category: 'Frontend Basics',
  },
  {
    id: '40000000-0000-0000-0000-000000000001',
    name: 'Node.js',
    synonyms: ['node', 'node.js', 'nodejs', 'express', 'express.js', 'backend', 'npm'],
    category: 'Backend & APIs',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    name: 'REST APIs',
    synonyms: ['rest', 'rest api', 'api', 'endpoints', 'crud', 'http', 'json', 'postman', 'swagger'],
    category: 'Backend & APIs',
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    name: 'SQL',
    synonyms: ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'database', 'rdbms', 'queries'],
    category: 'Database & Storage',
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    name: 'Git',
    synonyms: ['git', 'github', 'version control', 'commits', 'pr', 'pull request', 'branches'],
    category: 'Tools & Infrastructure',
  },
  {
    id: '40000000-0000-0000-0000-000000000005',
    name: 'Docker',
    synonyms: ['docker', 'containers', 'dockerfile', 'docker-compose', 'containerization'],
    category: 'Tools & Infrastructure',
  },
  {
    id: '40000000-0000-0000-0000-000000000008',
    name: 'MongoDB',
    synonyms: ['mongodb', 'nosql', 'mongoose', 'document db'],
    category: 'Database & Storage',
  },
  {
    id: '40000000-0000-0000-0000-000000000012',
    name: 'Python',
    synonyms: ['python', 'py', 'pandas', 'numpy', 'django', 'flask', 'fastapi'],
    category: 'Technical',
  },
  {
    id: '40000000-0000-0000-0000-000000000013',
    name: 'REST API Security',
    synonyms: ['jwt', 'auth', 'authentication', 'authorization', 'cors', 'tokens', 'oauth'],
    category: 'Backend & APIs',
  },
  {
    id: '40000000-0000-0000-0000-000000000014',
    name: 'System Design Basics',
    synonyms: ['system design', 'microservices', 'caching', 'load balancer', 'scalability', 'architecture'],
    category: 'Technical',
  },
]

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = RequestSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input. Please provide a description between 3 and 1500 characters.',
      }, { status: 400 })
    }

    const { text, career_target_id } = parsed.data
    const normalizedInput = text.toLowerCase()

    // 1. Fetch available canonical skills from DB if possible
    let availableSkills = CANONICAL_SKILL_SYNONYMS
    try {
      const supabase = await createSupabaseServerClient()
      const { data: dbSkills } = await (supabase as any)
        .from('skills')
        .select('id, name, slug, category')
        .eq('is_active', true)

      if (dbSkills && dbSkills.length > 0) {
        // augment canonical list with any database IDs
        availableSkills = dbSkills.map((dbs: any) => {
          const match = CANONICAL_SKILL_SYNONYMS.find(s => s.name.toLowerCase() === dbs.name.toLowerCase())
          return {
            id: dbs.id,
            name: dbs.name,
            category: dbs.category || 'Technical',
            synonyms: match ? match.synonyms : [dbs.name.toLowerCase()],
          }
        })
      }
    } catch {
      // Use built-in lexicon
    }

    // 2. Perform semantic keyword extraction & confidence scoring
    const detectedSkills: z.infer<typeof SkillMappingOutputSchema>['skills'] = []

    for (const skill of availableSkills) {
      for (const syn of skill.synonyms) {
        // Check for boundary match
        const regex = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (regex.test(normalizedInput)) {
          // Find matching snippet in input
          const matchIndex = normalizedInput.indexOf(syn)
          const start = Math.max(0, matchIndex - 20)
          const end = Math.min(text.length, matchIndex + syn.length + 30)
          const snippet = text.slice(start, end).trim()

          // Calculate confidence based on term prominence and context
          let confidence = 0.85
          if (normalizedInput.includes(`built with ${syn}`) || normalizedInput.includes(`using ${syn}`) || normalizedInput.includes(`experienced in ${syn}`)) {
            confidence = 0.95
          } else if (normalizedInput.includes(`learned ${syn}`) || normalizedInput.includes(`basic ${syn}`)) {
            confidence = 0.75
          }

          let familiarity: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
          if (normalizedInput.includes(`advanced ${syn}`) || normalizedInput.includes(`production ${syn}`) || normalizedInput.includes(`architected ${syn}`)) {
            familiarity = 'advanced'
          } else if (normalizedInput.includes(`beginner ${syn}`) || normalizedInput.includes(`basic ${syn}`) || normalizedInput.includes(`learning ${syn}`)) {
            familiarity = 'beginner'
          }

          detectedSkills.push({
            skillId: skill.id,
            skillName: skill.name,
            confidence,
            evidenceFromInput: snippet ? `"...${snippet}..."` : `Demonstrated familiarity with ${skill.name}`,
            suggestedFamiliarity: familiarity,
          })
          break // match one synonym per skill
        }
      }
    }

    // Deduplicate by skillId
    const uniqueMap = new Map<string, typeof detectedSkills[0]>()
    detectedSkills.forEach(s => uniqueMap.set(s.skillId, s))
    const finalSkills = Array.from(uniqueMap.values())

    const result = {
      skills: finalSkills,
      summary: finalSkills.length > 0
        ? `SkillBridge AI detected ${finalSkills.length} canonical skills in your experience description.`
        : 'No specific canonical technical skills detected. Please select your skills directly from the list below.',
    }

    const validated = SkillMappingOutputSchema.parse(result)

    return NextResponse.json({
      success: true,
      data: validated,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error processing AI skill mapping',
    }, { status: 500 })
  }
}
