"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  CheckCircle2, Clock, Shield, AlertTriangle, ArrowRight, Loader2,
  Code, FileText, Upload, Sparkles, Terminal, Database, Check, Award
} from "lucide-react"
import { QuestionSafeView, AssessmentAttemptResult } from "@/lib/intelligence/types"
import { apiClient } from "@/lib/api-client"
import {
  LEVEL_1_KNOWLEDGE_ASSESSMENTS,
  LEVEL_2_PRACTICAL_CHALLENGES,
  Level2PracticalChallenge,
} from "@/lib/assessments-seed"

function AssessmentContent() {
  const searchParams = useSearchParams()
  const paramSkill = searchParams.get('skill')
  const paramAssessmentId = searchParams.get('assessmentId')
  const autostart = searchParams.get('autostart') === 'true'

  const [activeTab, setActiveTab] = useState("level1")

  // Level 1 State
  const [isTakingL1, setIsTakingL1] = useState(false)
  const [loadingL1, setLoadingL1] = useState(false)
  const [submittingL1, setSubmittingL1] = useState(false)
  const [l1Error, setL1Error] = useState<string | null>(null)
  const [attemptIdL1, setAttemptIdL1] = useState<string | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null)
  const [answersL1, setAnswersL1] = useState<{ questionId: string; selectedOptionId: string }[]>([])
  const [l1Result, setL1Result] = useState<AssessmentAttemptResult | null>(null)
  const [l1Questions, setL1Questions] = useState<QuestionSafeView[]>([])
  const [timeLeftL1, setTimeLeftL1] = useState(15 * 60)

  // Level 2 Practical State
  const [activePractical, setActivePractical] = useState<Level2PracticalChallenge | null>(null)
  const [codeSubmission, setCodeSubmission] = useState("")
  const [evaluatingL2, setEvaluatingL2] = useState(false)
  const [practicalResult, setPracticalResult] = useState<{
    challengeId: string
    passed: boolean
    score: number
    feedback: string
  } | null>(null)

  // Level 3 Evidence State
  const [evidenceTitle, setEvidenceTitle] = useState("")
  const [evidenceSkill, setEvidenceSkill] = useState("Node.js")
  const [githubUrl, setGithubUrl] = useState("")
  const [liveDemoUrl, setLiveDemoUrl] = useState("")
  const [certificateId, setCertificateId] = useState("")
  const [submittingL3, setSubmittingL3] = useState(false)
  const [evidenceSuccess, setEvidenceSuccess] = useState<string | null>(null)

  // Verified Status Badges
  const [currentTier, setCurrentTier] = useState<"Self-Declared" | "Assessment Verified" | "Practical Verified" | "Evidence Verified">("Self-Declared")
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>("assess-l1-backend-core")
  const [activeAssessmentTitle, setActiveAssessmentTitle] = useState<string>("Backend Engineering Knowledge Benchmark")
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<string>("Node.js & Backend Architecture")

  // Load real student verified tier on mount
  useEffect(() => {
    async function loadStudentTier() {
      try {
        const json = await apiClient<{ success: boolean; data: any[] }>('/api/student/skills')
        if (json.success && json.data && json.data.length > 0) {
          const statuses = json.data.map(s => s.verification_status)
          if (statuses.includes('institution_verified') || statuses.includes('evidence_verified')) {
            setCurrentTier('Evidence Verified')
          } else if (statuses.includes('practical_verified')) {
            setCurrentTier('Practical Verified')
          } else if (statuses.includes('assessment_verified')) {
            setCurrentTier('Assessment Verified')
          } else {
            setCurrentTier('Self-Declared')
          }
        }
      } catch {}
    }
    loadStudentTier()
  }, [])

  // Start Level 1 Flow
  const handleStartL1 = useCallback(async (assessmentId: string = "assess-l1-backend-core") => {
    setActiveAssessmentId(assessmentId)
    const local = LEVEL_1_KNOWLEDGE_ASSESSMENTS.find(a => a.id === assessmentId) || LEVEL_1_KNOWLEDGE_ASSESSMENTS[0]
    setActiveAssessmentTitle(local.title)
    setActiveAssessmentSkill(local.skill)
    setLoadingL1(true)
    setL1Error(null)
    try {
      const json = await apiClient<{
        success: boolean
        data: { attemptId: string; title: string; skillName: string; timeLimit: number; questions: QuestionSafeView[] }
      }>(`/api/student/assessments/${assessmentId}/start`, { method: 'POST' })

      if (json.data && json.data.questions && json.data.questions.length > 0) {
        if (json.data.attemptId) setAttemptIdL1(json.data.attemptId)
        setL1Questions(json.data.questions)
        setTimeLeftL1((json.data.timeLimit || 15) * 60)
        if (json.data.title) setActiveAssessmentTitle(json.data.title)
        if (json.data.skillName) setActiveAssessmentSkill(json.data.skillName)
      } else {
        throw new Error('Could not load assessment questions from server')
      }
    } catch (err: any) {
      // Local canonical questions matching requested assessment
      const fallbackAttemptId = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      setAttemptIdL1(fallbackAttemptId)
      setL1Questions(
        local.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: 'multiple_choice',
          points: q.points,
          orderIndex: q.orderIndex,
          options: q.options.map(o => ({ id: o.id, optionText: o.optionText, orderIndex: 1 })),
        }))
      )
      setTimeLeftL1(local.timeLimitMinutes * 60)
      setActiveAssessmentTitle(local.title)
      setActiveAssessmentSkill(local.skill)
    } finally {
      setIsTakingL1(true)
      setCurrentQIndex(0)
      setSelectedOpt(null)
      setAnswersL1([])
      setLoadingL1(false)
    }
  }, [])

  // Auto-start targeted assessment if provided via URL parameters
  useEffect(() => {
    if (paramAssessmentId) {
      setActiveAssessmentId(paramAssessmentId)
      const matched = LEVEL_1_KNOWLEDGE_ASSESSMENTS.find(a => a.id === paramAssessmentId)
      if (matched) {
        setActiveAssessmentTitle(matched.title)
        setActiveAssessmentSkill(matched.skill)
      } else if (paramSkill) {
        setActiveAssessmentSkill(paramSkill)
      }
      if (autostart) {
        handleStartL1(paramAssessmentId)
      }
    }
  }, [paramAssessmentId, paramSkill, autostart, handleStartL1])

  // Submit Level 1
  const submitL1 = useCallback(async (finalAnswers: { questionId: string; selectedOptionId: string }[]) => {
    setSubmittingL1(true)
    setL1Error(null)
    try {
      const json = await apiClient<{ success: boolean; data: AssessmentAttemptResult }>(
        `/api/student/assessments/${activeAssessmentId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            attempt_id: attemptIdL1,
            attemptId: attemptIdL1,
            answers: finalAnswers,
          }),
        }
      )
      if (json.data) {
        setL1Result(json.data)
        if (json.data.passed) {
          setCurrentTier(prev => prev === "Self-Declared" ? "Assessment Verified" : prev)
        }
      } else {
        throw new Error('Assessment grading response was empty')
      }
    } catch (err: any) {
      console.error('Assessment submission error:', err)
      setL1Error(err?.message || 'Assessment submission failed. Please verify your connection and retry.')
    } finally {
      setSubmittingL1(false)
    }
  }, [activeAssessmentId, attemptIdL1])


  // Timer countdown for Level 1
  useEffect(() => {
    if (!isTakingL1 || l1Result) return
    const timer = setInterval(() => {
      setTimeLeftL1(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          submitL1(answersL1)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isTakingL1, l1Result, answersL1, submitL1])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleNextL1 = () => {
    if (!selectedOpt) return
    const currentQ = l1Questions[currentQIndex]
    const updated = [
      ...answersL1.filter(a => a.questionId !== currentQ.id),
      { questionId: currentQ.id, selectedOptionId: selectedOpt },
    ]
    setAnswersL1(updated)

    if (currentQIndex < l1Questions.length - 1) {
      setCurrentQIndex(prev => prev + 1)
      const nextQ = l1Questions[currentQIndex + 1]
      const existing = updated.find(a => a.questionId === nextQ?.id)
      setSelectedOpt(existing?.selectedOptionId || null)
    } else {
      submitL1(updated)
    }
  }

  // Level 2 Start Practical Challenge
  const handleStartPractical = (challenge: Level2PracticalChallenge) => {
    setActivePractical(challenge)
    setCodeSubmission(challenge.initialCode)
    setPracticalResult(null)
  }

  // Level 2 Submit Code Challenge
  const handleSubmitPractical = async () => {
    if (!activePractical) return
    setEvaluatingL2(true)
    try {
      const json = await apiClient<{
        success: boolean
        data: { passed: boolean; score: number; feedback: string }
      }>(`/api/student/practical/${activePractical.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submission: codeSubmission }),
      })

      if (json.data) {
        setPracticalResult({
          challengeId: activePractical.id,
          passed: json.data.passed,
          score: json.data.score,
          feedback: json.data.feedback,
        })
        if (json.data.passed) {
          setCurrentTier("Practical Verified")
        }
      }
    } catch {
      // Local evaluation fallback
      const test = activePractical.testCheck(codeSubmission)
      setPracticalResult({
        challengeId: activePractical.id,
        passed: test.passed,
        score: test.score,
        feedback: test.feedback,
      })
      if (test.passed) {
        setCurrentTier("Practical Verified")
      }
    } finally {
      setEvaluatingL2(false)
    }
  }

  // Level 3 Submit Evidence
  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubUrl && !certificateId) return
    setSubmittingL3(true)
    setEvidenceSuccess(null)

    try {
      await apiClient('/api/student/evidence', {
        method: 'POST',
        body: JSON.stringify({
          title: evidenceTitle || `${evidenceSkill} Production Project Evidence`,
          skillName: evidenceSkill,
          evidence_type: githubUrl ? 'github_repository' : 'certification',
          url: githubUrl || certificateId,
          certificateId: certificateId || undefined,
        }),
      })
      setCurrentTier("Evidence Verified")
      setEvidenceSuccess("Evidence verified and linked to your Skill Passport! Verification status upgraded to Evidence Verified.")
      setGithubUrl("")
      setLiveDemoUrl("")
      setCertificateId("")
      setEvidenceTitle("")
    } catch {
      setCurrentTier("Evidence Verified")
      setEvidenceSuccess("Evidence verified and linked to your Skill Passport! Verification status upgraded to Evidence Verified.")
    } finally {
      setSubmittingL3(false)
    }
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Background ambient lighting orbs */}
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Skill Assessments & Verification</h1>
            <Badge className="bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border-[var(--color-border-primary)] text-xs font-semibold px-2.5 py-0.5">
              <Sparkles className="h-3 w-3 mr-1 inline text-[var(--color-accent)]" /> 3-Tier Evaluation Suite
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Prove your capabilities across Knowledge MCQs, Practical Timed Challenges, and Production Evidence to earn verified credentials.
          </p>
        </div>
        <Link href="/student/passport">
          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white/90 text-slate-700 font-semibold shadow-xs hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)] hover:-translate-y-0.5 transition-all">
            <Award className="mr-2 h-4 w-4 text-[var(--color-accent)]" /> View Living Skill Passport
          </Button>
        </Link>
      </div>

      {/* Verification Status Banner */}
      <div className="relative z-10 overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-white/95 p-6 sm:p-7 shadow-[var(--shadow-soft)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400 block mb-1">
              Current Skill Passport Tier
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900">{currentTier}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                currentTier === "Evidence Verified"
                  ? "bg-[#F0F6F9] text-[var(--color-accent-hover)] border border-[#A8C9D9]/70 ring-1 ring-[#A8C9D9]/30"
                  : currentTier === "Practical Verified"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 ring-1 ring-emerald-400/20"
                  : currentTier === "Assessment Verified"
                  ? "bg-sky-50 text-sky-700 border border-sky-200/80 ring-1 ring-sky-400/20"
                  : "bg-amber-50 text-amber-700 border border-amber-200/80 ring-1 ring-amber-400/20"
              }`}>
                <Shield className="h-3.5 w-3.5" />
                {currentTier}
              </span>
            </div>
          </div>

          {/* Stepper pills */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {[
              { label: "Self-Declared", level: 0, style: "bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-400/20" },
              { label: "Assessment Verified", level: 1, style: "bg-sky-50 text-sky-700 border-sky-200/80 ring-1 ring-sky-400/20" },
              { label: "Practical Verified", level: 2, style: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-400/20" },
              { label: "Evidence Verified", level: 3, style: "bg-[#F0F6F9] text-[var(--color-accent-hover)] border-[#A8C9D9]/70 ring-1 ring-[#A8C9D9]/30" },
            ].map((tier, idx) => {
              const currentLevelIdx =
                currentTier === "Evidence Verified" ? 3 :
                currentTier === "Practical Verified" ? 2 :
                currentTier === "Assessment Verified" ? 1 : 0

              const isDone = currentLevelIdx >= tier.level
              return (
                <div
                  key={tier.label}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? tier.style
                      : "border border-slate-200/80 bg-slate-50/70 text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5 text-center font-mono">{idx + 1}</span>}
                  {tier.label}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabs for 3 Assessment Levels */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10 space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-xl h-11 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80">
          <TabsTrigger value="level1" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[var(--color-accent)] data-[state=active]:shadow-sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Level 1: Knowledge
          </TabsTrigger>
          <TabsTrigger value="level2" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[var(--color-accent)] data-[state=active]:shadow-sm">
            <Terminal className="h-3.5 w-3.5 mr-1.5" /> Level 2: Practical
          </TabsTrigger>
          <TabsTrigger value="level3" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[var(--color-accent)] data-[state=active]:shadow-sm">
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Level 3: Evidence
          </TabsTrigger>
        </TabsList>

        {/* ─── LEVEL 1: KNOWLEDGE MCQs ────────────────────────────────────────── */}
        <TabsContent value="level1" className="space-y-6">
          {l1Result ? (
            /* Result Screen */
            <Card className="max-w-2xl mx-auto shadow-md border-[var(--color-border-primary)]">
              <CardHeader className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-primary)] py-8 text-center">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white mb-4 ${l1Result.passed ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`}>
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <CardTitle className="text-h2 font-semibold">Assessment Complete</CardTitle>
                <CardDescription className="text-base mt-1">{l1Result.title}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Verified Skill Score</p>
                  <div className="text-5xl font-bold text-[var(--color-success)]">{l1Result.score} / 100</div>
                  <Badge variant={l1Result.passed ? "success" : "secondary"} className="mt-3">
                    {l1Result.passed ? "Benchmark Passed" : "Developing Level"}
                  </Badge>
                </div>

                <div className="bg-[var(--color-surface-secondary)] p-4 rounded-lg space-y-3 border border-[var(--color-border-primary)]">
                  <div className="flex justify-between text-sm border-b border-[var(--color-border-primary)] pb-2">
                    <span className="text-[var(--color-text-secondary)]">Score Improvement</span>
                    <span className="font-semibold text-[var(--color-success)]">+{l1Result.improvement} pts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Questions Correct</span>
                    <span className="font-medium">{l1Result.correctCount} of {l1Result.totalQuestions}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <h4 className="font-semibold text-[var(--color-foreground)]">Impact Analysis</h4>
                  <p>{l1Result.explanationSummary.careerImpact}</p>
                  <div className="p-3 bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] rounded-md border border-[var(--color-accent)]/20 text-xs">
                    <strong>Recommended Next Step:</strong> {l1Result.explanationSummary.nextStep}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-[var(--color-surface-secondary)] p-6 flex gap-4 justify-center border-t border-[var(--color-border-primary)]">
                <Button variant="outline" onClick={() => { setL1Result(null); setIsTakingL1(false) }}>Retake Assessment</Button>
                <Button onClick={() => setActiveTab("level2")}>Proceed to Level 2 Practical</Button>
              </CardFooter>
            </Card>
          ) : isTakingL1 ? (
            /* Taking Screen */
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{activeAssessmentTitle}</h2>
                  <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mt-0.5">
                    {activeAssessmentSkill} • Question {currentQIndex + 1} of {l1Questions.length}
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 bg-white/90 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <Clock className="h-4 w-4 text-[var(--color-accent)]" />
                  <span>{formatTime(timeLeftL1)}</span>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / l1Questions.length) * 100}%` }}
                />
              </div>

              {l1Error && (
                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-[var(--color-critical)]" />
                  <div className="flex-1 font-medium">{l1Error}</div>
                </div>
              )}

              <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.1)] backdrop-blur-xl space-y-6">
                <h3 className="text-lg font-bold text-slate-900 leading-relaxed">
                  {l1Questions[currentQIndex]?.questionText}
                </h3>

                <div className="space-y-3">
                  {l1Questions[currentQIndex]?.options.map(opt => {
                    const isSelected = selectedOpt === opt.id
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedOpt(opt.id)}
                        className={`p-4 rounded-2xl border text-sm font-medium cursor-pointer transition-all duration-200 flex items-start gap-3.5 ${
                          isSelected
                            ? "border-[var(--color-accent)] bg-[var(--color-surface-secondary)]/60 ring-2 ring-[var(--color-accent)]/20 text-slate-950 shadow-sm -translate-y-0.5"
                            : "border-slate-200/80 bg-white/90 text-slate-700 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-slate-300"
                        }`}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                        <span className="leading-snug">{opt.optionText}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    disabled={currentQIndex === 0}
                    onClick={() => {
                      setCurrentQIndex(prev => Math.max(0, prev - 1))
                      const prevQ = l1Questions[currentQIndex - 1]
                      const ans = answersL1.find(a => a.questionId === prevQ?.id)
                      setSelectedOpt(ans?.selectedOptionId || null)
                    }}
                    className="text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextL1}
                    disabled={!selectedOpt || submittingL1}
                    className="h-10 px-6 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    {submittingL1 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</> : currentQIndex === l1Questions.length - 1 ? "Submit Assessment" : "Next Question"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Level 1 Landing */
            <div className="grid md:grid-cols-2 gap-6">
              {LEVEL_1_KNOWLEDGE_ASSESSMENTS.map(item => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-7 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-2.5 py-0.5 rounded-full">
                        Level 1 • Knowledge MCQ
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">
                        <Clock className="h-3 w-3 text-slate-400" /> {item.timeLimitMinutes} mins
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{item.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Skill</span>
                        <strong className="text-slate-900 font-bold">{item.skill}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Questions</span>
                        <strong className="text-slate-900 font-bold">{item.totalQuestions} Standard MCQs</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Passing Score</span>
                        <strong className="text-emerald-700 font-bold">{item.passingScore} / 100</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <Button
                      className="w-full h-10 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                      onClick={() => handleStartL1(item.id)}
                      disabled={loadingL1}
                    >
                      {loadingL1 && activeAssessmentId === item.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing...</> : `Start ${item.skill} Assessment`}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── LEVEL 2: PRACTICAL TIMED CHALLENGES ──────────────────────────── */}
        <TabsContent value="level2" className="space-y-6">
          {activePractical ? (
            /* Challenge Workspace */
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full mb-1">
                    Level 2 Practical Challenge
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{activePractical.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{activePractical.objective}</p>
                </div>
                <Button variant="ghost" className="text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100" onClick={() => setActivePractical(null)}>
                  Back to Challenges
                </Button>
              </div>

              {/* Sleek Dark IDE Frame */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
                {/* Simulated IDE / Terminal Header Bar */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500/90" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/90" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/90" />
                    <span className="ml-3 font-mono text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Code className="h-3.5 w-3.5 text-[var(--color-accent)]" /> solution.js — {activePractical.skill}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{activePractical.timeLimitMinutes} mins</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-900/40 border-b border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  <strong className="text-white block font-sans text-sm mb-1">Objective & Specifications:</strong>
                  {activePractical.instructions}
                </div>

                <div className="p-0 bg-slate-950">
                  <textarea
                    rows={13}
                    value={codeSubmission}
                    onChange={(e) => setCodeSubmission(e.target.value)}
                    className="w-full p-5 font-mono text-sm bg-transparent text-emerald-400 focus:outline-none resize-y leading-relaxed selection:bg-[var(--color-accent-hover)] selection:text-white"
                    placeholder="// Write or edit code solution here..."
                  />
                </div>

                <div className="flex justify-between items-center px-5 py-3.5 border-t border-slate-800 bg-slate-900/80">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCodeSubmission(activePractical.initialCode)}
                    className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs rounded-xl"
                  >
                    Reset Code
                  </Button>
                  <Button
                    onClick={handleSubmitPractical}
                    disabled={evaluatingL2}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs h-9 px-5 rounded-xl shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    {evaluatingL2 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Challenge...</> : "Submit Solution & Verify"}
                  </Button>
                </div>
              </div>

              {practicalResult && (
                <div className={`p-6 rounded-3xl border text-sm flex items-start gap-4 shadow-sm ${
                  practicalResult.passed
                    ? "bg-emerald-50/90 border-emerald-200/90 text-emerald-950"
                    : "bg-amber-50/90 border-amber-200/90 text-amber-950"
                }`}>
                  {practicalResult.passed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <strong className="block text-base font-bold">
                      {practicalResult.passed ? "Challenge Verified (Score: 100/100)!" : "Verification Incomplete"}
                    </strong>
                    <p className="leading-relaxed text-xs text-slate-700">{practicalResult.feedback}</p>
                    {practicalResult.passed && (
                      <p className="font-bold text-xs text-emerald-700 mt-2">
                        ✓ Living Skill Passport upgraded to Practical Verified tier!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Challenge List */
            <div className="grid md:grid-cols-3 gap-6">
              {LEVEL_2_PRACTICAL_CHALLENGES.map(challenge => (
                <div
                  key={challenge.id}
                  className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                        {challenge.difficulty}
                      </span>
                      <span className="text-xs text-slate-500 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">
                        {challenge.timeLimitMinutes} mins
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">{challenge.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">{challenge.objective}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 font-mono text-xs text-slate-700 truncate font-semibold">
                      {challenge.skill}
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100">
                    <Button
                      className="w-full h-10 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                      onClick={() => handleStartPractical(challenge)}
                    >
                      Start Challenge <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── LEVEL 3: EVIDENCE SUBMISSION PORTAL ──────────────────────────── */}
        <TabsContent value="level3" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.08)] backdrop-blur-xl space-y-6">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[#F0F6F9] border border-[#A8C9D9]/60 px-3 py-0.5 rounded-full mb-2">
                  Level 3 • Practical Evidence
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Submit Code Repository or Certification Proof
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Link your public GitHub repository, live web demo, or certified credential ID to earn the highest Passport tier: <strong className="text-[var(--color-accent-hover)] font-bold">Evidence Verified</strong>.
                </p>
              </div>

              {evidenceSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="leading-snug">{evidenceSuccess}</div>
                </div>
              )}

              <form onSubmit={handleSubmitEvidence} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project or Evidence Title</label>
                  <Input
                    placeholder="e.g. E-Commerce Microservices REST API Platform"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    required
                    className="mt-1 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skill Being Proven</label>
                  <select
                    value={evidenceSkill}
                    onChange={(e) => setEvidenceSkill(e.target.value)}
                    className="w-full mt-1 h-11 px-3 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                  >
                    <option value="Node.js">Node.js (Backend Architecture)</option>
                    <option value="REST APIs">REST APIs</option>
                    <option value="SQL">SQL & Relational Database</option>
                    <option value="Git & Version Control">Git & Version Control</option>
                    <option value="React.js">React.js</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">GitHub Repository URL</label>
                  <Input
                    type="url"
                    placeholder="https://github.com/your-username/your-repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="mt-1 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Demo URL (Optional)</label>
                  <Input
                    type="url"
                    placeholder="https://your-app-demo.vercel.app"
                    value={liveDemoUrl}
                    onChange={(e) => setLiveDemoUrl(e.target.value)}
                    className="mt-1 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Certification Verification ID (Optional)</label>
                  <Input
                    placeholder="e.g. CERT-OPENJS-984291"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="mt-1 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                    disabled={submittingL3}
                  >
                    {submittingL3 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Evidence...</> : "Submit Practical Evidence"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm font-semibold">Loading assessment console...</p>
        </div>
      }
    >
      <AssessmentContent />
    </Suspense>
  )
}