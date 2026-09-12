import { NextRequest, NextResponse } from 'next/server'
import { getAllCombinedOpportunities } from '@/lib/opportunities-seed'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const all = getAllCombinedOpportunities()
  const found = all.find(o => o.id === id)
  if (!found) {
    return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: found })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const timestamp = new Date().toISOString()

  try {
    const admin = createSupabaseAdminClient()
    await (admin as any)
      .from('opportunities')
      .update({
        ...body,
        updated_at: timestamp,
      })
      .eq('id', id)
  } catch (err: any) {
    console.warn('[Industry Opportunity PATCH] Supabase fallback:', err.message)
  }

  return NextResponse.json({
    success: true,
    data: { id, ...body, updated_at: timestamp },
  })
}

