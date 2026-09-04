"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  BookOpen,
  Code,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Sparkles,
  Target,
  Clock,
  RotateCcw,
  CheckSquare,
  Square,
  HelpCircle,
  TrendingUp,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import {
  DiagnosticOutput,
  LearningPlan,
  PracticeQuestionSafe,
  PracticeFeedback,
  CoachMessage,
  DifficultyLevel,
} from "@/lib/ai/types"
import { apiClient } from "@/lib/api-client"

export default function AICoachPage() {
  const { isDemo, student } = useDemo()
  const [activeTab, setActiveTab] = useState("diagnosis")
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState<DiagnosticOutput | null>(null)
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null)
  const [hasNoAssessments, setHasNoAssessments] = useState(false)

  // Practice state
  const [practiceDifficulty, setPracticeDifficulty] = useState<DifficultyLevel>("Intermediate")
  const [practiceQuestion, setPracticeQuestion] = useState<PracticeQuestionSafe | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [practiceFeedback, setPracticeFeedback] = useState<PracticeFeedback | null>(null)
  const [submittingPractice, setSubmittingPractice] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<CoachMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Why is Spring Boot my priority gap?",
    "Explain Dependency Injection in Spring simply",
    "Give me a practice challenge",
    "Am I ready to reassess Spring Boot?",
  ])

  // Completed steps tracking in session
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    async function initCoach() {
      if (isDemo) {
        setDiagnosis({
          skill: "Spring Boot",
          summary: "Diagnostic analysis identifies a 25-point deficit in Spring Boot. Mastering REST controllers, dependency injection, and JPA repository queries will elevate your career readiness from 82% to 90%+.",
          currentScore: 50,
          targetScore: 75,
          gap: 25,
          weakAreas: ["REST Controller Testing", "Dependency Injection Lifecycle", "Spring Data JPA Queries"],
          strengths: ["Solid Java 80% Core Foundation", "Relational Database SQL Competency"],
          commonMistakes: [
            "Missing @Transactional annotations leading to inconsistent database states",
            "Field injection instead of constructor injection leading to untestable beans",
          ],
          prerequisites: ["Java Collections Framework", "HTTP & REST conventions"],
          recommendedSequence: [
            "1. Bean Lifecycle & Inversion of Control",
            "2. RESTful Controller Endpoints & DTOs",
            "3. Data Persistence with JPA & Repositories",
            "4. Integration Testing with MockMvc",
            "5. Practical Benchmark Assessment",
          ],
          nextAction: {
            title: "Spring Boot Microservices Practice Challenge",
            description: "Solve a 5-question adaptive challenge on RESTful endpoints and Dependency Injection.",
            estimatedMinutes: 20,
          },
          confidence: "high",
        })

        setLearningPlan({
          skill: "Spring Boot",
          careerTarget: "Backend Developer",
          initialScore: 50,
          targetScore: 75,
          estimatedTotalHours: 12,
          summary: "A 5-step structured microservices pathway to eliminate the 25-point gap in Spring Boot.",
          steps: [
            {
              stepNumber: 1,
              stepType: "understand",
              title: "Spring Core & Inversion of Control (IoC)",
              description: "Understand Bean lifecycle, ApplicationContext, and @Autowired dependency injection mechanisms.",
              estimatedMinutes: 90,
              keyConcept: "Bean scopes & Constructor Injection",
              careerRelevance: "Essential for decoupled enterprise backend architecture",
              isCompleted: false,
            },
            {
              stepNumber: 2,
              stepType: "learn",
              title: "Building RESTful Web Services",
              description: "Implement @RestController endpoints, request mapping, error handling with @ControllerAdvice.",
              estimatedMinutes: 120,
              keyConcept: "REST principles & HTTP Status Codes",
              careerRelevance: "Core responsibility of API developers",
              isCompleted: false,
            },
            {
              stepNumber: 3,
              stepType: "practice",
              title: "Data Persistence with Spring Data JPA",
              description: "Configure repositories, entity mappings, and custom JPQL query methods.",
              estimatedMinutes: 150,
              keyConcept: "Entity Relationships & Transactions",
              careerRelevance: "Required for robust database operations",
              isCompleted: false,
            },
            {
              stepNumber: 4,
              stepType: "build",
              title: "Integration Testing with MockMvc",
              description: "Write unit and integration tests for REST APIs using SpringBootTest and MockMvc.",
              estimatedMinutes: 120,
              keyConcept: "Automated Mock API Testing",
              careerRelevance: "Industry standard for quality assurance in CI/CD",
              isCompleted: false,
            },
            {
              stepNumber: 5,
              stepType: "reassess",
              title: "Official Spring Boot Practical Reassessment",
              description: "Take the verified SkillBridge practical coding assessment to prove benchmark competency.",
              estimatedMinutes: 45,
              keyConcept: "Verified Benchmark Evaluation",
              careerRelevance: "Upgrades your Skill Passport to Evidence Verified",
              isCompleted: false,
            },
          ],
        })

        setChatMessages([
          {
            role: "assistant",
            content: `Hello ${student.name.split(' ')[0]}! I am your **SkillBridge AI Coach**. I have analyzed your career target (**${student.targetCareer}**) and current readiness benchmarks. Your current priority is closing the **25-point gap in Spring Boot** (Current: 50 / Target: 75). How can I assist your preparation today?`,
          },
        ])
        setLoading(false)
        return
      }

      try {
        const [diagRes, planRes] = await Promise.all([
          apiClient('/api/ai/diagnose', { method: 'POST' }),
          apiClient('/api/ai/learning-plan', { method: 'POST' }),
        ])

        if (diagRes.success && diagRes.data?.diagnosis) {
          setDiagnosis(diagRes.data.diagnosis)
        } else {
          setHasNoAssessments(true)
        }

        if (planRes.success && planRes.data?.plan) {
          setLearningPlan(planRes.data.plan)
        }

        setChatMessages([
          {
            role: "assistant",
            content: `Hello! I am your **SkillBridge AI Coach**. I am ready to guide your skill development and benchmark preparation. Start an assessment to get a personalized diagnostic!`,
          },
        ])
      } catch (err) {
        console.warn("Coach init warning:", err)
        setHasNoAssessments(true)
      } finally {
        setLoading(false)
      }
    }
    initCoach()
  }, [isDemo, student])

  // Generate Practice Question
  const loadPractice = async (diff: DifficultyLevel = practiceDifficulty) => {
    setPracticeLoading(true)
    setPracticeFeedback(null)
    setSelectedOption(null)
    try {
      const json = await apiClient('/api/ai/practice', {
        method: 'POST',
        body: JSON.stringify({ skillName: diagnosis?.skill || "Node.js", difficulty: diff }),
      })
      if (json.success && json.data?.question) {
        setPracticeQuestion(json.data.question)
      }
    } catch (err) {
      console.warn("Practice loading error:", err)
    } finally {
      setPracticeLoading(false)
    }
  }

  // Submit Practice Answer
  const submitPractice = async () => {
    if (!selectedOption || !practiceQuestion) return
    setSubmittingPractice(true)
    try {
      const json = await apiClient('/api/ai/feedback', {
        method: 'POST',
        body: JSON.stringify({
          practiceId: practiceQuestion.id,
          skillName: practiceQuestion.skill,
          studentAnswer: selectedOption,
        }),
      })
      if (json.success && json.data) {
        setPracticeFeedback(json.data)
      }
    } catch (err) {
      console.warn("Submit practice error:", err)
    } finally {
      setSubmittingPractice(false)
    }
  }

  // Send Chat Message
  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputMessage
    if (!text.trim() || chatLoading) return

    const newHistory: CoachMessage[] = [...chatMessages, { role: "user", content: text }]
    setChatMessages(newHistory)
    setInputMessage("")
    setChatLoading(true)

    try {
      const json = await apiClient('/api/ai/coach', {
        method: 'POST',
        body: JSON.stringify({ message: text, history: newHistory }),
      })
      if (json.success && json.data) {
        setChatMessages(prev => [
          ...prev,
          { role: "assistant", content: json.data.reply },
        ])
        if (json.data.suggestedQuestions) {
          setSuggestedQuestions(json.data.suggestedQuestions)
        }
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I ran into a temporary hiccup processing your question. Focus on your prioritized Node.js learning plan and let me know how else I can assist!",
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const toggleStep = (stepNum: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepNum) ? prev.filter(s => s !== stepNum) : [...prev, stepNum]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Analyzing diagnostic skill intelligence...</p>
        </div>
      </div>
    )
  }

  // Real user with no assessment data yet (Section 10 requirement)
  if (!isDemo && hasNoAssessments && !diagnosis) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-h1 font-semibold">AI Skill Coach</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Diagnostic intelligence, personalized learning plans, and practice.</p>
          </div>
        </div>

        <Card className="border-[var(--color-border-primary)] shadow-sm bg-[var(--color-surface-secondary)] p-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-h3 font-semibold">Assessment Required for Diagnosis</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              I need at least one assessment result to diagnose your skill gaps. Start your assessment →
            </p>
            <div className="pt-2">
              <Link href="/student/assessment">
                <Button className="px-6">
                  Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const diag = diagnosis || {
    skill: "Spring Boot",
    summary: "Diagnostic analysis identifies a 25-point deficit in Spring Boot.",
    currentScore: 50,
    targetScore: 75,
    gap: 25,
    weakAreas: [
      "Asynchronous control flow (Promise chaining vs async/await rejection handling)",
      "Event loop tick phases and non-blocking I/O patterns",
      "Stream buffer backpressure & chunk error propagation",
    ],
    strengths: ["Demonstrated solid grasp of basic syntax and initialization for Node.js"],
    commonMistakes: [
      "Uncaught exceptions inside asynchronous callbacks causing process termination",
      "Blocking the main event loop with synchronous file system calls under load",
    ],
    prerequisites: ["JavaScript ES6 Modules & Closures", "HTTP Protocol & REST conventions"],
    recommendedSequence: [
      "1. Master Promise rejection and async/await try/catch blocks",
      "2. Implement event listener error boundaries",
      "3. Build a streaming pipe with backpressure handling",
    ],
    nextAction: {
      title: "Practice Asynchronous Error Handling in Node.js",
      description: "Complete a 15-minute targeted debugging scenario focusing on try/catch blocks with async/await.",
      estimatedMinutes: 15,
    },
    confidence: "high" as const,
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--color-accent)] rounded-lg text-white">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-h1 font-semibold">AI Skill Coach</h1>
            <p className="text-[var(--color-text-secondary)] mt-0.5">
              Personalized diagnostic intelligence, structured learning pathways, and adaptive practice.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/student/assessment">
            <Button size="sm" className="bg-[var(--color-accent)]">
              Take Reassessment <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Focus & Priority Banner */}
      <div className="p-6 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                AI Diagnostic Focus
              </Badge>
              <Badge variant="critical">Critical Gap ({diag.gap} pts)</Badge>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">
              Primary Goal: Elevate {diag.skill} from {diag.currentScore} to {diag.targetScore}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl">
              {diag.summary}
            </p>
          </div>

          <div className="bg-[var(--color-surface-card)] p-4 rounded-lg border border-[var(--color-border-primary)] min-w-[220px]">
            <p className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase">Recommended Next Step</p>
            <p className="text-sm font-medium mt-1 text-[var(--color-foreground)]">{diag.nextAction.title}</p>
            <div className="flex items-center justify-between text-xs text-[var(--color-accent)] font-medium mt-2">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {diag.nextAction.estimatedMinutes} mins</span>
              <button
                onClick={() => { setActiveTab("practice"); loadPractice(); }}
                className="hover:underline flex items-center gap-0.5"
              >
                Start Practice →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="learning-plan">Learning Plan</TabsTrigger>
          <TabsTrigger value="practice">Targeted Practice</TabsTrigger>
          <TabsTrigger value="chat">Ask Coach</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: DIAGNOSTIC BREAKDOWN ─────────────────────────────────── */}
        <TabsContent value="diagnosis" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-[var(--color-border-primary)] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
                  Identified Weakness Bottlenecks
                </CardTitle>
                <CardDescription>Concepts preventing advancement beyond {diag.currentScore} points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                {diag.weakAreas.map((w, idx) => (
                  <div key={idx} className="p-3 bg-[var(--color-surface-secondary)] rounded-md border border-[var(--color-border-primary)] text-xs leading-relaxed">
                    <strong className="text-[var(--color-foreground)]">Area {idx + 1}:</strong> {w}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border-primary)] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
                  Recommended Mastery Sequence
                </CardTitle>
                <CardDescription>Step-by-step cognitive progression</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                {diag.recommendedSequence.map((seq, idx) => (
                  <div key={idx} className="p-3 bg-[var(--color-surface-secondary)] rounded-md border border-[var(--color-border-primary)] text-xs text-[var(--color-text-secondary)]">
                    {seq}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-[var(--color-border-primary)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Common Anti-Patterns to Avoid</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 pt-1">
              {diag.commonMistakes.map((m, idx) => (
                <div key={idx} className="p-3 bg-[var(--color-surface-secondary)] rounded-md border border-[var(--color-border-primary)] text-xs text-[var(--color-text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--color-critical)] font-bold">✕</span>
                  <span>{m}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: PERSONALIZED LEARNING PLAN ─────────────────────────────── */}
        <TabsContent value="learning-plan" className="space-y-6 mt-6">
          <Card className="border-[var(--color-border-primary)] shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-semibold">{learningPlan?.skill || diag.skill} Mastery Pathway</CardTitle>
                  <CardDescription>Career-specific learning steps tailored for {learningPlan?.careerTarget || "Backend Developer"}</CardDescription>
                </div>
                <Badge variant="secondary">
                  {completedSteps.length} of {learningPlan?.steps.length || 5} Steps Done
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(learningPlan?.steps || []).map((step) => {
                const isDone = completedSteps.includes(step.stepNumber)
                return (
                  <div
                    key={step.stepNumber}
                    className={`p-4 rounded-lg border transition-all ${
                      isDone
                        ? "bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)] opacity-75"
                        : "bg-[var(--color-surface-card)] border-[var(--color-border-primary)] shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(step.stepNumber)}
                          className="mt-0.5 text-[var(--color-accent)] hover:opacity-80"
                        >
                          {isDone ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-[var(--color-text-muted)]" />}
                        </button>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                              Step {step.stepNumber} • {step.stepType}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {step.estimatedMinutes} mins
                            </span>
                          </div>
                          <h4 className={`text-sm font-semibold ${isDone ? 'line-through text-[var(--color-text-secondary)]' : 'text-[var(--color-foreground)]'}`}>
                            {step.title}
                          </h4>
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            {step.description}
                          </p>
                          <div className="pt-1.5 flex flex-wrap gap-2 text-[11px]">
                            <span className="bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]">
                              Key Concept: {step.keyConcept}
                            </span>
                            <span className="text-[var(--color-accent)] font-medium">
                              {step.careerRelevance}
                            </span>
                          </div>
                        </div>
                      </div>

                      {step.stepType === "reassess" && (
                        <Link href="/student/assessment" className="shrink-0">
                          <Button size="sm" variant="outline" className="text-xs h-8">
                            Reassess Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: TARGETED PRACTICE ─────────────────────────────────────── */}
        <TabsContent value="practice" className="space-y-6 mt-6">
          {/* Difficulty Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]">
            <div>
              <h3 className="font-semibold text-sm">Adaptive Practice Generator</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Generated scenarios targeting identified asynchronous bottlenecks.</p>
            </div>
            <div className="flex items-center gap-2">
              {(["Beginner", "Developing", "Intermediate", "Advanced"] as DifficultyLevel[]).map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={practiceDifficulty === d ? "default" : "outline"}
                  onClick={() => { setPracticeDifficulty(d); loadPractice(d); }}
                  className="text-xs h-8"
                >
                  {d}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => loadPractice()} className="text-xs h-8">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> New Question
              </Button>
            </div>
          </div>

          {/* Practice Question Card */}
          {practiceLoading ? (
            <div className="flex items-center justify-center min-h-[250px]">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            </div>
          ) : practiceQuestion ? (
            <Card className="border-[var(--color-border-primary)] shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{practiceQuestion.difficulty} Level</Badge>
                  <span className="text-xs text-[var(--color-text-secondary)]">{practiceQuestion.subskill}</span>
                </div>
                <CardTitle className="text-base font-semibold mt-2">{practiceQuestion.questionText}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {practiceQuestion.codeSnippet && (
                  <pre className="p-3 bg-[var(--color-surface-secondary)] rounded-md border border-[var(--color-border-primary)] font-mono text-xs overflow-x-auto text-[var(--color-foreground)]">
                    {practiceQuestion.codeSnippet}
                  </pre>
                )}

                <div className="space-y-2">
                  {(practiceQuestion.options || []).map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => !practiceFeedback && setSelectedOption(opt.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        selectedOption === opt.id
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] ring-1 ring-[var(--color-accent)]"
                          : "border-[var(--color-border-primary)] hover:bg-[var(--color-surface-secondary)]"
                      }`}
                    >
                      <div className={`h-3.5 w-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        selectedOption === opt.id ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--color-text-muted)]"
                      }`}>
                        {selectedOption === opt.id && <div className="h-1 w-1 rounded-full bg-white" />}
                      </div>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>

                {/* Feedback Box */}
                {practiceFeedback && (
                  <div className={`p-4 rounded-lg border space-y-2 animate-in fade-in duration-300 ${
                    practiceFeedback.isCorrect ? "bg-green-50 border-green-200 text-green-900" : "bg-red-50 border-red-200 text-red-900"
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {practiceFeedback.isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                      <span>{practiceFeedback.isCorrect ? "Correct Solution!" : "Incorrect — Concept Review Needed"}</span>
                    </div>
                    <p className="text-xs leading-relaxed">{practiceFeedback.explanation}</p>
                    <p className="text-xs font-medium pt-1">
                      <strong>Takeaway:</strong> {practiceFeedback.correctAnswerSummary}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] italic">
                      {practiceFeedback.recommendedFollowup}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  {!practiceFeedback ? (
                    <Button
                      size="sm"
                      onClick={submitPractice}
                      disabled={!selectedOption || submittingPractice}
                    >
                      {submittingPractice ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Evaluating...</> : "Submit Answer"}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => loadPractice()}>
                      Next Practice Challenge →
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">Click below to generate a focused practice challenge.</p>
              <Button size="sm" onClick={() => loadPractice()}>Generate Challenge</Button>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB 4: ASK AI COACH CHAT ─────────────────────────────────────── */}
        <TabsContent value="chat" className="space-y-4 mt-6">
          <Card className="border-[var(--color-border-primary)] shadow-sm flex flex-col h-[520px]">
            <CardHeader className="py-3 px-4 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="text-xs font-semibold">Career-Aware AI Skill Coach</span>
                </div>
                <Badge variant="outline" className="text-[10px]">Backend Developer Focus</Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] text-[var(--color-foreground)]"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3 text-xs flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />
                    <span>Analyzing technical context...</span>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-[var(--color-surface-secondary)] border-t border-[var(--color-border-primary)] flex gap-2 overflow-x-auto">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={chatLoading}
                  className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-[var(--color-surface-card)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent-hover)] border border-[var(--color-border-primary)] transition-all shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-[var(--color-border-primary)] flex gap-2 bg-[var(--color-surface-card)]">
              <input
                type="text"
                placeholder="Ask coach (e.g. 'Explain asynchronous streams simply' or 'Test me on error handling')..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                className="flex-1 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <Button
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || chatLoading}
                className="h-9 px-3"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}