import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { addVerificationRequest, VerificationItem } from '@/lib/verification-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      studentId = 'std-2026-001',
      studentName = 'Arib Tayab',
      studentEmail = 'student@dtu.ac.in',
      department = 'Computer Science & Engineering',
      skillName = 'Node.js & REST APIs',
      verificationTier = 'Assessment Verified',
      score = 85,
      proofUrl,
      proofNotes,
    } = body

    const item: VerificationItem = {
      id: `vr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      student_id: studentId,
      student_name: studentName,
      student_email: studentEmail,
      department,
      skill_name: skillName,
      verification_tier: verificationTier,
      score: score || 85,
      proof_url: proofUrl || null,
      proof_notes: proofNotes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    // Add to synchronized queue
    addVerificationRequest(item)

    // Attempt Supabase insert
    try {
      const admin = createSupabaseAdminClient()
      await (admin as any).from('verification_requests').insert([item])
    } catch (dbErr) {
      console.warn('Supabase verification_requests notice:', dbErr)
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    console.error("Error submitting verification request:", error)
    return NextResponse.json({ success: false, error: error.message || 'Submission failed' }, { status: 500 })
  }
}
