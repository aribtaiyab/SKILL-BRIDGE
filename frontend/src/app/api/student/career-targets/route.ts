import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase().trim() || ''

    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from('career_targets')
      .select('id, name, slug, description, category')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, data })
    }
  } catch (err) {
    console.warn('[Career Targets API] Supabase query warning:', err)
  }

  // Canonical fallback from comprehensive career benchmark catalog
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase().trim() || ''

  let list = CAREER_BENCHMARK_PROFILES.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    category: c.category,
  }))

  if (search) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(search) ||
      c.slug.toLowerCase().includes(search) ||
      (c.description && c.description.toLowerCase().includes(search)) ||
      (c.category && c.category.toLowerCase().includes(search))
    )
  }

  return NextResponse.json({
    success: true,
    data: list,
  })
}
