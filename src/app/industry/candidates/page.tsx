"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Search, Filter, User, Shield, CheckCircle2, AlertTriangle,
  Loader2, TrendingUp, Building, ChevronDown, ChevronUp, Users
} from "lucide-react"

interface CandidateResult {
  applicationId: string
  applicationStatus: string
  appliedAt: string
  candidate: {
    id: string
    name: string
    institution: string
  }
  opportunity: {
    id: string
    title: string
    type: string
  }
  readiness: {
    matchPercentage: number
    readinessCategory: string
    skillsMetCount: number
    totalSkillsCount: number
    mainBlocker: string | null
    skills: {
      name: string
      met: boolean
      currentLevel: number
      requiredLevel: number
    }[]
  }
}

function MatchBar({ pct }: { pct: number }) {
  const color = pct >= 85 ? 'bg-[var(--color-success)]' : pct >= 65 ? 'bg-yellow-400' : 'bg-orange-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--color-border-primary)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold w-12 text-right ${pct >= 65 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
        {pct}%
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'applied': return <Badge variant="secondary">Applied</Badge>
    case 'shortlisted': return <Badge variant="warning">Shortlisted</Badge>
    case 'interview': return <Badge variant="success">Interview</Badge>
    case 'selected': return <Badge variant="success" className="bg-[var(--color-success)] text-white">Selected</Badge>
    case 'rejected': return <Badge variant="critical">Rejected</Badge>
    default: return <Badge variant="outline" className="capitalize">{status}</Badge>
  }
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateResult[]>([])
  const [opportunities, setOpportunities] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [oppFilter, setOppFilter] = useState('')
  const [minMatch, setMinMatch] = useState('0')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOpportunities = async () => {
    try {
      const res = await fetch('/api/industry/opportunities?status=published')
      const json = await res.json()
      if (json.success && json.data) {
        setOpportunities(json.data.map((o: any) => ({ id: o.id, title: o.title })))
      }
    } catch {
      // noop
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (oppFilter) params.set('opportunity_id', oppFilter)
      if (minMatch && parseInt(minMatch) > 0) params.set('min_match', minMatch)

      const res = await fetch(`/api/industry/candidates?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        setCandidates(json.data)
      } else {
        setCandidates([])
      }
    } catch {
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }, [oppFilter, minMatch])

  useEffect(() => { loadOpportunities() }, [])
  useEffect(() => { load() }, [load])

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId)
    try {
      const res = await fetch(`/api/industry/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setCandidates(prev =>
          prev.map(c => c.applicationId === applicationId ? { ...c, applicationStatus: newStatus } : c)
        )
      }
    } catch {
      // noop
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Candidate Discovery</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Pre-verified talent matched to your opportunities by skill readiness.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
          Ranked by deterministic readiness
        </div>
      </div>

      {/* Filters */}
      <Card className="border-[var(--color-border-primary)] shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Filter by Opportunity</label>
            <Select value={oppFilter} onChange={e => setOppFilter(e.target.value)}>
              <option value="">All Active Opportunities</option>
              {opportunities.map(o => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </Select>
          </div>
          <div className="w-full md:w-44">
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Minimum Match %</label>
            <Select value={minMatch} onChange={e => setMinMatch(e.target.value)}>
              <option value="0">Any Match</option>
              <option value="60">60%+ Match</option>
              <option value="75">75%+ Match</option>
              <option value="85">85%+ Match</option>
              <option value="90">90%+ Match</option>
            </Select>
          </div>
          <Button variant="outline" onClick={load} className="shrink-0">
            <Filter className="mr-2 h-4 w-4" /> Apply Filters
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Computing candidate readiness...</p>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No candidates found</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
            {opportunities.length === 0
              ? 'Publish an opportunity first to start receiving applications and seeing matched candidates.'
              : 'No applications match your current filters. Try lowering the minimum match threshold.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((c) => {
            const isExpanded = expandedId === c.applicationId
            return (
              <Card key={c.applicationId} className="hover:border-[var(--color-accent)] transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Candidate Info */}
                    <div className="w-full lg:w-1/4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center border border-[var(--color-border-primary)] shrink-0">
                          <User className="h-5 w-5 text-[var(--color-text-secondary)]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{c.candidate.name}</h3>
                          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 truncate">
                            <Building className="h-3 w-3 shrink-0" /> {c.candidate.institution}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-0.5">Applied for</p>
                        <p className="text-sm font-medium">{c.opportunity.title}</p>
                      </div>
                      <StatusBadge status={c.applicationStatus} />
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Applied {new Date(c.appliedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="hidden lg:block w-px bg-[var(--color-border-primary)]" />

                    {/* Readiness */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                          Skill Readiness
                        </h4>
                        <Badge variant={c.readiness.matchPercentage >= 85 ? 'success' : 'warning'}>
                          {c.readiness.matchPercentage}% — {c.readiness.readinessCategory}
                        </Badge>
                      </div>

                      <MatchBar pct={c.readiness.matchPercentage} />

                      <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                        {c.readiness.skillsMetCount} of {c.readiness.totalSkillsCount} required skills met
                        {c.readiness.mainBlocker && ` · Main gap: ${c.readiness.mainBlocker}`}
                      </p>

                      {/* Expandable Skills */}
                      {c.readiness.skills.length > 0 && (
                        <>
                          <button
                            className="mt-3 text-xs text-[var(--color-accent)] flex items-center gap-1 hover:underline"
                            onClick={() => setExpandedId(isExpanded ? null : c.applicationId)}
                          >
                            {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide skills</> : <><ChevronDown className="h-3.5 w-3.5" /> View skill breakdown</>}
                          </button>

                          {isExpanded && (
                            <div className="mt-3 grid sm:grid-cols-2 gap-2">
                              {c.readiness.skills.map((skill, idx) => (
                                <div key={idx} className="bg-[var(--color-surface-secondary)] p-2.5 rounded-lg border border-[var(--color-border-subtle)] flex items-center gap-2">
                                  {skill.met
                                    ? <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />
                                    : <AlertTriangle className="h-4 w-4 text-[var(--color-warning)] shrink-0" />}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-medium flex items-center gap-1">
                                        <Shield className="h-3 w-3 text-[var(--color-text-muted)]" />
                                        {skill.name}
                                      </span>
                                      <span className="text-xs text-[var(--color-text-secondary)]">
                                        {skill.currentLevel} / {skill.requiredLevel}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--color-border-primary)]">
                        {c.applicationStatus === 'applied' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === c.applicationId}
                            onClick={() => handleUpdateStatus(c.applicationId, 'shortlisted')}
                          >
                            {updatingId === c.applicationId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Shortlist'}
                          </Button>
                        )}
                        {c.applicationStatus === 'shortlisted' && (
                          <Button
                            size="sm"
                            disabled={updatingId === c.applicationId}
                            onClick={() => handleUpdateStatus(c.applicationId, 'interview')}
                          >
                            {updatingId === c.applicationId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Schedule Interview'}
                          </Button>
                        )}
                        {c.applicationStatus === 'interview' && (
                          <Button
                            size="sm"
                            className="bg-[var(--color-success)] text-white"
                            disabled={updatingId === c.applicationId}
                            onClick={() => handleUpdateStatus(c.applicationId, 'selected')}
                          >
                            {updatingId === c.applicationId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Select Candidate'}
                          </Button>
                        )}
                        {!['rejected', 'selected'].includes(c.applicationStatus) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[var(--color-critical)] hover:bg-red-50"
                            disabled={updatingId === c.applicationId}
                            onClick={() => handleUpdateStatus(c.applicationId, 'rejected')}
                          >
                            Reject
                          </Button>
                        )}
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