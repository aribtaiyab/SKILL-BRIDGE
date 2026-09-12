import { NextResponse } from 'next/server'
import { PRESET_ACADEMICIANS } from '@/lib/verification-store'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: facultyRows, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, title, institution_name, department, expertise_skills, avatar_url')
        .eq('role', 'faculty')

      if (!error && facultyRows && facultyRows.length > 0) {
        const mapped = facultyRows.map((f: any) => ({
          id: f.id,
          profile_id: f.id,
          full_name: f.full_name || 'Academician Faculty',
          title: f.title || 'Department Faculty Reviewer',
          institution_name: f.institution_name || 'Delhi Technological University (DTU)',
          department: f.department || 'Computer Science & Engineering',
          expertise_skills: f.expertise_skills || ['Software Engineering', 'System Architecture'],
          availability: 'Mon - Fri, 10:00 AM - 5:00 PM IST',
          verified_count: 30,
          avatar_url: f.avatar_url,
        }))
        return NextResponse.json({ success: true, data: mapped })
      }
    } catch {
      // Use presets
    }

    return NextResponse.json({ success: true, data: PRESET_ACADEMICIANS })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load academicians' }, { status: 500 })
  }
}
