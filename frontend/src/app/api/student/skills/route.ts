import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const DEFAULT_SKILLS_DATA = [
  {
    id: 's-01',
    current_level: 65,
    self_declared_level: 65,
    verification_status: 'assessment_verified',
    skills: { id: '40000000-0000-0000-0000-000000000001', name: 'Node.js', category: 'Backend & APIs' },
  },
  {
    id: 's-02',
    current_level: 72,
    self_declared_level: 72,
    verification_status: 'practical_verified',
    skills: { id: '40000000-0000-0000-0000-000000000002', name: 'REST APIs', category: 'Backend & APIs' },
  },
  {
    id: 's-03',
    current_level: 82,
    self_declared_level: 82,
    verification_status: 'evidence_verified',
    skills: { id: '40000000-0000-0000-0000-000000000003', name: 'SQL', category: 'Database & Storage' },
  },
  {
    id: 's-04',
    current_level: 75,
    self_declared_level: 75,
    verification_status: 'practical_verified',
    skills: { id: '40000000-0000-0000-0000-000000000004', name: 'Git & Version Control', category: 'Tools & Infrastructure' },
  },
  {
    id: 's-05',
    current_level: 60,
    self_declared_level: 60,
    verification_status: 'assessment_verified',
    skills: { id: '40000000-0000-0000-0000-000000000006', name: 'React.js', category: 'Frontend Basics' },
  },
  {
    id: 's-06',
    current_level: 45,
    self_declared_level: 45,
    verification_status: 'self_declared',
    skills: { id: '40000000-0000-0000-0000-000000000005', name: 'Docker', category: 'Tools & Infrastructure' },
  },
]

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await (supabase as any)
        .from('student_skills')
        .select('*, skills(id, name, category)')
        .eq('student_id', user.id)

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, data })
      }
    }
  } catch {
    // fallback
  }

  return NextResponse.json({ success: true, data: DEFAULT_SKILLS_DATA })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skill_id, self_declared_level = 70 } = body

    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await (supabase as any)
          .from('student_skills')
          .upsert({
            student_id: user.id,
            skill_id,
            self_declared_level: Number(self_declared_level),
            current_level: Number(self_declared_level),
            verification_status: 'self_declared',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'student_id,skill_id' })
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      data: {
        skill_id,
        current_level: Number(self_declared_level),
        verification_status: 'self_declared',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to save skill' }, { status: 500 })
  }
}
