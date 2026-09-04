"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Loader2, Info, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface SkillGapItem {
  skillId: string
  skillName: string
  avgLevel: number
  studentCount: number
}

interface InsightsData {
  summary: { totalStudents: number; studentsAssessed: number }
  skillGaps: SkillGapItem[]
  demandedSkills: { skillName: string; demandCount: number; avgRequiredLevel: number }[]
}

function GapSeverity(avgLevel: number, demandedAvg: number | undefined) {
  const gap = demandedAvg ? Math.max(demandedAvg - avgLevel, 0) : 0
  if (gap >= 20) return <Badge variant="critical">Critical</Badge>
  if (gap >= 10) return <Badge variant="warning">Needs Improvement</Badge>
  return <Badge variant="secondary">Moderate</Badge>
}

export default function InstitutionSkillGapsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient('/api/institution/insights')
      .then(json => { if (json.success) setData(json.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading skill gap intelligence...</p>
        </div>
      </div>
    )
  }

  const demandMap = new Map((data?.demandedSkills || []).map(d => [d.skillName, d.avgRequiredLevel]))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Institutional Skill Intelligence</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Cross-department skill benchmarking, gap distribution, and capability deficits across all active student cohorts.
        </p>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Total Students</p>
            <p className="text-2xl font-bold">{data.summary.totalStudents}</p>
          </div>
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Students Assessed</p>
            <p className="text-2xl font-bold text-[var(--color-accent)]">{data.summary.studentsAssessed}</p>
          </div>
        </div>
      )}

      {!data || data.skillGaps.length === 0 ? (
        <Card className="p-8 border-dashed">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <Info className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              Skill gap data will appear once students complete skill assessments. Encourage your cohort to take assessments on SkillBridge.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.skillGaps.map((gap, i) => {
            const industryReq = demandMap.get(gap.skillName)
            const deficit = industryReq ? Math.max(industryReq - gap.avgLevel, 0) : 0
            return (
              <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{gap.skillName}</h3>
                      {GapSeverity(gap.avgLevel, industryReq)}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      <strong className="text-[var(--color-foreground)]">{gap.studentCount} students</strong> assessed
                      {' '}• Cohort Avg: <strong className="text-[var(--color-foreground)]">{gap.avgLevel}</strong>
                      {industryReq && <> / Industry Req: <strong>{industryReq}</strong></>}
                    </p>
                    <div className="relative h-1.5 w-full max-w-xs bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${gap.avgLevel}%` }} />
                      {industryReq && (
                        <div className="absolute top-0 h-full w-0.5 bg-[var(--color-foreground)]/40" style={{ left: `${Math.min(industryReq, 100)}%` }} />
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {deficit > 0 ? (
                      <>
                        <div className="text-2xl font-bold text-[var(--color-critical)]">-{deficit} pts</div>
                        <span className="text-xs text-[var(--color-text-secondary)]">Avg Deficit</span>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-[var(--color-success)]">{gap.avgLevel}</div>
                        <span className="text-xs text-[var(--color-text-secondary)]">Avg Score</span>
                      </>
                    )}
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
