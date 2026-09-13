"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import {
  ShieldCheck, Award, Calendar, CheckCircle2, Clock,
  AlertTriangle, UserCheck, ArrowRight, ExternalLink,
  ChevronRight, Save, User, FileText, Check, Loader2, Sparkles,
  Search, Filter, GitBranch, Globe, X, MessageSquare, RefreshCw, ThumbsUp, ThumbsDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SupportingEvidence {
  title: string
  type: string
  url?: string
  description?: string
}

interface VerificationRequestItem {
  id: string
  student_id: string
  student_name: string
  student_email: string
  department?: string
  skill_name: string
  skill_id?: string
  score: number
  claimed_level?: string
  verification_tier: string
  description?: string | null
  project_title?: string | null
  project_url?: string | null
  tech_stack?: string | null
  proof_url?: string | null
  proof_notes?: string | null
  supporting_evidence?: SupportingEvidence[]
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  academician_id?: string | null
  academician_name?: string | null
  academician_institution?: string | null
  academician_department?: string | null
  faculty_feedback?: string | null
  rejection_reason?: string | null
  verified_level?: number | null
  reviewed_at?: string | null
  created_at: string
}

export default function AcademiaVerificationPage() {
  const { user, profile } = useAuth()
  const { isDemo } = useDemo()

  const [requests, setRequests] = useState<VerificationRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected'>('all')

  // Review Workspace Modal State
  const [reviewingRequest, setReviewingRequest] = useState<VerificationRequestItem | null>(null)
  const [evalVerifiedScore, setEvalVerifiedScore] = useState(85)
  const [evalVerifiedTier, setEvalVerifiedTier] = useState('Institution Verified')
  const [evalFacultyNotes, setEvalFacultyNotes] = useState('Verified with high technical competence and hands-on repository evidence.')
  const [evalRejectionReason, setEvalRejectionReason] = useState('Insufficient practical repository evidence')
  const [evalRejectionFeedback, setEvalRejectionFeedback] = useState('Please attach a comprehensive repository with unit tests or deployment link demonstrating production readiness.')
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject'>('approve')
  const [submittingDecision, setSubmittingDecision] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null)

  // 1. Fetch live verification requests from database
  const loadRequests = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const res = await apiClient<{ success: boolean; data?: VerificationRequestItem[]; requests?: VerificationRequestItem[] }>('/api/verification/academician/requests')
      const loaded = res?.data || res?.requests || []
      setRequests(loaded)
    } catch (err) {
      console.warn('Notice loading academician verification queue:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  // Open Review Workspace for a specific ticket
  const handleOpenReview = (req: VerificationRequestItem, defaultMode: 'approve' | 'reject' = 'approve') => {
    setReviewingRequest(req)
    setDecisionMode(defaultMode)
    setEvalVerifiedScore(req.verified_level || req.score || 85)
    setEvalVerifiedTier(req.verification_tier || 'Institution Verified')
    setEvalFacultyNotes(req.faculty_feedback || `Verified ${req.skill_name} proficiency. Student demonstrated strong conceptual clarity and code artifacts.`)
    setEvalRejectionReason(req.rejection_reason || 'Insufficient practical repository evidence')
    setEvalRejectionFeedback('Please improve code documentation, unit test coverage, and resubmit with live demo link.')
    setDecisionError(null)
    setDecisionSuccess(null)
  }

  // Handle Approve or Reject Submission
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewingRequest) return

    setSubmittingDecision(true)
    setDecisionError(null)

    const reviewerName = profile?.full_name || (isDemo ? 'Dr. Sarah Mitchell (Dept. Chair)' : 'Faculty Reviewer')

    try {
      const payload = {
        requestId: reviewingRequest.id,
        action: decisionMode === 'approve' ? 'approved' : 'rejected',
        verifiedScore: Number(evalVerifiedScore) || 85,
        verifiedTier: evalVerifiedTier,
        facultyFeedback: decisionMode === 'approve' ? evalFacultyNotes : evalRejectionFeedback,
        rejectionReason: decisionMode === 'reject' ? evalRejectionReason : null,
        reviewerName,
      }

      const res = await apiClient<{ success: boolean; message?: string }>('/api/verification/action', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      if (res?.success) {
        setDecisionSuccess(decisionMode === 'approve' ? 'Skill successfully endorsed and verified in student profile!' : 'Verification rejected with student feedback.')
        await loadRequests(true)
        setTimeout(() => {
          setReviewingRequest(null)
          setDecisionSuccess(null)
        }, 1200)
      } else {
        setDecisionError('Failed to record verification decision. Please try again.')
      }
    } catch (err: any) {
      setDecisionError(err?.message || 'Error communicating with verification service.')
    } finally {
      setSubmittingDecision(false)
    }
  }

  // 1-Click Quick Endorsement Action
  const handleQuickEndorse = async (req: VerificationRequestItem) => {
    try {
      const reviewerName = profile?.full_name || (isDemo ? 'Dr. Sarah Mitchell (Dept. Chair)' : 'Faculty Reviewer')
      await apiClient('/api/verification/action', {
        method: 'PATCH',
        body: JSON.stringify({
          requestId: req.id,
          action: 'approved',
          verifiedScore: req.score || 85,
          facultyFeedback: 'Verified with high technical competence and valid practical evidence.',
          reviewerName,
        })
      })
      await loadRequests(true)
    } catch (err) {
      console.error('Quick approve error:', err)
    }
  }

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter(r => (r.status as string) === 'pending' || (r.status as string) === 'request_sent').length
    const inReview = requests.filter(r => (r.status as string) === 'in_review' || (r.status as string) === 'accepted' || (r.status as string) === 'scheduled').length
    const verified = requests.filter(r => (r.status as string) === 'approved' || (r.status as string) === 'verified').length
    const rejected = requests.filter(r => (r.status as string) === 'rejected' || (r.status as string) === 'reassessment_required').length
    return { total, pending, inReview, verified, rejected }
  }, [requests])

  // Filtered requests based on tab & search query
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Status filter
      if (statusFilter !== 'all') {
        const s = r.status as string
        if (statusFilter === 'pending' && s !== 'pending' && s !== 'request_sent') return false
        if (statusFilter === 'in_review' && s !== 'in_review' && s !== 'accepted' && s !== 'scheduled') return false
        if (statusFilter === 'approved' && s !== 'approved' && s !== 'verified') return false
        if (statusFilter === 'rejected' && s !== 'rejected' && s !== 'reassessment_required') return false
      }
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchName = r.student_name?.toLowerCase().includes(q)
        const matchSkill = r.skill_name?.toLowerCase().includes(q)
        const matchEmail = r.student_email?.toLowerCase().includes(q)
        const matchDept = r.department?.toLowerCase().includes(q)
        return matchName || matchSkill || matchEmail || matchDept
      }
      return true
    })
  }, [requests, statusFilter, searchTerm])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 max-w-7xl mx-auto">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">SKILL VERIFICATIONS</h1>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold px-2.5 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline text-emerald-600" /> Faculty Review Inbox
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Review student evidence artifacts, GitHub repositories, and project claims. Endorse competencies to grant official institutional verification badges on the student&apos;s Living Skill Passport.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRequests(true)}
            disabled={refreshing}
            className="rounded-xl text-xs font-bold h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* ─── 2. REAL METRICS CARDS (Calculated from Real Database Records) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer bg-white rounded-2xl border p-4 shadow-xs transition-all ${
            statusFilter === 'all' ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[var(--color-accent)]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-semibold">in database</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer bg-white rounded-2xl border p-4 shadow-xs transition-all ${
            statusFilter === 'pending' ? 'border-amber-400 ring-1 ring-amber-400/30 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Review</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{stats.pending}</span>
            <span className="text-[11px] text-amber-700 font-semibold">requires evaluation</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          className={`cursor-pointer bg-white rounded-2xl border p-4 shadow-xs transition-all ${
            statusFilter === 'approved' ? 'border-emerald-400 ring-1 ring-emerald-400/30 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Verified &amp; Endorsed</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{stats.verified}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">verified skills</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          className={`cursor-pointer bg-white rounded-2xl border p-4 shadow-xs transition-all ${
            statusFilter === 'rejected' ? 'border-rose-400 ring-1 ring-rose-400/30 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Revision Required</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-900">{stats.rejected}</span>
            <span className="text-[11px] text-rose-700 font-semibold">feedback sent</span>
          </div>
        </div>
      </div>

      {/* ─── 3. FILTER TABS & SEARCH BAR ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Requests ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Verified ({stats.verified})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. VERIFICATION REQUEST INBOX LIST ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Verification Queue ({filteredRequests.length})
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            {stats.pending} pending faculty decision
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            <span className="text-xs font-semibold text-slate-500">Loading academician verification queue...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">You&apos;re all caught up!</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              No verification requests match your active filter. New student evidence submissions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isApproved = req.status === 'approved'
              const isRejected = req.status === 'rejected'
              const isPending = req.status === 'pending' || req.status === 'in_review'
              const initials = (req.student_name || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isApproved
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                      : isRejected
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Student Info & Claim */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] font-black text-xs flex items-center justify-center shrink-0 border border-[var(--color-border-primary)]">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900 truncate">
                            {req.student_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({req.student_email || 'student@dtu.ac.in'})
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            • {req.department || 'Computer Science & Engineering'}
                          </span>
                        </div>

                        {/* Skill Badge & Claim */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-bold text-xs text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                            Skill: <strong className="text-[var(--color-accent)]">{req.skill_name}</strong>
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            Claimed: <strong className="text-slate-900">{req.score}/100</strong> ({req.claimed_level || 'Proficient'})
                          </span>

                          {isApproved && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ✓ ENDORSED ({req.verified_level || req.score} pts)
                            </span>
                          )}
                          {isPending && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              ⏱ PENDING REVIEW
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              ✕ REJECTED
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-0.5">
                          {req.description || req.proof_notes || 'Hands-on practical development evidence.'}
                        </p>

                        {/* Evidence links */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {req.supporting_evidence && req.supporting_evidence.length > 0 ? (
                            req.supporting_evidence.map((ev, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                {ev.type === 'github_repo' ? <GitBranch className="h-3 w-3 text-slate-700" /> : <Globe className="h-3 w-3 text-[var(--color-accent)]" />}
                                {ev.title}
                              </span>
                            ))
                          ) : req.proof_url ? (
                            <a
                              href={req.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-accent)] hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Inspect Code Repository
                            </a>
                          ) : null}

                          <span className="text-[10px] text-slate-400">
                            • Submitted {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-200/60">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(req, 'approve')}
                        className="rounded-xl text-xs font-bold h-8 px-3.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs"
                      >
                        Review &amp; Evaluate <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>

                      {isPending && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickEndorse(req)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1 text-emerald-600" /> Endorse
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(req, 'reject')}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5 border-rose-300 text-rose-800 hover:bg-rose-50"
                          >
                            <ThumbsDown className="h-3 w-3 mr-1 text-rose-600" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Banner if reviewed */}
                  {req.faculty_feedback && (
                    <div className={`mt-3 p-3 rounded-xl text-xs border flex items-start gap-2.5 ${
                      isApproved
                        ? 'bg-emerald-100/60 text-emerald-900 border-emerald-200'
                        : 'bg-rose-100/60 text-rose-900 border-rose-200'
                    }`}>
                      <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-slate-600" />
                      <div>
                        <div className="font-bold">
                          Recorded Faculty Evaluation ({req.academician_name || 'Academic Committee'}):
                        </div>
                        <p className="mt-0.5 leading-relaxed">{req.faculty_feedback}</p>
                        {req.rejection_reason && (
                          <p className="mt-1 font-semibold text-rose-800">
                            Rejection Reason: {req.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── 5. FACULTY REVIEW & DECISION WORKSPACE MODAL ─── */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Faculty Evaluation Workspace
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Ticket: {reviewingRequest.id}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Evaluate {reviewingRequest.student_name} — {reviewingRequest.skill_name}
                </h3>
              </div>
              <button
                onClick={() => setReviewingRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitDecision} className="p-5 overflow-y-auto space-y-4 flex-1">
              {decisionError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  {decisionError}
                </div>
              )}

              {decisionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {decisionSuccess}
                </div>
              )}

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Candidate</span>
                  <strong className="text-slate-900 font-bold">{reviewingRequest.student_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Department</span>
                  <strong className="text-slate-900 font-bold">{reviewingRequest.department || 'CSE'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Target Skill</span>
                  <strong className="text-[var(--color-accent)] font-bold">{reviewingRequest.skill_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Claimed Score</span>
                  <strong className="text-slate-900 font-bold">{reviewingRequest.score} / 100</strong>
                </div>
              </div>

              {/* Student Experience & Contribution */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Student Claim &amp; Experience Notes</h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  {reviewingRequest.description || reviewingRequest.proof_notes || 'No description provided.'}
                </div>
              </div>

              {/* Submitted Evidence Links */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted Evidence Artifacts</h4>
                <div className="space-y-2">
                  {reviewingRequest.supporting_evidence && reviewingRequest.supporting_evidence.length > 0 ? (
                    reviewingRequest.supporting_evidence.map((ev, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                            {ev.type === 'github_repo' ? <GitBranch className="h-4 w-4" /> : <Globe className="h-4 w-4 text-[var(--color-accent)]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">{ev.title}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{ev.description || ev.url}</span>
                          </div>
                        </div>
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shrink-0 inline-flex items-center gap-1 shadow-2xs"
                          >
                            Inspect Code <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : reviewingRequest.proof_url ? (
                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-700 truncate">{reviewingRequest.proof_url}</span>
                      <a
                        href={reviewingRequest.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shrink-0 inline-flex items-center gap-1 shadow-2xs"
                      >
                        Inspect Code <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No external proof URL attached.</p>
                  )}
                </div>
              </div>

              {/* Decision Toggle */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionMode('approve')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decisionMode === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="h-4 w-4" /> Endorse &amp; Verify Skill
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionMode('reject')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decisionMode === 'reject'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <X className="h-4 w-4" /> Reject &amp; Request Revision
                  </button>
                </div>

                {decisionMode === 'approve' ? (
                  <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-emerald-900 block mb-1">
                          Endorsed Verified Score (0–100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={evalVerifiedScore}
                          onChange={(e) => setEvalVerifiedScore(Number(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl border border-emerald-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-emerald-900 block mb-1">
                          Verification Tier
                        </label>
                        <select
                          value={evalVerifiedTier}
                          onChange={(e) => setEvalVerifiedTier(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-emerald-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="Institution Verified">Institution Verified</option>
                          <option value="Practical Verified">Practical Verified</option>
                          <option value="Evidence Verified">Evidence Verified</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-emerald-900 block mb-1">
                        Faculty Endorsement Notes
                      </label>
                      <textarea
                        value={evalFacultyNotes}
                        onChange={(e) => setEvalFacultyNotes(e.target.value)}
                        placeholder="Recorded feedback endorsing candidate competency..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-200 animate-in fade-in">
                    <div>
                      <label className="text-xs font-bold text-rose-900 block mb-1">
                        Rejection Reason
                      </label>
                      <select
                        value={evalRejectionReason}
                        onChange={(e) => setEvalRejectionReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Insufficient practical repository evidence">Insufficient practical repository evidence</option>
                        <option value="Repository links inaccessible or 404">Repository links inaccessible or 404</option>
                        <option value="Code does not demonstrate claimed proficiency level">Code does not demonstrate claimed proficiency level</option>
                        <option value="Missing unit tests and architectural documentation">Missing unit tests and architectural documentation</option>
                        <option value="Further academic coursework required">Further academic coursework required</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-rose-900 block mb-1">
                        Constructive Student Feedback
                      </label>
                      <textarea
                        value={evalRejectionFeedback}
                        onChange={(e) => setEvalRejectionFeedback(e.target.value)}
                        placeholder="Specific recommendations for the student on how to improve before resubmitting..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewingRequest(null)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingDecision}
                  className={`h-9 px-5 rounded-xl text-white text-xs font-bold shadow-xs ${
                    decisionMode === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingDecision ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Decision...
                    </>
                  ) : decisionMode === 'approve' ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Endorse &amp; Grant Badge
                    </>
                  ) : (
                    <>
                      <X className="mr-1.5 h-3.5 w-3.5" /> Confirm Rejection
                    </>
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
