"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import { VideoVerificationService } from "@/lib/verification/video-service"
import {
  ShieldCheck, Award, Calendar, CheckCircle2, Clock,
  AlertTriangle, UserCheck, ArrowRight, BookOpen, Sparkles,
  ExternalLink, X, Plus, Trash2, GitBranch, Globe, FileText,
  ChevronRight, MessageSquare, Loader2, Check, RefreshCw,
  Play, Code, Monitor, Camera, CameraOff, Video, CheckSquare,
  HelpCircle, Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SupportingEvidence {
  title: string
  type: string
  url?: string
  description?: string
}

interface TestQuestion {
  id: string
  type: 'conceptual' | 'practical' | 'debugging' | 'project_based'
  questionText: string
  options?: string[]
  points: number
  hints?: string | null
}

interface AssignedTest {
  id: string
  request_id: string
  skill_name: string
  title: string
  instructions: string
  test_type: string
  difficulty: string
  duration_minutes: number
  passing_score: number
  verification_methods?: string[]
  questions: TestQuestion[]
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
  status: 'pending' | 'in_review' | 'accepted' | 'test_sent' | 'test_submitted' | 'scheduled' | 'approved' | 'verified' | 'rejected' | 'reassessment_required'
  test_id?: string | null
  test_title?: string | null
  duration_minutes?: number | null
  passing_score?: number | null
  academic_test_score?: number | null
  verification_methods?: string[] | null
  academician_id?: string | null
  academician_name?: string | null
  academician_institution?: string | null
  academician_department?: string | null
  faculty_feedback?: string | null
  rejection_reason?: string | null
  rejection_feedback?: string | null
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

  // ─── 1. New Request Submission Form Modal State ───
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
  const [submittedSuccessItem, setSubmittedSuccessItem] = useState<VerificationRequest | null>(null)
  const [evidenceList, setEvidenceList] = useState<SupportingEvidence[]>([
    { title: 'Primary Project Repository', type: 'github_repo', url: '', description: 'Main source code repository with architecture and documentation' }
  ])

  // Request Inspection Modal
  const [inspectingRequest, setInspectingRequest] = useState<VerificationRequest | null>(null)

  // ─── 2. Student Interactive Test Workspace Modal State ───
  const [activeTestRequest, setActiveTestRequest] = useState<VerificationRequest | null>(null)
  const [activeTest, setActiveTest] = useState<AssignedTest | null>(null)
  const [loadingTest, setLoadingTest] = useState(false)
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({})
  const [testTimeRemaining, setTestTimeRemaining] = useState<number>(45 * 60)
  const [submittingTest, setSubmittingTest] = useState(false)
  const [testSubmitSuccess, setTestSubmitSuccess] = useState<any | null>(null)
  const [testSubmitError, setTestSubmitError] = useState<string | null>(null)

  // ─── 3. Live Screening Room State ───
  const [liveSessionRequest, setLiveSessionRequest] = useState<VerificationRequest | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)

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
        mappedSkills = [
          { name: 'React', level: 80, verification_status: 'self_declared' },
          { name: 'Node.js', level: 75, verification_status: 'self_declared' },
          { name: 'JavaScript', level: 85, verification_status: 'self_declared' },
          { name: 'SQL', level: 70, verification_status: 'self_declared' },
          { name: 'Python', level: 70, verification_status: 'self_declared' },
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

  // Countdown timer for active test
  useEffect(() => {
    if (!activeTestRequest || !activeTest) return
    const interval = setInterval(() => {
      setTestTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTestRequest, activeTest])

  // Start / Open Assigned Test
  const handleStartTest = async (req: VerificationRequest) => {
    setActiveTestRequest(req)
    setLoadingTest(true)
    setTestSubmitError(null)
    setTestSubmitSuccess(null)
    setTestAnswers({})

    try {
      const res = await apiClient<{ success: boolean; data?: AssignedTest }>(`/api/verification/requests/${req.id}/test`)
      if (res?.success && res.data) {
        setActiveTest(res.data)
        setTestTimeRemaining((res.data.duration_minutes || 45) * 60)
      }
    } catch (err: any) {
      setTestSubmitError(err?.message || 'Failed to load test definition')
    } finally {
      setLoadingTest(false)
    }
  }

  // Handle student test answer change
  const handleAnswerChange = (questionId: string, value: string) => {
    setTestAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }))
  }

  // Handle test submission
  const handleSubmitTestAttempt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTestRequest || !activeTest) return

    setSubmittingTest(true)
    setTestSubmitError(null)

    try {
      const payload = {
        answers: testAnswers,
        duration_taken_seconds: (activeTest.duration_minutes * 60) - testTimeRemaining,
      }

      const res = await apiClient<{ success: boolean; data?: any; message?: string }>(`/api/verification/requests/${activeTestRequest.id}/test/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res?.success) {
        setTestSubmitSuccess(res.data)
        await loadInitialData(true)
      } else {
        setTestSubmitError('Failed to submit test attempt. Please check your connection and try again.')
      }
    } catch (err: any) {
      setTestSubmitError(err?.message || 'Error submitting test.')
    } finally {
      setSubmittingTest(false)
    }
  }

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

  // Open modal prefilled for a specific skill
  const handleOpenModalForSkill = (skillName?: string, currentLevel?: number) => {
    if (skillName) {
      setSelectedSkillName(skillName)
      if (currentLevel) setClaimedScore(currentLevel)
    }
    setSubmitError(null)
    setSubmitSuccess(null)
    setSubmittedSuccessItem(null)
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
        const createdItem = res.data || {
          id: `vr-${Date.now()}`,
          skill_name: selectedSkillName,
          score: claimedScore,
          verification_tier: 'Institution Verified',
          status: 'pending',
          created_at: new Date().toISOString(),
          student_id: user?.id || 'std-2026-001',
          student_name: profile?.full_name || 'Student',
          student_email: user?.email || 'student@dtu.ac.in',
        } as VerificationRequest

        setSubmittedSuccessItem(createdItem)
        await loadInitialData(true)
      } else {
        setSubmitError('Failed to submit verification request. Please try again.')
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Error communicating with verification service.')
    } finally {
      setSubmitting(false)
    }
  }

  // Live Video Room Controls
  const handleOpenLiveSession = (req: VerificationRequest) => {
    setLiveSessionRequest(req)
  }

  const handleToggleCamera = async () => {
    if (isCameraActive) {
      VideoVerificationService.stopStream(cameraStream)
      setCameraStream(null)
      setIsCameraActive(false)
    } else {
      try {
        const stream = await VideoVerificationService.startLocalCamera(localVideoRef.current)
        setCameraStream(stream)
        setIsCameraActive(true)
      } catch (e: any) {
        alert(e.message || 'Camera access not available')
      }
    }
  }

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      VideoVerificationService.stopStream(screenStream)
      setScreenStream(null)
      setIsScreenSharing(false)
    } else {
      try {
        const stream = await VideoVerificationService.startScreenShare(screenVideoRef.current)
        setScreenStream(stream)
        setIsScreenSharing(true)
      } catch (e: any) {
        alert(e.message || 'Screen share cancelled')
      }
    }
  }

  const handleCloseLiveSession = () => {
    VideoVerificationService.stopStream(cameraStream)
    VideoVerificationService.stopStream(screenStream)
    setCameraStream(null)
    setScreenStream(null)
    setIsCameraActive(false)
    setIsScreenSharing(false)
    setLiveSessionRequest(null)
  }

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter(r => (r.status as string) === 'pending' || (r.status as string) === 'request_sent').length
    const activeTests = requests.filter(r => (r.status as string) === 'test_sent' || (r.status as string) === 'test_submitted' || (r.status as string) === 'accepted' || (r.status as string) === 'in_review').length
    const verified = requests.filter(r => (r.status as string) === 'approved' || (r.status as string) === 'verified').length
    const rejected = requests.filter(r => (r.status as string) === 'rejected' || (r.status as string) === 'reassessment_required').length
    return { total, pending, activeTests, verified, rejected }
  }, [requests])

  // Format time remaining
  const formattedTime = useMemo(() => {
    const mins = Math.floor(testTimeRemaining / 60)
    const secs = testTimeRemaining % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [testTimeRemaining])

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
            Request formal institutional skill verification, complete practical technical screening tests, and earn officially verified credentials on your Living Skill Passport.
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
            className="rounded-xl text-xs font-bold h-9 px-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Request Verification
          </Button>
        </div>
      </div>

      {/* ─── 2. REAL METRICS SUMMARY ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Submitted</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[var(--color-accent)]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-semibold">total requests</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Tests / Screening</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-900">{stats.activeTests}</span>
            <span className="text-[11px] text-indigo-700 font-semibold">active screening</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Verified Badges</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{stats.verified}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">endorsed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Revisions</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-900">{stats.rejected}</span>
            <span className="text-[11px] text-rose-700 font-semibold">reassessment</span>
          </div>
        </div>
      </div>

      {/* ─── 3. VERIFICATION REQUESTS LIST ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            My Verification Requests ({requests.length})
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            {stats.verified} officially verified on Living Skill Passport
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            <span className="text-xs font-semibold text-slate-500">Loading your verification portfolio...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">No verification requests yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Request academic verification for your core engineering skills to showcase verified proof to recruiters.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenModalForSkill()}
              className="rounded-xl text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Request Your First Verification
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const isApproved = req.status === 'approved' || req.status === 'verified'
              const isRejected = req.status === 'rejected' || req.status === 'reassessment_required'
              const isPending = req.status === 'pending' || req.status === 'in_review'
              const isTestSent = req.status === 'test_sent'
              const isTestSubmitted = req.status === 'test_submitted'

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isApproved
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                      : isRejected
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                      : isTestSent
                      ? 'border-indigo-300 bg-indigo-50/30 hover:border-indigo-400 ring-1 ring-indigo-300/40 shadow-xs'
                      : isTestSubmitted
                      ? 'border-blue-200 bg-blue-50/20 hover:border-blue-300'
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

                        {/* Status Badges */}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="h-3 w-3 text-emerald-700" /> INSTITUTION VERIFIED
                          </span>
                        )}
                        {isTestSent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs animate-pulse">
                            <Sparkles className="h-3 w-3" /> SKILL TEST ASSIGNED
                          </span>
                        )}
                        {isTestSubmitted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="h-3 w-3 text-blue-700" /> TEST SUBMITTED — IN FACULTY REVIEW
                          </span>
                        )}
                        {isPending && !isTestSent && !isTestSubmitted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-700" /> PENDING FACULTY REVIEW
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="h-3 w-3 text-rose-700" /> {req.status === 'reassessment_required' ? 'REASSESSMENT REQUIRED' : 'REVISION REQUIRED'}
                          </span>
                        )}

                        <span className="text-[10px] font-semibold text-slate-400">
                          Submitted: {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Description / Notes snippet */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {req.description || req.proof_notes || req.project_title || 'Hands-on practical development evidence.'}
                      </p>

                      {/* Assigned test details banner if active */}
                      {isTestSent && (
                        <div className="p-2.5 rounded-xl bg-white border border-indigo-200 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                              <CheckSquare className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{req.test_title || `${req.skill_name} Practical Verification Test`}</span>
                              <span className="text-[10px] text-slate-500">Duration: {req.duration_minutes || 45} mins • Pass: {req.passing_score || 75}%</span>
                            </div>
                          </div>
                        </div>
                      )}

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

                    {/* Right: Scores & Action Buttons */}
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

                      <div className="flex items-center gap-2 flex-wrap">
                        {isTestSent && (
                          <Button
                            size="sm"
                            onClick={() => handleStartTest(req)}
                            className="rounded-xl text-xs font-bold h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs animate-bounce"
                          >
                            <Play className="h-3.5 w-3.5 mr-1" /> Start Test
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenLiveSession(req)}
                          className="rounded-xl text-[11px] font-bold h-8 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Video className="h-3.5 w-3.5 mr-1 text-blue-600" /> Live Room
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInspectingRequest(req)}
                          className="rounded-xl text-xs font-bold h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          Details <ChevronRight className="h-3 w-3 ml-1 text-slate-400" />
                        </Button>

                        {isRejected && (
                          <div className="flex items-center gap-1.5">
                            <Link href={`/student/career?skill=${encodeURIComponent(req.skill_name)}`}>
                              <Button
                                size="sm"
                                className="rounded-xl text-xs font-bold h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                              >
                                <Bot className="h-3.5 w-3.5 mr-1" /> Improve with AI Coach
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              onClick={() => handleOpenModalForSkill(req.skill_name, req.score)}
                              className="rounded-xl text-xs font-bold h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                            >
                              Resubmit
                            </Button>
                          </div>
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

      {/* ─── 4. STUDENT INTERACTIVE TEST WORKSPACE MODAL ─── */}
      {activeTestRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Test Header with Timer */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-900 text-white">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-800 text-indigo-200">
                  Practical Screening Assessment
                </span>
                <h3 className="text-lg font-black text-white">
                  {activeTest?.title || `${activeTestRequest.skill_name} Practical Skill Test`}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950 border border-indigo-800 text-white font-mono text-sm font-bold shadow-inner">
                  <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                  {formattedTime}
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to exit? Your answers will not be submitted.')) {
                      setActiveTestRequest(null)
                      setActiveTest(null)
                    }
                  }}
                  className="p-1.5 text-indigo-300 hover:text-white rounded-xl hover:bg-indigo-800 transition-colors text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Test Body */}
            {loadingTest ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2.5">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                <span className="text-xs font-semibold text-slate-500">Loading screening tasks...</span>
              </div>
            ) : testSubmitSuccess ? (
              <div className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center animate-in zoom-in-95">
                <div className="h-16 w-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-xl font-black text-slate-900">
                    Skill Test Submitted Successfully!
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your answers and code implementations have been recorded and sent to your faculty reviewer.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 w-full max-w-md text-left text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Preliminary Assessment Score:</span>
                    <span className="text-indigo-700 text-sm">{testSubmitSuccess.score}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Final score and institutional badge endorsement will be recorded after faculty review.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setActiveTestRequest(null)
                    setActiveTest(null)
                    setTestSubmitSuccess(null)
                  }}
                  className="rounded-xl text-xs font-bold h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Return to Verification Queue
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTestAttempt} className="p-5 overflow-y-auto space-y-5 flex-1">
                {testSubmitError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    {testSubmitError}
                  </div>
                )}

                {/* Instructions card */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-600 block">Instructions</span>
                  <p className="leading-relaxed">{activeTest?.instructions || 'Answer all conceptual and practical questions thoroughly.'}</p>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {activeTest?.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-indigo-900">Task #{idx + 1}</span>
                            <Badge className="text-[10px] uppercase font-bold bg-white text-slate-700 border-slate-200">
                              {q.type}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed">{q.questionText}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 shrink-0">
                          {q.points} pts
                        </span>
                      </div>

                      {/* Options for MCQ / Conceptual */}
                      {q.options && q.options.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isChecked = testAnswers[q.id] === opt
                            return (
                              <label
                                key={oIdx}
                                className={`p-3 rounded-xl border text-xs flex items-center gap-3 cursor-pointer transition-all ${
                                  isChecked
                                    ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-950'
                                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  value={opt}
                                  checked={isChecked}
                                  onChange={() => handleAnswerChange(q.id, opt)}
                                  className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{opt}</span>
                              </label>
                            )
                          })}
                        </div>
                      ) : (
                        /* Text / Code Answer for Practical & Debugging */
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block">
                            Your Solution / Code Implementation
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Write your technical explanation or code solution..."
                            value={testAnswers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                            required
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTestRequest(null)}
                    className="text-xs h-9"
                  >
                    Save &amp; Finish Later
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingTest}
                    className="h-9 px-6 rounded-xl text-white text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                  >
                    {submittingTest ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Submit Assessment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── 5. SUBMIT NEW VERIFICATION REQUEST MODAL ─── */}
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

            {/* Modal Form Body or Success Screen */}
            {submittedSuccessItem ? (
              <div className="p-6 sm:p-8 text-center space-y-5 flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                <div className="h-16 w-16 rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                
                <div className="space-y-2 max-w-md">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Verification Request Sent
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Your verification request for <strong className="text-slate-900 font-bold">{submittedSuccessItem.skill_name}</strong> has been successfully submitted to Academia.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 w-full max-w-md flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Current Status</div>
                      <div className="text-[11px] text-slate-500 font-medium">Waiting for Academia review</div>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs font-bold uppercase tracking-wider px-2.5 py-1">
                    Pending Review
                  </Badge>
                </div>

                <div className="flex items-center gap-3 w-full max-w-md pt-2">
                  <Button
                    onClick={() => {
                      setSubmittedSuccessItem(null)
                      setIsSubmitModalOpen(false)
                    }}
                    className="w-full rounded-xl text-xs font-bold h-11 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs transition-all"
                  >
                    View My Verification
                  </Button>
                </div>
              </div>
            ) : (
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
                    Claimed Proficiency Level
                  </label>
                  <select
                    value={claimedProficiency}
                    onChange={(e) => setClaimedProficiency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <option value="Advanced (90-100)">Advanced (90–100)</option>
                    <option value="Strong (80-89)">Strong (80–89)</option>
                    <option value="Intermediate (60-79)">Intermediate (60–79)</option>
                    <option value="Developing (40-59)">Developing (40–59)</option>
                  </select>
                </div>
              </div>

              {/* Assign Reviewer */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Department Reviewer / Academician <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  required
                >
                  {academicians.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.full_name} — {fac.title} ({fac.institution_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Demonstrated Competency &amp; Experience Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={experienceDescription}
                  onChange={(e) => setExperienceDescription(e.target.value)}
                  placeholder="Describe your hands-on development experience with this skill, notable architectural choices, and problems solved (min 20 characters)..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] leading-relaxed"
                  required
                />
              </div>

              {/* Evidence Repositories */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Supporting Code Evidence &amp; Repositories
                    </h4>
                    <p className="text-[11px] text-slate-500">Provide GitHub repository URLs or live project demonstrations.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddEvidence}
                    className="rounded-xl text-xs font-bold h-7 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Link
                  </Button>
                </div>

                <div className="space-y-2">
                  {evidenceList.map((ev, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Evidence Title (e.g. Next.js Dashboard Repo)"
                          value={ev.title}
                          onChange={(e) => handleUpdateEvidence(idx, 'title', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        />
                        {evidenceList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://github.com/username/project-repo"
                        value={ev.url}
                        onChange={(e) => handleUpdateEvidence(idx, 'url', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      />
                    </div>
                  ))}
                </div>
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
                  className="h-9 px-5 rounded-xl text-white text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Submit for Verification
                    </>
                  )}
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      {/* ─── 6. LIVE VIDEO / SCREEN SHARE ROOM MODAL ─── */}
      {liveSessionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Live Skill Verification: {liveSessionRequest.skill_name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Reviewer: {liveSessionRequest.academician_name || 'Faculty Reviewer'}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCloseLiveSession}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                ✕ Leave Room
              </Button>
            </div>

            {/* Video Streams */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />
                {!isCameraActive && (
                  <div className="text-center space-y-2 p-6">
                    <div className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <CameraOff className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">Your Camera Inactive</p>
                    <Button
                      size="sm"
                      onClick={handleToggleCamera}
                      className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 h-8 text-white"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1" /> Turn On Camera
                    </Button>
                  </div>
                )}
                {isCameraActive && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-[10px] font-bold text-white">
                    You (Student)
                  </div>
                )}
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-contain ${isScreenSharing ? 'block' : 'hidden'}`}
                />
                {!isScreenSharing && (
                  <div className="text-center space-y-2 p-6">
                    <div className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Monitor className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">Code Walkthrough / Screen Share</p>
                    <Button
                      size="sm"
                      onClick={handleToggleScreenShare}
                      className="rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 h-8 text-white"
                    >
                      <Monitor className="h-3.5 w-3.5 mr-1" /> Share Screen
                    </Button>
                  </div>
                )}
                {isScreenSharing && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-[10px] font-bold text-white">
                    Active Code Walkthrough Screen
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleCamera}
                  className={`rounded-xl text-xs font-bold h-8 border-slate-700 ${isCameraActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  {isCameraActive ? <Camera className="h-3.5 w-3.5 mr-1" /> : <CameraOff className="h-3.5 w-3.5 mr-1" />}
                  {isCameraActive ? 'Camera On' : 'Camera Off'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleScreenShare}
                  className={`rounded-xl text-xs font-bold h-8 border-slate-700 ${isScreenSharing ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <Monitor className="h-3.5 w-3.5 mr-1" />
                  {isScreenSharing ? 'Stop Screen' : 'Share Screen'}
                </Button>
              </div>

              <Button
                size="sm"
                onClick={handleCloseLiveSession}
                className="rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white h-8 px-4"
              >
                Close Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. INSPECT DETAILS MODAL ─── */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Verification Record
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {inspectingRequest.skill_name} Details
                </h3>
              </div>
              <button
                onClick={() => setInspectingRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Status</span>
                  <strong className="text-slate-900 font-bold uppercase">{inspectingRequest.status}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Score</span>
                  <strong className="text-emerald-700 font-bold">{inspectingRequest.verified_level || inspectingRequest.score}/100</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Reviewer</span>
                  <strong className="text-slate-900 font-bold">{inspectingRequest.academician_name || 'Faculty Committee'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Submitted</span>
                  <strong className="text-slate-900 font-bold">{new Date(inspectingRequest.created_at).toLocaleDateString()}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Student Notes</span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {inspectingRequest.description || inspectingRequest.proof_notes || 'No notes provided.'}
                </div>
              </div>

              {inspectingRequest.faculty_feedback && (
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Faculty Feedback</span>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed font-medium">
                    {inspectingRequest.faculty_feedback}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Button
                size="sm"
                onClick={() => setInspectingRequest(null)}
                className="rounded-xl text-xs font-bold bg-slate-900 text-white"
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
