"use client"

import { useState, useEffect } from "react"
import {
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Loader2,
  ArrowRight,
  BarChart3,
  BookOpen,
  Presentation,
  Sliders,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface InterventionItem {
  id: string
  title: string
  description: string
  interventionType: 'workshop' | 'mentorship' | 'curriculum_update' | 'bootcamp'
  skillName: string
  skillId: string | null
  status: 'active' | 'completed' | 'scheduled'
  startDate: string | null
  endDate: string | null
  enrolledCount: number
  reassessedCount: number
  preReadinessAvg: number
  postReadinessAvg: number
  netImprovementLift: number
  createdAt: string
}

import { useDemo } from "@/lib/demo/demo-context"

export default function AcademiaInterventionsPage() {
  const { isDemo, demoService } = useDemo()
  const [interventions, setInterventions] = useState<InterventionItem[]>([])
  const [loading, setLoading] = useState(true)

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [interventionType, setInterventionType] = useState<'workshop' | 'mentorship' | 'curriculum_update' | 'bootcamp'>('workshop')
  const [targetStudents, setTargetStudents] = useState(30)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchInterventions = async () => {
    try {
      setLoading(true)

      if (isDemo) {
        const list = demoService.getInterventions()
        setInterventions(list as any)
        setLoading(false)
        return
      }

      const res = await fetch('/api/academia/interventions')
      const json = await res.json()
      if (json.success) {
        setInterventions(json.data || [])
      }
    } catch (err) {
      console.error('Interventions fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterventions()
  }, [isDemo])

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    try {
      setSubmitting(true)

      if (isDemo) {
        demoService.addIntervention({
          title,
          description,
          interventionType,
          targetStudents,
          startDate,
          endDate: endDate || null,
        })
        setShowCreateModal(false)
        setTitle('')
        setDescription('')
        setToastMessage('Demo Simulation: Intervention program staged in session!')
        fetchInterventions()
        setTimeout(() => setToastMessage(null), 5000)
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/academia/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          interventionType,
          targetStudents,
          startDate,
          endDate: endDate || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create intervention')
      }
      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setToastMessage('Faculty intervention program designed and scheduled successfully!')
      fetchInterventions()
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      alert(err.message || 'Error creating intervention')
    } finally {
      setSubmitting(false)
    }
  }

  const totalEnrolled = interventions.reduce((sum, i) => sum + i.enrolledCount, 0)
  const totalReassessed = interventions.reduce((sum, i) => sum + i.reassessedCount, 0)
  const avgLift = interventions.length > 0
    ? Math.round(interventions.reduce((sum, i) => sum + i.netImprovementLift, 0) / interventions.length)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Intervention Hub & Longitudinal Efficacy
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Track whether faculty interventions (masterclasses, 1-on-1 coaching, remedial drills) measurably close skill gaps
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--color-accent)] hover:opacity-90 text-white shadow-sm flex items-center gap-2 text-xs"
          >
            <Plus className="h-4 w-4" />
            Design Intervention
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-[var(--radius-card)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Average Readiness Lift</span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {avgLift >= 0 ? `+${avgLift}` : avgLift} pts
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Net post-intervention score gain</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Students Enrolled</span>
            <div className="h-8 w-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{totalEnrolled}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Learners receiving structured support</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Reassessed Learners</span>
            <div className="h-8 w-8 rounded-full bg-[#F0F6F9]0/10 flex items-center justify-center text-[var(--color-accent)]">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{totalReassessed}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
            {totalEnrolled > 0 ? `${Math.round((totalReassessed / totalEnrolled) * 100)}% verification rate` : 'Awaiting initial cohort'}
          </p>
        </div>
      </div>

      {/* Interventions Efficacy List */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Longitudinal Intervention Programs</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Verified pre vs post skill metrics across institutional cohorts</p>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            Total Programs: <strong className="text-[var(--color-text-primary)]">{interventions.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            <p className="text-xs text-[var(--color-text-muted)]">Analyzing longitudinal intervention outcomes...</p>
          </div>
        ) : interventions.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <Sparkles className="h-8 w-8 text-[var(--color-text-muted)] mx-auto" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No interventions launched yet</p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
              Design structured interventions to help groups of students bridge critical skill gaps and track their before/after test scores.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--color-accent)] text-white text-xs mt-2"
            >
              Design Your First Intervention
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-primary)]">
            {interventions.map((item) => (
              <div key={item.id} className="p-6 hover:bg-[var(--color-surface-card-hover)]/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 capitalize">
                        {item.interventionType.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : item.status === 'active'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                        Competency: <strong className="text-[var(--color-text-primary)]">{item.skillName}</strong>
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[var(--color-text-primary)]">{item.title}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">{item.description}</p>

                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        {item.enrolledCount} enrolled ({item.reassessedCount} reassessed)
                      </span>
                      {item.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                          {new Date(item.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Score Trajectory & Net Lift */}
                  <div className="flex items-center gap-6 bg-[var(--color-surface-card)] p-4 rounded-[var(--radius-card)] border border-[var(--color-border-primary)] self-start lg:self-center">
                    <div className="text-center font-mono">
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Baseline</div>
                      <div className="text-base font-bold text-[var(--color-text-primary)]">{item.preReadinessAvg}%</div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />

                    <div className="text-center font-mono">
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Post-Intervention</div>
                      <div className="text-base font-bold text-[var(--color-text-primary)]">{item.postReadinessAvg}%</div>
                    </div>

                    <div className="h-8 w-px bg-[var(--color-border-primary)]" />

                    <div className="text-center">
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Net Lift</div>
                      <div className={`text-base font-bold ${item.netImprovementLift >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {item.netImprovementLift >= 0 ? `+${item.netImprovementLift}` : item.netImprovementLift} pts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Design Intervention Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Design Faculty Intervention</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Structure an intervention program and monitor cohort score lift</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateIntervention} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Intervention Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed SQL & Concurrency Masterclass"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Intervention Type</label>
                  <select
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="workshop">Remedial Workshop</option>
                    <option value="mentorship">1-on-1 Coaching</option>
                    <option value="bootcamp">Accelerated Bootcamp</option>
                    <option value="curriculum_update">Curriculum Integration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Target Student Size</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={targetStudents}
                    onChange={(e) => setTargetStudents(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Intervention Scope & Strategy</label>
                <textarea
                  rows={3}
                  placeholder="Describe the remedial exercises, laboratory experiments, or code review sessions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Estimated End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
                      Saving...
                    </>
                  ) : (
                    'Launch Intervention'
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
