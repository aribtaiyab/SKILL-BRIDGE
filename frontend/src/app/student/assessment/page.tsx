"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, ChevronRight, FileText, Clock, Shield, AlertTriangle, ArrowRight, Loader2 } from "lucide-react"
import { QuestionSafeView, AssessmentAttemptResult, FALLBACK_QUESTIONS } from "@/lib/intelligence/types"
import { apiClient } from "@/lib/api-client"

import { useDemo } from "@/lib/demo/demo-context"

interface AssessmentSummary {
  id: string
  title: string
  description?: string | null
  time_limit: number
  total_questions: number
  passing_score: number
  skills?: { id: string; name: string } | null
  career_target_id?: string | null
}

export default function AssessmentPage() {
  const { isDemo, submitAssessment } = useDemo()
  const [isTaking, setIsTaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ questionId: string; selectedOptionId: string }[]>([])
  const [attemptId, setAttemptId] = useState<string>("")
  const [assessmentResult, setAssessmentResult] = useState<AssessmentAttemptResult | null>(null)
  const [questions, setQuestions] = useState<QuestionSafeView[]>([])
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 mins
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([])
  const [activeAssessment, setActiveAssessment] = useState<AssessmentSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) return
    apiClient<{ data: AssessmentSummary[] }>('/api/student/assessments')
      .then(response => setAssessments(response.data || []))
      .catch(() => setError("We couldn't load your assessments. Please try again."))
  }, [isDemo])

  // Start Assessment Flow
  const handleStart = async (assessmentId: string) => {
    setLoading(true)
    setError(null)
    try {
      const assessment = assessments.find(item => item.id === assessmentId) || null
      const json = await apiClient<{ success: boolean; data: { attemptId: string; title: string; skillName: string; timeLimit: number; questions: QuestionSafeView[] } }>(`/api/student/assessments/${assessmentId}/start`, { method: 'POST' })
      if (json.success && json.data) {
        setAttemptId(json.data.attemptId)
        setQuestions(json.data.questions)
        setTimeLeft(json.data.timeLimit * 60)
        setActiveAssessment(assessment)
      } else {
        throw new Error('Assessment could not be started')
      }
      setIsTaking(true)
      setCurrentQuestion(0)
      setSelectedOption(null)
      setAnswers([])
    } catch (err: any) {
      setError(err?.message || "We couldn't start this assessment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const submitAnswers = useCallback(async (finalAnswers: { questionId: string; selectedOptionId: string }[]) => {
    setSubmitting(true)
    if (isDemo) {
      // Deterministic calculation in Demo Mode
      const correctCount = 4
      const totalQuestions = 5
      const score = 80
      const skillName = "Spring Boot"

      submitAssessment(skillName, score)

      setAssessmentResult({
        attemptId,
        assessmentId: "1",
        title: "Spring Boot Microservices Benchmark Assessment",
        skillName,
        totalQuestions,
        correctCount,
        score,
        percentage: score,
        passed: true,
        previousScore: 50,
        improvement: 30,
        explanationSummary: {
          strengths: ["REST Controller Mapping", "Dependency Injection Lifecycle"],
          weaknesses: ["MockMvc Integration Testing"],
          careerImpact: "Your Spring Boot score increased by 30 points (50 → 80), eliminating the 25-point gap!",
          nextStep: "Submit code repository evidence to earn Evidence Verified status in your Passport.",
        },
      })
      setSubmitting(false)
      return
    }

    try {
      const json = await apiClient<{ success: boolean; data: AssessmentAttemptResult }>(`/api/student/assessments/${activeAssessment?.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ attempt_id: attemptId, answers: finalAnswers }),
      })
      if (json.success && json.data) {
        setAssessmentResult(json.data)
      }
    } catch (err: any) {
      setError(err?.message || "We couldn't submit your assessment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [attemptId, isDemo, submitAssessment])

  const handleSubmit = useCallback(() => {
    if (selectedOption) {
      const currentQ = questions[currentQuestion]
      const updatedAnswers = [...answers.filter(a => a.questionId !== currentQ.id), { questionId: currentQ.id, selectedOptionId: selectedOption }]
      submitAnswers(updatedAnswers)
    } else {
      submitAnswers(answers)
    }
  }, [selectedOption, questions, currentQuestion, answers, submitAnswers])

  // Timer countdown
  useEffect(() => {
    if (!isTaking || assessmentResult) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isTaking, assessmentResult, handleSubmit])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleNext = () => {
    if (!selectedOption) return

    const currentQ = questions[currentQuestion]
    const updatedAnswers = [...answers.filter(a => a.questionId !== currentQ.id), { questionId: currentQ.id, selectedOptionId: selectedOption }]
    setAnswers(updatedAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      const nextQ = questions[currentQuestion + 1]
      const existing = updatedAnswers.find(a => a.questionId === nextQ.id)
      setSelectedOption(existing?.selectedOptionId || null)
    } else {
      submitAnswers(updatedAnswers)
    }
  }

  // ─── Result Screen ───────────────────────────────────────────────────────────
  if (assessmentResult) {
    const res = assessmentResult
    return (
      <div className="max-w-2xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
        <Card className="shadow-lg border-[var(--color-border-primary)]">
          <CardHeader className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-primary)] py-8 text-center">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white mb-4 ${res.passed ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`}>
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-h2 font-semibold">Assessment Complete</CardTitle>
            <CardDescription className="text-base mt-1 text-[var(--color-text-secondary)]">
              {res.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Verified Skill Score</p>
              <div className="text-5xl font-bold text-[var(--color-success)]">{res.score} / 100</div>
              <Badge variant={res.passed ? "success" : "secondary"} className="mt-3">
                {res.passed ? "Passed Benchmark" : "Developing Level"}
              </Badge>
            </div>

            <div className="bg-[var(--color-surface-secondary)] p-4 rounded-lg space-y-3 border border-[var(--color-border-primary)]">
              <div className="flex justify-between text-sm border-b border-[var(--color-border-primary)] pb-2">
                <span className="text-[var(--color-text-secondary)]">Previous Score</span>
                <span className="font-medium">{res.previousScore !== null ? res.previousScore : "Not Assessed"}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-[var(--color-border-primary)] pb-2">
                <span className="text-[var(--color-text-secondary)]">Score Delta</span>
                <span className={`font-semibold ${res.improvement >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}`}>
                  {res.improvement > 0 ? `+${res.improvement} pts` : `${res.improvement} pts`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Questions Correct</span>
                <span className="font-medium">{res.correctCount} of {res.totalQuestions}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <h4 className="font-semibold text-[var(--color-foreground)]">Impact Analysis</h4>
              <p>{res.explanationSummary.careerImpact}</p>
              <div className="p-3 bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] rounded-md border border-[var(--color-accent)]/20 text-xs">
                <strong>Recommended Next Step:</strong> {res.explanationSummary.nextStep}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-[var(--color-surface-secondary)] p-6 flex gap-4 justify-center border-t border-[var(--color-border-primary)]">
            <Link href="/student">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Link href="/student/skill-gap">
              <Button>View Updated Skill Gaps</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ─── Active Assessment Taking Screen ───────────────────────────────────────────
  if (isTaking) {
    const q = questions[currentQuestion] || questions[0]
    const progressPercent = ((currentQuestion + 1) / questions.length) * 100

    return (
      <div className="max-w-3xl mx-auto mt-6 animate-in fade-in duration-300 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">{activeAssessment?.title || 'Assessment'}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Knowledge Verification • {questions.length} Questions</p>
          </div>
          <div className="flex items-center gap-2 font-mono text-sm bg-[var(--color-surface-secondary)] px-3 py-1.5 rounded-md border border-[var(--color-border-primary)]">
            <Clock className="h-4 w-4 text-[var(--color-accent)]" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progressPercent)}% completed</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card className="border-[var(--color-border-primary)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{q.questionText}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-4 rounded-lg border text-sm cursor-pointer transition-all flex items-start gap-3 ${
                  selectedOption === opt.id
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-foreground)] ring-1 ring-[var(--color-accent)]"
                    : "border-[var(--color-border-primary)] hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)]"
                }`}
              >
                <div className={`h-4 w-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  selectedOption === opt.id ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--color-text-muted)]"
                }`}>
                  {selectedOption === opt.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <span>{opt.optionText}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-[var(--color-border-primary)] p-4 bg-[var(--color-surface-secondary)]">
            <Button
              variant="ghost"
              disabled={currentQuestion === 0}
              onClick={() => {
                setCurrentQuestion(prev => Math.max(0, prev - 1))
                const prevQ = questions[currentQuestion - 1]
                const ans = answers.find(a => a.questionId === prevQ?.id)
                setSelectedOption(ans?.selectedOptionId || null)
              }}
            >
              Previous
            </Button>
            <Button onClick={handleNext} disabled={!selectedOption || submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</>
              ) : currentQuestion === questions.length - 1 ? (
                "Submit Assessment"
              ) : (
                "Next Question"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ─── Assessment Overview / Landing Screen ───────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Skill Assessments</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Take standardized assessments to verify your skills and unlock job matches.</p>
      </div>

      {error && <p className="text-sm text-[var(--color-critical)]">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        {isDemo ? <Card className="border-[var(--color-border-primary)] hover:border-[var(--color-accent)] transition-all">
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="secondary" className="bg-[var(--color-surface-secondary)]">Knowledge Assessment</Badge>
              <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" /> 15 mins
              </span>
            </div>
            <CardTitle className="text-xl mt-3">Node.js Fundamentals</CardTitle>
            <CardDescription>
              Evaluates understanding of the Node.js event loop, asynchronous non-blocking patterns, Streams, and child processes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between">
                <span>Target Career</span>
                <span className="font-medium text-[var(--color-foreground)]">Backend Developer</span>
              </div>
              <div className="flex justify-between">
                <span>Current Verified Level</span>
                <span className="font-medium text-[var(--color-foreground)]">65 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Required Level</span>
                <span className="font-medium text-[var(--color-foreground)]">80 / 100</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-[var(--color-border-primary)] pt-4">
            <Button className="w-full" onClick={() => handleStart("1")} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing...</> : "Start Assessment"}
            </Button>
          </CardFooter>
        </Card> : assessments.map(assessment => <Card key={assessment.id} className="border-[var(--color-border-primary)] hover:border-[var(--color-accent)] transition-all">
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="secondary" className="bg-[var(--color-surface-secondary)]">Knowledge Assessment</Badge>
              <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" /> {assessment.time_limit} mins
              </span>
            </div>
            <CardTitle className="text-xl mt-3">{assessment.title}</CardTitle>
            <CardDescription>{assessment.description || 'Complete this assessment to verify the associated skill.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between">
                <span>Target Career</span>
                <span className="font-medium text-[var(--color-foreground)]">{assessment.skills?.name || 'Target skill'}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Verified Level</span>
                <span className="font-medium text-[var(--color-foreground)]">Not Assessed</span>
              </div>
              <div className="flex justify-between">
                <span>Required Level</span>
                <span className="font-medium text-[var(--color-foreground)]">Passing: {assessment.passing_score} / 100</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-[var(--color-border-primary)] pt-4">
            <Button className="w-full" variant="outline" onClick={() => handleStart(assessment.id)} disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing...</> : "Take Reassessment"}
            </Button>
          </CardFooter>
        </Card>)}
      </div>

      {!isDemo && assessments.length === 0 && !error && <p className="text-sm text-[var(--color-text-secondary)]">No assessments are currently configured for your account.</p>}

      <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)]">
        <CardContent className="p-6 flex items-start gap-4">
          <Shield className="h-6 w-6 text-[var(--color-accent)] shrink-0 mt-1" />
          <div className="space-y-1">
            <h3 className="font-semibold">Trust & Verification Policy</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Assessment answers are verified server-side. Completing knowledge assessments upgrades your capability from Self-Declared to Assessment Verified on your Skill Passport.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}