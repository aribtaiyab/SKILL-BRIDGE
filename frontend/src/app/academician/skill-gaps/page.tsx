"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, Info, BookOpen, Presentation, Filter } from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"

interface SkillGapItem {
  skillId: string
  skillName: string
  category: string
  avgLevel: number
  requiredLevel: number
  gap: number
  severity: 'Critical' | 'Needs Improvement' | 'Ready'
  studentCount: number
  affectedFraction: string
}

interface AcadInsightsData {
  summary: { totalStudents: number; studentsAssessed: number; avgSkillLevel: number }
  skillGaps: SkillGapItem[]
  industryDemand: { skillName: string; demandCount: number; avgRequiredLevel: number }[]
}

export default function AcademicianSkillGapsPage() {
  const { isDemo } = useDemo()
  const [data, setData] = useState<AcadInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'Critical' | 'Needs Improvement'>('all')

  useEffect(() => {
    if (isDemo) {
      setData({
        summary: { totalStudents: 4, studentsAssessed: 4, avgSkillLevel: 72 },
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
          {
            skillId: "sg-3",
            skillName: "Docker Containerization",
            category: "DevOps",
            avgLevel: 62,
            requiredLevel: 80,
            gap: 18,
            severity: "Critical",
            studentCount: 3,
            affectedFraction: "3/4 (75%)",
          },
        ],
        industryDemand: [
          { skillName: "Spring Boot", demandCount: 10, avgRequiredLevel: 85 },
          { skillName: "SQL", demandCount: 8, avgRequiredLevel: 75 },
          { skillName: "Docker", demandCount: 6, avgRequiredLevel: 80 },
        ],
      })
      setLoading(false)
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/academician/insights`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) setData(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isDemo])

  const filteredGaps = useMemo(() => {
    if (!data?.skillGaps) return []
    if (severityFilter === 'all') return data.skillGaps
    return data.skillGaps.filter(g => g.severity === severityFilter)
  }, [data, severityFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading cohort skill intelligence...</p>
        </div>
      </div>
    )
  }

  const demandMap = new Map((data?.industryDemand || []).map(d => [d.skillName, d.avgRequiredLevel]))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Cohort Skill Gaps</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Identify widespread technical bottlenecks across your student cohort to plan curriculum interventions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
          >
            <option value="all">All Gaps</option>
            <option value="Critical">Critical Deficits Only</option>
            <option value="Needs Improvement">Moderate Gaps</option>
          </select>
        </div>
      </div>

      {data && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Total Cohort Students</p>
            <p className="text-2xl font-bold">{data.summary.totalStudents}</p>
          </div>
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Assessed with Benchmarks</p>
            <p className="text-2xl font-bold text-[var(--color-accent)]">{data.summary.studentsAssessed}</p>
          </div>
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Cohort Avg Skill Level</p>
            <p className="text-2xl font-bold text-[var(--color-success)]">{data.summary.avgSkillLevel} / 100</p>
          </div>
        </div>
      )}

      {!data || filteredGaps.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
            <Info className="h-6 w-6 text-[var(--color-accent)]" />
            <p className="text-sm">
              No skill gaps found for the selected filter.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGaps.map((gap, i) => {
            const industryReq = demandMap.get(gap.skillName) || gap.requiredLevel
            const deficit = Math.max(industryReq - gap.avgLevel, 0)
            const severity = gap.severity

            return (
              <Card key={i} className="border-[var(--color-border-primary)] shadow-sm hover:border-[var(--color-accent)]/40 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-base">{gap.skillName}</h3>
                        <Badge variant={severity === 'Critical' ? 'critical' : 'warning'}>
                          {severity}
                        </Badge>
                        <span className="text-xs text-[var(--color-text-muted)]">• {gap.category}</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-foreground)]">{gap.studentCount} students</strong> assessed
                        {' '}• Cohort avg: <strong className="text-[var(--color-foreground)]">{gap.avgLevel}</strong>
                        {' '}/ Industry target: <strong className="text-[var(--color-critical)]">{industryReq}</strong>
                        {deficit > 0 && <> • <strong className="text-[var(--color-critical)]">-{deficit} pts</strong> average deficit</>}
                      </p>
                      <div className="mt-2 relative h-2 w-full max-w-md bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${severity === 'Critical' ? 'bg-[var(--color-critical)]' : 'bg-[var(--color-warning)]'}`}
                          style={{ width: `${Math.min(100, (gap.avgLevel / industryReq) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/academician/workshops?skill=${encodeURIComponent(gap.skillName)}`}>
                        <Button size="sm" className="bg-[var(--color-accent)] cursor-pointer">
                          <Presentation className="mr-1.5 h-3.5 w-3.5" /> Host Workshop
                        </Button>
                      </Link>
                      <Link href={`/academician/mentorship?skill=${encodeURIComponent(gap.skillName)}`}>
                        <Button size="sm" variant="outline" className="cursor-pointer">
                          <BookOpen className="mr-1.5 h-3.5 w-3.5" /> 1-on-1 Coaching
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
