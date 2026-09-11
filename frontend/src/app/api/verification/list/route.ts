import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getVerificationRequests } from '@/lib/verification-store'

export async function GET(req: NextRequest) {
  try {
    const memoryRequests = getVerificationRequests()

    try {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await (supabase as any)
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        const memMap = new Map(memoryRequests.map(m => [m.id, m]))
        data.forEach((d: any) => memMap.set(d.id, d))
        return NextResponse.json({ success: true, requests: Array.from(memMap.values()) })
      }
    } catch {}

    return NextResponse.json({ success: true, requests: memoryRequests })
  } catch (error: any) {
    console.error('Failed to list verification requests:', error)
    return NextResponse.json({ success: true, requests: getVerificationRequests() })
  }
}
