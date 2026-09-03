"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Target, CheckCircle2, BarChart3, Loader2, AlertCircle, Info } from "lucide-react"

interface InsightsData {
  summary: {
    totalOpportunities: number
    publishedOpportunities: number
    draftOpportunities: number
    totalApplications: number
    avgReadinessAtApplication: number
  }
  applicationsByStatus: Record<string, number>
  skillDemand: { skillName: string; demandCount: number; avgRequiredLevel: number }[]
  opportunities: { id: string; title: string; type: string; status: string }[]
}

export default function IndustryInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/industry/insights`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setData(json.data)
        } else {
          setError('Could not load insights data.')
        }
      })
      .catch(() => setError('Network error. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading real-time insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-[var(--color-critical)] border border-red-200 max-w-xl">
        <AlertCircle className="h-5 w-5 shrink-0" /> {error}
      </div>
    )
  }

  if (!data) return null

  const { summary, applicationsByStatus, skillDemand } = data
  const hasApplications = summary.totalApplications > 0
  const hasSkillData = skillDemand.length > 0

  const statusLabels: Record<string, string> = {
    applied: 'Applied',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    selected: 'Selected',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Talent & Skill Insights</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Real analytics from your opportunities and candidate data.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Total Opportunities</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{summary.totalOpportunities}</span>
              <span className="text-sm text-[var(--color-text-muted)] mb-0.5">{summary.publishedOpportunities} active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Total Applications</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-[var(--color-accent)]">{summary.totalApplications}</span>
              {!hasApplications && <span className="text-sm text-[var(--color-text-muted)] mb-0.5">No apps yet</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Avg Readiness on Apply</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-bold ${summary.avgReadinessAtApplication >= 65 ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}`}>
                {hasApplications ? `${summary.avgReadinessAtApplication}%` : '—'}
              </span>
              {hasApplications && (
                <span className="text-sm text-[var(--color-text-muted)] mb-0.5">at submission</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">Selected Candidates</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-[var(--color-success)]">
                {applicationsByStatus['selected'] || 0}
              </span>
              {hasApplications && (
                <span className="text-sm text-[var(--color-text-muted)] mb-0.5">
                  of {summary.totalApplications} applicants
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Pipeline */}
      {hasApplications ? (
        <Card className="border-[var(--color-border-primary)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--color-accent)]" /> Application Pipeline
            </CardTitle>
            <CardDescription>Current distribution of applications across pipeline stages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(applicationsByStatus).map(([status, count]) => {
              const pct = Math.round((count / summary.totalApplications) * 100)
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-[var(--color-text-secondary)] capitalize shrink-0">
                    {statusLabels[status] || status}
                  </span>
                  <div className="flex-1 h-2 bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[var(--color-border-primary)] border-dashed p-8">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <Info className="h-5 w-5 shrink-0" />
            <p className="text-sm">Application pipeline data will appear here once students start applying to your opportunities.</p>
          </div>
        </Card>
      )}

      {/* Skill Demand from Your Opportunities */}
      {hasSkillData ? (
        <Card className="border-[var(--color-border-primary)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--color-accent)]" /> Skills You Require Most
            </CardTitle>
            <CardDescription>
              Skills appearing most frequently across your opportunity requirements, with average minimum level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {skillDemand.map((s, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm truncate">{s.skillName}</span>
                    <Badge variant={s.avgRequiredLevel >= 75 ? 'critical' : s.avgRequiredLevel >= 60 ? 'warning' : 'secondary'}>
                      Avg Min: {s.avgRequiredLevel}
                    </Badge>
                  </div>
                  <div className="relative h-1.5 w-full bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-[var(--color-accent)] rounded-full"
                      style={{ width: `${Math.min(s.demandCount * 20, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)] shrink-0 w-20 text-right">
                  {s.demandCount} opportunit{s.demandCount !== 1 ? 'ies' : 'y'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed p-8">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <Info className="h-5 w-5 shrink-0" />
            <p className="text-sm">Skill demand analytics will appear when you add skill requirements to your opportunities.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
