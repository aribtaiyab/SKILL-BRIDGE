"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, AlertTriangle, BookOpen, UserCheck, TrendingUp, Loader2 } from "lucide-react"
import { getAcademicianDashboardData, AcademicianDashboardStats } from "@/lib/database/academician"

export default function AcademicianDashboardPage() {
  const [stats, setStats] = useState<AcademicianDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getAcademicianDashboardData()
        setStats(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading academician cohort intelligence...</p>
        </div>
      </div>
    )
  }

  const s = stats!

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Cohort Intelligence</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{s.cohortName}</p>
        </div>
        <Button variant="outline">
          Export Report
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total Cohort</p>
              <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold">{s.totalCohort}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Avg. Readiness</p>
              <TrendingUp className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-warning)]">{s.avgReadiness}%</div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Need Intervention</p>
              <AlertTriangle className="h-4 w-4 text-[var(--color-critical)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-critical)]">{s.needIntervention}</div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Internship Ready</p>
              <UserCheck className="h-4 w-4 text-[var(--color-success)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-success)]">{s.internshipReady}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-[var(--color-border-primary)] border-t-4 border-t-[var(--color-critical)]">
          <CardHeader>
            <div className="flex items-center gap-2 text-[var(--color-critical)] mb-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Critical Cohort Gaps</CardTitle>
            </div>
            <CardDescription>
              Based on the 78 students targeting Software Engineering roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-[var(--color-surface-secondary)] p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Primary Finding:</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                <span className="font-bold text-[var(--color-foreground)]">78%</span> of students targeting software development have weak Backend / REST API skills compared to active industry requirements.
              </p>
              <Button size="sm" className="mt-4 bg-[var(--color-critical)] hover:bg-red-700 text-white">
                <BookOpen className="mr-2 h-4 w-4" /> Conduct API Workshop
              </Button>
            </div>

            <div className="space-y-4">
              {s.criticalGaps.map((gap, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{gap.skill}</span>
                    <span className="text-[var(--color-critical)] text-xs">{gap.affected}</span>
                  </div>
                  <div className="relative h-2 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[var(--color-border-primary)]" style={{ width: `${gap.req}%` }} />
                    <div className="absolute top-0 left-0 h-full bg-[var(--color-critical)]" style={{ width: `${gap.current}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry Demand Alignment</CardTitle>
            <CardDescription>How well your curriculum matches current hiring needs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.alignmentItems.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.skill}</span>
                  {item.alignment < item.demand - 20 ? (
                    <Badge variant="warning" className="text-[10px]">Curriculum Gap</Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px]">Aligned</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)]">
                      <span>Demand</span>
                      <span>Alignment</span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-[var(--color-surface-secondary)]">
                      <div className="absolute h-full rounded-full bg-[var(--color-border-primary)] opacity-50" style={{ width: `${item.demand}%` }} />
                      <div className={`absolute h-full rounded-full ${item.alignment < item.demand - 20 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'}`} style={{ width: `${item.alignment}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}