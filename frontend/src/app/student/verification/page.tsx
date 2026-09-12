"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import {
  ShieldCheck, Award, Calendar, CheckCircle2, Clock,
  AlertTriangle, UserCheck, ArrowRight, BookOpen, Sparkles,
  ExternalLink, X, Plus, Trash2, GitBranch, Globe, FileText,
  ChevronRight, MessageSquare, Loader2, Check, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SupportingEvidence {
  title: string
  type: string
  url?: string
  description?: string
}

interface VerificationRequest {
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

interface AvailableSkill {
  id?: string
  name: string
  level?: number
  verification_status?: string
}

export default function StudentVerificationPage() {
  const { user, profile } = useAuth()
  const { isDemo, student } = useDemo()

  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [academicians, setAcademicians] = useState<AcademicianOption[]>([])
  const [studentSkills, setStudentSkills] = useState<AvailableSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Submission Form Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Form Fields
  const [selectedSkillName, setSelectedSkillName] = useState('')
  const [claimedProficiency, setClaimedProficiency] = useState('Strong (80-89)')
  const [claimedScore, setClaimedScore] = useState(85)
  const [experienceDescription, setExperienceDescription] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [techStack, setTechStack] = useState('')
  const [selectedFacultyId, setSelectedFacultyId] = useState('')
  const [evidenceList, setEvidenceList] = useState<SupportingEvidence[]>([
    { title: 'Primary Project Repository', type: 'github_repo', url: '', description: 'Main source code repository with architecture and documentation' }
  ])

  // Request Inspection Modal
  const [inspectingRequest, setInspectingRequest] = useState<VerificationRequest | null>(null)

  // 1. Load Student's real skills, available faculty, and verification history
  const loadInitialData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      // A. Load available academicians
      const facRes = await apiClient<{ success: boolean; data: AcademicianOption[] }>('/api/verification/academicians')
      if (facRes?.success && Array.isArray(facRes.data)) {
        setAcademicians(facRes.data)
        if (facRes.data.length > 0 && !selectedFacultyId) {
          setSelectedFacultyId(facRes.data[0].id)
        }
      }

      // B. Load student's verification requests
      const reqRes = await apiClient<{ success: boolean; data?: VerificationRequest[]; requests?: VerificationRequest[] }>('/api/verification/student/requests')
      const loadedReqs = reqRes?.data || reqRes?.requests || []
      setRequests(loadedReqs)

      // C. Load student's real skills from database
      const skillsRes = await apiClient<{ success: boolean; data: any[] }>('/api/student/skills')
      let mappedSkills: AvailableSkill[] = []
      
      if (skillsRes?.success && Array.isArray(skillsRes.data) && skillsRes.data.length > 0) {
        mappedSkills = skillsRes.data.map(s => ({
          id: s.skill_id || s.id,
          name: s.skills?.name || s.skill_name || s.name || 'Core Skill',
          level: s.self_declared_level || s.current_level || 60,
          verification_status: s.verification_status,
        }))
      } else if (isDemo && student?.skills) {
        mappedSkills = student.skills.map(s => ({
          id: s.id,
          name: s.name,
          level: s.currentLevel,
          verification_status: s.status,
        }))
      } else {
        // Fallback to standard canonical engineering competencies
        mappedSkills = [
          { name: 'React', level: 80, verification_status: 'self_declared' },
          { name: 'Node.js', level: 75, verification_status: 'self_declared' },
          { name: 'JavaScript', level: 85, verification_status: 'self_declared' },
          { name: 'SQL', level: 70, verification_status: 'self_declared' },
          { name: 'REST APIs', level: 80, verification_status: 'self_declared' },
          { name: 'Python', level: 70, verification_status: 'self_declared' },
          { name: 'Git & Version Control', level: 80, verification_status: 'self_declared' },
        ]
      }

      setStudentSkills(mappedSkills)
      if (mappedSkills.length > 0 && !selectedSkillName) {
        setSelectedSkillName(mappedSkills[0].name)
      }
    } catch (err) {
      console.warn('Notice loading verification data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isDemo, student, selectedFacultyId, selectedSkillName])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Add evidence row
  const handleAddEvidence = () => {
    setEvidenceList(prev => [
      ...prev,
      { title: '', type: 'github_repo', url: '', description: '' }
    ])
  }

  // Remove evidence row
  const handleRemoveEvidence = (index: number) => {
    setEvidenceList(prev => prev.filter((_, idx) => idx !== index))
  }

  // Update evidence field
  const handleUpdateEvidence = (index: number, field: keyof SupportingEvidence, value: string) => {
    setEvidenceList(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  // Open modal prefilled for a specific skill (e.g. from table or skill list)
  const handleOpenModalForSkill = (skillName?: string, currentLevel?: number) => {
    if (skillName) {
      setSelectedSkillName(skillName)
      if (currentLevel) setClaimedScore(currentLevel)
    }
    setSubmitError(null)
    setSubmitSuccess(null)
    setIsSubmitModalOpen(true)
  }

  // Handle Form Submission
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSkillName) {
      setSubmitError('Please select a skill to verify.')
      return
    }
    if (!experienceDescription.trim() || experienceDescription.trim().length < 20) {
      setSubmitError('Please provide a meaningful description of your hands-on experience (min 20 characters).')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const validEvidence = evidenceList.filter(e => e.title.trim() || e.url?.trim())
      
      const payload = {
        skill_name: selectedSkillName,
        claimed_level: claimedProficiency,
        score: claimedScore,
        description: experienceDescription,
        project_title: projectTitle || 'Practical Engineering Implementation',
        project_url: validEvidence[0]?.url || null,
        tech_stack: techStack,
        supporting_evidence: validEvidence,
        proof_url: validEvidence[0]?.url || null,
        proof_notes: experienceDescription,
        academician_id: selectedFacultyId || (academicians[0]?.id || 'fac-01-sarah-mitchell'),
        student_id: user?.id || (isDemo ? 'std-demo-001' : 'std-2026-001'),
        student_name: profile?.full_name || user?.email?.split('@')[0] || (isDemo ? student?.name : 'Student'),
        student_email: user?.email || (isDemo ? student?.email : 'student@dtu.ac.in'),
        department: (profile as any)?.department || 'Computer Science & Engineering',
        verification_tier: 'Institution Verified',
      }

      const res = await apiClient<{ success: boolean; data?: VerificationRequest; message?: string }>('/api/verification/request', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res?.success) {
        setSubmitSuccess('Your skill verification request was successfully submitted to faculty for endorsement!')
        // Reset form
        setExperienceDescription('')
        setProjectTitle('')
        setTechStack('')
        setEvidenceList([{ title: 'Primary Project Repository', type: 'github_repo', url: '', description: 'Source code repository' }])
        
        await loadInitialData(true)
        setTimeout(() => {
          setIsSubmitModalOpen(false)
          setSubmitSuccess(null)
        }, 1500)
      } else {
        setSubmitError('Failed to submit verification request. Please check your inputs.')
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Error communicating with verification service.')
    } finally {
      setSubmitting(false)
    }
  }

  // Summary Metrics
  const stats = useMemo(() => {
    const total = requests.length
    const verified = requests.filter(r => r.status === 'approved').length
    const pending = requests.filter(r => r.status === 'pending' || r.status === 'in_review').length
    const rejected = requests.filter(r => r.status === 'rejected').length
    return { total, verified, pending, rejected }
  }, [requests])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 max-w-7xl mx-auto">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">SKILL VERIFICATION</h1>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold px-2.5 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline text-emerald-600" /> Academic Endorsement
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Prove what you know. Submit verified practical evidence, repositories, and project artifacts to faculty reviewers to turn self-declared skills into authoritative credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadInitialData(true)}
            disabled={refreshing}
            className="rounded-xl text-xs font-bold h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenModalForSkill()}
            className="rounded-xl text-xs font-bold h-9 px-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs hover:-translate-y-0.5 transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Request Verification
          </Button>
        </div>
      </div>

      {/* ─── 2. SUMMARY METRICS CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[var(--color-accent)]">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-semibold">requests</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Verified Credentials</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{stats.verified}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">endorsed by faculty</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Review</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{stats.pending}</span>
            <span className="text-[11px] text-amber-700 font-semibold">in faculty inbox</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verification Rate</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : '—'}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">success rate</span>
          </div>
        </div>
      </div>

      {/* ─── 3. FIVE-STAGE VERIFICATION WORKFLOW BANNER ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[var(--color-accent)]" />
            How Academic Verification Works
          </h2>
          <span className="text-[10px] font-bold text-slate-400">Trusted Academic Layer</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <span className="h-5 w-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">1</span>
              Select Skill
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Choose from your declared competencies in your profile.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <span className="h-5 w-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">2</span>
              Describe Impact
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Explain practical problems solved and your exact role.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <span className="h-5 w-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">3</span>
              Attach Proof
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Link GitHub repositories, live projects, and certificates.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <span className="h-5 w-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">4</span>
              Faculty Review
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Department professors review your evidence objectively.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
              <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">5</span>
              Get Endorsed
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              Skill becomes Institution Verified with verified score badge.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 4. VERIFICATION REQUESTS HISTORY & VERIFIED BADGES TABLE ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              My Skill Verification Submissions
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live status of skills submitted for faculty review and official institutional endorsement.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {requests.length} Total Records
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            <span className="text-xs font-semibold text-slate-500">Loading verified credentials and submissions...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-[var(--color-accent)] flex items-center justify-center mx-auto">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900">No verification requests submitted yet</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Choose a skill from your profile, add your repository or project evidence, and request verification from your faculty committee.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenModalForSkill()}
              className="rounded-xl text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Submit Your First Skill
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const isApproved = req.status === 'approved'
              const isRejected = req.status === 'rejected'
              const isPending = req.status === 'pending' || req.status === 'in_review'

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isApproved
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                      : isRejected
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Skill & Core Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">
                          {req.skill_name}
                        </span>

                        {/* Status Badge */}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="h-3 w-3 text-emerald-700" /> INSTITUTION VERIFIED
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-700" /> PENDING FACULTY REVIEW
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3 w-3 text-rose-700" /> REVISION REQUIRED
                          </span>
                        )}

