import { NextRequest, NextResponse } from 'next/server'
import { requireAcademicianAuth } from '@/lib/auth/academia-guard'

export async function GET(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { adminSupabase } = auth.context
  const { searchParams } = new URL(req.url)
  const typeFilter = searchParams.get('type') || 'all'

  try {
    let query = (adminSupabase as any)
      .from('opportunities')
      .select(`
        id,
        title,
        description,
        type,
        location,
        work_mode,
        duration,
        stipend_amount,
        deadline,
        status,
        created_at,
        industry_profiles(organization_name, website, location),
        opportunity_skills(skills(name))
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    const { data: opportunities, error } = await query

    if (error) {
      console.warn('Opportunities fetch error:', error)
      return NextResponse.json({ success: false, error: 'Could not fetch opportunities' }, { status: 500 })
    }

    let items = (opportunities || []).map((o: any) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      type: o.type,
      location: o.location,
      workMode: o.work_mode,
      duration: o.duration,
      stipendAmount: o.stipend_amount,
      deadline: o.deadline ? new Date(o.deadline).toLocaleDateString() : 'Flexible',
      provider: o.industry_profiles?.organization_name || 'Industry Partner',
      skills: (o.opportunity_skills || []).map((os: any) => os.skills?.name).filter(Boolean),
    }))

    if (typeFilter !== 'all') {
      items = items.filter((item: any) => item.type.toLowerCase().includes(typeFilter.toLowerCase()))
    }

    return NextResponse.json({
      success: true,
      data: items,
    })
  } catch (err: any) {
    console.error('Opportunities API error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAcademicianAuth()
  if (!auth.success) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const { user, adminSupabase } = auth.context

  try {
    const body = await req.json()
    const { title, description, type = 'workshop', location = 'Campus / Virtual', duration = '1 Week', deadline } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const { data: created, error } = await (adminSupabase as any)
      .from('opportunities')
      .insert({
        industry_id: user.id, // Auth user acting as creator
        title,
        description: description || 'Academic collaboration initiative published via SkillBridge Opportunity Hub.',
        type,
        location,
        duration,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: 'published',
      })
      .select()
      .single()

    if (error) {
      console.error('Opportunity insert error:', error)
      return NextResponse.json({ success: false, error: 'Could not create opportunity' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (err: any) {
    console.error('Opportunity POST error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
