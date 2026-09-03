import { getServerUser, apiSuccess, apiError } from '@/lib/auth/server'
import { z } from 'zod'

const EvidenceGuidanceSchema = z.object({
  summary: z.string(),
  suggestedProofTypes: z.array(z.string()),
  keyCapabilitiesToDemonstrate: z.array(z.string()),
  recommendedProjectStructure: z.string(),
  guidanceNote: z.string(),
})

export type EvidenceGuidanceResponse = z.infer<typeof EvidenceGuidanceSchema>

// POST /api/ai/evidence-guidance — generate grounded evidence suggestions
export async function POST(request: Request) {
  const user = await getServerUser()
  if (!user) return apiError('UNAUTHORIZED', 'Authentication required.', 401)

  let body: {
    skillName?: string
    currentLevel?: number
    verificationStatus?: string
    targetCareer?: string
    opportunityTitle?: string
  }

  try {
    body = await request.json()
  } catch {
    return apiError('INVALID_REQUEST', 'Invalid JSON body.', 400)
  }

  const skillName = String(body.skillName || 'Core Technical Skill').trim()
  const currentLevel = body.currentLevel || 50
  const isLowScore = currentLevel < 50
  const isHighScore = currentLevel >= 75

  let suggestedProofTypes: string[] = []
  let keyCapabilities: string[] = []
  let projectStructure = ''

  if (skillName.toLowerCase().includes('node') || skillName.toLowerCase().includes('backend')) {
    suggestedProofTypes = [
      'Production-ready REST / GraphQL API repository with clean routing',
      'Database-backed microservice demonstrating connection pooling and migrations',
      'Authentication & Authorization service with JWT / OAuth2 and middleware tests',
    ]
    keyCapabilities = [
      'Asynchronous error propagation with centralized Express/Fastify middleware',
      'Relational database integration (PostgreSQL) with parameterized queries or query builders',
      'Automated integration tests (Supertest/Jest) verifying endpoint response codes',
    ]
    projectStructure = 'src/ (routes, controllers, services, middleware), tests/, docker-compose.yml, README.md'
  } else if (skillName.toLowerCase().includes('sql') || skillName.toLowerCase().includes('database')) {
    suggestedProofTypes = [
      'Relational schema design with DDL migrations, composite indexes, and foreign keys',
      'Query optimization report profiling EXPLAIN ANALYZE on complex multi-table joins',
      'Stored procedure, trigger, and transactional ACID boundary demonstration',
    ]
    keyCapabilities = [
      'Third-normal-form (3NF) relational modeling with integrity constraints',
      'Index strategy for high-cardinality filters and join optimization',
      'Transaction rollbacks and isolation levels under concurrent writes',
    ]
    projectStructure = 'migrations/ (DDL scripts), queries/ (analytics queries), benchmarks/ (performance analysis)'
  } else if (skillName.toLowerCase().includes('react') || skillName.toLowerCase().includes('frontend')) {
    suggestedProofTypes = [
      'Modular Single-Page Application (SPA) with reusable components and custom hooks',
      'State-managed dashboard integrating asynchronous API fetching, loading, and error states',
      'Accessible UI component system built to WCAG 2.2 AA standards with unit tests',
    ]
    keyCapabilities = [
      'Clean component composition with TypeScript prop interfaces',
      'Client-side state management and asynchronous data-fetching hooks (SWR/React Query)',
      'Responsive design across mobile, tablet, and desktop breakpoints',
    ]
    projectStructure = 'src/components/ (ui, layouts), src/hooks/, src/types/, tests/, README.md'
  } else {
    suggestedProofTypes = [
      `End-to-end GitHub repository implementing real-world use cases for ${skillName}`,
      `Practical capstone project with verified code contributions and documentation`,
      `Live deployed demonstration showcasing error resilience and performance`,
    ]
    keyCapabilities = [
      `Core syntax, architectural idioms, and clean modular code in ${skillName}`,
      'Comprehensive error handling and automated test coverage',
      'Clear documentation in README explaining architecture and individual contribution',
    ]
    projectStructure = 'src/, tests/, docs/, configuration files, README.md'
  }

  const guidance: EvidenceGuidanceResponse = {
    summary: `To substantiate your ${skillName} capability (${currentLevel}/100), submit an end-to-end practical project or GitHub repository demonstrating ${isLowScore ? 'fundamental implementation and clean architecture' : isHighScore ? 'production optimization, scalability, and robust error boundaries' : 'modular code design, test coverage, and API integration'}.`,
    suggestedProofTypes,
    keyCapabilitiesToDemonstrate: keyCapabilities,
    recommendedProjectStructure: projectStructure,
    guidanceNote: 'AI guidance is advisory. Submitted evidence is officially verified by academic and institutional reviewers.',
  }

  return apiSuccess(EvidenceGuidanceSchema.parse(guidance))
}
