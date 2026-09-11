"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Compass,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Code,
  Layers,
  TrendingUp,
  HelpCircle,
  RotateCcw,
  Check,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  Terminal,
} from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ComparisonOption {
  option: string
  learningCurve?: string
  marketDemand?: string
  pros: string[]
  cons: string[]
  bestFor?: string
}

interface RoadmapStage {
  stage: string
  title: string
  description?: string
  topics: string[]
  projects: string[]
}

interface ContextSection {
  title: string
  content: string
}

interface StructuredCareerResponse {
  question: string
  headline: string
  answer: string
  recommendation: string
  intent: string
  sections: ContextSection[]
  comparison: ComparisonOption[]
  roadmap: RoadmapStage[]
  next_steps: string[]
  what_to_avoid: string[]
  follow_up_questions: string[]
}

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  structuredData?: StructuredCareerResponse
}

function toStringArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (typeof item === 'number' || typeof item === 'boolean') return String(item)
        if (typeof item === 'object' && item !== null) {
          const record = item as Record<string, unknown>
          const candidate = record.text || record.name || record.title || record.value || record.point || record.desc
          if (typeof candidate === 'string') return candidate.trim()
          return JSON.stringify(item)
        }
        return ''
      })
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
  }

  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (!trimmed) return []
    if (trimmed.includes('\n')) {
      return trimmed
        .split('\n')
        .map(line => line.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(line => line.length > 0)
    }
    if (trimmed.includes(',') && !trimmed.includes('{')) {
      const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean)
      if (parts.length > 1) return parts
    }
    return [trimmed]
  }

  if (typeof val === 'object' && val !== null) {
    const values = Object.values(val as Record<string, unknown>)
    return values
      .map(v => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean)
  }

  return []
}

function normalizeCareerData(raw: unknown, queryText = ''): StructuredCareerResponse {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const rawSections = Array.isArray(obj.sections) ? obj.sections : []
  const sections: ContextSection[] = rawSections
    .filter((sec): sec is Record<string, unknown> => typeof sec === 'object' && sec !== null)
    .map((sec) => ({
      title: typeof sec.title === 'string' ? sec.title.trim() : 'Overview',
      content: typeof sec.content === 'string' ? sec.content.trim() : (typeof sec.description === 'string' ? sec.description.trim() : ''),
    }))
    .filter(sec => sec.title.length > 0 || sec.content.length > 0)

  const rawComparison = Array.isArray(obj.comparison)
    ? obj.comparison
    : Array.isArray(obj.options)
    ? obj.options
    : Array.isArray(obj.comparisons)
    ? obj.comparisons
    : []

  const comparison: ComparisonOption[] = rawComparison
    .filter((opt): opt is Record<string, unknown> => typeof opt === 'object' && opt !== null)
    .map((opt) => {
      const optName = typeof opt.option === 'string'
        ? opt.option.trim()
        : typeof opt.name === 'string'
        ? opt.name.trim()
        : typeof opt.title === 'string'
        ? opt.title.trim()
        : 'Option'

      return {
        option: optName,
        learningCurve: typeof opt.learningCurve === 'string' ? opt.learningCurve.trim() : undefined,
        marketDemand: typeof opt.marketDemand === 'string' ? opt.marketDemand.trim() : undefined,
        pros: toStringArray(opt.pros),
        cons: toStringArray(opt.cons),
        bestFor: typeof opt.bestFor === 'string' ? opt.bestFor.trim() : (typeof opt.target === 'string' ? opt.target.trim() : undefined),
      }
    })

  const rawRoadmap = Array.isArray(obj.roadmap)
    ? obj.roadmap
    : Array.isArray(obj.stages)
    ? obj.stages
    : Array.isArray(obj.steps)
    ? obj.steps
    : []

  const roadmap: RoadmapStage[] = rawRoadmap
    .filter((stage): stage is Record<string, unknown> => typeof stage === 'object' && stage !== null)
    .map((stg, idx) => {
      const stageName = typeof stg.stage === 'string'
        ? stg.stage.trim()
        : typeof stg.phase === 'string'
        ? stg.phase.trim()
        : `Stage ${idx + 1}`

      const stageTitle = typeof stg.title === 'string'
        ? stg.title.trim()
        : typeof stg.name === 'string'
        ? stg.name.trim()
        : 'Milestone'

      return {
        stage: stageName,
        title: stageTitle,
        description: typeof stg.description === 'string' ? stg.description.trim() : undefined,
        topics: toStringArray(stg.topics || stg.skills || stg.concepts),
        projects: toStringArray(stg.projects || stg.practical || stg.tasks),
      }
    })

  const headline = typeof obj.headline === 'string' && obj.headline.trim().length > 0
    ? obj.headline.trim()
    : typeof obj.answer === 'string' && obj.answer.trim().length > 0
    ? obj.answer.trim()
    : 'Career Guidance Overview'

  const answer = typeof obj.answer === 'string' && obj.answer.trim().length > 0
    ? obj.answer.trim()
    : headline

  const recommendation = typeof obj.recommendation === 'string'
    ? obj.recommendation.trim()
    : ''

  const intent = typeof obj.intent === 'string' && obj.intent.trim().length > 0
    ? obj.intent.trim()
    : 'general'

  return {
    question: typeof obj.question === 'string' && obj.question.trim().length > 0 ? obj.question.trim() : queryText,
    headline,
    answer,
    recommendation,
    intent,
    sections,
    comparison,
    roadmap,
    next_steps: toStringArray(obj.next_steps || obj.nextSteps || obj.action_items),
    what_to_avoid: toStringArray(obj.what_to_avoid || obj.whatToAvoid || obj.pitfalls),
    follow_up_questions: toStringArray(obj.follow_up_questions || obj.followUpQuestions || obj.suggested_questions),
  }
}

