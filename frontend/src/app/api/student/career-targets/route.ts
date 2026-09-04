import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CAREER_BENCHMARK_PROFILES } from '@/lib/benchmarks'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('career_targets')
      .select('id, name, slug, description, category')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, data })
    }
  } catch (err) {
    console.warn('Supabase query failed, returning deterministic career targets:', err)
  }

  // Deterministic Fallback: Return the standard 5 official benchmark career profiles
  return NextResponse.json({
    success: true,
    data: CAREER_BENCHMARK_PROFILES.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      category: c.category,
    })),
  })
}
