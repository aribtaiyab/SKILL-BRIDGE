"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users, Calendar, MessageSquare, CheckCircle2,
  PlusCircle, Loader2, X, AlertCircle, Clock
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"

interface MentorshipSession {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  skillName: string
  status: 'active' | 'completed' | 'cancelled' | 'requested'
  startDate: string
  notes: string
  createdAt: string
}

interface StudentOption {
  id: string
  name: string
  career: string
  priorityGap: string
}

export default function AcademicianMentorshipPage() {
  const { isDemo, cohortStudents } = useDemo()
  const [sessions, setSessions] = useState<MentorshipSession[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)

  // Scheduling modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [topic, setTopic] = useState("")
  const [sessionDate, setSessionDate] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    if (isDemo) {
      setSessions([
        {
          id: "m-1",
          studentId: "demo-aditi",
          studentName: "Aditi Sharma",
          studentEmail: "aditi.sharma@apex.edu",
          skillName: "Node.js Streams & Error Handling",
          status: "active",
          startDate: "Tomorrow, 2:00 PM",
          notes: "Targeting 15-pt gap on backend streams and async concurrency.",
          createdAt: new Date().toISOString(),
        },
        {
          id: "m-2",
          studentId: "demo-rahul",
          studentName: "Rahul Verma",
          studentEmail: "rahul.verma@apex.edu",
          skillName: "Docker Multi-stage Builds",
          status: "requested",
          startDate: "Thursday, 10:00 AM",
          notes: "Reviewing Dockerfile best practices and image optimization.",
          createdAt: new Date().toISOString(),
        },
      ])
      setStudents(cohortStudents.map((c: any) => ({
        id: c.id,
        name: c.name,
        career: c.targetCareer || 'Backend Developer',
        priorityGap: (c.skills || []).find((s: any) => (s.gap || 0) > 0)?.name || 'Spring Boot',
      })))
      setLoading(false)
      return
    }

    try {
      const [jsonSessions, jsonStudents] = await Promise.all([
        apiClient.get<any>("/api/academician/mentorship"),
        apiClient.get<any>("/api/academician/students"),
      ])

      if (jsonSessions.success && Array.isArray(jsonSessions.data)) {
        setSessions(jsonSessions.data)
      }
      if (jsonStudents.success && Array.isArray(jsonStudents.data)) {
        setStudents(jsonStudents.data)
      }
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [isDemo, cohortStudents])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      setError("Please select a student.")
      return
    }
    if (!topic.trim()) {
      setError("Please specify the mentorship topic.")
      return
    }

    setSubmitting(true)
    setError("")

    if (isDemo) {
      const studentObj = students.find(s => s.id === selectedStudent)
      const newSession: MentorshipSession = {
        id: `m-${Date.now()}`,
        studentId: selectedStudent,
        studentName: studentObj?.name || 'Student Mentee',
        studentEmail: 'student@apex.edu',
        skillName: topic.trim(),
        status: 'active',
        startDate: sessionDate ? new Date(sessionDate).toLocaleDateString() : 'Scheduled',
        notes: `Focus area: ${topic.trim()}`,
        createdAt: new Date().toISOString(),
      }
      setSessions(prev => [newSession, ...prev])
      setSubmitting(false)
      setModalOpen(false)
      setTopic("")
      setSelectedStudent("")
      return
    }

    try {
      const json = await apiClient.post<any>("/api/academician/mentorship", {
        studentId: selectedStudent,
        notes: topic.trim(),
        startDate: sessionDate ? new Date(sessionDate).toISOString() : new Date().toISOString(),
      })
      if (json.success) {
        setModalOpen(false)
        setTopic("")
        setSelectedStudent("")
        loadData()
      } else {
        setError(json.error || 'Failed to schedule session.')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'completed' | 'cancelled') => {
    if (isDemo) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
      return
    }

    try {
      await apiClient.patch(`/api/academician/mentorship/${id}`, { status: newStatus })
      loadData()
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Mentorship & Office Hours</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Provide 1-on-1 technical coaching and guide students through targeted skill gap interventions.
          </p>
        </div>
        <Button
          onClick={() => { setModalOpen(true); setError("") }}
          className="bg-[var(--color-accent)] cursor-pointer"
        >
          <PlusCircle className="mr-1.5 h-4 w-4" /> Schedule Mentorship
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
            <Users className="h-8 w-8 text-[var(--color-accent)]" />
            <p className="font-medium text-base text-[var(--color-foreground)]">No Mentorship Sessions Scheduled</p>
            <p className="text-sm max-w-md">
              Click &quot;Schedule Mentorship&quot; to arrange 1-on-1 coaching sessions with students who have critical skill gaps.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map(m => (
            <Card key={m.id} className="border-[var(--color-border-primary)] shadow-sm hover:border-[var(--color-accent)]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{m.studentName}</h3>
                      <Badge variant={m.status === 'completed' ? 'success' : m.status === 'active' ? 'secondary' : 'warning'}>
                        {m.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-[var(--color-text-muted)]">• {m.studentEmail}</span>
                    </div>
                    <p className="text-xs text-[var(--color-accent)] font-medium pt-0.5">
                      Focus Topic: {m.skillName}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5 pt-1">
                      <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      Session Time: {m.startDate}
                    </p>
                    {m.notes && <p className="text-xs text-[var(--color-text-muted)] pt-0.5">Notes: {m.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => handleStatusChange(m.id, 'completed')}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[var(--color-success)]" /> Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Mentorship Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[var(--color-border-primary)] pb-3">
              <h2 className="text-h2 font-semibold">Schedule Mentorship Session</h2>
              <button onClick={() => setModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Select Student <span className="text-[var(--color-critical)]">*</span></label>
                <select
                  value={selectedStudent}
                  onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
                  required
                >
                  <option value="">Choose student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.career || 'Student'}) — Gap: {s.priorityGap}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mentorship Topic / Skill Focus <span className="text-[var(--color-critical)]">*</span></label>
                <Input
                  placeholder="e.g. Node.js Streams & Error Handling Architecture"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Session Date & Time</label>
                <Input
                  type="datetime-local"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[var(--color-accent)] cursor-pointer">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
