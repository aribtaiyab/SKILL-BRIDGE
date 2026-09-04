import { NextResponse } from 'next/server'

export async function GET() {
  const insightsData = {
    summary: {
      totalStudents: 120,
      studentsAssessed: 98,
      avgSkillLevel: 74,
      avgReadiness: 76,
      needIntervention: 28,
      departmentName: "Computer Science & Engineering Cohort",
    },
    topSkills: [
      { skillName: "PostgreSQL / SQL", avgLevel: 82, studentCount: 92 },
      { skillName: "Git & Version Control", avgLevel: 76, studentCount: 88 },
      { skillName: "React.js", avgLevel: 71, studentCount: 75 },
    ],
    skillGaps: [
      {
        skillId: "sg-01",
        skillName: "Node.js & Express Async Architecture",
        category: "Backend & APIs",
        avgLevel: 58,
        requiredLevel: 80,
        gap: 22,
        severity: "Critical",
        studentCount: 76,
        affectedFraction: "76/98 (78%)",
      },
      {
        skillId: "sg-02",
        skillName: "REST API Security & Error Boundaries",
        category: "Backend & APIs",
        avgLevel: 62,
        requiredLevel: 75,
        gap: 13,
        severity: "Needs Improvement",
        studentCount: 54,
        affectedFraction: "54/98 (55%)",
      },
      {
        skillId: "sg-03",
        skillName: "Docker Containerization & CI/CD",
        category: "Tools & Infrastructure",
        avgLevel: 45,
        requiredLevel: 65,
        gap: 20,
        severity: "Critical",
        studentCount: 68,
        affectedFraction: "68/98 (69%)",
      },
    ],
    criticalGaps: [
      {
        skillName: "Node.js & Express Async Architecture",
        affectedFraction: "78% students targeting backend need API help",
        avgLevel: 58,
        requiredLevel: 80,
        gap: 22,
      },
      {
        skillName: "Docker Containerization & CI/CD",
        affectedFraction: "69% students lack container deployment experience",
        avgLevel: 45,
        requiredLevel: 65,
        gap: 20,
      },
    ],
    industryDemand: [
      { skillName: "Node.js & Microservices", demandCount: 24, avgRequiredLevel: 80 },
      { skillName: "SQL & Query Optimization", demandCount: 20, avgRequiredLevel: 75 },
      { skillName: "Docker & Cloud Deployments", demandCount: 18, avgRequiredLevel: 70 },
      { skillName: "React & TypeScript", demandCount: 16, avgRequiredLevel: 75 },
    ],
  }

  return NextResponse.json({
    success: true,
    data: insightsData,
  })
}