export default function CareerNavigatorPage() {
  const [query, setQuery] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const quickPrompts = [
    "What should I learn after HTML, CSS & JavaScript?",
    "AI vs Frontend: Which should I choose?",
    "Roadmap to become a Backend Developer",
    "I know Python. What should I learn next?",
    "Java or Python for 2026?",
    "DSA or Web Development for placements?",
    "Can I switch from frontend to AI?",
    "How do I get my first tech internship?",
  ]

  const handleAsk = async (text: string) => {
    const q = text.trim()
    if (!q || analyzing) return

    setAnalyzing(true)
    setErrorMsg(null)
    setQuery(q)

    // Append user message immediately
    const updatedHistory: ConversationTurn[] = [
      ...conversation,
      { role: 'user', content: q },
    ]
    setConversation(updatedHistory)

    try {
      // Build lightweight payload with prior turns
      const historyPayload = conversation.map(c => ({
        role: c.role,
        content: c.role === 'user' ? c.content : (c.structuredData ? JSON.stringify(c.structuredData) : c.content),
      }))

      const res = await fetch('/api/career-navigator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          conversation: historyPayload,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || "Career Navigator couldn't process that request right now. Please try again.")
      }

      const structured: StructuredCareerResponse = normalizeCareerData(data.data, q)

      // Append AI response turn
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: structured.headline || structured.recommendation || 'Career analysis completed.',
          structuredData: structured,
        },
      ])
      setQuery("")
    } catch (err: any) {
      console.error("Career Navigator error:", err)
      setErrorMsg(err.message || "Failed to connect to Groq AI. Please check your connection and try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    setConversation([])
    setQuery("")
    setErrorMsg(null)
  }

  const latestTurn = conversation.slice().reverse().find(t => t.role === 'assistant')
  const activeResult = latestTurn?.structuredData

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold tracking-tight">
            <Compass className="h-3.5 w-3.5 text-emerald-600" />
            <span>AI Career Guidance • Groq Powered</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Career Navigator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Ask anything about your career. Get practical advice, compare paths, explore tech stacks, and build your next roadmap with AI.
          </p>
        </div>

        {conversation.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-900 border-slate-200 shrink-0 self-start sm:self-center cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            New Conversation
          </Button>
        )}
      </div>

      {/* Input Section */}
      <Card className="border border-slate-200/90 shadow-[0_12px_35px_-12px_rgba(15,23,42,0.08)] bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-2 sm:p-2.5 flex items-center gap-2">
          <div className="pl-3 text-slate-400">
            <Compass className="h-5 w-5 text-emerald-600 shrink-0" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder="Ask any career question (e.g. 'What should I learn after Python?', 'AI vs Web Dev?', 'Roadmap for Backend')..."
            className="flex-1 h-12 px-2 sm:px-3 bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm outline-none"
            disabled={analyzing}
          />
          <Button
            onClick={() => handleAsk(query)}
            disabled={analyzing || !query.trim()}
            className="h-11 px-5 sm:px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer shrink-0"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <span>Ask Navigator</span>
                <Send className="h-3.5 w-3.5 ml-1.5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Questions Chips (Visible when no conversation yet) */}
      {conversation.length === 0 && !analyzing && (
        <div className="space-y-3 pt-2">
          <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            Suggested Career Questions
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(prompt)}
                className="px-3.5 py-2 rounded-2xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all shadow-xs hover:shadow-sm cursor-pointer text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="font-semibold">{errorMsg}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => query && handleAsk(query)}
              className="h-8 text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {analyzing && (
        <Card className="border border-slate-200 bg-white/90 shadow-sm rounded-3xl p-8 text-center space-y-4 animate-in fade-in duration-300">
          <div className="h-10 w-10 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center animate-pulse">
            <Sparkles className="h-5 w-5 animate-spin text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Thinking through your career question with Groq AI...</h3>
            <p className="text-xs text-slate-500">Evaluating pathways, analyzing real-world tech requirements, and structuring your actionable next steps.</p>
          </div>
        </Card>
      )}

      {/* Active AI Structured Result */}
      {activeResult && !analyzing && (
        <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-500">
          
          {/* Top Verdict & Direct Answer */}
          <Card className="border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/20 to-white shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    AI Mentor Verdict • {activeResult.intent.toUpperCase()}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold text-slate-500 border-slate-200">
                  Question: &quot;{activeResult.question}&quot;
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
                {activeResult.headline}
              </CardTitle>
            </CardHeader>

            {activeResult.recommendation && (
              <CardContent className="pt-4 pb-5">
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900">Recommended Path</span>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-950 leading-relaxed">
                      {activeResult.recommendation}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Structured Context Sections */}
          {activeResult.sections && activeResult.sections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeResult.sections.map((sec, idx) => (
                <Card key={idx} className="border border-slate-200/80 bg-white shadow-xs rounded-3xl overflow-hidden flex flex-col">
                  <CardHeader className="pb-2 bg-slate-50/60 border-b border-slate-100">
                    <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                      {sec.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-ul:my-2 prose-li:my-0.5">
                    <ReactMarkdown>{sec.content}</ReactMarkdown>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Comparison Matrix (When comparing options) */}
          {activeResult.comparison && activeResult.comparison.length > 0 && (
            <Card className="border border-slate-200/80 bg-white shadow-xs rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <CardTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  Direct Path Comparison
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Side-by-side trade-offs, learning curve, and market relevance to help you decide.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeResult.comparison.map((opt, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all space-y-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                        <span className="text-base font-black text-slate-900">{opt.option}</span>
                        {opt.bestFor && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">
                            Best for: {opt.bestFor}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {opt.learningCurve && (
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Learning Curve</span>
                            <span className="font-semibold text-slate-800">{opt.learningCurve}</span>
                          </div>
                        )}
                        {opt.marketDemand && (
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Market Demand</span>
                            <span className="font-semibold text-slate-800">{opt.marketDemand}</span>
                          </div>
                        )}
                      </div>

                      {Array.isArray(opt.pros) && opt.pros.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-600" /> Key Strengths
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
                            {opt.pros.map((p, pIdx) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(opt.cons) && opt.cons.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-amber-600" /> Challenges / Trade-offs
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
                            {opt.cons.map((c, cIdx) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interactive Step-by-Step Roadmap (When roadmap requested) */}
          {Array.isArray(activeResult.roadmap) && activeResult.roadmap.length > 0 && (
            <Card className="border border-slate-200/80 bg-white shadow-xs rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <CardTitle className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Practical Progression Roadmap
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Follow this structured sequence to build verified competency without getting overwhelmed.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {activeResult.roadmap.map((stage, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex h-9 w-9 rounded-xl bg-emerald-600 text-white font-black text-xs items-center justify-center shrink-0 shadow-xs">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            {stage.stage}
                          </span>
                          <span className="text-sm font-black text-slate-900">• {stage.title}</span>
                        </div>
                        {stage.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                        )}
                      </div>

                      {Array.isArray(stage.topics) && stage.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Topics:</span>
                          {stage.topics.map((top, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60"
                            >
                              {top}
                            </span>
                          ))}
                        </div>
                      )}

                      {Array.isArray(stage.projects) && stage.projects.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1 mr-1">
                            <Terminal className="h-3 w-3" /> Project:
                          </span>
                          {stage.projects.map((proj, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200"
                            >
                              {proj}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bottom Grid: What to Avoid & Immediate Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* What to Avoid */}
            {Array.isArray(activeResult.what_to_avoid) && activeResult.what_to_avoid.length > 0 && (
              <Card className="border border-amber-200/70 bg-amber-50/20 shadow-xs rounded-3xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-amber-100">
                  <CardTitle className="text-sm sm:text-base font-bold text-amber-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    Pitfalls to Avoid
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {activeResult.what_to_avoid.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-amber-950 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Actionable Next Steps */}
            {Array.isArray(activeResult.next_steps) && activeResult.next_steps.length > 0 && (
              <Card className="border border-emerald-200/70 bg-emerald-50/20 shadow-xs rounded-3xl overflow-hidden">
                <CardHeader className="pb-2 border-b border-emerald-100">
                  <CardTitle className="text-sm sm:text-base font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Your Actionable Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {activeResult.next_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-emerald-950 font-semibold">
                      <span className="flex h-5 w-5 rounded-full bg-emerald-600 text-white items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Clickable Follow-up Questions */}
          {Array.isArray(activeResult.follow_up_questions) && activeResult.follow_up_questions.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> Follow-up Questions
              </div>
              <div className="flex flex-wrap gap-2">
                {activeResult.follow_up_questions.map((fq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(fq)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>{fq}</span>
                    <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
