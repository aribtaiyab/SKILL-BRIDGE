"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Compass,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Clock,
  ExternalLink,
  History,
  Bot,
  HelpCircle,
  Briefcase,
  ChevronRight,
  Check,
  Zap,
  Target,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { CareerNavigatorResponse } from "@/lib/career-navigator/types"
import { CareerComparisonItem } from "@/lib/career-navigator/comparison-engine"
import { useDemo } from "@/lib/demo/demo-context"

export default function CareerNavigatorPage() {
  const { isDemo, student } = useDemo()
  const [query, setQuery] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<CareerNavigatorResponse['data'] | null>(null)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load decision history on mount
  useEffect(() => {
    async function loadHistory() {
      if (isDemo) {
        setHistoryItems([
          {
            id: 'demo-h1',
            question: 'Should I choose Full Stack or AI/ML?',
            recommended_career_name: 'Full Stack Engineer',
            confidence: 84,
            created_at: '2026-09-01T10:00:00Z',
          },
          {
            id: 'demo-h2',
            question: 'Backend Developer vs Frontend Developer',
            recommended_career_name: 'Backend Developer',
            confidence: 80,
            created_at: '2026-08-25T14:30:00Z',
          },
        ])
        return
      }

      try {
        const json = await apiClient<{ success: boolean; data: any[] }>('/api/career-navigator/history')
        if (json.success && Array.isArray(json.data)) {
          setHistoryItems(json.data)
        }
      } catch (err) {
        console.warn('Could not load career navigator history:', err)
      }
    }
    loadHistory()
  }, [isDemo])

  // Core Analyze Function
  const handleAnalyze = async (searchQuery: string) => {
    const q = searchQuery.trim()
    if (!q || analyzing) return

    setAnalyzing(true)
    setErrorMsg(null)
    setQuery(q)

    const updatedHistory = [...conversation, { role: 'user' as const, content: q }]
    setConversation(updatedHistory)

    try {
      const response = await apiClient<CareerNavigatorResponse>('/api/career-navigator/analyze', {
        method: 'POST',
        body: JSON.stringify({
          message: q,
          query: q,
          history: updatedHistory.slice(-4),
        }),
      })

      if (response.success && response.data) {
        if (
          response.data.headline?.toLowerCase().includes('temporarily unavailable') ||
          response.data.summary?.toLowerCase().includes('temporarily unavailable')
        ) {
          setErrorMsg('Analysis temporarily unavailable — please try again')
          setResult(null)
          return
        }

        setResult(response.data)
        setConversation(prev => [
          ...prev,
          { role: 'assistant' as const, content: response.data.summary },
        ])
        // Add to history items if not present
        setHistoryItems(prev => [
          {
            id: `decision-${Date.now()}`,
            question: q,
            recommended_career_name: response.data.recommendation.careerName,
            confidence: response.data.recommendation.confidence,
            created_at: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ])
      } else {
        throw new Error(response.error || 'Analysis temporarily unavailable — please try again')
      }
    } catch (err: any) {
      console.error('Career Navigator error:', err)
      setErrorMsg('Analysis temporarily unavailable — please try again')
      setResult(null)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[var(--color-accent)] text-white shadow-xs">
              <Compass className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Career Navigator</h1>
                <Badge className="bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border-[var(--color-border-primary)] text-xs font-semibold px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3 mr-1 inline text-[var(--color-accent)]" /> Career Decision Engine
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Compare careers. Understand your fit. Decide your next move.
              </p>
            </div>
          </div>
        </div>

        {historyItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="h-9 px-3.5 rounded-xl border-slate-200 bg-white/90 text-slate-700 font-semibold shadow-xs hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)] hover:-translate-y-0.5 transition-all self-start sm:self-auto"
          >
            <History className="h-3.5 w-3.5 mr-1.5 text-[var(--color-accent)]" />
            Previous Decisions ({historyItems.length})
          </Button>
        )}
      </div>

      {/* ─── HERO & ASK BOX ────────────────────────────────────────────────── */}
      <div className="relative z-10 overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-white/95 p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-6">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-3 py-0.5 rounded-full inline-block mb-2">
            Deterministic Match + Real Market Intelligence + AI Reasoning
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Don't guess your career. Compare your paths.
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Ask any question about your target career tracks, switch feasibility, skill choices, or real market demand.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { label: "Compare Careers", prompt: "Web Development or AI/ML?" },
            { label: "Find My Best Fit", prompt: "Which career fits my current skills?" },
            { label: "Plan a Career Switch", prompt: "Can I switch from frontend to AI?" },
            { label: "Market Demand", prompt: "Which career has better market demand?" },
            { label: "Skill Choice", prompt: "Should I learn Java or Python?" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setQuery(action.prompt)
                handleAnalyze(action.prompt)
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-slate-200/80 bg-slate-50/80 text-slate-700 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-foreground)] transition-all shadow-2xs"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAnalyze(query)
          }}
          className="relative flex items-center"
        >
          <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your career (e.g., 'Web Development vs AI?', 'Which career fits me?')..."
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all shadow-xs"
          />
          <Button
            type="submit"
            disabled={!query.trim() || analyzing}
            className="absolute right-2 h-9 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-sm transition-all"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
          </Button>
        </form>

        {/* Suggested Prompts below input */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold text-slate-700">Try asking:</span>
          {["AI or Web Development?", "Full Stack or Data Science?", "Can I switch to AI?", "Should I learn Java or Python?"].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setQuery(sample)
                handleAnalyze(sample)
              }}
              className="text-[var(--color-accent)] hover:text-[var(--color-foreground)] hover:underline font-medium"
            >
              "{sample}"
            </button>
          ))}
        </div>
      </div>

      {/* ─── HISTORY DRAWER / MODAL ────────────────────────────────────────── */}
      {historyOpen && (
        <div className="relative z-10 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="h-4 w-4 text-[var(--color-accent)]" /> Recent Career Decisions
            </h3>
            <button
              onClick={() => setHistoryOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              Close
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setQuery(item.question)
                  handleAnalyze(item.question)
                  setHistoryOpen(false)
                }}
                className="cursor-pointer p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/50 hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-accent)]/40 transition-all"
              >
                <span className="text-xs font-bold text-slate-900 block line-clamp-1">"{item.question}"</span>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                  <span>Recommended: <strong className="text-[var(--color-accent-hover)]">{item.recommended_career_name}</strong></span>
                  <span>{item.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── LOADING STATE ─────────────────────────────────────────────────── */}
      {analyzing && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-12 text-center backdrop-blur-xl shadow-sm space-y-4 animate-in fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] shadow-sm">
            <Compass className="h-7 w-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Analyzing your career path...</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Synthesizing your assessed skills, career requirements, and live market intelligence.
            </p>
          </div>
        </div>
      )}

      {/* ─── ERROR STATE ───────────────────────────────────────────────────── */}
      {errorMsg && !analyzing && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-xs font-medium text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {query && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAnalyze(query)}
              className="h-8 px-3 rounded-xl border-amber-300 text-amber-900 hover:bg-amber-100 text-xs shrink-0 self-start sm:self-auto"
            >
              Try again
            </Button>
          )}
        </div>
      )}

      {/* ─── RESULTS CONTAINER ─────────────────────────────────────────────── */}
      {result && !analyzing && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Recommendation Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-gradient-to-br from-[#FAF6F3] via-white to-[#F2F7F9] p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-3 py-0.5 rounded-full">
                  <Target className="h-3 w-3" /> Career Recommendation
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {result.headline}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed font-medium max-w-2xl">
                  {result.summary}
                </p>
              </div>

              {result.recommendation.confidence > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-[var(--color-border-primary)] shrink-0 text-center sm:text-right shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Match Confidence</span>
                  <div className="text-3xl font-black text-[var(--color-accent)]">{result.recommendation.confidence}%</div>
                  <span className="text-[10px] font-semibold text-slate-500">Based on authenticated ledger</span>
                </div>
              )}
            </div>

            {result.recommendation.reason && (
              <div className="p-4 rounded-2xl bg-white/80 border border-[var(--color-border-primary)] text-xs text-slate-700 font-medium">
                <strong className="text-slate-900 font-bold block mb-1">Recommendation Breakdown:</strong>
                {result.recommendation.reason}
              </div>
            )}
          </div>

          {/* ─── SIDE-BY-SIDE COMPARISON GRID ──────────────────────────────── */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Side-by-Side Path Comparison</h3>
              <p className="text-xs text-slate-500">
                Authoritative benchmark compliance vs live industry market outlook
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {result.comparison.map((item, idx) => {
                const isWinner = item.careerSlug === result.recommendation.careerSlug
                return (
                  <div
                    key={item.careerSlug}
                    className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 backdrop-blur-xl ${
                      isWinner
                        ? 'border-[var(--color-accent)] bg-white ring-2 ring-[var(--color-accent)]/20 shadow-xs'
                        : 'border-slate-200/80 bg-white/90 shadow-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          {isWinner && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-2 py-0.5 rounded-full mb-1 inline-block">
                              Best Fit For You
                            </span>
                          )}
                          <h4 className="text-lg font-black text-slate-900">{item.careerName}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-900 font-mono">{item.fitScore}%</span>
                          <span className="text-[10px] font-semibold text-slate-400 block">Your Fit</span>
                        </div>
                      </div>

              {/* Metric Breakdown Table */}
                      <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Skill Advantage:</span>
                          <strong className="font-bold text-slate-700">
                            {Array.isArray(item.skillAdvantage) ? item.skillAdvantage[0] : (item.skillAdvantage || 'Standard')}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Skill Deficit / Gap:</span>
                          <strong className="font-bold text-slate-700">
                            {Array.isArray((item as any).missingSkills) ? `${(item as any).missingSkills.length} areas` : (item.gapLevel || 'Targeted')}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Market Outlook:</span>
                          <strong className="text-[var(--color-accent-hover)] font-bold">{item.marketOutlook}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transition Difficulty:</span>
                          <strong className="font-bold text-slate-700">
                            {item.transitionDifficulty}
                          </strong>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Salary Range (Median):</span>
                          <strong className="text-slate-900 font-bold">
                            {item.marketData?.salaryRange?.median ? String(item.marketData.salaryRange.median) : 'Competitive'}
                          </strong>
                        </div>
                      </div>

                      {/* Market Note */}
                      {item.marketData?.summary && (
                        <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                          "{item.marketData.summary}"
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100">
                      <Link href="/student/career">
                        <Button
                          variant={isWinner ? "default" : "outline"}
                          size="sm"
                          className="w-full text-xs font-semibold rounded-xl"
                        >
                          Select as Career Target →
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── WHY THIS RESULT & WHAT'S MISSING ─────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Why This Result? */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Why This Result?
              </h4>
              <ul className="space-y-2.5">
                {(result.why || []).map((reason, idx) => (
                  <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What You Are Missing */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" /> What You Are Missing
              </h4>
              <div className="space-y-3">
                {((result.gaps && result.gaps.length > 0) ? result.gaps : (result.comparison || []).map(c => ({ careerName: c.careerName, skills: ((c as any).missingSkills || []) as string[] }))).map((item: { careerName: string; skills: string[] }) => (
                  <div key={item.careerName} className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
                    <span className="text-xs font-bold text-amber-950 block">{item.careerName}:</span>
                    {item.skills && item.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.skills.map((s: string, idx: number) => (
                          <span key={idx} className="text-[11px] font-semibold bg-white text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-700 font-medium">All core benchmarks satisfied!</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── YOUR NEXT MOVE & ACTION PLAN ─────────────────────────────── */}
          <div className="rounded-3xl border border-[var(--color-border-primary)] bg-gradient-to-r from-[#FAF6F3] via-white to-[#F2F7F9] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] block mb-1">
                  Actionable Strategy
                </span>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Your Next Move</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Follow these verified milestones to eliminate remaining gaps and qualify for live opportunities.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Link href="/student/assessment">
                  <Button className="h-10 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-sm">
                    Build My Plan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/student/opportunities">
                  <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-semibold">
                    Matching Opportunities ({isDemo ? 4 : 'Active'})
                  </Button>
                </Link>
              </div>
            </div>

            {/* Milestones */}
            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              {((result.bridgeMilestones && result.bridgeMilestones.length > 0) ? result.bridgeMilestones : (result.nextSteps || [])).slice(0, 3).map((step, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-[var(--color-border-primary)] shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2 py-0.5 rounded-md">
                    Phase {idx + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-snug pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── MARKET DATA CITATION ───────────────────────────────────────── */}
          {result.marketSummary && (
            <div className="text-center text-[11px] text-slate-400 max-w-xl mx-auto space-y-1">
              <p>
                Market intelligence sources: <span className="text-slate-600 font-medium">{result.marketSummary.source}</span> ({result.marketSummary.freshness}).
              </p>
              <p className="italic">
                Decision framework combines 35% Student Skill Fit, 25% Requirement Compliance, 20% Market Outlook, 10% Preferences, and 10% Transition Ease.
              </p>
            </div>
          )}

          {/* ─── FOLLOW-UP PROMPT SUGGESTIONS ──────────────────────────────── */}
          {result.followUpQuestion && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2.5">
              <span className="text-xs font-bold text-slate-900 block">{result.followUpQuestion.questionText}</span>
              <div className="flex justify-center gap-2 flex-wrap">
                {result.followUpQuestion.options.map((opt) => (
                  <Button
                    key={opt}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setQuery(opt)
                      handleAnalyze(opt)
                    }}
                    className="rounded-xl text-xs"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
