"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users, AlertTriangle, BookOpen, TrendingUp,
  Loader2, Presentation, Award, ArrowRight, ShieldCheck
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"

interface InsightsData {
  summary: {
    totalStudents: number
    studentsAssessed: number
    avgSkillLevel: number
    avgReadiness: number
    needIntervention: number
    departmentName?: string
  }
  topSkills: { skillName: string; avgLevel: number; studentCount: number }[]
  skillGaps: {
    skillId: string
    skillName: string
    category: string
    avgLevel: number
    requiredLevel: number
    gap: number
    severity: 'Critical' | 'Needs Improvement' | 'Ready'
    studentCount: number
    affectedFraction: string
  }[]
  criticalGaps: {
    skillName: string
    affectedFraction: string
    avgLevel: number
    requiredLevel: number
    gap: number
  }[]
  industryDemand: {
    skillName: string
    demandCount: number
    avgRequiredLevel: number
  }[]
}

export default function AcademicianDashboardPage() {
  const { isDemo, academicianData } = useDemo()
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setData({
        summary: {
          totalStudents: academicianData.totalStudents,
          studentsAssessed: 4,
          avgSkillLevel: academicianData.averageReadiness,
          avgReadiness: academicianData.averageReadiness,
          needIntervention: 2,
          departmentName: academicianData.cohortName,
        },
        topSkills: [
          { skillName: "Java", avgLevel: 88, studentCount: 4 },
          { skillName: "Database Systems", avgLevel: 78, studentCount: 4 },
        ],
        skillGaps: [
          {
            skillId: "sg-1",
            skillName: "Spring Boot",
            category: "Backend",
            avgLevel: 56,
            requiredLevel: 75,
            gap: 19,
            severity: "Critical",
            studentCount: 4,
            affectedFraction: "4/4 (100%)",
          },
          {
            skillId: "sg-2",
            skillName: "SQL Optimization",
            category: "Database",
            avgLevel: 68,
            requiredLevel: 75,
            gap: 7,
            severity: "Needs Improvement",
            studentCount: 2,
            affectedFraction: "2/4 (50%)",
          },
        ],
        criticalGaps: [
          {
            skillName: "Spring Boot",
            affectedFraction: "4/4 (100%)",
            avgLevel: 56,
            requiredLevel: 75,
            gap: 19,
          },
          {
            skillName: "SQL Optimization",
            affectedFraction: "2/4 (50%)",
            avgLevel: 68,
            requiredLevel: 75,
            gap: 7,
          },
        ],
        industryDemand: [
          { skillName: "Java", demandCount: 12, avgRequiredLevel: 90 },
          { skillName: "Spring Boot", demandCount: 10, avgRequiredLevel: 85 },
          { skillName: "SQL", demandCount: 8, avgRequiredLevel: 75 },
        ],
      })
      setLoading(false)
      return
    }

    async function load() {
      try {
        const json = await apiClient('/api/academician/insights')
        if (json.success && json.data) {
          setData(json.data)
        }
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isDemo, academicianData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading academic cohort intelligence...</p>
        </div>
      </div>
    )
  }

  const s = data?.summary || {
    totalStudents: 0,
    studentsAssessed: 0,
    avgSkillLevel: 0,
    avgReadiness: 0,
    needIntervention: 0,
    departmentName: 'Department Cohort',
  }

  const criticalGaps = data?.criticalGaps || []
  const industryDemand = data?.industryDemand || []

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Cohort Skill Intelligence</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{s.departmentName}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/academician/workshops">
            <Button size="sm" className="bg-[var(--color-accent)] cursor-pointer">
              <Presentation className="mr-1.5 h-4 w-4" /> Host Workshop
            </Button>
          </Link>
          <Link href="/academician/mentorship">
            <Button size="sm" variant="outline" className="cursor-pointer">
              <BookOpen className="mr-1.5 h-4 w-4" /> Mentorship
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total Students</p>
              <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold">{s.totalStudents}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {s.studentsAssessed} assessed with verified scores
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Avg. Readiness</p>
              <TrendingUp className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-accent)]">{s.avgReadiness}%</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Across career target requirements</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Need Intervention</p>
              <AlertTriangle className="h-4 w-4 text-[var(--color-critical)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-critical)]">{s.needIntervention}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Deficit &gt; 15 pts on core skills</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Active Gaps</p>
              <ShieldCheck className="h-4 w-4 text-[var(--color-success)]" />
            </div>
            <div className="text-3xl font-bold">{criticalGaps.length}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Identified curriculum bottlenecks</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Gaps Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-h2 font-semibold">Priority Skill Shortages</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Widespread bottlenecks identified across student benchmark assessments.
            </p>
          </div>
          <Link href="/academician/skill-gaps">
            <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
              View All Gaps <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {criticalGaps.length === 0 ? (
          <Card className="p-8 border-dashed text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              No critical skill shortages detected. Cohort skill levels meet target industry benchmarks.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {criticalGaps.map((gap, idx) => (
              <Card key={idx} className="border-[var(--color-border-primary)] shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold">{gap.skillName}</CardTitle>
                    <Badge variant="critical">Critical Deficit</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Impact: {gap.affectedFraction} students • Avg: {gap.avgLevel} / Req: {gap.requiredLevel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Cohort Score</span>
                      <span className="text-[var(--color-critical)]">-{gap.gap} pts gap</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-critical)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (gap.avgLevel / gap.requiredLevel) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link href={`/academician/workshops?skill=${encodeURIComponent(gap.skillName)}`}>
                      <Button size="sm" variant="outline" className="text-xs cursor-pointer">
                        <Presentation className="mr-1.5 h-3.5 w-3.5" /> Plan Workshop
                      </Button>
                    </Link>
                    <Link href={`/academician/students?search=${encodeURIComponent(gap.skillName)}`}>
                      <Button size="sm" variant="ghost" className="text-xs cursor-pointer">
                        View Affected Students →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Real Industry Demand Calibration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-h2 font-semibold">Industry Skill Demand Calibration</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Active requirements extracted from verified hiring partner opportunities.
            </p>
          </div>
          <Link href="/academician/industry">
            <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
              Demand Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {industryDemand.length === 0 ? (
          <Card className="p-8 border-dashed text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              No active industry opportunities published yet.
            </p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {industryDemand.slice(0, 3).map((item, i) => (
              <Card key={i} className="border-[var(--color-border-primary)]">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{item.skillName}</span>
                    <Badge variant="secondary">{item.demandCount} Openings</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Required Level: <strong className="text-[var(--color-foreground)]">{item.avgRequiredLevel} / 100</strong>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}