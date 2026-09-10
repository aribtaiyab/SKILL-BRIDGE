"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import {
  ShieldCheck, Award, Calendar, Video, CheckCircle2, Clock,
  AlertTriangle, UserCheck, ArrowRight, BookOpen, Sparkles,
  ExternalLink, Mic, MicOff, VideoOff, Monitor, X, Play,
  FileCheck, HelpCircle, ChevronRight, MessageSquare, Bot, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface VerificationRequest {
  id: string
  student_id: string
  student_name: string
  academician_id: string
  academician_name: string
  academician_institution: string
  academician_department: string
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

interface AcademicianOption {
  id: string
  profile_id: string
  full_name: string
  title: string
  institution_name: string
  department: string
  expertise_skills: string[]
  availability: string
}

export default function StudentVerificationPage() {
  const { user, profile } = useAuth()
  const { isDemo, student } = useDemo()

  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [academicians, setAcademicians] = useState<AcademicianOption[]>([])
  const [loading, setLoading] = useState(true)

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState('React')
  const [selectedAcademicianId, setSelectedAcademicianId] = useState('')
  const [evidenceProject, setEvidenceProject] = useState('Full Stack E-Commerce Platform')
  const [evidenceGithub, setEvidenceGithub] = useState('https://github.com/student/react-production-app')
  const [evidenceCertificate, setEvidenceCertificate] = useState('Advanced React Architecture Certificate')
  const [studentNotes, setStudentNotes] = useState('I have built production applications and completed diagnostic assessments.')

  // Live Video Room State
  const [activeVideoSession, setActiveVideoSession] = useState<VerificationRequest | null>(null)
  const [micActive, setMicActive] = useState(true)
  const [videoActive, setVideoActive] = useState(true)
  const [screenShareActive, setScreenShareActive] = useState(false)
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(1800) // 30 mins

  // Academic Test State
  const [activeTestRequest, setActiveTestRequest] = useState<VerificationRequest | null>(null)
  const [testQuestions, setTestQuestions] = useState<any[]>([])
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({})
  const [testSubmitting, setTestSubmitting] = useState(false)
  const [testResult, setTestResult] = useState<any | null>(null)

  // Load available academicians and student requests
  useEffect(() => {
    async function loadData() {
      try {
        const [facRes, reqRes] = await Promise.all([
          apiClient<{ success: boolean; data: AcademicianOption[] }>('/api/verification/academicians'),
          apiClient<{ success: boolean; data: VerificationRequest[] }>('/api/verification/student/requests'),
        ])

        if (facRes?.success && Array.isArray(facRes.data)) {
          setAcademicians(facRes.data)
          if (facRes.data.length > 0) setSelectedAcademicianId(facRes.data[0].id)
        }

        if (reqRes?.success && Array.isArray(reqRes.data)) {
          setRequests(reqRes.data)
        }
      } catch (err) {
        console.warn('Error loading verification data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Timer countdown for active video room
  useEffect(() => {
    let interval: any
    if (activeVideoSession && sessionSecondsLeft > 0) {
      interval = setInterval(() => {
        setSessionSecondsLeft(prev => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeVideoSession, sessionSecondsLeft])

  // Handle Request Submission
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSkill || !selectedAcademicianId || submittingRequest) return

    setSubmittingRequest(true)
    try {
      const payload = {
        skill_name: selectedSkill,
        academician_id: selectedAcademicianId,
        student_notes: studentNotes,
        supporting_evidence: [
          { title: evidenceProject, type: 'project', url: evidenceGithub, description: 'Hands-on practical full-stack project' },
          { title: 'GitHub Repository', type: 'github_repo', url: evidenceGithub, description: 'Public open-source implementation' },
          { title: evidenceCertificate, type: 'certificate', description: 'Accredited coursework certification' },
        ],
      }

      const res = await apiClient<{ success: boolean; data: VerificationRequest }>('/api/verification/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res?.success && res.data) {
        setRequests(prev => [res.data, ...prev])
        setIsRequestModalOpen(false)
      }
    } catch (err) {
      console.error('Failed to submit verification request:', err)
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Handle Opening Academic Skill Test
  const handleOpenSkillTest = async (req: VerificationRequest) => {
    setActiveTestRequest(req)
    setTestResult(null)
    setStudentAnswers({})
    try {
      const res = await apiClient<{ success: boolean; data: any }>(`/api/verification/requests/${req.id}/test`)
      if (res?.success && res.data?.questions) {
        setTestQuestions(res.data.questions)
      }
    } catch (err) {
      console.error('Failed to load test:', err)
    }
  }

  // Handle Submitting Academic Skill Test
  const handleSubmitSkillTest = async () => {
    if (!activeTestRequest || testSubmitting) return
    setTestSubmitting(true)
    try {
      const res = await apiClient<{ success: boolean; data: any }>(`/api/verification/requests/${activeTestRequest.id}/test/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: studentAnswers }),
      })
      if (res?.success && res.data) {
        setTestResult(res.data)
        // Update local request score
        setRequests(prev => prev.map(r => r.id === activeTestRequest.id ? { ...r, academic_test_score: res.data.score } : r))
      }
    } catch (err) {
      console.error('Failed to submit test:', err)
    } finally {
      setTestSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getStatusBadge = (status: VerificationRequest['status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-emerald-600 text-white font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> Academically Verified</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-600 text-white font-bold"><Calendar className="h-3 w-3 mr-1" /> Session Scheduled</Badge>
      case 'in_progress':
        return <Badge className="bg-amber-600 text-white font-bold"><Clock className="h-3 w-3 mr-1" /> In Progress</Badge>
      case 'accepted':
        return <Badge className="bg-indigo-600 text-white font-bold"><CheckCircle2 className="h-3 w-3 mr-1" /> Accepted (Pending Date)</Badge>
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
          <p className="text-xs font-semibold text-slate-500">Loading academician verification ledger...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" /> Authoritative Human Layer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Academician Skill Verification
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl">
            Have university professors evaluate your practical projects, conduct live technical interviews, and grant official <strong className="text-slate-800">Academically Verified</strong> trust badges to your individual skills.
          </p>
        </div>

        <Button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-2xl shadow-sm gap-2 shrink-0 h-11 px-5"
        >
          <Award className="h-4 w-4" /> Request Verification
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Academically Verified</span>
          <div className="text-3xl font-black text-emerald-600">
            {requests.filter(r => r.status === 'verified').length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Individual skills human-verified</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Requests</span>
          <div className="text-3xl font-black text-[var(--color-accent)]">
            {requests.filter(r => ['request_sent', 'accepted', 'scheduled', 'in_progress'].includes(r.status)).length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Under professor review or scheduled</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Available Faculty</span>
          <div className="text-3xl font-black text-slate-800">
            {academicians.length || 4}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">DTU, IIT Delhi, IIIT Hyderabad</span>
        </div>
      </div>

      {/* Requests Ledger */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-[var(--color-accent)]" /> Your Verification Requests
          </h2>
          <span className="text-xs text-slate-500 font-medium">{requests.length} total recorded</span>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 shadow-xs">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">No verification requests yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Take your assessed competencies to the next level. Request a faculty review for React, Python, Java, or SQL to earn an official Academically Verified badge.
              </p>
            </div>
            <Button
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-2xl text-xs h-9 px-4"
            >
              Select a Skill to Verify
            </Button>
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
                    <div className="h-10 w-10 rounded-2xl bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center font-black text-sm">
                      {req.skill_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {req.skill_name} Verification
                      </h3>
                      <p className="text-xs text-slate-500">
                        Reviewer: <strong className="text-slate-800">{req.academician_name}</strong> • {req.academician_institution}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Evidence & Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Diagnostic Score</span>
                    <strong className="text-slate-900 font-bold text-sm">{req.assessment_score}/100</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Academic Test</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {req.academic_test_score ? `${req.academic_test_score}/100` : 'Pending'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Evidence Submitted</span>
                    <strong className="text-slate-900 font-bold text-sm">{req.supporting_evidence.length} Artifacts</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Scheduled Date</span>
                    <strong className="text-[var(--color-accent-hover)] font-bold text-sm">
                      {req.session?.scheduled_at ? new Date(req.session.scheduled_at).toLocaleDateString() : 'Awaiting Faculty'}
                    </strong>
                  </div>
                </div>

                {/* Rejection / Reassessment Feedback Banner */}
                {(req.status === 'rejected' || req.status === 'reassessment_required') && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Feedback from {req.academician_name}: {req.rejection_reason}</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed font-medium">
                      "{req.rejection_feedback || 'Focus on foundational debugging and production project evidence before requesting another assessment.'}"
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <Link
                        href={`/student/ai-coach?skill=${encodeURIComponent(req.skill_name)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <Bot className="h-3.5 w-3.5" /> Improve Skill with AI Coach <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold">Request Date:</span> {new Date(req.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Academic Test Action */}
                    {['accepted', 'scheduled', 'in_progress'].includes(req.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSkillTest(req)}
                        className="h-9 px-3 rounded-xl border-slate-200 text-slate-800 hover:bg-slate-50 font-bold text-xs gap-1.5"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-[var(--color-accent)]" /> Take Academic Skill Test
                      </Button>
                    )}

                    {/* Join Live Video Verification */}
                    {['scheduled', 'in_progress'].includes(req.status) && (
                      <Button
                        size="sm"
                        onClick={() => setActiveVideoSession(req)}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                      >
                        <Video className="h-3.5 w-3.5" /> Join Video Verification
                      </Button>
                    )}

                    {req.status === 'verified' && (
                      <Link
                        href="/student/skills"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                      >
                        View Verified Skill in Profile <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── REQUEST VERIFICATION MODAL ────────────────────────────────────── */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Human Faculty Review
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Request Academician Verification
                </h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Skill Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Select Skill to Verify</label>
                <select
                  value={selectedSkill}
                  onChange={e => setSelectedSkill(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <option value="React">React (Modern Component Architecture)</option>
                  <option value="Node.js">Node.js (Backend & REST APIs)</option>
                  <option value="Python">Python (AI / Data Processing)</option>
                  <option value="Java">Java (Enterprise & Spring Boot)</option>
                  <option value="SQL">SQL (Relational Schemas & Querying)</option>
                  <option value="Git & Version Control">Git & Version Control</option>
                </select>
              </div>

              {/* Academician Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Select Faculty Reviewer</label>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {academicians.map(fac => {
                    const isSelected = selectedAcademicianId === fac.id
                    return (
                      <div
                        key={fac.id}
                        onClick={() => setSelectedAcademicianId(fac.id)}
                        className={`cursor-pointer p-3 rounded-2xl border text-xs transition-all ${
                          isSelected
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]/40 ring-1 ring-[var(--color-accent)]'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold text-slate-900">
                          <span>{fac.full_name}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{fac.department}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{fac.institution_name}</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {fac.expertise_skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Supporting Evidence Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">Supporting Evidence (For Faculty Review)</h4>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">Project Title</label>
                  <input
                    type="text"
                    value={evidenceProject}
                    onChange={e => setEvidenceProject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                    placeholder="e.g. Distributed E-Commerce Backend"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">GitHub Repository Link</label>
                  <input
                    type="url"
                    value={evidenceGithub}
                    onChange={e => setEvidenceGithub(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 font-mono"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">Certificates or Credentials</label>
                  <input
                    type="text"
                    value={evidenceCertificate}
                    onChange={e => setEvidenceCertificate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                    placeholder="e.g. Meta Frontend Developer / AWS Associate"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">Notes to Faculty</label>
                  <textarea
                    rows={2}
                    value={studentNotes}
                    onChange={e => setStudentNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
                    placeholder="Brief description of your practical experience..."
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingRequest}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-xl text-xs h-9 px-5 shadow-xs"
                >
                  {submittingRequest ? 'Submitting...' : 'Send Verification Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LIVE VIDEO VERIFICATION ROOM ─────────────────────────────────── */}
      {activeVideoSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Live Skill Verification: {activeVideoSession.skill_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Faculty Reviewer: {activeVideoSession.academician_name} ({activeVideoSession.academician_institution})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-emerald-400">
                  ⏱ {formatTime(sessionSecondsLeft)}
                </span>
                <button
                  onClick={() => setActiveVideoSession(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Feeds Grid */}
            <div className="grid sm:grid-cols-2 gap-4 h-72 sm:h-80">
              {/* Student Camera */}
              <div className="relative rounded-2xl bg-slate-800/90 border border-slate-700/80 overflow-hidden flex items-center justify-center">
                {videoActive ? (
                  <div className="text-center space-y-2">
                    <div className="h-16 w-16 mx-auto rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-xl font-black text-slate-300">
                      ST
                    </div>
                    <span className="text-xs font-semibold text-slate-300 block">Your Camera Feed (Live)</span>
                  </div>
                ) : (
                  <div className="text-center space-y-1 text-slate-500">
                    <VideoOff className="h-8 w-8 mx-auto" />
                    <span className="text-xs">Camera Muted</span>
                  </div>
                )}
                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-slate-200 backdrop-blur-xs">
                  You ({micActive ? 'Mic On' : 'Muted'})
                </span>
              </div>

              {/* Faculty Camera */}
              <div className="relative rounded-2xl bg-slate-800/90 border border-slate-700/80 overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 mx-auto rounded-full bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/50 flex items-center justify-center text-xl font-black text-[var(--color-accent)]">
                    {activeVideoSession.academician_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-300 block">{activeVideoSession.academician_name}</span>
                  <span className="text-[10px] text-slate-400 block">{activeVideoSession.academician_institution}</span>
                </div>
                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-emerald-400 backdrop-blur-xs">
                  Faculty Reviewer (Connected)
                </span>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMicActive(prev => !prev)}
                  className={`rounded-xl border-slate-700 text-xs gap-1.5 ${micActive ? 'bg-slate-800 text-white' : 'bg-rose-900/60 text-rose-300 border-rose-700'}`}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {micActive ? 'Mute' : 'Unmute'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVideoActive(prev => !prev)}
                  className={`rounded-xl border-slate-700 text-xs gap-1.5 ${videoActive ? 'bg-slate-800 text-white' : 'bg-rose-900/60 text-rose-300 border-rose-700'}`}
                >
                  {videoActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  {videoActive ? 'Stop Video' : 'Start Video'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScreenShareActive(prev => !prev)}
                  className={`rounded-xl border-slate-700 text-xs gap-1.5 ${screenShareActive ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700' : 'bg-slate-800 text-white'}`}
                >
                  <Monitor className="h-4 w-4" /> {screenShareActive ? 'Stop Sharing' : 'Share Screen'}
                </Button>
              </div>

              <Button
                size="sm"
                onClick={() => setActiveVideoSession(null)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs h-9 px-4"
              >
                End Call
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACADEMIC SKILL TEST MODAL ────────────────────────────────────── */}
      {activeTestRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Academic Standardized Diagnostic
                </span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {activeTestRequest.skill_name} Academic Skill Test
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigned by {activeTestRequest.academician_name} • Passing Threshold: 75%
                </p>
              </div>
              <button
                onClick={() => setActiveTestRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {testResult ? (
              <div className="space-y-5">
                <div className={`p-5 rounded-2xl text-center space-y-2 border ${
                  testResult.passed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="text-4xl font-black">{testResult.score}%</div>
                  <h4 className="text-base font-bold">
                    {testResult.passed ? 'Academic Test Passed!' : 'Threshold Not Met'}
                  </h4>
                  <p className="text-xs max-w-md mx-auto">
                    {testResult.passed
                      ? 'Your academic test score has been submitted directly to your reviewing faculty.'
                      : 'You scored below the 75% threshold. Your faculty reviewer can request re-assessment or allow re-testing.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Question Performance Breakdown</h4>
                  {testResult.review?.map((rev: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Q{idx + 1}: {rev.questionText}</span>
                        <span className={rev.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                          {rev.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]"><strong className="text-slate-800">Your Answer:</strong> {rev.studentAnswer}</p>
                      <p className="text-slate-500 text-[11px] italic"><strong className="text-slate-700">Explanation:</strong> {rev.explanation}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    onClick={() => setActiveTestRequest(null)}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-xl text-xs h-9 px-5"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {testQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 text-xs">
                    <div className="flex justify-between items-start font-bold text-slate-900">
                      <span>Question {idx + 1} ({q.type.toUpperCase()})</span>
                      <span className="text-slate-500 text-[11px]">{q.points} pts</span>
                    </div>
                    <p className="text-slate-800 text-sm font-semibold">{q.questionText}</p>

                    <div className="space-y-1.5 pt-1">
                      {q.options?.map((opt: string) => {
                        const isChosen = studentAnswers[q.id] === opt
                        return (
                          <div
                            key={opt}
                            onClick={() => setStudentAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className={`cursor-pointer p-2.5 rounded-xl border transition-all text-xs font-medium ${
                              isChosen
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]/40 text-slate-900 font-bold ring-1 ring-[var(--color-accent)]'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {opt}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTestRequest(null)}
                    className="rounded-xl text-xs h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitSkillTest}
                    disabled={testSubmitting || Object.keys(studentAnswers).length === 0}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-xl text-xs h-9 px-5"
                  >
                    {testSubmitting ? 'Grading Test...' : 'Submit Academic Test'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
