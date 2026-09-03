"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, Calendar, CheckCircle2, ExternalLink, Loader2, FileText, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface ApplicationItem {
  id: string
  status: string
  created_at: string
  updated_at: string
  opportunities: {
    id: string
    title: string
    opportunity_type: string
    location: string
    industry_profiles: { organization_name: string } | null
  } | null
  readinessSnapshot: {
    readinessPercentage: number
    skillsMet: number
    totalSkills: number
    snapshotAt: string
    snapshot_data?: any
  } | null
  timeline: { status: string; note: string | null; changed_at: string }[]
}

const STATUS_ORDER = ['applied', 'shortlisted', 'under_review', 'interview', 'selected', 'rejected', 'withdrawn']

function getStatusBadge(status: string) {
  switch (status) {
    case 'selected': return <Badge variant="success" className="bg-[var(--color-success)] text-white">Selected</Badge>
    case 'shortlisted': return <Badge variant="success" className="bg-[var(--color-success)]/80 text-white">Shortlisted</Badge>
    case 'interview': return <Badge variant="success">Interview Scheduled</Badge>
    case 'rejected': return <Badge variant="secondary" className="bg-gray-200 text-gray-600">Not Selected</Badge>
    case 'withdrawn': return <Badge variant="secondary">Withdrawn</Badge>
    case 'applied': return <Badge variant="outline" className="border-[var(--color-accent)] text-[var(--color-accent)]">Applied</Badge>
    default: return <Badge variant="outline" className="capitalize">{status}</Badge>
  }
}

type TabStatus = 'all' | 'applied' | 'interview' | 'selected' | 'rejected'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabStatus>('all')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/applications`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setApplications(json.data)
        } else {
          setApplications([])
        }
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }, [])

  const tabs: { key: TabStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'applied', label: 'Pending' },
    { key: 'interview', label: 'Interview' },
    { key: 'selected', label: 'Selected' },
    { key: 'rejected', label: 'Closed' },
  ]

  const filtered = applications.filter(a => {
    if (tab === 'all') return true
    if (tab === 'applied') return ['applied', 'shortlisted', 'under_review'].includes(a.status)
    if (tab === 'rejected') return ['rejected', 'withdrawn'].includes(a.status)
    return a.status === tab
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading your applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">My Applications</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Track the status of your opportunity applications.</p>
        </div>
        {applications.length > 0 && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {applications.length} application{applications.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Status Tabs */}
      {applications.length > 0 && (
        <div className="flex gap-1 bg-[var(--color-surface-secondary)] rounded-xl p-1 w-fit overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-[var(--color-surface-card)] text-[var(--color-foreground)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-60">
                {t.key === 'all' ? applications.length
                  : t.key === 'applied' ? applications.filter(a => ['applied', 'shortlisted', 'under_review'].includes(a.status)).length
                  : t.key === 'rejected' ? applications.filter(a => ['rejected', 'withdrawn'].includes(a.status)).length
                  : applications.filter(a => a.status === t.key).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {applications.length === 0 ? (
        <Card className="p-12 text-center bg-[var(--color-surface-secondary)] border-dashed">
          <FileText className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-4">
            You haven't applied to any opportunities yet. Explore your top matches on the Opportunity Hub.
          </p>
          <Link href="/student/opportunities">
            <Button>Discover Opportunities</Button>
          </Link>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-[var(--color-text-secondary)]">No applications in this category.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filtered.map((app) => {
            const opp = app.opportunities
            const snap = app.readinessSnapshot
            const isActive = ['applied', 'shortlisted', 'under_review', 'interview'].includes(app.status)

            return (
              <Card key={app.id} className="overflow-hidden border-[var(--color-border-primary)] shadow-sm">
                <div className={`h-1.5 w-full ${
                  app.status === 'selected' ? 'bg-[var(--color-success)]' :
                  app.status === 'rejected' ? 'bg-gray-300' :
                  app.status === 'interview' ? 'bg-blue-400' :
                  app.status === 'shortlisted' ? 'bg-[var(--color-success)]/60' :
                  'bg-[var(--color-accent)]'
                }`} />
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      {/* Left: App info */}
                      <div className="w-full md:w-2/5">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getStatusBadge(app.status)}
                        </div>
                        <h3 className="text-lg font-semibold">{opp?.title || 'Opportunity'}</h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mt-1 mb-4">
                          <Building className="h-4 w-4" />
                          {opp?.industry_profiles?.organization_name || 'Organization'}
                        </div>

                        <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                          <div className="flex justify-between">
                            <span>Applied:</span>
                            <span className="font-medium text-[var(--color-foreground)]">
                              {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Update:</span>
                            <span className="font-medium text-[var(--color-foreground)]">
                              {new Date(app.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Readiness Snapshot */}
                        {snap && (
                          <div className="mt-4 p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]">
                            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                              Readiness When Applied
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xl font-bold ${snap.readinessPercentage >= 65 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                                {snap.readinessPercentage}%
                              </span>
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                {snap.skillsMet}/{snap.totalSkills} skills met
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)] flex flex-col gap-2">
                          {opp?.id && (
                            <Link href={`/student/opportunities/${opp.id}`}>
                              <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-[var(--color-surface-secondary)]">
                                View Opportunity <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          )}
                          {isActive && opp?.id && (
                            <Link href={`/student/ai-coach?opportunity=${opp.id}`}>
                              <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                                <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Improve Readiness
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Right: Timeline */}
                      <div className="w-full md:w-3/5 bg-[var(--color-surface-secondary)]/50 rounded-lg p-5 border border-[var(--color-border-primary)]/50">
                        <h4 className="text-sm font-semibold mb-4 text-[var(--color-text-secondary)] uppercase tracking-wider">
                          Application Timeline
                        </h4>

                        <div className="relative">
                          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[var(--color-border-primary)]" />
                          <div className="space-y-4 relative">
                            {app.timeline.length > 0 ? (
                              app.timeline.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-success)] bg-[var(--color-success)] text-white">
                                    <CheckCircle2 className="h-3 w-3" />
                                  </div>
                                  <div className="pt-0.5">
                                    <p className="text-sm font-medium capitalize">{step.status}</p>
                                    {step.note && (
                                      <p className="text-xs text-[var(--color-text-secondary)]">{step.note}</p>
                                    )}
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                      {new Date(step.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              // Fallback synthesized timeline from current status
                              STATUS_ORDER.slice(0, STATUS_ORDER.indexOf(app.status) + 1).map((s, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-success)] bg-[var(--color-success)] text-white">
                                    <CheckCircle2 className="h-3 w-3" />
                                  </div>
                                  <div className="pt-0.5">
                                    <p className="text-sm font-medium capitalize">{s}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
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