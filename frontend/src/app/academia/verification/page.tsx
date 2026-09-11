"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import {
  ShieldCheck, Award, Calendar, Video, CheckCircle2, Clock,
  AlertTriangle, UserCheck, ArrowRight, ExternalLink, Mic,
  MicOff, VideoOff, Monitor, X, Play, FileCheck, HelpCircle,
  ChevronRight, Save, User, FileText, Check, Loader2, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface VerificationRequestItem {
  id: string
  student_id: string
  student_name: string
  student_email: string
  academician_id: string
  academician_name: string
  skill_name: string
  current_skill_score: number
  assessment_score: number
  academic_test_score?: number
  status: 'request_sent' | 'accepted' | 'scheduled' | 'in_progress' | 'verified' | 'rejected' | 'reassessment_required' | 'reschedule_required'
  supporting_evidence: Array<{
    title: string
    type: string
    url?: string
    description?: string
  }>
  student_notes?: string
  rejection_reason?: string
  rejection_feedback?: string
  created_at: string
  session?: {
    id: string
    scheduled_at: string
    duration_minutes: number
    verification_methods: string[]
    meeting_link: string
    verification_notes?: string
  } | null
}

export default function AcademiaVerificationPage() {
  const { user, profile } = useAuth()
  const { isDemo } = useDemo()

  const [requests, setRequests] = useState<VerificationRequestItem[]>([])
  const [loading, setLoading] = useState(true)

  // Scheduling Modal State
  const [schedulingRequest, setSchedulingRequest] = useState<VerificationRequestItem | null>(null)
  const [scheduleDate, setScheduleDate] = useState('2026-09-12')
  const [scheduleTime, setScheduleTime] = useState('14:30')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [submittingSchedule, setSubmittingSchedule] = useState(false)

  // Live Video Room State
  const [activeVideoSession, setActiveVideoSession] = useState<VerificationRequestItem | null>(null)
  const [micActive, setMicActive] = useState(true)
  const [videoActive, setVideoActive] = useState(true)
  const [screenShareActive, setScreenShareActive] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSavedNotice, setNotesSavedNotice] = useState(false)

  // Final Decision Modal State
  const [decisionRequest, setDecisionRequest] = useState<VerificationRequestItem | null>(null)
  const [evidenceScore, setEvidenceScore] = useState(85)
  const [academicTestScore, setAcademicTestScore] = useState(85)
  const [rejectionReason, setRejectionReason] = useState('Insufficient practical evidence demonstrated')
  const [rejectionFeedback, setRejectionFeedback] = useState('Recommend building a complete CRUD application with end-to-end testing and review debugging fundamentals.')
  const [submittingDecision, setSubmittingDecision] = useState(false)

  // Evidence Drawer / Viewer State
  const [inspectingRequest, setInspectingRequest] = useState<VerificationRequestItem | null>(null)

  // Fetch Verification Requests
  const loadRequests = async () => {
    try {
      // 1. Try dedicated live Supabase verification list
      const liveRes = await fetch('/api/verification/list')
      if (liveRes.ok) {
        const liveJson = await liveRes.json()
        if (liveJson.requests && Array.isArray(liveJson.requests) && liveJson.requests.length > 0) {
          const mapped = liveJson.requests.map((r: any) => ({
            id: r.id,
            student_id: r.student_id,
            student_name: r.student_name,
            student_email: r.student_email || 'student@dtu.ac.in',
            academician_id: 'faculty-001',
            academician_name: 'Dr. Sarah Mitchell',
            skill_name: r.skill_name,
            current_skill_score: r.score || 85,
            assessment_score: r.score || 85,
            status: r.status === 'approved' ? 'verified' : (r.status === 'rejected' ? 'rejected' : 'request_sent'),
            verification_tier: r.verification_tier,
            supporting_evidence: r.proof_url ? [{ title: 'Repository Evidence', type: 'github', url: r.proof_url, description: r.proof_notes }] : [],
            student_notes: r.proof_notes || 'Student benchmark assessment submitted for verified Living Skill Passport upgrade.',
            created_at: r.created_at || new Date().toISOString(),
          }))
          setRequests(mapped as any)
          setLoading(false)
          return
        }
      }

      // 2. Fallback to academician requests endpoint
      const res = await apiClient<{ success: boolean; data: VerificationRequestItem[] }>('/api/verification/academician/requests')
      if (res?.success && Array.isArray(res.data)) {
        setRequests(res.data)
      }
    } catch (err) {
      console.warn('Failed to load academician verification queue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  // 1-Click Approve Verification Action
  const handleQuickApprove = async (id: string) => {
    try {
      const res = await fetch('/api/verification/action', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action: 'approved', facultyFeedback: 'Verified with high technical competence.' })
      })
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'verified' as any } : r))
    } catch (err) {
      console.error('Quick approve error:', err)
    }
  }

  // 1-Click Quick Reject Action
  const handleQuickReject = async (id: string) => {
    try {
      const res = await fetch('/api/verification/action', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, action: 'rejected', facultyFeedback: 'Evidence insufficient to warrant endorsement.' })
      })
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as any } : r))
    } catch (err) {
      console.error('Quick reject error:', err)
    }
  }

  // Action: Accept Request (Scheduling route)
  const handleAccept = async (id: string) => {
    try {
      const res = await apiClient<{ success: boolean; data: VerificationRequestItem }>(`/api/verification/requests/${id}/accept`, {
        method: 'POST',
      })
      if (res?.success && res.data) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r))
      }
    } catch (err) {
      console.error('Failed to accept request:', err)
    }
  }

  // Action: Submit Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedulingRequest || submittingSchedule) return

    setSubmittingSchedule(true)
    try {
      const scheduled_at = new Date(`${scheduleDate}T${scheduleTime}:00Z`).toISOString()
      const res = await apiClient<{ success: boolean; data: any }>(`/api/verification/requests/${schedulingRequest.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          scheduled_at,
          duration_minutes: durationMinutes,
          verification_methods: ['live_video', 'skill_test'],
        }),
      })

      if (res?.success && res.data) {
        setRequests(prev => prev.map(r => r.id === schedulingRequest.id ? { ...r, status: 'scheduled', session: res.data.session } : r))
        setSchedulingRequest(null)
      }
    } catch (err) {
      console.error('Failed to schedule session:', err)
    } finally {
      setSubmittingSchedule(false)
    }
  }

  // Action: Save Real-Time Verification Notes
  const handleSaveNotes = async () => {
    if (!activeVideoSession || savingNotes) return
    setSavingNotes(true)
    try {
      await apiClient(`/api/verification/requests/${activeVideoSession.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes: sessionNotes }),
      })
      setNotesSavedNotice(true)
      setTimeout(() => setNotesSavedNotice(false), 2500)
    } catch (err) {
      console.error('Failed to save notes:', err)
    } finally {
      setSavingNotes(false)
    }
  }

  // Action: Final Verification Decision (Verify, Reject, Reassessment)
  const handleDecision = async (decision: 'VERIFY' | 'REJECT' | 'REASSESSMENT') => {
    if (!decisionRequest || submittingDecision) return
    setSubmittingDecision(true)

    try {
      const payload = {
        decision,
        evidence_score: evidenceScore,
        platform_assessment_score: decisionRequest.assessment_score || 80,
        academic_test_score: decisionRequest.academic_test_score || academicTestScore,
        verification_notes: sessionNotes || 'Verified through practical walkthrough and standardized test.',
        rejection_reason: rejectionReason,
        rejection_feedback: rejectionFeedback,
      }

      const res = await apiClient<{ success: boolean; data: any }>(`/api/verification/requests/${decisionRequest.id}/decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res?.success) {
        const newStatus = decision === 'VERIFY' ? 'verified' : decision === 'REASSESSMENT' ? 'reassessment_required' : 'rejected'
        setRequests(prev => prev.map(r => r.id === decisionRequest.id ? { ...r, status: newStatus as any } : r))
        setDecisionRequest(null)
        setActiveVideoSession(null)
      }
    } catch (err) {
      console.error('Failed to submit verification decision:', err)
    } finally {
      setSubmittingDecision(false)
    }
  }

  const getStatusBadge = (status: VerificationRequestItem['status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-emerald-600 text-white font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> Academically Verified</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-600 text-white font-bold"><Calendar className="h-3 w-3 mr-1" /> Session Scheduled</Badge>
      case 'in_progress':
        return <Badge className="bg-amber-600 text-white font-bold"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>
      case 'accepted':
        return <Badge className="bg-indigo-600 text-white font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> Accepted</Badge>
      case 'reassessment_required':
        return <Badge className="bg-amber-500 text-white font-bold"><AlertTriangle className="h-3 w-3 mr-1" /> Re-Assessment Required</Badge>
      case 'rejected':
        return <Badge className="bg-rose-600 text-white font-bold"><X className="h-3 w-3 mr-1" /> Not Approved</Badge>
      default:
        return <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-semibold"><Clock className="h-3 w-3 mr-1" /> Request Sent</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-[var(--color-accent)]" />
          <p className="text-xs font-semibold text-slate-500">Loading faculty verification queue...</p>
        </div>
      </div>
    )
  }

  const pendingCount = requests.filter(r => r.status === 'request_sent').length
  const scheduledCount = requests.filter(r => r.status === 'scheduled' || r.status === 'in_progress').length
  const verifiedCount = requests.filter(r => r.status === 'verified').length

  return (
    <div className="relative space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" /> Faculty Evaluation Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Academician Verification Dashboard
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl">
            Review student evidence, schedule live video verifications, assign standardized skill tests, and grant authoritative <strong className="text-slate-800">Academically Verified</strong> trust badges.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Pending Review</span>
          <div className="text-3xl font-black text-[var(--color-accent)]">{pendingCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">New student submissions awaiting evaluation</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Scheduled Sessions</span>
          <div className="text-3xl font-black text-blue-600">{scheduledCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Live interviews & practical tests queued</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Skills Verified</span>
          <div className="text-3xl font-black text-emerald-600">{verifiedCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Officially endorsed student competencies</span>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[var(--color-accent)]" /> Verification Requests Queue
          </h2>
          <span className="text-xs text-slate-500 font-medium">{requests.length} students in queue</span>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-3">
            <ShieldCheck className="h-10 w-10 mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">No requests pending review</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When students request human faculty endorsement for their skills, their profile, evidence, and assessment scores will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div
                key={req.id}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-[var(--color-accent)]/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center font-black text-sm">
                      {req.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {req.student_name} • <span className="text-[var(--color-accent-hover)]">{req.skill_name}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {req.student_email} • Request Date: {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Performance & Evidence Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Diagnostic Score</span>
                    <strong className="text-slate-900 font-bold text-sm">{req.assessment_score}/100</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Academic Test</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {req.academic_test_score ? `${req.academic_test_score}/100` : 'Not Taken'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Projects Attached</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {req.supporting_evidence.filter(e => e.type === 'project').length || 1} Projects
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Scheduled Date</span>
                    <strong className="text-blue-700 font-bold text-sm">
                      {req.session?.scheduled_at ? new Date(req.session.scheduled_at).toLocaleDateString() : 'Unscheduled'}
                    </strong>
                  </div>
                </div>

                {/* Action Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectingRequest(req)}
                    className="h-9 px-3 rounded-xl border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-bold gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-500" /> View Evidence Portfolio
                  </Button>

                  <div className="flex items-center gap-2">
                    {req.status === 'request_sent' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleQuickApprove(req.id)}
                          className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Approve Verification
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAccept(req.id)}
                          className="h-9 px-3 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs gap-1.5 cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5 text-blue-600" /> Schedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReject(req.id)}
                          className="h-9 px-3 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer"
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {req.status === 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => setSchedulingRequest(req)}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                      >
                        <Calendar className="h-3.5 w-3.5" /> Schedule Verification
                      </Button>
                    )}

                    {['scheduled', 'in_progress'].includes(req.status) && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveVideoSession(req)
                            setSessionNotes(req.session?.verification_notes || '')
                          }}
                          className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                        >
                          <Video className="h-3.5 w-3.5" /> Join Live Verification
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => setDecisionRequest(req)}
                          className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs gap-1.5 shadow-xs"
                        >
                          <Award className="h-3.5 w-3.5" /> Final Decision
                        </Button>
                      </>
                    )}

                    {req.status === 'verified' && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Endorsement Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── SCHEDULE VERIFICATION MODAL ───────────────────────────────────── */}
      {schedulingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Faculty Scheduling
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Schedule Verification Session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student: {schedulingRequest.student_name} • Skill: {schedulingRequest.skill_name}
                </p>
              </div>
              <button
                onClick={() => setSchedulingRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Session Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                        durationMinutes === mins
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      {mins} Minutes
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Verification Methods</label>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Live Video Technical Interview
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Standardized Academic Skill Test
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Project & Code Repository Review
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSchedulingRequest(null)}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingSchedule}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-xs"
                >
                  {submittingSchedule ? 'Scheduling...' : 'Confirm & Notify Student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LIVE VIDEO VERIFICATION ROOM (FACULTY VIEW) ───────────────────── */}
      {activeVideoSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-white max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Faculty Verification Room: {activeVideoSession.skill_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Evaluating Student: <strong className="text-white">{activeVideoSession.student_name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setDecisionRequest(activeVideoSession)}
                  className="h-8 px-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs"
                >
                  Proceed to Final Decision
                </Button>
                <button
                  onClick={() => setActiveVideoSession(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Streams Grid */}
            <div className="grid sm:grid-cols-2 gap-4 h-64 sm:h-72">
              {/* Faculty Stream */}
              <div className="relative rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="h-14 w-14 mx-auto rounded-full bg-[var(--color-accent)]/30 border border-[var(--color-accent)] flex items-center justify-center text-lg font-black text-[var(--color-accent)]">
                    FAC
                  </div>
                  <span className="text-xs font-semibold text-slate-300 block">Your Camera Feed</span>
                </div>
                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-emerald-400">
                  Faculty (Host)
                </span>
              </div>

              {/* Student Stream */}
              <div className="relative rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="h-14 w-14 mx-auto rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-lg font-black text-slate-200">
                    ST
                  </div>
                  <span className="text-xs font-semibold text-slate-300 block">{activeVideoSession.student_name}</span>
                  <span className="text-[10px] text-emerald-400 block">Connected Live</span>
                </div>
                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-slate-200">
                  Student Feed
                </span>
              </div>
            </div>

            {/* Live Verification Notes Panel */}
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[var(--color-accent)]" /> Live Evaluation Notes (Recorded during technical walkthrough)
                </label>
                {notesSavedNotice && (
                  <span className="text-[11px] font-bold text-emerald-400">✓ Notes Saved</span>
                )}
              </div>
              <textarea
                rows={3}
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                placeholder="Record candidate's practical answers, project architecture comprehension, and debugging competence..."
              />
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMicActive(prev => !prev)}
                    className={`h-8 rounded-xl border-slate-700 text-xs gap-1.5 ${micActive ? 'bg-slate-800 text-white' : 'bg-rose-900/60 text-rose-300'}`}
                  >
                    {micActive ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />} {micActive ? 'Mute' : 'Unmute'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVideoActive(prev => !prev)}
                    className={`h-8 rounded-xl border-slate-700 text-xs gap-1.5 ${videoActive ? 'bg-slate-800 text-white' : 'bg-rose-900/60 text-rose-300'}`}
                  >
                    {videoActive ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />} {videoActive ? 'Stop Cam' : 'Start Cam'}
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="h-8 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" /> {savingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FINAL DECISION MODAL ──────────────────────────────────────────── */}
      {decisionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Human Authority Decision
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Final Skill Verification Decision
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Skill: <strong className="text-slate-900">{decisionRequest.skill_name}</strong> • Student: {decisionRequest.student_name}
                </p>
              </div>
              <button
                onClick={() => setDecisionRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Evidence & Assessment Synthesis Matrix */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Evaluation Synthesis</h4>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-semibold">Diagnostic Assessment</span>
                  <strong className="text-base font-black text-slate-900">{decisionRequest.assessment_score}/100</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-semibold">Academic Skill Test</span>
                  <strong className="text-base font-black text-[var(--color-accent)]">
                    {decisionRequest.academic_test_score ? `${decisionRequest.academic_test_score}/100` : `${academicTestScore}/100`}
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-semibold">Practical Evidence</span>
                  <strong className="text-base font-black text-emerald-600">{evidenceScore}/100</strong>
                </div>
              </div>

              {sessionNotes && (
                <div className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                  <strong className="text-slate-800 font-bold block mb-0.5">Live Verification Notes:</strong>
                  "{sessionNotes}"
                </div>
              )}
            </div>

            {/* Score Calibration Sliders */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Assigned Evidence Score</span>
                  <span className="text-[var(--color-accent)]">{evidenceScore}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={evidenceScore}
                  onChange={e => setEvidenceScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Assigned Academic Test Score</span>
                  <span className="text-[var(--color-accent)]">{academicTestScore}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={academicTestScore}
                  onChange={e => setAcademicTestScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rejection / Reassessment Feedback Input */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">Rejection / Re-Assessment Reason (If applicable)</label>
              <select
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
              >
                <option value="Insufficient practical knowledge">Insufficient practical knowledge</option>
                <option value="Evidence not sufficient">Evidence not sufficient</option>
                <option value="Assessment performance low">Assessment performance low</option>
                <option value="Live verification unsuccessful">Live verification unsuccessful</option>
              </select>

              <textarea
                rows={2}
                value={rejectionFeedback}
                onChange={e => setRejectionFeedback(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900"
                placeholder="Provide guidance for student to improve with AI Coach..."
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                disabled={submittingDecision}
                onClick={() => handleDecision('VERIFY')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> VERIFY SKILL
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={submittingDecision}
                onClick={() => handleDecision('REASSESSMENT')}
                className="border-amber-300 text-amber-900 hover:bg-amber-50 font-bold rounded-xl text-xs h-10"
              >
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" /> RE-ASSESSMENT
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={submittingDecision}
                onClick={() => handleDecision('REJECT')}
                className="border-rose-300 text-rose-900 hover:bg-rose-50 font-bold rounded-xl text-xs h-10"
              >
                <X className="h-4 w-4 mr-1 text-rose-600" /> REJECT SKILL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EVIDENCE INSPECTOR DRAWER / MODAL ─────────────────────────────── */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  Portfolio Proof
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {inspectingRequest.student_name}'s Evidence
                </h3>
                <p className="text-xs text-slate-500">
                  Target Skill: {inspectingRequest.skill_name}
                </p>
              </div>
              <button
                onClick={() => setInspectingRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 font-semibold block text-[11px]">Student Notes</span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  "{inspectingRequest.student_notes || 'Submitted for formal academician review and trust endorsement.'}"
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Submitted Artifacts</h4>
                {inspectingRequest.supporting_evidence.map((ev, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{ev.title}</span>
                      <span className="text-[10px] text-[var(--color-accent-hover)] uppercase">{ev.type}</span>
                    </div>
                    {ev.description && <p className="text-slate-500 text-[11px]">{ev.description}</p>}
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline pt-0.5"
                      >
                        {ev.url} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setInspectingRequest(null)}
                className="rounded-xl text-xs h-9 px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
