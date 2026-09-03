"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText, PlusCircle, CheckCircle2, AlertTriangle, Clock,
  ExternalLink, Trash2, Edit3, Send, Loader2, ArrowLeft,
  Shield, Code, AlertCircle, HelpCircle, Sparkles
} from "lucide-react"

interface SkillOption {
  id: string
  name: string
}

interface EvidenceItem {
  id: string
  title: string
  description: string
  evidenceType: string
  url?: string | null
  status: string
  reviewerFeedback?: string | null
  submittedAt?: string | null
  verifiedAt?: string | null
  createdAt: string
  skills: {
    id: string
    skillId: string
    skillName: string
    claimedLevel?: number
    claimDescription?: string
    verificationStatus: string
  }[]
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return (
        <Badge variant="success" className="bg-[var(--color-success)] text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
        </Badge>
      )
    case 'submitted':
      return (
        <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-200">
          <Clock className="h-3 w-3 mr-1" /> Submitted
        </Badge>
      )
    case 'under_review':
      return (
        <Badge variant="warning" className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="h-3 w-3 mr-1" /> Under Review
        </Badge>
      )
    case 'needs_clarification':
      return (
        <Badge variant="warning" className="bg-orange-100 text-orange-800 border-orange-200">
          <HelpCircle className="h-3 w-3 mr-1" /> Needs Clarification
        </Badge>
      )
    case 'rejected':
      return (
        <Badge variant="critical">
          <AlertTriangle className="h-3 w-3 mr-1" /> Rejected
        </Badge>
      )
    case 'draft':
    default:
      return (
        <Badge variant="secondary">
          <Edit3 className="h-3 w-3 mr-1" /> Draft
        </Badge>
      )
  }
}

