import { NextResponse } from 'next/server'

export async function GET() {
  const candidates = [
    {
      id: "cand-01",
      name: "Sarah Jenkins",
      email: "sarah.jenkins@student.techinst.edu",
      targetCareer: "Backend Developer",
      readinessScore: 78,
      readinessTier: "Ready",
      verifiedSkills: [
        { name: "SQL", score: 82, tier: "Evidence Verified" },
        { name: "Node.js", score: 80, tier: "Assessment Verified" },
        { name: "REST APIs", score: 75, tier: "Practical Verified" },
        { name: "Git & Version Control", score: 75, tier: "Practical Verified" },
      ],
      githubRepo: "https://github.com/developer/ecommerce-platform-api",
      status: "Shortlisted",
    },
    {
      id: "cand-02",
      name: "Michael Chen",
      email: "michael.chen@student.techinst.edu",
      targetCareer: "Frontend Developer",
      readinessScore: 84,
      readinessTier: "Ready",
      verifiedSkills: [
        { name: "React.js", score: 85, tier: "Evidence Verified" },
        { name: "JavaScript / TypeScript", score: 82, tier: "Practical Verified" },
        { name: "Tailwind CSS / HTML", score: 80, tier: "Practical Verified" },
      ],
      githubRepo: "https://github.com/developer/react-design-system",
      status: "Reviewed",
    },
    {
      id: "cand-03",
      name: "David Rodriguez",
      email: "david.rodriguez@student.techinst.edu",
      targetCareer: "Full Stack Engineer",
      readinessScore: 74,
      readinessTier: "Needs Improvement",
      verifiedSkills: [
        { name: "Node.js", score: 72, tier: "Practical Verified" },
        { name: "React.js", score: 70, tier: "Assessment Verified" },
        { name: "PostgreSQL", score: 75, tier: "Practical Verified" },
      ],
      githubRepo: "https://github.com/developer/fullstack-taskmanager",
      status: "Applied",
    },
  ]

  return NextResponse.json({
    success: true,
    data: candidates,
  })
}
