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
  BookOpen,
  Calendar,
  ShieldCheck,
  Layers,
  Award,
  BarChart3,
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
        timeoutMs: 40000,
        body: JSON.stringify({
          message: q,
          query: q,
          history: updatedHistory.slice(-4),
        }),
      })

      if (response.success && response.data) {
        setResult(response.data)
        setConversation(prev => [
          ...prev,
          { role: 'assistant' as const, content: response.data.directAnswer || response.data.summary },
        ])
        // Add to history items if not present
        setHistoryItems(prev => [
          {
            id: `decision-${Date.now()}`,
            question: q,
            recommended_career_name: response.data.recommendation?.careerName || response.data.headline,
            confidence: response.data.recommendation?.confidence || 75,
            created_at: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ])
      } else {
        throw new Error(response.error || 'Career Navigator could not analyze this question. Please try again.')
      }
    } catch (err: any) {
      console.error('Career Navigator error:', err)
      setErrorMsg(err.message || 'Analysis temporarily unavailable — please try again')
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
            { label: "AI or Web Development?", prompt: "AI or Web Development?" },
            { label: "Which career fits me?", prompt: "Which career fits me?" },
            { label: "Can I switch to AI?", prompt: "Can I switch to AI?" },
            { label: "What should I learn next?", prompt: "What should I learn next?" },
            { label: "Java or Python?", prompt: "Should I learn Java or Python?" },
            { label: "DSA or Development?", prompt: "Should I focus on DSA or Web Development?" },
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
          <span className="font-semibold text-slate-700">Quick questions:</span>
          {[
            "AI or Web Development?",
            "Which career fits me?",
            "Can I switch to AI?",
            "What should I learn next?",
            "Java or Python?",
            "DSA or Development?"
          ].map((sample) => (
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
          {/* AI Fallback Notice Banner if Gemini unavailable / quota exhausted */}
          {result.isFromFallback && (
            <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 text-xs font-medium text-amber-900 flex items-center gap-3 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-bold text-amber-950 block">SkillBridge Deterministic Intelligence Active</strong>
                <span>{result.fallbackNotice || 'AI analysis is currently operating in deterministic mode — displaying SkillBridge benchmark standards and profile intelligence.'}</span>
              </div>
            </div>
          )}

          {/* ─── 1. DIRECT ANSWER ─────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-gradient-to-br from-[#FAF6F3] via-white to-[#F2F7F9] p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-3 py-0.5 rounded-full">
                    <Sparkles className="h-3 w-3" /> 1. Direct Answer
                  </span>
                  {result.extractedQuery?.intent && (
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Intent: {result.extractedQuery.intent}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {result.headline}
                </h3>
                <div className="p-4 rounded-2xl bg-white/90 border border-[var(--color-border-primary)] text-sm sm:text-base font-semibold text-slate-800 leading-relaxed shadow-xs">
                  {result.directAnswer || result.summary}
                </div>
              </div>

              {result.recommendation?.confidence !== undefined && (
                <div className="p-4 rounded-2xl bg-white border border-[var(--color-border-primary)] shrink-0 text-center sm:text-right shadow-xs min-w-[130px]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Confidence</span>
                  <div className="text-3xl font-black text-[var(--color-accent)]">{result.recommendation.confidence}%</div>
                  <span className="text-[10px] font-semibold text-slate-500">SkillBridge Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── 2. WHY THIS IS BETTER FOR YOU & 4. YOUR CURRENT FIT ───────────── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 2. Why This Is Better For You */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <h4 className="text-base font-bold text-slate-900">2. Why This Is Better For You</h4>
              </div>
              <ul className="space-y-2.5">
                {(result.why && result.why.length > 0 ? result.why : [result.summary]).map((reason, idx) => (
                  <li key={idx} className="text-xs text-slate-700 leading-relaxed flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/60 border border-slate-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <span className="font-medium">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Your Current Fit */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-border-primary)]">
                    <Target className="h-4 w-4" />
                  </span>
                  <h4 className="text-base font-bold text-slate-900">4. Your Current Fit</h4>
                </div>
                {result.currentFit && (
                  <Badge className="bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border-[var(--color-border-primary)] text-xs font-bold">
                    {result.currentFit.fitLevel}
                  </Badge>
                )}
              </div>

              {result.currentFit ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Target Career</span>
                      <strong className="text-sm font-black text-slate-900">{result.currentFit.targetCareer}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Readiness Score</span>
                      <strong className="text-xl font-black text-[var(--color-accent)] font-mono">{result.currentFit.score}%</strong>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {result.currentFit.summary}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Profile fit calculation active for your configured career targets.</p>
              )}
            </div>
          </div>

          {/* ─── 3. MARKET OUTLOOK ────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
                <TrendingUp className="h-4 w-4" />
              </span>
              <h4 className="text-base font-bold text-slate-900">3. Market Outlook</h4>
            </div>

            {result.marketOutlook && result.marketOutlook.available && !result.marketOutlook.demand?.includes('unavailable') ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Demand Level</span>
                  <strong className="text-slate-900 font-bold text-sm">{result.marketOutlook.demand}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Projected Growth</span>
                  <strong className="text-slate-900 font-bold text-sm">{result.marketOutlook.growth}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Opportunity Volume</span>
                  <strong className="text-slate-900 font-bold text-sm">{result.marketOutlook.opportunityVolume || 'Active'}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Industry Relevance</span>
                  <strong className="text-slate-900 font-bold text-sm">{result.marketOutlook.industryRelevance || 'High'}</strong>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  <span>Market Data Availability Notice</span>
                </div>
                <p className="italic">
                  {result.marketOutlook?.note || 'Market data unavailable for this specific comparison request. General technical recommendations are derived from verified engineering roadmaps and career target benchmarks.'}
                </p>
              </div>
            )}
          </div>

          {/* ─── OPTIONAL: SIDE-BY-SIDE PATH COMPARISON (IF MULTI-TRACK) ────── */}
          {result.comparison && result.comparison.length > 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Side-by-Side Path Comparison</h4>
                <p className="text-xs text-slate-500">Benchmark compliance and fit comparison</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.comparison.map((item) => {
                  const isWinner = item.careerSlug === result.recommendation?.careerSlug
                  return (
                    <div
                      key={item.careerSlug}
                      className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                        isWinner
                          ? 'border-[var(--color-accent)] bg-white ring-2 ring-[var(--color-accent)]/20 shadow-xs'
                          : 'border-slate-200/80 bg-white/90 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            {isWinner && (
                              <span className="text-[10px] font-bold uppercase text-[var(--color-accent-hover)] bg-[var(--color-accent-light)] px-2 py-0.5 rounded-full mb-1 inline-block">
                                Best Fit
                              </span>
                            )}
                            <h5 className="text-base font-bold text-slate-900">{item.careerName}</h5>
                          </div>
                          <span className="text-xl font-black text-slate-900 font-mono">{item.fitScore}%</span>
                        </div>
                        <div className="text-xs space-y-1.5 text-slate-600">
                          <div className="flex justify-between">
                            <span>Market Outlook:</span>
                            <strong className="text-slate-800">{item.marketOutlook}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Difficulty:</span>
                            <strong className="text-slate-800">{item.transitionDifficulty}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100">
                        <Link href="/student/career">
                          <Button variant={isWinner ? "default" : "outline"} size="sm" className="w-full text-xs rounded-xl">
                            Select Career →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── 5. SKILLS YOU ALREADY HAVE & 6. SKILLS YOU ARE MISSING ───────── */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 5. Skills You Already Have */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h4 className="text-base font-bold text-slate-900">5. Skills You Already Have</h4>
              </div>

              {result.skillsHave && result.skillsHave.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.skillsHave.map((skill, idx) => (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        skill.isVerified
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {skill.isVerified ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                      )}
                      <span>{skill.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({skill.isVerified ? `Verified Lvl ${skill.level}` : `Self-Declared Lvl ${skill.level}`})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                  No skills declared or assessed yet on your profile. Declare skills in Career Target to calibrate your fit.
                </div>
              )}
            </div>

            {/* 6. Skills You Are Missing */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <h4 className="text-base font-bold text-slate-900">6. Skills You Are Missing</h4>
              </div>

              {result.skillsMissing && result.skillsMissing.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.skillsMissing.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50/70 text-amber-900 border border-amber-200/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  No critical missing benchmarks identified for your active track!
                </div>
              )}
            </div>
          </div>

          {/* ─── 7. SKILL GAPS ─────────────────────────────────────────────────── */}
          {result.skillGaps && result.skillGaps.length > 0 && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                  <Layers className="h-4 w-4" />
                </span>
                <h4 className="text-base font-bold text-slate-900">7. Skill Gaps Diagnostic</h4>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.skillGaps.map((gap, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <strong className="font-bold text-slate-900">{gap.skillName}</strong>
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        -{gap.deficit} Level Gap
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Current: Level {gap.currentLevel}</span>
                      <span>Target: Level {gap.requiredLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── 8. WHAT YOU SHOULD LEARN ──────────────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <BookOpen className="h-4 w-4" />
              </span>
              <h4 className="text-base font-bold text-slate-900">8. What You Should Learn</h4>
            </div>

            <div className="space-y-2.5">
              {(result.whatToLearn && result.whatToLearn.length > 0
                ? result.whatToLearn
                : result.nextSteps || ['Explore core benchmarks', 'Take skill assessment']
              ).map((step, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3 text-xs">
                  <span className="h-6 w-6 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 pt-0.5 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── 9. RECOMMENDED ROADMAP ────────────────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-border-primary)]">
                  <Calendar className="h-4 w-4" />
                </span>
                <h4 className="text-base font-bold text-slate-900">9. Recommended Roadmap</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">7 / 30 / 60 / 90 Days</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { period: 'Day 7', title: 'Diagnostic', content: result.roadmap?.day7 || 'Complete initial diagnostic assessments.' },
                { period: 'Day 30', title: 'Core Foundations', content: result.roadmap?.day30 || 'Close top missing benchmark with project.' },
                { period: 'Day 60', title: 'Verification', content: result.roadmap?.day60 || 'Earn Level 1/2 verification badge.' },
                { period: 'Day 90', title: 'Opportunity Ready', content: result.roadmap?.day90 || 'Qualify for matching partner opportunities.' },
              ].map((phase, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2 py-0.5 rounded-md">
                      {phase.period}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">{phase.title}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed pt-1">
                    {phase.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── 10. FINAL RECOMMENDATION & ACTIONS ─────────────────────────────── */}
          <div className="rounded-3xl border border-[var(--color-border-primary)] bg-gradient-to-r from-[#FAF6F3] via-white to-[#F2F7F9] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent-hover)] block">
                  10. Final Recommendation
                </span>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Your Next Strategic Move</h4>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed max-w-2xl pt-1">
                  {result.finalRecommendation || result.recommendation?.reason || result.directAnswer}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <Link href="/student/career">
                  <Button className="h-10 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs shadow-sm w-full sm:w-auto">
                    Go to Career Target <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/student/career?action=assess">
                  <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-semibold w-full sm:w-auto">
                    Take Skill Assessments
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ─── MARKET DATA CITATION ───────────────────────────────────────── */}
          {result.marketSummary && (
            <div className="text-center text-[11px] text-slate-400 max-w-xl mx-auto space-y-1">
              <p>
                Market intelligence sources: <span className="text-slate-600 font-medium">{result.marketSummary.source}</span> ({result.marketSummary.freshness}).
              </p>
              <p className="italic">
                Decision framework combines verified student skills, requirement benchmarks, and current market demand.
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