                        <span className="text-[10px] font-semibold text-slate-400">
                          Submitted: {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Description / Notes snippet */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {req.description || req.proof_notes || req.project_title || 'Hands-on practical development evidence.'}
                      </p>

                      {/* Evidence Pill Tags */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {req.supporting_evidence && req.supporting_evidence.length > 0 ? (
                          req.supporting_evidence.map((ev, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                              {ev.type === 'github_repo' ? <GitBranch className="h-3 w-3 text-slate-700" /> : <Globe className="h-3 w-3 text-[var(--color-accent)]" />}
                              {ev.title || 'Attached Evidence'}
                            </span>
                          ))
                        ) : req.proof_url ? (
                          <a
                            href={req.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-accent)] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" /> View Evidence Repository
                          </a>
                        ) : null}

                        {req.academician_name && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            • Reviewer: <strong className="text-slate-700">{req.academician_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Scores & Evaluation Status */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-200/60">
                      <div className="text-left lg:text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isApproved ? 'Verified Score' : 'Claimed Score'}
                        </div>
                        <div className="text-base font-black text-slate-900">
                          <span className={isApproved ? 'text-emerald-700' : 'text-slate-800'}>
                            {isApproved ? (req.verified_level || req.score) : req.score}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold"> / 100</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInspectingRequest(req)}
                          className="rounded-xl text-xs font-bold h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          View Details <ChevronRight className="h-3 w-3 ml-1 text-slate-400" />
                        </Button>

                        {isRejected && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenModalForSkill(req.skill_name, req.score)}
                            className="rounded-xl text-xs font-bold h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                          >
                            Improve &amp; Resubmit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Faculty Feedback Banner (If Reviewed) */}
                  {req.faculty_feedback && (
                    <div className={`mt-3 p-3 rounded-xl text-xs border flex items-start gap-2.5 ${
                      isApproved
                        ? 'bg-emerald-100/60 text-emerald-900 border-emerald-200'
                        : 'bg-rose-100/60 text-rose-900 border-rose-200'
                    }`}>
                      <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-slate-600" />
                      <div>
                        <div className="font-bold">
                          Faculty Endorsement Notes ({req.academician_name || 'Academic Committee'}):
                        </div>
                        <p className="mt-0.5 leading-relaxed">{req.faculty_feedback}</p>
                        {req.rejection_reason && (
                          <p className="mt-1 font-semibold text-rose-800">
                            Reason: {req.rejection_reason}
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

      {/* ─── 5. SUBMIT VERIFICATION REQUEST MODAL ─── */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    New Submission
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Academic Endorsement</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Request Skill Verification
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitVerification} className="p-5 overflow-y-auto space-y-4 flex-1">
              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {submitSuccess}
                </div>
              )}

              {/* Skill Selection & Claimed Score */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select Skill to Verify <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSkillName}
                    onChange={(e) => {
                      setSelectedSkillName(e.target.value)
                      const found = studentSkills.find(s => s.name === e.target.value)
                      if (found?.level) setClaimedScore(found.level)
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    required
                  >
                    {studentSkills.map((s, idx) => (
                      <option key={idx} value={s.name}>
                        {s.name} (Current: {s.level || 80}/100)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Claimed Proficiency Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={claimedProficiency}
                    onChange={(e) => {
                      setClaimedProficiency(e.target.value)
                      if (e.target.value.includes('Expert')) setClaimedScore(95)
                      else if (e.target.value.includes('Strong')) setClaimedScore(85)
                      else if (e.target.value.includes('Intermediate')) setClaimedScore(75)
                      else if (e.target.value.includes('Developing')) setClaimedScore(60)
                      else setClaimedScore(45)
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="Developing (50-69)">Developing (50–69 pts)</option>
                    <option value="Intermediate (70-79)">Intermediate / Proficient (70–79 pts)</option>
                    <option value="Strong (80-89)">Strong (80–89 pts)</option>
                    <option value="Expert (90-100)">Expert / Production Ready (90–100 pts)</option>
                  </select>
                </div>
              </div>

              {/* Experience Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tell us how you used and mastered this skill <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={experienceDescription}
                  onChange={(e) => setExperienceDescription(e.target.value)}
                  placeholder="What have you built? What architectural problems did you solve? What was your specific personal contribution?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] leading-relaxed"
                  required
                />
              </div>

              {/* Project & Tech Stack */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Project Name
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Full-Stack Distributed E-Commerce App"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Technologies / Tools Used
                  </label>
                  <input
                    type="text"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="e.g. React 19, TypeScript, Express, PostgreSQL"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>

              {/* Multi-Item Evidence Proof Section */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5 text-slate-700" />
                    Supporting Evidence &amp; Proof Artifacts <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    className="text-[11px] font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add More Proof
                  </button>
                </div>

                <div className="space-y-2">
                  {evidenceList.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          <input
                            type="text"
                            placeholder="Proof Title (e.g. GitHub Repository)"
                            value={item.title}
                            onChange={(e) => handleUpdateEvidence(idx, 'title', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                            required
                          />
                          <select
                            value={item.type}
                            onChange={(e) => handleUpdateEvidence(idx, 'type', e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-semibold"
                          >
                            <option value="github_repo">GitHub Repository</option>
                            <option value="live_project">Live Deployed URL</option>
                            <option value="certificate">Certification / Coursework</option>
                            <option value="document">Technical Document / Report</option>
                            <option value="project">College / Capstone Project</option>
                          </select>
                        </div>
                        {evidenceList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="url"
                        placeholder="Artifact URL (https://github.com/... or https://...)"
                        value={item.url || ''}
                        onChange={(e) => handleUpdateEvidence(idx, 'url', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-mono"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Reviewer Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Assign Faculty Reviewer
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  {academicians.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.full_name} — {fac.title} ({fac.institution_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Submit to Faculty for Review
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. DETAIL INSPECTION MODAL ─── */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    inspectingRequest.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inspectingRequest.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {inspectingRequest.status === 'approved' ? 'Institution Verified' : inspectingRequest.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Ticket ID: {inspectingRequest.id}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {inspectingRequest.skill_name} Verification Details
                </h3>
              </div>
              <button
                onClick={() => setInspectingRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Reviewer & Timestamps */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Assigned Faculty</span>
                  <strong className="text-slate-900 font-bold">{inspectingRequest.academician_name || 'Academic Committee'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Submission Date</span>
                  <strong className="text-slate-900 font-bold">{new Date(inspectingRequest.created_at).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Verified Score</span>
                  <strong className="text-emerald-700 font-black">{inspectingRequest.verified_level || inspectingRequest.score} / 100</strong>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Experience Description</h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  {inspectingRequest.description || inspectingRequest.proof_notes || 'No description provided.'}
                </div>
              </div>

              {/* Evidence Artifacts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted Evidence Artifacts</h4>
                <div className="space-y-2">
                  {inspectingRequest.supporting_evidence && inspectingRequest.supporting_evidence.length > 0 ? (
                    inspectingRequest.supporting_evidence.map((ev, idx) => (
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
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-[var(--color-accent)] hover:bg-slate-200 shrink-0 inline-flex items-center gap-1"
                          >
                            Inspect <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : inspectingRequest.proof_url ? (
                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-700 truncate">{inspectingRequest.proof_url}</span>
                      <a
                        href={inspectingRequest.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-[var(--color-accent)] hover:bg-slate-200 shrink-0 inline-flex items-center gap-1"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No external proof URL attached.</p>
                  )}
                </div>
              </div>

              {/* Faculty Evaluation */}
              {inspectingRequest.faculty_feedback && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold block text-emerald-950">Faculty Reviewer Endorsement:</span>
                  <p>{inspectingRequest.faculty_feedback}</p>
                </div>
              )}
            </div>

            <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setInspectingRequest(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
