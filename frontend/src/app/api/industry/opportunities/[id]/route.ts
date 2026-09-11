import { NextRequest, NextResponse } from 'next/server'
import { getAllCombinedOpportunities } from '@/lib/opportunities-seed'

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
  return NextResponse.json({
    success: true,
    data: { id, ...body, updated_at: new Date().toISOString() },
  })
}
