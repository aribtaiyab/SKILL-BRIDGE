import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const defaultPassportData = {
    name: "Arib Tayab",
    collegeName: "Dr. Akhilesh Das Gupta Institute of Professional Studies",
    department: "Computer Science & Engineering",
    course: "B.Tech in Computer Science",
    year: "2nd Year (4th Semester)",
    targetRole: "Backend Developer Internship",
    passportId: "SKILL-2026-IN-8491",
    readinessScore: 82,
    skills: [
      { name: "Node.js & Express", category: "Backend", score: 82, verificationLevel: "Practical Verified", lastEvaluated: "Aug 2026" },
      { name: "REST API Design", category: "Backend", score: 78, verificationLevel: "Practical Verified", lastEvaluated: "Aug 2026" },
      { name: "PostgreSQL & Database Design", category: "Database", score: 85, verificationLevel: "Assessment Verified", lastEvaluated: "Jul 2026" },
      { name: "Data Structures & Algorithms", category: "Core CS", score: 76, verificationLevel: "Assessment Verified", lastEvaluated: "Jul 2026" },
      { name: "Git & Version Control", category: "DevOps & Tools", score: 88, verificationLevel: "Evidence Verified", lastEvaluated: "Aug 2026" },
      { name: "React.js & Tailwind CSS", category: "Frontend", score: 70, verificationLevel: "Self-Declared", lastEvaluated: "Pending" }
    ],
    projects: [
      {
        title: "Scalable Task Automation Engine",
        description: "Distributed job execution service with Redis background queues and role-based JWT access.",
        tags: ["Node.js", "Redis", "PostgreSQL", "Express"],
        githubUrl: "https://github.com",
        liveUrl: "https://demo.vercel.app",
        verifiedStatus: "Practical Verified"
      },
      {
        title: "Campus Academic Resource Hub",
        description: "Centralized lab and seminar hall booking platform with real-time slot conflict resolution.",
        tags: ["TypeScript", "Next.js", "Tailwind CSS"],
        githubUrl: "https://github.com",
        verifiedStatus: "Repository Linked"
      }
    ]
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (profile && (profile as any).full_name) {
        defaultPassportData.name = (profile as any).full_name
      }

      // Merge verified skills from student_skills table
      try {
        const { data: verifiedSkills } = await (supabase as any)
          .from('student_skills')
          .select('skill_name, score, verification_level, last_evaluated')
          .eq('student_id', user.id)

        if (verifiedSkills && verifiedSkills.length > 0) {
          for (const v of verifiedSkills) {
            const idx = defaultPassportData.skills.findIndex(s => s.name.toLowerCase() === v.skill_name.toLowerCase())
            if (idx >= 0) {
              defaultPassportData.skills[idx].score = Number(v.score) || defaultPassportData.skills[idx].score
              defaultPassportData.skills[idx].verificationLevel = v.verification_level || defaultPassportData.skills[idx].verificationLevel
            } else {
              defaultPassportData.skills.unshift({
                name: v.skill_name,
                category: "Backend",
                score: Number(v.score) || 85,
                verificationLevel: v.verification_level || "Institution Verified",
                lastEvaluated: "Just Now",
              })
            }
          }
        }
      } catch {}
    }
  } catch {
    // Graceful fallback to default passport data
  }

  return NextResponse.json({
    success: true,
    ...defaultPassportData,
    data: defaultPassportData,
  })
}
