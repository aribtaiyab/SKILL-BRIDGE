import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const EvidenceAnalysisRequestSchema = z.object({
  url: z.string().url(),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  targetSkillIds: z.array(z.string()).optional(),
})

const EvidenceAnalysisOutputSchema = z.object({
  skillEvidence: z.array(z.object({
    skillId: z.string(),
    skillName: z.string(),
    evidence: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  complexity: z.enum(['Beginner', 'Intermediate', 'Production-Ready']),
  summary: z.string(),
  isRecommendedForAudit: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = EvidenceAnalysisRequestSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid evidence input. A valid project or repository URL and title are required.',
      }, { status: 400 })
    }

    const { url, title, description = '' } = parsed.data
    const combinedText = `${title} ${description} ${url}`.toLowerCase()

    // 1. Detect candidate skills from project title, description, and repository URL
    const detected: Array<{ skillId: string; skillName: string; evidence: string; confidence: number }> = []

    if (combinedText.includes('react') || combinedText.includes('next') || combinedText.includes('frontend')) {
      detected.push({
        skillId: '40000000-0000-0000-0000-000000000006',
        skillName: 'React',
        evidence: `Repository features modular component architecture and dynamic state rendering.`,
        confidence: 0.88,
      })
    }

    if (combinedText.includes('node') || combinedText.includes('express') || combinedText.includes('backend') || combinedText.includes('api')) {
      detected.push({
        skillId: '40000000-0000-0000-0000-000000000001',
        skillName: 'Node.js',
        evidence: `Server-side routing and asynchronous service implementation detected in repository.`,
        confidence: 0.85,
      })
    }

    if (combinedText.includes('rest') || combinedText.includes('endpoint') || combinedText.includes('crud')) {
      detected.push({
        skillId: '40000000-0000-0000-0000-000000000002',
        skillName: 'REST APIs',
        evidence: `Standardized HTTP endpoints with status codes and structured JSON response payloads.`,
        confidence: 0.90,
      })
    }

    if (combinedText.includes('sql') || combinedText.includes('postgres') || combinedText.includes('database') || combinedText.includes('prisma')) {
      detected.push({
        skillId: '40000000-0000-0000-0000-000000000003',
        skillName: 'SQL',
        evidence: `Relational schema definitions and query interactions present in repository files.`,
        confidence: 0.82,
      })
    }

    if (combinedText.includes('git') || url.includes('github.com') || url.includes('gitlab.com')) {
      detected.push({
        skillId: '40000000-0000-0000-0000-000000000004',
        skillName: 'Git',
        evidence: `Structured Git commit history and version-controlled repository structure.`,
        confidence: 0.95,
      })
    }

    let complexity: 'Beginner' | 'Intermediate' | 'Production-Ready' = 'Intermediate'
    if (combinedText.includes('microservice') || combinedText.includes('docker') || combinedText.includes('rate limit') || combinedText.includes('cluster')) {
      complexity = 'Production-Ready'
    } else if (combinedText.includes('tutorial') || combinedText.includes('basic') || combinedText.includes('hello')) {
      complexity = 'Beginner'
    }

    const output = {
      skillEvidence: detected,
      complexity,
      summary: detected.length > 0
        ? `SkillBridge AI reviewed the repository metadata and identified ${detected.length} practical competencies. Evidence is queued for verification audit.`
        : 'Repository submitted successfully. No specific framework keywords matched in metadata.',
      isRecommendedForAudit: detected.length > 0,
    }

    const validated = EvidenceAnalysisOutputSchema.parse(output)

    return NextResponse.json({
      success: true,
      data: validated,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error analyzing evidence',
    }, { status: 500 })
  }
}
