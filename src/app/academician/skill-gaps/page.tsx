"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, Info, BookOpen } from "lucide-react"

interface AcadInsightsData {
  summary: { totalStudents: number; studentsAssessed: number; avgSkillLevel: number }
  skillGaps: { skillName: string; avgLevel: number; studentCount: number }[]
  industryDemand: { skillName: string; demandCount: number; avgRequiredLevel: number }[]
}

export default function AcademicianSkillGapsPage() {
  const [data, setData] = useState<AcadInsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/academician/insights')
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

  // Build demand lookup
  const demandMap = new Map((data?.industryDemand || []).map(d => [d.skillName, d.avgRequiredLevel]))

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Cohort Skill Gaps</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Identify widespread technical bottlenecks across your student cohort to plan curriculum interventions.
        </p>
      </div>

      {data && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Total Students</p>
            <p className="text-2xl font-bold">{data.summary.totalStudents}</p>
          </div>
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Assessed</p>
            <p className="text-2xl font-bold text-[var(--color-accent)]">{data.summary.studentsAssessed}</p>
          </div>
          <div className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
            <p className="text-xs text-[var(--color-text-secondary)]">Cohort Avg Skill Level</p>
            <p className="text-2xl font-bold text-[var(--color-success)]">{data.summary.avgSkillLevel}</p>
          </div>
        </div>
      )}

      {!data || data.skillGaps.length === 0 ? (
        <Card className="p-8 border-dashed">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <Info className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              Cohort skill data will appear once students complete assessments. Share the SkillBridge platform with your students to begin building this intelligence.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.skillGaps.map((gap, i) => {
            const industryReq = demandMap.get(gap.skillName)
            const deficit = industryReq ? Math.max(industryReq - gap.avgLevel, 0) : 0
            const severity = deficit >= 20 ? 'Critical' : deficit >= 10 ? 'High' : 'Medium'

            return (
              <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-base">{gap.skillName}</h3>
                        <Badge variant={severity === 'Critical' ? 'critical' : 'warning'}>
                          {severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-foreground)]">{gap.studentCount} students</strong> assessed
                        {' '}• Cohort avg: <strong className="text-[var(--color-foreground)]">{gap.avgLevel}</strong>
                        {industryReq && <> / Industry min: <strong className="text-[var(--color-critical)]">{industryReq}</strong></>}
                        {deficit > 0 && <> • <strong className="text-[var(--color-critical)]">-{deficit} pts</strong> average deficit</>}
                      </p>
                      <div className="mt-2 relative h-1.5 w-full max-w-sm bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${gap.avgLevel}%` }} />
                        {industryReq && (
                          <div className="absolute top-0 h-full w-0.5 bg-[var(--color-foreground)]/40" style={{ left: `${Math.min(industryReq, 100)}%` }} />
                        )}
                      </div>
                    </div>
                    <Button size="sm" className="bg-[var(--color-accent)] shrink-0">
                      <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Plan Workshop
                    </Button>
                  </div>

                  {deficit > 0 && (
                    <div className="p-3 bg-[var(--color-surface-secondary)] rounded-md border border-[var(--color-border-primary)] text-xs text-[var(--color-text-secondary)]">
                      <strong className="text-[var(--color-foreground)]">Suggested Intervention:</strong>{' '}
                      Students need to improve <strong>{gap.skillName}</strong> by an average of {deficit} points to meet industry expectations. Consider scheduling a focused practical session or lab exercise.
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
