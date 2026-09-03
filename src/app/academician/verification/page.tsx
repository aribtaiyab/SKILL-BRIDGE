"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield, CheckCircle2, AlertTriangle, Clock, HelpCircle,
  ExternalLink, Loader2, User, Building, MessageSquare, Check, X
} from "lucide-react"

interface QueueItem {
  id: string
  title: string
  description: string
  evidenceType: string
  url?: string | null
  status: string
  submittedAt: string
  reviewerFeedback?: string | null
  student: {
    id: string
    name: string
    email: string
  }
  skills: {
    id: string
    skillId: string
    skillName: string
    category: string
    claimedLevel?: number
    claimDescription?: string
    verificationStatus: string
  }[]
}

export default function AcademicianVerificationQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Feedback modal state
  const [activeModal, setActiveModal] = useState<{ id: string; type: 'reject' | 'clarify' } | null>(null)
  const [feedbackText, setFeedbackText] = useState("")

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/verification/queue?status=${statusFilter}`)
      const json = await res.json()
      if (json.success && json.data) {
        setItems(json.data)
      } else {
        setItems([])
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const handleApprove = async (id: string) => {
    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/verification/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Verified through academic proof review.' }),
      })
      if (res.ok) {
        loadQueue()
      }
    } catch {
      // noop
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleModalSubmit = async () => {
    if (!activeModal || !feedbackText.trim()) return
    const { id, type } = activeModal
    setActionLoadingId(id)

    try {
      const endpoint = type === 'reject' ? `/api/verification/${id}/reject` : `/api/verification/${id}/clarify`
      const payload = type === 'reject' ? { reason: feedbackText.trim() } : { message: feedbackText.trim() }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setActiveModal(null)
        setFeedbackText("")
        loadQueue()
      }
    } catch {
      // noop
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Evidence Verification Queue</h1>
          <p className="text-[var(--color-text-secondary)] mt-0.5">
            Audit student-submitted project repositories, capstones, and proof to officially verify skill proficiencies.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border-primary)] pb-3">
        {[
          { key: 'submitted', label: 'Pending Review' },
          { key: 'verified', label: 'Verified Proof' },
          { key: 'needs_clarification', label: 'Clarifications' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all', label: 'All Submissions' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === tab.key
                ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback / Clarification Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl bg-[var(--color-surface-card)] border-[var(--color-border-primary)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {activeModal.type === 'reject' ? 'Reject Evidence Submission' : 'Request Additional Clarification'}
              </CardTitle>
              <CardDescription className="text-xs">
                {activeModal.type === 'reject'
                  ? 'Provide constructive feedback explaining why this evidence does not meet verification standards.'
                  : 'Specify what additional proof or details the student needs to provide.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                placeholder={activeModal.type === 'reject' ? "e.g. Repository lacks demonstration of relational database design..." : "e.g. Please link to the specific file or PR where the backend route was implemented..."}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                className="w-full min-h-[100px] text-xs p-2.5 rounded border border-[var(--color-border-primary)] bg-transparent resize-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setActiveModal(null); setFeedbackText(""); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant={activeModal.type === 'reject' ? 'default' : 'secondary'}
                  onClick={handleModalSubmit}
                  disabled={!feedbackText.trim()}
                >
                  {activeModal.type === 'reject' ? 'Confirm Rejection' : 'Send Clarification Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Queue Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-[var(--color-surface-secondary)]">
          <Shield className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">Queue is clear</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
            No submissions in this category. Evidence submitted by students will appear here for audit.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <Card key={item.id} className="border-[var(--color-border-primary)]">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.evidenceType.replace('_', ' ')}
                      </Badge>
                      <Badge variant={item.status === 'verified' ? 'success' : item.status === 'rejected' ? 'critical' : 'secondary'} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1 font-medium text-[var(--color-foreground)]">
                        <User className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        {item.student.name}
                      </span>
                      <span>•</span>
                      <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pt-1">
                        {item.description}
                      </p>
                    )}

                    {item.url && (
                      <div className="pt-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Inspect Proof URL: {item.url}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  {item.status === 'submitted' && (
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/90"
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleApprove(item.id)}
                      >
                        {actionLoadingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="mr-1 h-3.5 w-3.5" /> Approve Proof</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === item.id}
                        onClick={() => setActiveModal({ id: item.id, type: 'clarify' })}
                      >
                        <HelpCircle className="mr-1 h-3.5 w-3.5" /> Clarification
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--color-critical)] hover:bg-red-50"
                        disabled={actionLoadingId === item.id}
                        onClick={() => setActiveModal({ id: item.id, type: 'reject' })}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Claimed Skills */}
                {item.skills.length > 0 && (
                  <div className="pt-3 border-t border-[var(--color-border-primary)] space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Claimed Competencies to Verify
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {item.skills.map((s, idx) => (
                        <div key={idx} className="p-3 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm">{s.skillName}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {s.category}
                            </Badge>
                          </div>
                          {s.claimDescription ? (
                            <p className="text-[var(--color-text-secondary)] italic">
                              "{s.claimDescription}"
                            </p>
                          ) : (
                            <p className="text-[var(--color-text-muted)] text-[11px]">No specific claim note.</p>
                          )}
                        </div>
                      ))}
                    </div>
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
