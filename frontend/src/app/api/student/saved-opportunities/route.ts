import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// In-memory fallback store for demo/development sessions
const fallbackSavedOpportunityIds = new Set<string>()

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: saved, error } = await (supabase as any)
        .from('saved_opportunities')
        .select('opportunity_id')
        .eq('student_id', user.id)

      if (!error && saved) {
        const ids = saved.map((row: any) => row.opportunity_id)
        return NextResponse.json({ success: true, data: ids, savedOpportunityIds: ids })
      }
    }
  } catch (err) {
    console.warn('Supabase saved_opportunities query fallback:', err)
  }

  return NextResponse.json({
    success: true,
    data: Array.from(fallbackSavedOpportunityIds),
    savedOpportunityIds: Array.from(fallbackSavedOpportunityIds),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { opportunityId } = body

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'opportunityId is required' },
        { status: 422 }
      )
    }

    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: existing } = await (supabase as any)
          .from('saved_opportunities')
          .select('id')
          .eq('student_id', user.id)
          .eq('opportunity_id', opportunityId)
          .maybeSingle()

        if (existing) {
          await (supabase as any)
            .from('saved_opportunities')
            .delete()
            .eq('student_id', user.id)
            .eq('opportunity_id', opportunityId)
          return NextResponse.json({ success: true, saved: false, isSaved: false, opportunityId })
        } else {
          await (supabase as any)
            .from('saved_opportunities')
            .insert({ student_id: user.id, opportunity_id: opportunityId })
          return NextResponse.json({ success: true, saved: true, isSaved: true, opportunityId })
        }
      }
    } catch (dbErr) {
      console.warn('Supabase toggle saved fallback:', dbErr)
    }

    // In-memory fallback
    const wasSaved = fallbackSavedOpportunityIds.has(opportunityId)
    if (wasSaved) {
      fallbackSavedOpportunityIds.delete(opportunityId)
    } else {
      fallbackSavedOpportunityIds.add(opportunityId)
    }

    return NextResponse.json({
      success: true,
      saved: !wasSaved,
      isSaved: !wasSaved,
      opportunityId,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to toggle saved opportunity' },
      { status: 500 }
    )
  }
}
