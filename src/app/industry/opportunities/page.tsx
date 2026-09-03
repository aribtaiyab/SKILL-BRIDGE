"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Search, PlusCircle, Filter, MapPin, Users, Calendar,
  Loader2, AlertCircle, Eye, MoreHorizontal, CheckCircle2,
  Clock, Archive, Globe, PauseCircle
} from "lucide-react"

interface IndustryOpportunity {
  id: string
  title: string
  opportunity_type: string
  location: string
  status: string
  deadline: string | null
  spots_available: number | null
  created_at: string
  _applicationCount?: number
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'published': return <Badge variant="success" className="bg-[var(--color-success)] text-white">Active</Badge>
    case 'draft': return <Badge variant="secondary">Draft</Badge>
    case 'closed': return <Badge variant="warning">Closed</Badge>
    case 'archived': return <Badge variant="secondary" className="opacity-60">Archived</Badge>
    default: return <Badge variant="outline" className="capitalize">{status}</Badge>
  }
}

export default function IndustryOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<IndustryOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/industry/opportunities?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        setOpportunities(json.data)
      } else {
        setOpportunities([])
        if (!json.success) setError('Could not load opportunities. Please try again.')
      }
    } catch {
      setOpportunities([])
      setError('Network error. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/industry/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status } : o))
      }
    } catch {
      // noop
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = opportunities.filter(o =>
    !search || o.title.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'

  const isDeadlinePassed = (d: string | null) => d ? new Date(d) < new Date() : false

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Manage Opportunities</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Create and track your published roles and programs.</p>
        </div>
        <Link href="/industry/opportunities/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Opportunity
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Search opportunities..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-44">
          <option value="">All Statuses</option>
          <option value="published">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </Select>
        <Button variant="outline" onClick={load}>
          <Filter className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      {!loading && opportunities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: opportunities.length, color: '' },
            { label: 'Active', value: opportunities.filter(o => o.status === 'published').length, color: 'text-[var(--color-success)]' },
            { label: 'Draft', value: opportunities.filter(o => o.status === 'draft').length, color: '' },
            { label: 'Closed', value: opportunities.filter(o => o.status === 'closed').length, color: 'text-[var(--color-text-secondary)]' },
          ].map(stat => (
            <div key={stat.label} className="bg-[var(--color-surface-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
              <p className="text-xs text-[var(--color-text-secondary)]">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Globe className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">
            {opportunities.length === 0 ? 'No opportunities yet' : 'No results match your filters'}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-4">
            {opportunities.length === 0
              ? 'Create your first opportunity to start matching with pre-verified candidates.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {opportunities.length === 0 && (
            <Link href="/industry/opportunities/create">
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Opportunity</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((opp) => (
            <Card key={opp.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusBadge status={opp.status} />
                      <Badge variant="outline" className="text-[var(--color-text-secondary)]">{opp.opportunity_type}</Badge>
                      {isDeadlinePassed(opp.deadline) && opp.status === 'published' && (
                        <Badge variant="warning" className="text-xs">Deadline Passed</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{opp.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)] mt-2">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {opp.location}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Deadline: {formatDate(opp.deadline)}</span>
                      {opp.spots_available !== null && (
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {opp.spots_available} spot{opp.spots_available !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link href={`/industry/opportunities/${opp.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                      </Button>
                    </Link>

                    {opp.status === 'draft' && (
                      <Button
                        size="sm"
                        disabled={updatingId === opp.id}
                        onClick={() => updateStatus(opp.id, 'published')}
                        className="bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90"
                      >
                        {updatingId === opp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Publish</>}
                      </Button>
                    )}

                    {opp.status === 'published' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === opp.id}
                        onClick={() => updateStatus(opp.id, 'closed')}
                      >
                        {updatingId === opp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Close</>}
                      </Button>
                    )}

                    {(opp.status === 'closed' || opp.status === 'published') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--color-text-muted)]"
                        disabled={updatingId === opp.id}
                        onClick={() => updateStatus(opp.id, 'archived')}
                        title="Archive opportunity"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Application count link */}
                {opp.status === 'published' && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)] flex items-center justify-between">
                    <Link
                      href={`/industry/applications?opportunity_id=${opp.id}`}
                      className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] flex items-center gap-1.5"
                    >
                      <Users className="h-4 w-4" /> View candidates who applied
                    </Link>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Created {new Date(opp.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}