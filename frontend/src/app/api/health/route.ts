import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SkillBridge Connect Unified Engine',
    version: '1.0.0',
    features: {
      deterministicFallback: true,
      multiLevelAssessments: true,
      opportunityHub: true,
      aiCoach: true,
    },
  })
}