export default function EvidenceManagementPage() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([])
  const [availableSkills, setAvailableSkills] = useState<SkillOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [evidenceType, setEvidenceType] = useState("project")
  const [url, setUrl] = useState("")
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [claimDescription, setClaimDescription] = useState("")
  const [formError, setFormError] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [evRes, skRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/evidence`).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/skills`).then(r => r.json()),
      ])

      if (evRes.success && evRes.data) {
        setEvidenceList(evRes.data)
      }
      if (skRes.success && skRes.data) {
        setAvailableSkills(skRes.data.map((s: any) => ({ id: s.skills?.id || s.skill_id, name: s.skills?.name || 'Skill' })))
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (submitNow: boolean) => {
    if (!title.trim() || title.length < 3) {
      setFormError("Title must be at least 3 characters.")
      return
    }
    setSubmitting(true)
    setFormError("")

    try {
      const skillsPayload = selectedSkillId
        ? [{ skillId: selectedSkillId, claimDescription: claimDescription.trim() || undefined }]
        : []

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          evidenceType,
          url: url.trim() || undefined,
          submitNow,
          skills: skillsPayload,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setShowAddModal(false)
        setTitle("")
        setDescription("")
        setUrl("")
        setSelectedSkillId("")
        setClaimDescription("")
        loadData()
      } else {
        setFormError(json.error?.message || "Could not save evidence.")
      }
    } catch {
      setFormError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitDraft = async (id: string) => {
    setActionLoadingId(id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/evidence/${id}/submit`, { method: 'POST' })
      if (res.ok) {
        loadData()
      }
    } catch {
      // noop
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft evidence?")) return
    setActionLoadingId(id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/evidence/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEvidenceList(prev => prev.filter(e => e.id !== id))
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
          <div className="flex items-center gap-2 mb-1">
            <Link href="/student/passport" className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Passport
            </Link>
          </div>
          <h1 className="text-h1 font-semibold">Evidence Portfolio</h1>
          <p className="text-[var(--color-text-secondary)] mt-0.5">
            Submit repositories, live projects, and credentials to substantiate your skills with verified proof.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Submit Evidence
        </Button>
      </div>

      {/* Add Evidence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-xl bg-[var(--color-surface-card)] border-[var(--color-border-primary)] my-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Add Skill Evidence</span>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
                >
                  ✕
                </button>
              </CardTitle>
              <CardDescription>
                Provide proof of your capability. Submitted evidence is reviewed by academic verifiers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="p-3 rounded bg-red-50 text-[var(--color-critical)] text-xs border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={e => setEvidenceType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-foreground)]"
                >
                  <option value="project">Capstone / Practical Project</option>
                  <option value="github_repo">GitHub Repository</option>
                  <option value="live_demo">Live Production Demo</option>
                  <option value="certification">Professional Certificate</option>
                  <option value="internship">Internship / Work Experience</option>
                  <option value="academic_project">Academic Coursework</option>
                  <option value="competition">Hackathon / Competition</option>
                  <option value="other">Other Professional Proof</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Title *</label>
                <Input
                  placeholder="e.g. Distributed E-Commerce Microservices"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Proof URL (Repository / Demo / Document)</label>
                <Input
                  placeholder="https://github.com/username/project"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Overview & Implementation</label>
                <textarea
                  placeholder="Describe what you built, architecture decisions, and core problems solved..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full min-h-[80px] text-xs p-2.5 rounded border border-[var(--color-border-primary)] bg-transparent resize-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              {/* Link to Skill */}
              <div className="pt-2 border-t border-[var(--color-border-primary)] space-y-3">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Skill Demonstrated
                </p>
                <div>
                  <select
                    value={selectedSkillId}
                    onChange={e => setSelectedSkillId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-foreground)]"
                  >
                    <option value="">Select a skill to verify with this proof...</option>
                    {availableSkills.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {selectedSkillId && (
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">What did YOU personally implement for this skill?</label>
                    <textarea
                      placeholder="e.g. I designed the PostgreSQL relational schema, indexed foreign keys, and wrote complex aggregation queries."
                      value={claimDescription}
                      onChange={e => setClaimDescription(e.target.value)}
                      className="w-full min-h-[60px] text-xs p-2.5 rounded border border-[var(--color-border-primary)] bg-transparent resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-primary)]">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCreate(false)} disabled={submitting}>
                  Save Draft
                </Button>
                <Button size="sm" onClick={() => handleCreate(true)} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                  Submit for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : evidenceList.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-[var(--color-surface-secondary)]">
          <FileText className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No evidence submitted yet</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-4">
            Strengthen your Skill Passport by attaching project repositories, live demos, and academic work to your skills.
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Submit First Evidence
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {evidenceList.map(ev => (
            <Card key={ev.id} className="hover:border-[var(--color-accent)] transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{ev.title}</h3>
                      <StatusBadge status={ev.status} />
                      <Badge variant="outline" className="text-xs capitalize">
                        {ev.evidenceType.replace('_', ' ')}
                      </Badge>
                    </div>
                    {ev.description && (
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pt-1">
                        {ev.description}
                      </p>
                    )}
                    {ev.url && (
                      <div className="pt-2">
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View Submitted Proof ({ev.url})
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions for drafts */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ev.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          disabled={actionLoadingId === ev.id}
                          onClick={() => handleSubmitDraft(ev.id)}
                        >
                          {actionLoadingId === ev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                          Submit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[var(--color-critical)]"
                          disabled={actionLoadingId === ev.id}
                          onClick={() => handleDelete(ev.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {ev.status === 'needs_clarification' && (
                      <Button
                        size="sm"
                        disabled={actionLoadingId === ev.id}
                        onClick={() => handleSubmitDraft(ev.id)}
                      >
                        Resubmit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Reviewer Feedback if present */}
                {ev.reviewerFeedback && (
                  <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] text-xs space-y-1">
                    <p className="font-semibold text-[var(--color-foreground)] flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-[var(--color-accent)]" /> Verifier Feedback:
                    </p>
                    <p className="text-[var(--color-text-secondary)] italic">"{ev.reviewerFeedback}"</p>
                  </div>
                )}

                {/* Linked Skills */}
                {ev.skills.length > 0 && (
                  <div className="pt-3 border-t border-[var(--color-border-primary)] space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Demonstrated Skills
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {ev.skills.map((s, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{s.skillName}</span>
                            <Badge variant={s.verificationStatus === 'verified' ? 'success' : 'outline'} className="text-[10px]">
                              {s.verificationStatus}
                            </Badge>
                          </div>
                          {s.claimDescription && (
                            <p className="text-[var(--color-text-secondary)] text-[11px] leading-tight">
                              {s.claimDescription}
                            </p>
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
