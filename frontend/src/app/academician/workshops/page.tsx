"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar, Users, PlusCircle, CheckCircle2,
  Presentation, Loader2, X, AlertCircle, Trash2
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"

interface WorkshopItem {
  id: string
  title: string
  description: string
  skillTarget: string
  date: string
  time: string
  enrolled: number
  capacity: number
  status: 'upcoming' | 'completed' | 'cancelled'
}

function WorkshopsContent() {
  const searchParams = useSearchParams()
  const prefillSkill = searchParams.get('skill') || ''
  const { isDemo } = useDemo()

  const [workshops, setWorkshops] = useState<WorkshopItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [skillTarget, setSkillTarget] = useState(prefillSkill)
  const [date, setDate] = useState("")
  const [duration, setDuration] = useState("2 Hours")
  const [capacity, setCapacity] = useState(50)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (prefillSkill) {
      setSkillTarget(prefillSkill)
      setTitle(`Targeted Lab: Mastering ${prefillSkill}`)
      setModalOpen(true)
    }
  }, [prefillSkill])

  const loadWorkshops = useCallback(async () => {
    setLoading(true)
    if (isDemo) {
      setWorkshops([
        {
          id: "w-1",
          title: "Mastering Asynchronous Control Flow & Streams",
          description: "Targeted hands-on lab on Node.js streams, backpressure, and async error recovery.",
          date: "Friday, Nov 10, 2026",
          time: "2:00 PM - 4:00 PM",
          enrolled: 42,
          capacity: 50,
          status: "upcoming",
          skillTarget: "Node.js (15-pt gap focus)",
        },
        {
          id: "w-2",
          title: "PostgreSQL Query Optimization & EXPLAIN ANALYZE",
          description: "Hands-on index tuning, query plan analysis, and connection pooling workshop.",
          date: "Wednesday, Nov 15, 2026",
          time: "10:00 AM - 12:00 PM",
          enrolled: 35,
          capacity: 40,
          status: "upcoming",
          skillTarget: "SQL Database Design",
        },
        {
          id: "w-3",
          title: "Docker Containerization for Modern Web Apps",
          description: "Multi-stage builds, rootless containers, and production deployment.",
          date: "Oct 28, 2026",
          time: "Completed",
          enrolled: 48,
          capacity: 50,
          status: "completed",
          skillTarget: "Docker Basics",
        },
      ])
      setLoading(false)
      return
    }

    try {
      const json = await apiClient('/api/academician/workshops')
      if (json.success && Array.isArray(json.data)) {
        setWorkshops(json.data)
      } else {
        setWorkshops([])
      }
    } catch {
      setWorkshops([])
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => {
    loadWorkshops()
  }, [loadWorkshops])

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Please provide a workshop title.")
      return
    }

    setSubmitting(true)
    setError("")

    if (isDemo) {
      const newWs: WorkshopItem = {
        id: `w-${Date.now()}`,
        title: title.trim(),
        description: `Targeted intervention lab addressing ${skillTarget || 'core technical competencies'}.`,
        date: date ? new Date(date).toLocaleDateString() : 'Upcoming',
        time: duration || '2 Hours',
        enrolled: 1,
        capacity,
        status: 'upcoming',
        skillTarget: skillTarget.trim() || 'General Technical',
      }
      setWorkshops(prev => [newWs, ...prev])
      setSubmitting(false)
      setModalOpen(false)
      setTitle("")
      setSkillTarget("")
      return
    }

    try {
      const json = await apiClient('/api/academician/workshops', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: `Targeted intervention workshop covering ${skillTarget || 'core skills'}.`,
          duration,
          capacity,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
        }),
      })
      if (json.success) {
        setModalOpen(false)
        setTitle("")
        setSkillTarget("")
        loadWorkshops()
      } else {
        setError(json.error || 'Failed to create workshop.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'completed' | 'cancelled') => {
    if (isDemo) {
      setWorkshops(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w))
      return
    }

    try {
      await apiClient(`/api/academician/workshops/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      loadWorkshops()
    } catch {
      // noop
    }
  }

  const handleDelete = async (id: string) => {
    if (isDemo) {
      setWorkshops(prev => prev.filter(w => w.id !== id))
      return
    }

    try {
      await apiClient(`/api/academician/workshops/${id}`, { method: 'DELETE' })
      loadWorkshops()
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Department Workshops & Labs</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Host targeted hands-on technical labs to systematically close observed cohort skill gaps.
          </p>
        </div>
        <Button
          onClick={() => { setModalOpen(true); setError("") }}
          className="bg-[var(--color-accent)] cursor-pointer"
        >
          <PlusCircle className="mr-1.5 h-4 w-4" /> Create Workshop
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : workshops.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
            <Presentation className="h-8 w-8 text-[var(--color-accent)]" />
            <p className="font-medium text-base text-[var(--color-foreground)]">No Workshops Created Yet</p>
            <p className="text-sm max-w-md">
              Create hands-on lab sessions to address critical cohort skill gaps and monitor attendance.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {workshops.map(w => (
            <Card key={w.id} className="border-[var(--color-border-primary)] shadow-sm hover:border-[var(--color-accent)]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{w.title}</h3>
                      <Badge variant={w.status === "upcoming" ? "secondary" : "success"}>
                        {w.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-accent)] font-medium">Focus: {w.skillTarget}</p>
                    {w.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] pt-0.5">{w.description}</p>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 pt-1">
                      <Calendar className="h-3.5 w-3.5" /> {w.date} • {w.time}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{w.enrolled} / {w.capacity}</div>
                      <span className="text-xs text-[var(--color-text-secondary)]">Enrolled</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {w.status === 'upcoming' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer text-xs"
                          onClick={() => handleStatusChange(w.id, 'completed')}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-[var(--color-success)]" /> Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="cursor-pointer text-[var(--color-critical)] hover:bg-red-50"
                        onClick={() => handleDelete(w.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Workshop Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-[var(--color-border-primary)] pb-3">
              <h2 className="text-h2 font-semibold">Create Targeted Workshop</h2>
              <button onClick={() => setModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleCreateWorkshop} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Workshop Title <span className="text-[var(--color-critical)]">*</span></label>
                <Input
                  placeholder="e.g. Asynchronous Control Flow & REST Security Lab"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Targeted Skill Gap</label>
                <Input
                  placeholder="e.g. Node.js Streams / SQL Query Optimization"
                  value={skillTarget}
                  onChange={e => setSkillTarget(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Capacity</label>
                  <Input
                    type="number"
                    min={5}
                    max={200}
                    value={capacity}
                    onChange={e => setCapacity(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[var(--color-accent)] cursor-pointer">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Workshop'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AcademicianWorkshopsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    }>
      <WorkshopsContent />
    </Suspense>
  )
}
