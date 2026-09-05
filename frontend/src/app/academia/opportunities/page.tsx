"use client"

import { useState, useEffect } from "react"
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  Loader2,
  Filter,
  CheckCircle2,
  ExternalLink,
  Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDemo } from "@/lib/demo/demo-context"
import { demoService } from "@/lib/demo/demo-service"

interface OpportunityItem {
  id: string
  title: string
  description: string
  type: string
  location: string
  workMode: string | null
  duration: string | null
  stipendAmount: number | null
  deadline: string
  provider: string
  skills: string[]
}

export default function AcademiaOpportunitiesPage() {
  const { isDemo } = useDemo()
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  // Publish Opportunity Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [oppType, setOppType] = useState('project')
  const [location, setLocation] = useState('Campus / Remote')
  const [duration, setDuration] = useState('3 Months')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      if (isDemo) {
        const demoList = demoService.getOpportunities(typeFilter).map(o => ({
          id: o.id,
          title: o.title,
          description: o.description,
          type: o.type,
          location: o.location,
          workMode: o.workMode,
          duration: o.duration,
          stipendAmount: o.stipendAmount,
          deadline: o.deadline,
          provider: o.provider,
          skills: o.requiredSkills.map(s => s.name),
        }))
        setOpportunities(demoList)
        setLoading(false)
        return
      }

      const res = await fetch(`/api/academia/opportunities?type=${typeFilter}`)
      const json = await res.json()
      if (json.success) {
        setOpportunities(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [typeFilter, isDemo])

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    try {
      setSubmitting(true)
      if (isDemo) {
        demoService.addOpportunity({
          title,
          description,
          type: oppType,
          location,
          duration,
          deadline: deadline || null,
        })
        setShowCreateModal(false)
        setTitle('')
        setDescription('')
        setToastMessage('Academic project published to Opportunity Hub! (Demo session)')
        fetchOpportunities()
        setTimeout(() => setToastMessage(null), 5000)
        return
      }

      const res = await fetch('/api/academia/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type: oppType,
          location,
          duration,
          deadline: deadline || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create opportunity')
      }
      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setToastMessage('Academic project published to Opportunity Hub!')
      fetchOpportunities()
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      alert(err.message || 'Error publishing opportunity')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Demo Notice */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Demo Sandbox:</strong> Browsing live corporate & faculty listings with opportunity readiness benchmarks.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Opportunity Hub & Industry Collaboration
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Real industry internships, sponsored capstones, and faculty research projects aligned with student competencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--color-accent)] hover:opacity-90 text-white shadow-sm flex items-center gap-2 text-xs"
          >
            <Plus className="h-4 w-4" />
            Publish Academic Project
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-[var(--radius-card)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] pb-2 text-xs font-medium">
        {[
          { id: 'all', label: 'All Opportunities' },
          { id: 'internship', label: 'Internships' },
          { id: 'job', label: 'Full-Time Roles' },
          { id: 'project', label: 'Research & Capstones' },
          { id: 'workshop', label: 'Collaborative Labs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-[var(--radius-control)] transition-colors ${
              typeFilter === tab.id
                ? 'bg-[var(--color-accent)] text-white font-bold'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          <p className="text-xs text-[var(--color-text-muted)]">Loading opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 text-center rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] space-y-3">
          <Briefcase className="h-8 w-8 text-[var(--color-text-muted)] mx-auto" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No published opportunities found</p>
          <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
            Opportunities published by industry partners or faculty will appear here. Students with verified skill readiness can be directly matched.
          </p>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--color-accent)] text-white text-xs mt-2"
          >
            Publish Capstone / Research Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm p-5 flex flex-col justify-between hover:border-[var(--color-accent)]/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 uppercase tracking-wider">
                    {opp.type}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    Deadline: {opp.deadline}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">{opp.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {opp.provider}
                  </p>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">{opp.description}</p>

                <div className="pt-2 border-t border-[var(--color-border-primary)] space-y-1 text-xs text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-[var(--color-accent)]" />
                    <span>{opp.location} {opp.workMode ? `(${opp.workMode})` : ''}</span>
                  </div>
                  {opp.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-[var(--color-accent)]" />
                      <span>{opp.duration}</span>
                    </div>
                  )}
                </div>

                {opp.skills?.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {opp.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-card-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--color-border-primary)] flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {opp.stipendAmount ? `₹${opp.stipendAmount.toLocaleString()}/mo` : 'Stipend / Honorarium'}
                </span>
                <span className="text-[11px] font-medium text-[var(--color-accent)] flex items-center gap-1">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Academic Collaboration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Publish Academic Project / Capstone</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Open an initiative on the shared Opportunity Hub for students</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Database Research Lab / AI Verification Benchmark"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Opportunity Type</label>
                  <select
                    value={oppType}
                    onChange={(e) => setOppType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="project">Research / Capstone Project</option>
                    <option value="internship">Academic Research Internship</option>
                    <option value="workshop">Hands-On Hackathon / Challenge</option>
                    <option value="job">Teaching Assistantship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Work Mode & Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Scope & Objectives</label>
                <textarea
                  rows={3}
                  placeholder="Describe prerequisites, deliverables, and role expectations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-primary)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-[var(--color-accent)] hover:opacity-90 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Opportunity'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
