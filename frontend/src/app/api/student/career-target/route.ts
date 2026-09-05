import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await (supabase as any)
        .from('student_profiles')
        .select('target_career_id, career_targets(id, name, slug, description, category)')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (!error && data && data.target_career_id) {
        return NextResponse.json({
          success: true,
          data: {
            target_career_id: data.target_career_id,
            career_targets: data.career_targets || {
              id: data.target_career_id,
              name: 'Selected Career Target',
            },
          },
        })
      }
    }
  } catch (err) {
    console.warn('Could not read student profile target, using fallback:', err)
  }

  // Default to Frontend Developer or Backend Developer benchmark profile
  const defaultProfile = CAREER_BENCHMARK_PROFILES[1] || CAREER_BENCHMARK_PROFILES[0]
  return NextResponse.json({
    success: true,
    data: {
      target_career_id: defaultProfile.id,
      career_targets: {
        id: defaultProfile.id,
        name: defaultProfile.name,
        slug: defaultProfile.slug,
        description: defaultProfile.description,
        category: defaultProfile.category,
      },
    },
  })
}

async function handleSaveTarget(request: NextRequest) {
  try {
    const body = await request.json()
    const careerId = body.target_career_id || body.career_id
    if (!careerId) {
      return NextResponse.json({ success: false, error: 'target_career_id is required' }, { status: 400 })
    }

    const matchedCareer = CAREER_BENCHMARK_PROFILES.find(c => c.id === careerId || c.slug === careerId)
    const targetId = matchedCareer ? matchedCareer.id : careerId

    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await (supabase as any)
          .from('student_profiles')
          .upsert({
            profile_id: user.id,
            target_career_id: targetId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'profile_id' })
      }
    } catch (dbErr) {
      console.warn('Supabase student_profiles save error:', dbErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        target_career_id: targetId,
        career_targets: matchedCareer || {
          id: targetId,
          name: 'Career Target',
        },
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to save career target',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return handleSaveTarget(request)
}

export async function PATCH(request: NextRequest) {
  return handleSaveTarget(request)
}
