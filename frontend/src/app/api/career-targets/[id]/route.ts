import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

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

    let query = (supabase as any)
      .from('career_targets')
      .select('id, name, slug, description, category, is_active')

    if (isUuid) {
      query = query.eq('id', id)
    } else {
      query = query.eq('slug', id)
    }

    const { data, error } = await query.maybeSingle()

    if (!error && data) {
      return NextResponse.json({ success: true, data })
    }
  } catch (err) {
    console.warn('Database error fetching career target:', err)
  }

  // Canonical fallback
  const fallback = CAREER_BENCHMARK_PROFILES.find(c => c.id === id || c.slug === id)
  if (fallback) {
    return NextResponse.json({
      success: true,
      data: {
        id: fallback.id,
        name: fallback.name,
        slug: fallback.slug,
        description: fallback.description,
        category: fallback.category,
      },
    })
  }

  return NextResponse.json({ success: false, error: 'Career target not found' }, { status: 404 })
}
