import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { addVerificationRequest, VerificationItem, PRESET_ACADEMICIANS } from '@/lib/verification-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Resolve user context if available
    let resolvedStudentId = body.student_id || body.studentId
    let resolvedStudentName = body.student_name || body.studentName
    let resolvedStudentEmail = body.student_email || body.studentEmail
    let resolvedDepartment = body.department || 'Computer Science & Engineering'

    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        resolvedStudentId = user.id
        resolvedStudentEmail = user.email || resolvedStudentEmail
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('full_name, department')
          .eq('id', user.id)
          .maybeSingle()
        if (profile) {
          resolvedStudentName = profile.full_name || resolvedStudentName
          resolvedDepartment = profile.department || resolvedDepartment
        }
      }
    } catch {
      // Use provided body fields
    }

    const {
      skillName = body.skill_name || 'React',
      skillId = body.skill_id,
      verificationTier = body.verification_tier || 'Evidence Verified',
      claimedLevel = body.claimed_level || 'Strong',
      score = body.score || 85,
      description = body.description || body.student_notes || null,
      projectTitle = body.project_title || body.evidenceProject || null,
      projectUrl = body.project_url || body.evidenceGithub || null,
      techStack = body.tech_stack || null,
      proofUrl = body.proof_url || body.evidenceGithub || null,
      proofNotes = body.proof_notes || body.student_notes || null,
      supportingEvidence = body.supporting_evidence || [],
      academicianId = body.academician_id || body.selectedAcademicianId || 'fac-01-sarah-mitchell',
    } = body

    if (!skillName) {
      return NextResponse.json({ success: false, error: 'Skill name is required for verification.' }, { status: 400 })
    }

    const matchedFaculty = PRESET_ACADEMICIANS.find(f => f.id === academicianId || f.profile_id === academicianId) || PRESET_ACADEMICIANS[0]

    // Assemble evidence array
    const evidenceList = Array.isArray(supportingEvidence) && supportingEvidence.length > 0
      ? supportingEvidence
      : [
          ...(proofUrl ? [{ title: projectTitle || 'Project Repository', type: 'github_repo', url: proofUrl, description: proofNotes || description }] : []),
        ]

    const item: VerificationItem = {
      id: `vr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      student_id: resolvedStudentId || 'std-2026-001',
      student_name: resolvedStudentName || 'Arib Tayab',
      student_email: resolvedStudentEmail || 'student@dtu.ac.in',
      department: resolvedDepartment,
      skill_name: skillName,
      skill_id: skillId,
      verification_tier: verificationTier,
      claimed_level: claimedLevel,
      score: Number(score) || 85,
      description,
      project_title: projectTitle,
      project_url: projectUrl,
      tech_stack: techStack,
      proof_url: proofUrl || evidenceList[0]?.url || null,
      proof_notes: proofNotes || description || null,
      supporting_evidence: evidenceList,
      status: 'pending',
      academician_id: matchedFaculty.id,
      academician_name: matchedFaculty.full_name,
      academician_institution: matchedFaculty.institution_name,
      academician_department: matchedFaculty.department,
      created_at: new Date().toISOString(),
    }

    // 1. Add to synchronized local queue
    addVerificationRequest(item)

    // 2. Attempt Supabase insert
    try {
      const admin = createSupabaseAdminClient()
      await (admin as any).from('verification_requests').insert([{
        id: item.id,
        student_id: item.student_id,
        student_name: item.student_name,
        student_email: item.student_email,
        department: item.department,
        skill_name: item.skill_name,
        verification_tier: item.verification_tier,
        score: item.score,
        proof_url: item.proof_url,
        proof_notes: item.description || item.proof_notes,
        status: 'pending',
        supporting_evidence: item.supporting_evidence,
        created_at: item.created_at,
      }])
    } catch (dbErr) {
      console.warn('Supabase verification_requests insert notice:', dbErr)
    }

    return NextResponse.json({ success: true, data: item, message: 'Skill verification request submitted successfully.' })
  } catch (error: any) {
    console.error("Error submitting verification request:", error)
    return NextResponse.json({ success: false, error: error.message || 'Submission failed' }, { status: 500 })
  }
}
