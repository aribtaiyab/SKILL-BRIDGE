import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getVerificationRequests } from '@/lib/verification-store'

export async function GET(req: NextRequest) {
  try {
    let studentId: string | undefined
    let studentEmail: string | undefined

    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        studentId = user.id
        studentEmail = user.email
      }
    } catch {
      // Unauthenticated / fallback
    }

    const memoryRequests = getVerificationRequests(studentId ? { studentId } : undefined)

    try {
      const supabase = await createSupabaseServerClient()
      let query = (supabase as any)
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (studentId) {
        query = query.eq('student_id', studentId)
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        const memMap = new Map(memoryRequests.map(m => [m.id, m]))
        data.forEach((d: any) => memMap.set(d.id, {
          ...d,
          supporting_evidence: d.supporting_evidence || (d.proof_url ? [{ title: 'Repository Evidence', type: 'github_repo', url: d.proof_url, description: d.proof_notes }] : []),
        }))
        const merged = Array.from(memMap.values())
        return NextResponse.json({ success: true, data: merged, requests: merged })
      }
    } catch {}

    return NextResponse.json({ success: true, data: memoryRequests, requests: memoryRequests })
  } catch (error: any) {
    console.error('Error in student verification requests API:', error)
    return NextResponse.json({ success: true, data: getVerificationRequests(), requests: getVerificationRequests() })
  }
}
