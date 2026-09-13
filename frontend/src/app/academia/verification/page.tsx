"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import { VideoVerificationService } from "@/lib/verification/video-service"
import {
  ShieldCheck, Award, Calendar, CheckCircle2, Clock,
  AlertTriangle, UserCheck, ArrowRight, ExternalLink,
  ChevronRight, Save, User, FileText, Check, Loader2, Sparkles,
  Search, Filter, GitBranch, Globe, X, MessageSquare, RefreshCw,
  ThumbsUp, ThumbsDown, Video, Monitor, Mic, MicOff, Camera,
  CameraOff, Play, CheckSquare, Plus, Trash2, HelpCircle, Code
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
  correctAnswer: string
  explanation?: string
  points: number
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

const SKILL_TEST_PRESETS: Record<string, { title: string; instructions: string; questions: TestQuestion[] }> = {
  react: {
    title: 'React Production & Architecture Screening',
    instructions: 'Evaluate student competence in React 19 hooks, component composition, state management, and performance optimization.',
    questions: [
      {
        id: 'q-react-1',
        type: 'conceptual',
        questionText: 'How does React handle optimistic state transitions in async server actions, and what is the primary role of `useActionState`?',
        options: [
          'It synchronizes synchronous UI with server mutations and automatically reverts on rejection',
          'It replaces the React Virtual DOM with web components',
          'It only works inside pure client-rendered static pages',
          'It disables browser event propagation',
        ],
        correctAnswer: 'It synchronizes synchronous UI with server mutations and automatically reverts on rejection',
        explanation: '`useActionState` manages pending states and rollback of optimistic UI during async transitions.',
        points: 25,
      },
      {
        id: 'q-react-2',
        type: 'practical',
        questionText: 'In a component with complex sub-trees, what is the correct strategy to prevent redundant re-renders when passing callbacks to memoized children?',
        options: [
          'Memoize callbacks with `useCallback` and ensure dependencies are immutable or stable',
          'Call `forceUpdate` in the parent component',
          'Store all callbacks in the DOM dataset attribute',
          'Declare callbacks inside `useEffect` with an empty dependency array',
        ],
        correctAnswer: 'Memoize callbacks with `useCallback` and ensure dependencies are immutable or stable',
        explanation: 'Stable references via `useCallback` prevent pure child components wrapped in `React.memo` from re-rendering.',
        points: 25,
      },
      {
        id: 'q-react-3',
        type: 'debugging',
        questionText: 'A `useEffect` hook runs on every single render causing an infinite network loop. What is the most common architectural defect?',
        options: [
          'An object or array created inline inside render is listed in the dependency array without memoization',
          'The component does not use Redux',
          'The JSX tag was not self-closing',
          'React strict mode was turned off',
        ],
        correctAnswer: 'An object or array created inline inside render is listed in the dependency array without memoization',
        explanation: 'Inline objects create a new reference on each render, tripping shallow reference equality in the dependency array.',
        points: 25,
      },
      {
        id: 'q-react-4',
        type: 'project_based',
        questionText: 'Explain how you would design a scalable Modal or Accordion design system component sharing state cleanly with child sub-components.',
        options: [
          'Using React Context with compound components pattern',
          'Global window variables',
          'Direct DOM querySelectors inside useEffect',
          'Deep props drilling through 10 component layers',
        ],
        correctAnswer: 'Using React Context with compound components pattern',
        explanation: 'Compound components with Context provide declarative, flexible, and decoupled state sharing.',
        points: 25,
      },
    ],
  },
  python: {
    title: 'Python Engineering & System Foundations',
    instructions: 'Evaluate proficiency in Python concurrency, memory management, generators, and backend API design.',
    questions: [
      {
        id: 'q-py-1',
        type: 'conceptual',
        questionText: 'What is the Global Interpreter Lock (GIL) in CPython and how does it influence CPU-bound concurrency?',
        options: [
          'A mutex that protects access to Python objects, preventing multiple native threads from executing bytecodes simultaneously',
          'A security firewall for network sockets',
          'A hardware driver for GPU acceleration',
          'A memory leak prevention algorithm in Pandas',
        ],
        correctAnswer: 'A mutex that protects access to Python objects, preventing multiple native threads from executing bytecodes simultaneously',
        explanation: 'The GIL ensures thread-safe memory management in CPython but restricts CPU-bound tasks in standard threading.',
        points: 25,
      },
      {
        id: 'q-py-2',
        type: 'practical',
        questionText: 'What is the key advantage of using a generator expression or `yield` over returning a standard list for large datasets?',
        options: [
          'Memory efficiency via lazy evaluation (evaluates item-by-item without allocating memory for the entire sequence)',
          'It compiles the code into WebAssembly',
          'It makes the code run 100x faster regardless of memory',
          'It automatically parallelizes across GPU cores',
        ],
        correctAnswer: 'Memory efficiency via lazy evaluation (evaluates item-by-item without allocating memory for the entire sequence)',
        explanation: 'Generators produce values on demand, enabling processing of massive datasets that would exceed memory limits.',
        points: 25,
      },
      {
        id: 'q-py-3',
        type: 'debugging',
        questionText: 'Why is defining a mutable default argument like `def append_item(item, items=[])` dangerous in Python?',
        options: [
          'The default list is instantiated once when the function is defined and shared across all subsequent invocations',
          'It raises a SyntaxError at compile time',
          'It causes garbage collection to hang',
          'It turns the function into an asynchronous coroutine',
        ],
        correctAnswer: 'The default list is instantiated once when the function is defined and shared across all subsequent invocations',
        explanation: 'Default arguments are evaluated once at definition time, causing mutable objects to retain state across calls.',
        points: 25,
      },
      {
        id: 'q-py-4',
        type: 'project_based',
        questionText: 'In a production FastAPI service, what mechanism should be used to handle database connection pooling and graceful cleanup per request?',
        options: [
          'Dependency injection with `yield` in async context managers',
          'Global static dictionaries',
          'Re-instantiating raw TCP connections in every route function without pooling',
          'Cron jobs that restart the process every minute',
        ],
        correctAnswer: 'Dependency injection with `yield` in async context managers',
        explanation: 'FastAPI dependency injection with yield guarantees proper session acquisition and cleanup even on errors.',
        points: 25,
      },
    ],
  },
}

export default function AcademiaVerificationPage() {
  const { user, profile } = useAuth()
  const { isDemo } = useDemo()

  const [requests, setRequests] = useState<VerificationRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected'>('all')

  // ─── 1. Review Workspace Modal State ───
  const [reviewingRequest, setReviewingRequest] = useState<VerificationRequestItem | null>(null)
  const [reviewAttemptData, setReviewAttemptData] = useState<any | null>(null)
  const [evalVerifiedScore, setEvalVerifiedScore] = useState(85)
  const [evalVerifiedTier, setEvalVerifiedTier] = useState('Institution Verified')
  const [evalFacultyNotes, setEvalFacultyNotes] = useState('Verified with high technical competence and practical understanding.')
  const [evalRejectionReason, setEvalRejectionReason] = useState('Insufficient practical repository evidence')
  const [evalRejectionFeedback, setEvalRejectionFeedback] = useState('Please build an end-to-end repository with comprehensive tests and resubmit.')
  const [decisionMode, setDecisionMode] = useState<'approve' | 'reject' | 'reassessment'>('approve')
  const [submittingDecision, setSubmittingDecision] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null)

  // ─── 2. "Send Skill Test" Modal State ───
  const [sendingTestRequest, setSendingTestRequest] = useState<VerificationRequestItem | null>(null)
  const [testTitle, setTestTitle] = useState('')
  const [testInstructions, setTestInstructions] = useState('')
  const [testType, setTestType] = useState<'conceptual' | 'practical' | 'debugging' | 'project_based' | 'mixed'>('mixed')
  const [testDifficulty, setTestDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [testDuration, setTestDuration] = useState(45)
  const [testPassScore, setTestPassScore] = useState(75)
  const [testDeadline, setTestDeadline] = useState('')
  const [testVerificationMethod, setTestVerificationMethod] = useState<'assignment_only' | 'assignment_live_video' | 'assignment_screen_share' | 'assignment_live_video_screen_share'>('assignment_only')
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [assigningTest, setAssigningTest] = useState(false)
  const [assignTestError, setAssignTestError] = useState<string | null>(null)
  const [assignTestSuccess, setAssignTestSuccess] = useState<string | null>(null)

  // ─── 3. Live Video & Screen Share Modal State ───
  const [liveSessionRequest, setLiveSessionRequest] = useState<VerificationRequestItem | null>(null)
  const [liveNotes, setLiveNotes] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isMicActive, setIsMicActive] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)

  // Fetch live verification requests from database
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

  // Open "Send Skill Test" modal with smart skill presets
  const handleOpenSendTest = (req: VerificationRequestItem) => {
    setSendingTestRequest(req)
    setAssignTestError(null)
    setAssignTestSuccess(null)

    const skillKey = (req.skill_name || 'react').toLowerCase().replace(/[^a-z0-9]/g, '')
    const preset = SKILL_TEST_PRESETS[skillKey] || SKILL_TEST_PRESETS.react

    setTestTitle(`${req.skill_name} Practical Skill Verification`)
    setTestInstructions(preset.instructions || `Complete the practical assessment for ${req.skill_name}. Demonstrate core architecture, clean code, and error handling.`)
    setTestType('mixed')
    setTestDifficulty('intermediate')
    setTestDuration(45)
    setTestPassScore(75)
    setTestDeadline('')
    setTestVerificationMethod('assignment_only')
    setTestQuestions(preset.questions || [])
  }

  // Add question to test builder
  const handleAddQuestion = () => {
    setTestQuestions(prev => [
      ...prev,
      {
        id: `q-custom-${Date.now()}`,
        type: 'practical',
        questionText: '',
        options: [],
        correctAnswer: '',
        explanation: '',
        points: 25,
      }
    ])
  }

  // Remove question from test builder
  const handleRemoveQuestion = (index: number) => {
    setTestQuestions(prev => prev.filter((_, i) => i !== index))
  }

  // Update question field
  const handleUpdateQuestion = (index: number, field: keyof TestQuestion, value: any) => {
    setTestQuestions(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  // Submit and assign skill test
  const handleAssignTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sendingTestRequest) return

    setAssigningTest(true)
    setAssignTestError(null)

    try {
      const payload = {
        title: testTitle,
        instructions: testInstructions,
        test_type: testType,
        difficulty: testDifficulty,
        duration_minutes: testDuration,
        passing_score: testPassScore,
        deadline: testDeadline || null,
        verification_methods: [testVerificationMethod],
        questions: testQuestions,
      }

      const res = await apiClient<{ success: boolean; message?: string }>(`/api/verification/requests/${sendingTestRequest.id}/test`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res?.success) {
        setAssignTestSuccess('Skill test assigned and dispatched to student!')
        await loadRequests(true)
        setTimeout(() => {
          setSendingTestRequest(null)
          setAssignTestSuccess(null)
        }, 1200)
      } else {
        setAssignTestError('Failed to assign skill test. Please try again.')
      }
    } catch (err: any) {
      setAssignTestError(err?.message || 'Error assigning skill test.')
    } finally {
      setAssigningTest(false)
    }
  }

  // Open Review Workspace for a specific ticket (fetches test attempt details if submitted)
  const handleOpenReview = async (req: VerificationRequestItem, defaultMode: 'approve' | 'reject' | 'reassessment' = 'approve') => {
    setReviewingRequest(req)
    setDecisionMode(defaultMode)
    setEvalVerifiedScore(req.verified_level || req.academic_test_score || req.score || 85)
    setEvalVerifiedTier(req.verification_tier || 'Institution Verified')
    setEvalFacultyNotes(req.faculty_feedback || `Verified ${req.skill_name} proficiency. Student demonstrated strong conceptual clarity and code artifacts.`)
    setEvalRejectionReason(req.rejection_reason || 'Insufficient practical repository evidence')
    setEvalRejectionFeedback(req.rejection_feedback || 'Please improve code documentation, unit test coverage, and resubmit with live demo link.')
    setDecisionError(null)
    setDecisionSuccess(null)
    setReviewAttemptData(null)

    // Load attempt data if submitted
    try {
      const res = await apiClient<{ success: boolean; data?: any }>(`/api/verification/requests/${req.id}/attempt`)
      if (res?.success && res.data) {
        setReviewAttemptData(res.data)
        if (res.data.attempt?.score) {
          setEvalVerifiedScore(res.data.attempt.score)
        }
      }
    } catch {}
  }

  // Handle Approve, Rejection, or Reassessment Submission
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewingRequest) return

    setSubmittingDecision(true)
    setDecisionError(null)

    const reviewerName = profile?.full_name || (isDemo ? 'Dr. Sarah Mitchell (Dept. Chair)' : 'Faculty Reviewer')

    try {
      const payload = {
        decision: decisionMode === 'approve' ? 'VERIFY' : decisionMode === 'reassessment' ? 'REASSESSMENT' : 'REJECT',
        verified_level: Number(evalVerifiedScore) || 85,
        academic_test_score: Number(evalVerifiedScore) || 85,
        verification_notes: decisionMode === 'approve' ? evalFacultyNotes : evalRejectionFeedback,
        rejection_reason: decisionMode !== 'approve' ? evalRejectionReason : null,
        rejection_feedback: decisionMode !== 'approve' ? evalRejectionFeedback : null,
        reviewerName,
      }

      const res = await apiClient<{ success: boolean; message?: string }>(`/api/verification/requests/${reviewingRequest.id}/decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res?.success) {
        setDecisionSuccess(
          decisionMode === 'approve'
            ? 'Skill successfully endorsed and verified in student profile!'
            : decisionMode === 'reassessment'
            ? 'Re-assessment requested with developmental feedback.'
            : 'Verification request rejected with constructive feedback.'
        )
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
      await apiClient(`/api/verification/requests/${req.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'VERIFY',
          verified_level: req.score || 85,
          academic_test_score: req.score || 85,
          verification_notes: 'Verified with high technical competence and valid practical evidence.',
          reviewerName,
        })
      })
      await loadRequests(true)
    } catch (err) {
      console.error('Quick approve error:', err)
    }
  }

  // Live Video Room Controls
  const handleOpenLiveSession = (req: VerificationRequestItem) => {
    setLiveSessionRequest(req)
    setLiveNotes(req.faculty_feedback || '')
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

  const handleSaveLiveNotes = async () => {
    if (!liveSessionRequest) return
    setSavingNotes(true)
    try {
      await apiClient(`/api/verification/requests/${liveSessionRequest.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes: liveNotes })
      })
      await loadRequests(true)
    } catch {}
    finally {
      setSavingNotes(false)
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
    const inReview = requests.filter(r => (r.status as string) === 'in_review' || (r.status as string) === 'accepted' || (r.status as string) === 'test_sent' || (r.status as string) === 'test_submitted' || (r.status as string) === 'scheduled').length
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
        if (statusFilter === 'in_review' && s !== 'in_review' && s !== 'accepted' && s !== 'test_sent' && s !== 'test_submitted' && s !== 'scheduled') return false
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
            Review student verification requests, assign practical skill tests, conduct live screening reviews, and grant authoritative institutional endorsements.
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

      {/* ─── 2. REAL METRICS CARDS ─── */}
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
          onClick={() => setStatusFilter('in_review')}
          className={`cursor-pointer bg-white rounded-2xl border p-4 shadow-xs transition-all ${
            statusFilter === 'in_review' ? 'border-indigo-400 ring-1 ring-indigo-400/30 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Active Tests &amp; In-Review</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-900">{stats.inReview}</span>
            <span className="text-[11px] text-indigo-700 font-semibold">in screening</span>
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
      </div>

      {/* ─── 3. FILTER TABS & SEARCH BAR ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              onClick={() => setStatusFilter('in_review')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'in_review'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              Active Screening ({stats.inReview})
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
            {stats.pending} pending initial review • {stats.inReview} in practical screening
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
              No verification requests match your active filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isApproved = req.status === 'approved' || req.status === 'verified'
              const isRejected = req.status === 'rejected' || req.status === 'reassessment_required'
              const isPending = req.status === 'pending' || req.status === 'in_review'
              const isTestSent = req.status === 'test_sent'
              const isTestSubmitted = req.status === 'test_submitted'
              const initials = (req.student_name || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isApproved
                      ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                      : isRejected
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                      : isTestSubmitted
                      ? 'border-indigo-300 bg-indigo-50/30 hover:border-indigo-400 ring-1 ring-indigo-300/40'
                      : isTestSent
                      ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
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
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ ENDORSED ({req.verified_level || req.score} pts)
                            </span>
                          )}
                          {isTestSubmitted && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                              <CheckSquare className="h-3 w-3 text-indigo-600" /> TEST SUBMITTED ({req.academic_test_score || 85}%)
                            </span>
                          )}
                          {isTestSent && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-700" /> TEST ASSIGNED (Awaiting Submission)
                            </span>
                          )}
                          {isPending && !isTestSent && !isTestSubmitted && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                              ⏱ PENDING REVIEW
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                              ✕ {req.status === 'reassessment_required' ? 'REASSESSMENT REQUIRED' : 'REJECTED'}
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

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-200/60">
                      {/* Priority Action based on status */}
                      {isTestSubmitted ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReview(req, 'approve')}
                          className="rounded-xl text-xs font-bold h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                        >
                          <CheckSquare className="h-3.5 w-3.5 mr-1" /> Review Test &amp; Decision
                        </Button>
                      ) : isTestSent ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenSendTest(req)}
                            className="rounded-xl text-[11px] font-bold h-8 px-3 border-amber-300 text-amber-900 hover:bg-amber-50"
                          >
                            <Code className="h-3.5 w-3.5 mr-1 text-amber-700" /> View Test
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenReview(req, 'approve')}
                            className="rounded-xl text-xs font-bold h-8 px-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs"
                          >
                            Evaluate <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleOpenSendTest(req)}
                            className="rounded-xl text-xs font-bold h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Send Skill Test
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(req, 'approve')}
                            className="rounded-xl text-xs font-bold h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-100"
                          >
                            Evaluate <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      )}

                      {/* Secondary Actions */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenLiveSession(req)}
                          className="rounded-xl text-[11px] font-bold h-7 px-2.5 border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <Video className="h-3 w-3 mr-1 text-blue-600" /> Live Screening
                        </Button>

                        {isPending && !isTestSubmitted && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickEndorse(req)}
                              className="rounded-xl text-[11px] font-bold h-7 px-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                              title="1-Click Endorse"
                            >
                              <ThumbsUp className="h-3 w-3 text-emerald-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReview(req, 'reject')}
                              className="rounded-xl text-[11px] font-bold h-7 px-2 border-rose-300 text-rose-800 hover:bg-rose-50"
                              title="Reject Request"
                            >
                              <ThumbsDown className="h-3 w-3 text-rose-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Banner if reviewed */}
                  {req.faculty_feedback && (
                    <div className={`mt-3 p-3 rounded-xl text-xs border flex items-start gap-2.5 ${
                      isApproved
                        ? 'bg-emerald-100/60 text-emerald-900 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-100/60 text-rose-900 border-rose-200'
                        : 'bg-slate-100 text-slate-900 border-slate-200'
                    }`}>
                      <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-slate-600" />
                      <div>
                        <div className="font-bold">
                          Recorded Faculty Evaluation ({req.academician_name || 'Academic Committee'}):
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

      {/* ─── 5. SEND SKILL TEST MODAL ─── */}
      {sendingTestRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    Academic Skill Screening
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Ticket: {sendingTestRequest.id}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Assign Skill Test to {sendingTestRequest.student_name}
                </h3>
              </div>
              <button
                onClick={() => setSendingTestRequest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAssignTestSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {assignTestError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  {assignTestError}
                </div>
              )}

              {assignTestSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {assignTestSuccess}
                </div>
              )}

              {/* Top metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-xs">
                <div>
                  <span className="text-indigo-400 font-semibold block text-[10px] uppercase">Student</span>
                  <strong className="text-slate-900 font-bold">{sendingTestRequest.student_name}</strong>
                </div>
                <div>
                  <span className="text-indigo-400 font-semibold block text-[10px] uppercase">Skill</span>
                  <strong className="text-indigo-700 font-bold">{sendingTestRequest.skill_name}</strong>
                </div>
                <div>
                  <span className="text-indigo-400 font-semibold block text-[10px] uppercase">Claimed Score</span>
                  <strong className="text-slate-900 font-bold">{sendingTestRequest.score}/100</strong>
                </div>
                <div>
                  <span className="text-indigo-400 font-semibold block text-[10px] uppercase">Department</span>
                  <strong className="text-slate-900 font-bold">{sendingTestRequest.department || 'CSE'}</strong>
                </div>
              </div>

              {/* Title & Instructions */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Assignment / Test Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Screening Instructions &amp; Expectations <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={testInstructions}
                    onChange={(e) => setTestInstructions(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Test Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Test Type</label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="mixed">Mixed (Conceptual + Practical)</option>
                    <option value="conceptual">Conceptual</option>
                    <option value="practical">Practical Implementation</option>
                    <option value="debugging">Debugging &amp; Diagnostics</option>
                    <option value="project_based">Project-Based</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={testDifficulty}
                    onChange={(e) => setTestDifficulty(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={testDuration}
                    onChange={(e) => setTestDuration(Number(e.target.value) || 30)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pass Score (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={testPassScore}
                    onChange={(e) => setTestPassScore(Number(e.target.value) || 70)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Verification Method & Optional Deadline */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Verification Method</label>
                  <select
                    value={testVerificationMethod}
                    onChange={(e) => setTestVerificationMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="assignment_only">Assignment / Practical Task Only</option>
                    <option value="assignment_live_video">Assignment + Live Video Interview</option>
                    <option value="assignment_screen_share">Assignment + Screen Share Walkthrough</option>
                    <option value="assignment_live_video_screen_share">Assignment + Live Video + Screen Share</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Submission Deadline (Optional)</label>
                  <input
                    type="date"
                    value={testDeadline}
                    onChange={(e) => setTestDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Question / Task Builder */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Screening Tasks &amp; Questions ({testQuestions.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">Configure tasks, practical problems, and conceptual questions.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddQuestion}
                    className="rounded-xl text-xs font-bold h-7 px-2.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Task
                  </Button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {testQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-indigo-900">
                          Task #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={q.type}
                            onChange={(e) => handleUpdateQuestion(idx, 'type', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700"
                          >
                            <option value="conceptual">Conceptual</option>
                            <option value="practical">Practical</option>
                            <option value="debugging">Debugging</option>
                            <option value="project_based">Project-based</option>
                          </select>
                          <input
                            type="number"
                            value={q.points}
                            onChange={(e) => handleUpdateQuestion(idx, 'points', Number(e.target.value) || 25)}
                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-900"
                            title="Points"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Task / Question prompt..."
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(idx, 'questionText', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Expected answer or evaluation criteria..."
                        value={q.correctAnswer}
                        onChange={(e) => handleUpdateQuestion(idx, 'correctAnswer', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        required
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
                  onClick={() => setSendingTestRequest(null)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assigningTest}
                  className="h-9 px-5 rounded-xl text-white text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                >
                  {assigningTest ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Assigning Test...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Assign &amp; Dispatch Test
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. FACULTY REVIEW & DECISION WORKSPACE MODAL ─── */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
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

              {/* Candidate Metadata Card */}
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

              {/* Submitted Test Attempt Breakdown (If Available) */}
              {reviewAttemptData?.attempt && (
                <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                        Submitted Skill Test Results
                      </h4>
                    </div>
                    <Badge className={`text-xs font-bold ${reviewAttemptData.attempt.passed ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 'bg-amber-100 text-amber-900 border-amber-200'}`}>
                      Score: {reviewAttemptData.attempt.score}% ({reviewAttemptData.attempt.passed ? 'PASSED' : 'BELOW THRESHOLD'})
                    </Badge>
                  </div>

                  {reviewAttemptData.attempt.review && Array.isArray(reviewAttemptData.attempt.review) && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {reviewAttemptData.attempt.review.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl border border-indigo-200 bg-white text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">Q{idx + 1}: {item.questionText}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.isCorrect ? '✓ Correct' : 'Reviewed'} ({item.points} pts)
                            </span>
                          </div>
                          <div className="text-slate-700 font-mono text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong>Student Answer:</strong> {item.studentAnswer}
                          </div>
                          {item.correctAnswer && (
                            <div className="text-[11px] text-slate-500">
                              <strong>Expected:</strong> {item.correctAnswer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionMode('approve')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decisionMode === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="h-4 w-4" /> Endorse &amp; Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionMode('reassessment')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decisionMode === 'reassessment'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" /> Re-Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionMode('reject')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decisionMode === 'reject'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <X className="h-4 w-4" /> Reject Request
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
                        Reason
                      </label>
                      <select
                        value={evalRejectionReason}
                        onChange={(e) => setEvalRejectionReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="Insufficient practical repository evidence">Insufficient practical repository evidence</option>
                        <option value="Test score below passing threshold">Test score below passing threshold</option>
                        <option value="Code does not demonstrate claimed proficiency level">Code does not demonstrate claimed proficiency level</option>
                        <option value="Missing unit tests and architectural documentation">Missing unit tests and architectural documentation</option>
                        <option value="Further academic coursework required">Further academic coursework required</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-rose-900 block mb-1">
                        Constructive Student Feedback &amp; AI Coach Recommendations
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
                      : decisionMode === 'reassessment'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submittingDecision ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Decision...
                    </>
                  ) : decisionMode === 'approve' ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Endorse &amp; Grant Verified Badge
                    </>
                  ) : decisionMode === 'reassessment' ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Request Re-Assessment
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

      {/* ─── 7. LIVE VIDEO / SCREEN SHARE MODAL ─── */}
      {liveSessionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Room Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Live Skill Screening: {liveSessionRequest.student_name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Skill: {liveSessionRequest.skill_name} • Department: {liveSessionRequest.department || 'CSE'}
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

            {/* Video & Media Area */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
              {/* Local Camera Stream */}
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
                    <p className="text-xs font-bold text-slate-300">Camera Inactive</p>
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
                    You (Faculty Reviewer)
                  </div>
                )}
              </div>

              {/* Shared Screen or Candidate Display */}
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
                    <p className="text-xs font-bold text-slate-300">Screen Sharing</p>
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
                    Active Screen Presentation
                  </div>
                )}
              </div>
            </div>

            {/* Live Notes & Bottom Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Live Technical Screening Notes
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={liveNotes}
                    onChange={(e) => setLiveNotes(e.target.value)}
                    placeholder="Candidate demonstrated strong understanding of asynchronous control flow..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveLiveNotes}
                    disabled={savingNotes}
                    className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4"
                  >
                    {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Notes'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
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
                    {isScreenSharing ? 'Stop Screen' : 'Screen Share'}
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    handleCloseLiveSession()
                    handleOpenReview(liveSessionRequest, 'approve')
                  }}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3.5"
                >
                  Proceed to Final Decision <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
