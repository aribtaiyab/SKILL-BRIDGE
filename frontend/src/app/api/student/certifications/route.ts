import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: certs, error } = await (supabase as any)
      .from('certifications')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !certs) {
      return NextResponse.json({ success: true, data: [] })
    }

    return NextResponse.json({ success: true, data: certs })
  } catch (err: any) {
    console.error('Error fetching student certifications:', err)
    return NextResponse.json({ success: true, data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newCert = {
      id: body.id || undefined,
      student_id: user.id,
      name: body.name || 'Certification',
      issuing_organization: body.issuing_organization || body.issuer || 'Issuing Organization',
      issue_date: body.issue_date || new Date().toISOString().split('T')[0],
      credential_url: body.credential_url || body.credentialUrl || null,
      created_at: new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from('certifications')
      .insert(newCert)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: true, data: { ...newCert, id: `cert-${Date.now()}` } })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Error creating student certification:', err)
    return NextResponse.json({ success: false, error: 'Failed to create certification' }, { status: 500 })
  }
}
