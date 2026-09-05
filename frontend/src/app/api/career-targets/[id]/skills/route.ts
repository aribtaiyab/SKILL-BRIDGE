import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export interface CareerSkillRequirementResponse {
  skillId: string
  skillName: string
  slug: string
  category: string
  description?: string | null
  requiredLevel: number
  importance: 'High' | 'Medium' | 'Low' | string
}

// Canonical fallback skill metadata mapping
const CANONICAL_SKILL_META: Record<string, { id: string; slug: string; category: string; description: string }> = {
  'Node.js': {
    id: '40000000-0000-0000-0000-000000000001',
    slug: 'nodejs',
    category: 'Backend & APIs',
    description: 'JavaScript runtime for server-side event-driven applications',
  },
  'REST APIs': {
    id: '40000000-0000-0000-0000-000000000002',
    slug: 'rest-apis',
    category: 'Backend & APIs',
    description: 'Designing scalable, secure, and standardized RESTful endpoints',
  },
  'SQL': {
    id: '40000000-0000-0000-0000-000000000003',
    slug: 'sql-postgres',
    category: 'Database & Storage',
    description: 'Relational database schema modeling, indexing, and complex queries',
  },
  'Git & Version Control': {
    id: '40000000-0000-0000-0000-000000000004',
    slug: 'git',
    category: 'Tools & Infrastructure',
    description: 'Branching workflows, merges, rebasing, and GitHub collaboration',
  },
  'Docker': {
    id: '40000000-0000-0000-0000-000000000005',
    slug: 'docker',
    category: 'Tools & Infrastructure',
    description: 'Containerization, multi-stage builds, and Docker Compose environments',
  },
  'React.js': {
    id: '40000000-0000-0000-0000-000000000006',
    slug: 'react',
    category: 'Frontend Basics',
    description: 'Component lifecycles, state management, and modern React hooks',
  },
  'React': {
    id: '40000000-0000-0000-0000-000000000006',
    slug: 'react',
    category: 'Frontend Basics',
    description: 'Component lifecycles, state management, and modern React hooks',
  },
  'JavaScript': {
    id: '40000000-0000-0000-0000-000000000015',
    slug: 'javascript',
    category: 'Frontend Basics',
    description: 'Modern JavaScript language fundamentals for browser and server applications',
  },
  'JavaScript / TypeScript': {
    id: '40000000-0000-0000-0000-000000000015',
    slug: 'javascript',
    category: 'Frontend Basics',
    description: 'Modern JavaScript language fundamentals for browser and server applications',
  },
  'Tailwind CSS / HTML': {
    id: '40000000-0000-0000-0000-000000000007',
    slug: 'html-css',
    category: 'Frontend Basics',
    description: 'Semantic HTML5 markup and responsive layout styling with modern CSS',
  },
  'HTML/CSS': {
    id: '40000000-0000-0000-0000-000000000007',
    slug: 'html-css',
    category: 'Frontend Basics',
    description: 'Semantic HTML5 markup and responsive layout styling with modern CSS',
  },
  'Python': {
    id: '40000000-0000-0000-0000-000000000012',
    slug: 'python',
    category: 'Technical',
    description: 'Data structures, scripting, and backend processing in Python',
  },
  'Python / Pandas': {
    id: '40000000-0000-0000-0000-000000000012',
    slug: 'python',
    category: 'Technical',
    description: 'Data structures, scripting, and backend processing in Python',
  },
  'REST API Security': {
    id: '40000000-0000-0000-0000-000000000013',
    slug: 'rest-api-security',
    category: 'Backend & APIs',
    description: 'JWT authentication, RBAC, rate limiting, and CORS headers',
  },
  'System Design Basics': {
    id: '40000000-0000-0000-0000-000000000014',
    slug: 'system-design',
    category: 'Technical',
    description: 'Microservices architecture, caching strategies, and load balancing',
  },
  'Linux': {
    id: '40000000-0000-0000-0000-000000000016',
    slug: 'linux',
    category: 'Tools & Infrastructure',
    description: 'Linux shell, process management, permissions, and bash scripting',
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ success: false, error: 'Career ID is required' }, { status: 400 })
  }

  try {
    const supabase = await createSupabaseServerClient()
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    let targetId = id
    if (!isUuid) {
      // Resolve slug to UUID
      const { data: ct } = await (supabase as any)
        .from('career_targets')
        .select('id')
        .eq('slug', id)
        .maybeSingle()

      if (ct?.id) {
        targetId = ct.id
      }
    }

    const { data: reqs, error } = await (supabase as any)
      .from('career_target_skills')
      .select('skill_id, required_level, importance, skills(id, name, slug, category, description)')
      .eq('career_target_id', targetId)

    if (!error && reqs && reqs.length > 0) {
      const formatted: CareerSkillRequirementResponse[] = reqs.map((r: any) => ({
        skillId: r.skill_id,
        skillName: r.skills?.name || 'Skill',
        slug: r.skills?.slug || '',
        category: r.skills?.category || 'Technical',
        description: r.skills?.description || null,
        requiredLevel: r.required_level,
        importance: r.importance || 'High',
      }))
      return NextResponse.json({ success: true, data: formatted })
    }
  } catch (err) {
    console.warn('Database error fetching career target skills:', err)
  }

  // Canonical fallback from CAREER_BENCHMARK_PROFILES
  const profile = CAREER_BENCHMARK_PROFILES.find(c => c.id === id || c.slug === id)
  if (profile) {
    const fallbackList: CareerSkillRequirementResponse[] = Object.entries(profile.skills).map(([skillName, bench]) => {
      const meta = CANONICAL_SKILL_META[skillName] || {
        id: `skill-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        slug: skillName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category: 'Technical',
        description: `${skillName} competency for ${profile.name}`,
      }

      return {
        skillId: meta.id,
        skillName,
        slug: meta.slug,
        category: meta.category,
        description: meta.description,
        requiredLevel: bench.required,
        importance: bench.weight >= 0.3 ? 'High' : bench.weight >= 0.2 ? 'Medium' : 'Low',
      }
    })

    return NextResponse.json({ success: true, data: fallbackList })
  }

  return NextResponse.json({ success: false, error: 'Career target skills not found' }, { status: 404 })
}
