"use client"

import { useState, useEffect } from "react"
import {
  Presentation,
  Calendar,
  Clock,
  Users,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  XCircle,
  Sparkles,
  Building2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"

interface WorkshopItem {
  id: string
  title: string
  description: string
  skillId: string | null
  skillName: string
  skillCategory: string
  date: string
  duration: string
  capacity: number
  enrolledCount: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  institutionName: string
  isOwnWorkshop: boolean
  createdAt: string
}

import { useDemo } from "@/lib/demo/demo-context"

export default function AcademiaWorkshopsPage() {
  const { isDemo, demoService } = useDemo()
  const [workshops, setWorkshops] = useState<WorkshopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('2 Hours')
  const [capacity, setCapacity] = useState(40)
  const [submitting, setSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchWorkshops = async () => {
    try {
      setLoading(true)

      if (isDemo) {
        const list = demoService.getWorkshops()
        setWorkshops(list as any)
        setLoading(false)
        return
      }

      const json = await apiClient<{ success: boolean; data: WorkshopItem[] }>('/api/academia/workshops')
      if (json.success) {
        setWorkshops(json.data || [])
      }
    } catch (err) {
      console.error('Workshops fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkshops()
  }, [isDemo])

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) return

    try {
      setSubmitting(true)

      if (isDemo) {
        demoService.addWorkshop({
          title,
          description,
          date,
          duration,
          capacity,
        })
        setShowCreateModal(false)
        setTitle('')
        setDescription('')
        setDate('')
        setToastMessage('Demo Simulation: Workshop staged in your session! Open for enrollment simulation.')
        fetchWorkshops()
        setTimeout(() => setToastMessage(null), 5000)
        setSubmitting(false)
        return
      }

      const json = await apiClient.post<{ success: boolean; data?: any }>('/api/academia/workshops', {
        title,
        description,
        date,
        duration,
        capacity,
        status: 'scheduled',
      })
      if (!json.success) {
        throw new Error((json as any).error || 'Failed to create workshop')
      }
      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setDate('')
      setToastMessage('Targeted Workshop published successfully! Open for student enrollment.')
      fetchWorkshops()
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      alert(err.message || 'Error creating workshop')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      if (isDemo) {
        demoService.updateWorkshopStatus(id, newStatus as any)
        setToastMessage(`Demo Simulation: Workshop status updated to ${newStatus}`)
        fetchWorkshops()
        setTimeout(() => setToastMessage(null), 4000)
        return
      }

      const json = await apiClient.patch<{ success: boolean }>(`/api/academia/workshops/${id}`, { status: newStatus })
      if (json.success) {
        setToastMessage(`Workshop status updated to ${newStatus}`)
        fetchWorkshops()
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Error updating workshop:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this workshop?')) return

    try {
      if (isDemo) {
        demoService.deleteWorkshop(id)
        setToastMessage('Demo Simulation: Workshop removed from session')
        fetchWorkshops()
        setTimeout(() => setToastMessage(null), 4000)
        return
      }

      const json = await apiClient.delete<{ success: boolean }>(`/api/academia/workshops/${id}`)
      if (json.success) {
        setToastMessage('Workshop deleted successfully')
        fetchWorkshops()
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Error deleting workshop:', err)
    }
  }

  const filtered = statusFilter === 'all'
    ? workshops
    : workshops.filter(w => w.status === statusFilter)

  const totalEnrolled = workshops.reduce((sum, w) => sum + (w.enrolledCount || 0), 0)
  const completedCount = workshops.filter(w => w.status === 'completed').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Workshops & Remedial Labs
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Conduct intensive cohorts and hands-on masterclasses to address collective skill gaps
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() + 3)
              setDate(d.toISOString().split('T')[0])
              setShowCreateModal(true)
            }}
            className="bg-[var(--color-accent)] hover:opacity-90 text-white shadow-sm flex items-center gap-2 text-xs"
          >
            <Plus className="h-4 w-4" />
            Publish Workshop
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
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Total Workshops</span>
            <div className="h-8 w-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
              <Presentation className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{workshops.length}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Scheduled or conducted sessions</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Student Enrollments</span>
            <div className="h-8 w-8 rounded-full bg-[#F0F6F9]0/10 flex items-center justify-center text-[var(--color-accent)]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{totalEnrolled}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Total student participations</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Completed Sessions</span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{completedCount}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Finished hands-on labs</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] pb-2 text-xs font-medium">
        {[
          { id: 'all', label: 'All Workshops' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-[var(--radius-control)] transition-colors ${
              statusFilter === tab.id
                ? 'bg-[var(--color-accent)] text-white font-bold'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card-hover)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workshop Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          <p className="text-xs text-[var(--color-text-muted)]">Loading workshops catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] space-y-3">
          <Presentation className="h-8 w-8 text-[var(--color-text-muted)] mx-auto" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">No workshops found</p>
          <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
            Targeted workshops allow you to gather cohort groups facing common skill deficits for focused practical drills.
          </p>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--color-accent)] text-white text-xs mt-2"
          >
            Create Your First Workshop
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((w) => {
            const fillPct = Math.min(100, Math.round((w.enrolledCount / w.capacity) * 100))

            return (
              <div
                key={w.id}
                className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm p-5 flex flex-col justify-between hover:border-[var(--color-accent)]/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                      {w.skillName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      w.status === 'scheduled'
                        ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        : w.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : w.status === 'in_progress'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {w.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-2">{w.title}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">{w.description}</p>

                  <div className="pt-2 border-t border-[var(--color-border-primary)] space-y-1.5 text-xs text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      <span>{new Date(w.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      <span>Duration: {w.duration}</span>
                    </div>
                  </div>

                  {/* Enrollment Progress */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[var(--color-text-muted)]">Enrollment:</span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {w.enrolledCount} / {w.capacity} ({fillPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--color-surface-card-hover)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-border-primary)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {w.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(w.id, 'completed')}
                        className="h-7 text-[11px] text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Done
                      </Button>
                    )}
                    {w.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(w.id, 'cancelled')}
                        className="h-7 text-[11px] text-rose-500 hover:bg-rose-500/10"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {w.isOwnWorkshop && (
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-[var(--color-text-muted)] hover:text-rose-500 p-1 transition-colors"
                      title="Delete Workshop"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Publish Workshop Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Publish Academic Workshop</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Design an intensive session to close critical skill deficits</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateWorkshop} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Workshop Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed SQL & Query Optimization Lab"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Description & Learning Outcomes</label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of concepts practiced, tooling required, and hands-on exercises..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="1 Hour">1 Hour</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="Half Day (3-4 Hours)">Half Day (3-4 Hours)</option>
                    <option value="Full Day (6 Hours)">Full Day (6 Hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Student Capacity</label>
                <input
                  type="number"
                  min={5}
                  max={250}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
                />
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
                    'Publish Workshop'
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
