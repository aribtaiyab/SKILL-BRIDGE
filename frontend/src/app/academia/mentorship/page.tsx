"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  XCircle,
  FileEdit,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface MentorshipItem {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  studentAvatar: string | null
  skillId: string
  skillName: string
  skillCategory: string
  status: 'active' | 'completed' | 'cancelled'
  startDate: string | null
  endDate: string | null
  notes: string | null
  createdAt: string
}

interface StudentOption {
  id: string
  name: string
  email: string
  department: string
}

import { useDemo } from "@/lib/demo/demo-context"

export default function AcademiaMentorshipPage() {
  const { isDemo, demoService } = useDemo()
  const [mentorships, setMentorships] = useState<MentorshipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [studentsList, setStudentsList] = useState<StudentOption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [focusSkill, setFocusSkill] = useState('')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit / Status Modal state
  const [editItem, setEditItem] = useState<MentorshipItem | null>(null)
  const [updatingNotes, setUpdatingNotes] = useState('')
  const [submittingUpdate, setSubmittingUpdate] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchMentorships = async () => {
    try {
      setLoading(true)

      if (isDemo) {
        const list = demoService.getMentorships(statusFilter)
        setMentorships(list as any)
        setLoading(false)
        return
      }

      const res = await fetch(`/api/academia/mentorship?status=${statusFilter}`)
      const json = await res.json()
      if (json.success) {
        setMentorships(json.data || [])
      }
    } catch (err) {
      console.error('Mentorship fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      if (isDemo) {
        const stds = demoService.getStudents().students
        setStudentsList(stds.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          department: s.department,
        })))
        if (stds.length > 0 && !selectedStudentId) {
          setSelectedStudentId(stds[0].id)
        }
        return
      }

      const res = await fetch('/api/academia/students')
      const json = await res.json()
      if (json.success && json.data?.students) {
        setStudentsList(json.data.students.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          department: s.department,
        })))
        if (json.data.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(json.data.students[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching students list:', err)
    }
  }

  useEffect(() => {
    fetchMentorships()
  }, [statusFilter, isDemo])

  useEffect(() => {
    fetchStudents()
  }, [isDemo])

  const handleCreateMentorship = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return

    try {
      setSubmitting(true)

      if (isDemo) {
        demoService.addMentorship({
          studentId: selectedStudentId,
          notes: notes ? `${notes} (Target Skill: ${focusSkill || 'Core Engineering'})` : `Mentorship on ${focusSkill || 'Core Engineering'}`,
          startDate,
          endDate: endDate || null,
        })
        setShowCreateModal(false)
        setNotes('')
        setFocusSkill('')
        setToastMessage('Demo Simulation: 1-on-1 mentorship session staged in your session!')
        fetchMentorships()
        setTimeout(() => setToastMessage(null), 5000)
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/academia/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          notes: notes ? `${notes} (Target Skill: ${focusSkill || 'Core Engineering'})` : `Mentorship on ${focusSkill || 'Core Engineering'}`,
          startDate,
          endDate: endDate || null,
          status: 'active',
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create mentorship')
      }
      setShowCreateModal(false)
      setNotes('')
      setFocusSkill('')
      setToastMessage('New mentorship session initiated successfully!')
      fetchMentorships()
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      alert(err.message || 'Error creating mentorship')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: 'completed' | 'cancelled' | 'active') => {
    try {
      if (isDemo) {
        demoService.updateMentorship(id, {
          status: newStatus,
          endDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        })
        setToastMessage(`Demo Simulation: Mentorship marked as ${newStatus}!`)
        fetchMentorships()
        setTimeout(() => setToastMessage(null), 4000)
        return
      }

      const res = await fetch(`/api/academia/mentorship/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          endDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setToastMessage(`Mentorship marked as ${newStatus}!`)
        fetchMentorships()
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return

    try {
      setSubmittingUpdate(true)

      if (isDemo) {
        demoService.updateMentorship(editItem.id, { notes: updatingNotes })
        setToastMessage('Demo Simulation: Progress notes updated successfully!')
        setEditItem(null)
        fetchMentorships()
        setTimeout(() => setToastMessage(null), 4000)
        setSubmittingUpdate(false)
        return
      }

      const res = await fetch(`/api/academia/mentorship/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatingNotes }),
      })
      const json = await res.json()
      if (json.success) {
        setToastMessage('Progress notes updated successfully!')
        setEditItem(null)
        fetchMentorships()
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Error updating notes:', err)
    } finally {
      setSubmittingUpdate(false)
    }
  }

  const activeCount = mentorships.filter(m => m.status === 'active').length
  const completedCount = mentorships.filter(m => m.status === 'completed').length
  const uniqueStudents = new Set(mentorships.map(m => m.studentId)).size

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            1-on-1 Faculty Mentorship
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Personalized guidance sessions to close critical role-readiness deficits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--color-accent)] hover:opacity-90 text-white shadow-sm flex items-center gap-2 text-xs"
          >
            <Plus className="h-4 w-4" />
            Initiate Mentorship
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
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Active Mentorships</span>
            <div className="h-8 w-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{activeCount}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Currently in-progress sessions</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Completed Sessions</span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{completedCount}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Successfully fulfilled pairings</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Unique Students Mentored</span>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{uniqueStudents}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Distinct learners supported</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-primary)] pb-2 text-xs font-medium">
        {[
          { id: 'all', label: 'All Sessions' },
          { id: 'active', label: 'Active' },
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

      {/* Mentorship List */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            <p className="text-xs text-[var(--color-text-muted)]">Loading mentorship portfolio...</p>
          </div>
        ) : mentorships.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <BookOpen className="h-8 w-8 text-[var(--color-text-muted)] mx-auto" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No mentorship sessions found</p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
              Initiate a 1-on-1 mentorship with an enrolled student to provide personalized coaching and monitor their trajectory.
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--color-accent)] text-white mt-2 text-xs"
            >
              Initiate First Mentorship
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-primary)]">
            {mentorships.map((m) => (
              <div key={m.id} className="p-5 hover:bg-[var(--color-surface-card-hover)]/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {m.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/academia/students/${m.studentId}`} className="text-sm font-bold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] hover:underline flex items-center gap-1">
                        {m.studentName}
                        <ExternalLink className="h-3 w-3 text-[var(--color-text-muted)]" />
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'active'
                          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20'
                          : m.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{m.studentEmail}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                      <span className="font-semibold text-[var(--color-accent)]">Focus: {m.skillName}</span>
                      {m.startDate && (
                        <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                          <Calendar className="h-3 w-3" />
                          Started {new Date(m.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {m.notes && (
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-card)] p-2 rounded-[var(--radius-control)] border border-[var(--color-border-primary)] max-w-xl">
                        {m.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditItem(m)
                      setUpdatingNotes(m.notes || '')
                    }}
                    className="h-8 text-xs flex items-center gap-1"
                  >
                    <FileEdit className="h-3 w-3" />
                    Notes
                  </Button>

                  {m.status === 'active' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(m.id, 'completed')}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateStatus(m.id, 'cancelled')}
                        className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </>
                  )}

                  {m.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(m.id, 'active')}
                      className="h-8 text-xs"
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Mentorship Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Initiate 1-on-1 Mentorship</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Select an enrolled student for focused academic coaching</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateMentorship} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Select Student</label>
                {studentsList.length === 0 ? (
                  <p className="text-xs text-amber-500">No students available in your department.</p>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  >
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department || 'Engineering'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Target Competency / Skill Area</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems, SQL Query Optimization, React Architecture"
                  value={focusSkill}
                  onChange={(e) => setFocusSkill(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
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
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Mentorship Plan / Remedial Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Outline key milestones, code review intervals, or practical benchmarks..."
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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
                  disabled={submitting || studentsList.length === 0}
                  className="bg-[var(--color-accent)] hover:opacity-90 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Creating...
                    </>
                  ) : (
                    'Confirm Mentorship'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                Update Mentorship Notes: {editItem.studentName}
              </h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Progress Notes & Observations</label>
                <textarea
                  rows={4}
                  value={updatingNotes}
                  onChange={(e) => setUpdatingNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  placeholder="Record observations, milestone completions, or areas needing further drill-down..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border-primary)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditItem(null)}
                  disabled={submittingUpdate}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingUpdate}
                  className="bg-[var(--color-accent)] text-white"
                >
                  {submittingUpdate ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
