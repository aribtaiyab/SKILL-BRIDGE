import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const defaultPassportData = {
    profile: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@student.techinst.edu",
      institution: "Tech Institute of Modern Dev",
      targetCareer: "Backend Developer (Internship/Junior)",
    },
    settings: {
      shareToken: "sarah-jenkins-passport-token",
      isPublic: true,
      headline: "Aspiring Backend & Systems Engineer • Verified 78% Readiness",
      bio: "Passionate about high-concurrency microservices, robust API design, and distributed PostgreSQL performance.",
      showSkills: true,
      showProjects: true,
      showCertifications: true,
      showReadiness: true,
    },
    skills: [
      {
        id: "ps-01",
        skillId: "40000000-0000-0000-0000-000000000001",
        name: "Node.js",
        category: "Backend & APIs",
        currentLevel: 80,
        verificationStatus: "assessment_verified",
        verificationBadge: {
          label: "Assessment Verified",
          shortLabel: "Assessment",
          variant: "default",
          description: "Verified via server-side evaluated benchmark assessment.",
        },
        proofCount: 2,
        proofItems: [
          { id: "pf-01", title: "Level 1 Knowledge Benchmark (80/100)", type: "assessment" },
          { id: "pf-02", title: "Express Route Debugging Challenge", type: "practical" },
        ],
      },
      {
        id: "ps-02",
        skillId: "40000000-0000-0000-0000-000000000002",
        name: "REST APIs",
        category: "Backend & APIs",
        currentLevel: 75,
        verificationStatus: "practical_verified",
        verificationBadge: {
          label: "Practical Verified",
          shortLabel: "Practical",
          variant: "success",
          description: "Hands-on challenge completed and tested in timed environment.",
        },
        proofCount: 1,
        proofItems: [
          { id: "pf-03", title: "REST API Endpoint Implementation", type: "practical" },
        ],
      },
      {
        id: "ps-03",
        skillId: "40000000-0000-0000-0000-000000000003",
        name: "SQL",
        category: "Database & Storage",
        currentLevel: 82,
        verificationStatus: "evidence_verified",
        verificationBadge: {
          label: "Evidence Verified",
          shortLabel: "Evidence",
          variant: "success",
          description: "Verified by linked GitHub code repository and project demo.",
        },
        proofCount: 2,
        proofItems: [
          { id: "pf-04", title: "PostgreSQL Production Modeling Repo", type: "github", url: "https://github.com/developer/ecommerce-platform-api" },
          { id: "pf-05", title: "SQL Benchmark Certification", type: "certificate" },
        ],
      },
      {
        id: "ps-04",
        skillId: "40000000-0000-0000-0000-000000000004",
        name: "Git & Version Control",
        category: "Tools & Infrastructure",
        currentLevel: 75,
        verificationStatus: "practical_verified",
        verificationBadge: {
          label: "Practical Verified",
          shortLabel: "Practical",
          variant: "success",
          description: "Hands-on branch management and conflict resolution verified.",
        },
        proofCount: 1,
        proofItems: [
          { id: "pf-06", title: "Multi-branch Rebase & Merge Challenge", type: "practical" },
        ],
      },
    ],
    projects: [
      {
        id: "proj-01",
        title: "E-Commerce Microservices Platform",
        description: "Built a fully functional REST API for an e-commerce platform including user authentication (JWT), product catalog management, and order processing logic.",
        technologies: ["Node.js", "Express", "PostgreSQL", "Docker"],
        githubUrl: "https://github.com/developer/ecommerce-platform-api",
        liveUrl: "https://ecommerce-api-demo.up.railway.app",
        verificationStatus: "verified",
      },
      {
        id: "proj-02",
        title: "Real-time Chat Service",
        description: "Implemented a WebSocket-based chat service allowing real-time messaging between users in different rooms with token bucket rate-limiting.",
        technologies: ["Socket.io", "Redis", "TypeScript"],
        githubUrl: "https://github.com/developer/realtime-chat-service",
        verificationStatus: "verified",
      },
    ],
    certifications: [
      {
        id: "cert-01",
        name: "PostgreSQL Associate Certification",
        issuingOrganization: "PostgreSQL Professional Guild",
        issueDate: "2024-08-15",
        verificationStatus: "evidence_verified",
      },
    ],
    auditRecords: [
      {
        id: "ar-01",
        skillName: "SQL",
        verificationType: "Evidence Verified",
        verifiedLevel: 82,
        source: "GitHub Repository Inspection",
        notes: "Repository contains schema migrations, connection pooling, and indexed queries.",
        verifiedAt: "2026-08-20",
      },
      {
        id: "ar-02",
        skillName: "Node.js",
        verificationType: "Assessment Verified",
        verifiedLevel: 80,
        source: "SkillBridge Knowledge Benchmark",
        notes: "Scored 80/100 on official server-side evaluated assessment.",
        verifiedAt: "2026-08-15",
      },
    ],
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
        defaultPassportData.profile.name = (profile as any).full_name
        defaultPassportData.profile.email = (profile as any).email
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    success: true,
    data: defaultPassportData,
  })
}
