"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Search, MapPin, Building, Calendar, CheckCircle2, AlertTriangle,
  Briefcase, Loader2, Bookmark, BookmarkCheck, Clock, TrendingUp, Sparkles, ArrowRight,
  XCircle, Check, X, AlertCircle
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import {
  SEED_OPPORTUNITIES,
  calculateOpportunityMatch,
  getAssessmentRouteForSkill,
  OpportunitySkillBreakdown,
  OpportunityItem
} from "@/lib/opportunities-seed"

export const READY_THRESHOLD = 70
export const ALMOST_READY_THRESHOLD = 40

export interface OpportunityCard {
  id: string
  title: string
  company: string
  type: string
  location: string
  workMode: string
  duration: string | null
  deadline: string | null
  deadlineLabel: string
  isDeadlineSoon: boolean
  isDeadlinePassed: boolean
  matchPercentage: number
  readinessCategory: string
  skillsMetCount: number
  totalSkillsCount: number
  mainBlocker: string | null
  skills: OpportunitySkillBreakdown[]
  isSaved: boolean
  hasApplied: boolean
}

type TabType = 'all' | 'saved'

function DeadlineBadge({ label, isSoon, isPassed }: { label: string; isSoon: boolean; isPassed: boolean }) {
  if (isPassed) {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
        Closed
      </span>
    )
  }
  if (isSoon) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-400/20">
        <Clock className="h-3 w-3 text-amber-500" /> {label}
      </span>
    )
  }
  return <span className="text-xs text-slate-500 font-medium">Apply by {label}</span>
}

function MatchBadge({ pct }: { pct: number }) {
  if (pct >= READY_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ring-1 ring-emerald-400/20 shadow-xs">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {pct}% Match
      </span>
    )
  }
  if (pct >= ALMOST_READY_THRESHOLD) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ring-1 ring-amber-400/20 shadow-xs">
        <TrendingUp className="h-3 w-3 text-amber-600" /> {pct}% Match
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      {pct}% Match
    </span>
  )
}

function OpportunityCardItem({
  opp,
  onToggleSave,
  onSaveError,
}: {
  opp: OpportunityCard
  onToggleSave: (id: string, saved: boolean) => void
  onSaveError: (msg: string) => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (toggling) return

    setToggling(true)
    const previousSavedState = opp.isSaved
    const newSavedState = !previousSavedState

    // Optimistic UI state update
    onToggleSave(opp.id, newSavedState)

    try {
      const res = await apiClient<{ success: boolean; saved: boolean }>(
        '/api/student/saved-opportunities',
        {
          method: 'POST',
          body: JSON.stringify({ opportunityId: opp.id }),
        }
      )

      if (!res.success) {
        throw new Error('Save failed')
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      onToggleSave(opp.id, previousSavedState)
      onSaveError('Failed to update bookmark. Please check your connection and try again.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      className={`group rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] hover:border-[var(--color-accent)]/40 transition-all duration-300 flex flex-col justify-between ${
        opp.isDeadlinePassed ? 'opacity-60' : ''
      }`}
    >
      <div>
        {/* Card Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MatchBadge pct={opp.matchPercentage} />
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100/90 border border-slate-200/70 px-2.5 py-0.5 rounded-full">
                {opp.type}
              </span>
              {opp.hasApplied && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border border-[var(--color-border-primary)]">
                  Applied
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
              {opp.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
              <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {opp.company}
            </div>
          </div>

          {/* Feature 3: Consistent Bookmark/Save Button */}
          <button
            onClick={handleSave}
            disabled={toggling}
            className="p-2 rounded-xl text-slate-400 hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-secondary)] transition-all disabled:opacity-50 shrink-0"
            title={opp.isSaved ? 'Remove from saved' : 'Save opportunity'}
            aria-label={opp.isSaved ? 'Remove from saved' : 'Save opportunity'}
          >
            {toggling ? (
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
            ) : opp.isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-[var(--color-accent)] fill-[var(--color-accent)]" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Feature 1 & 2: Explainable Match Breakdown with Inline 'Close This Gap' Links */}
        <div className="pt-2 pb-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            <span>Skill Match Breakdown</span>
            <span className="text-slate-700 font-mono">{opp.skillsMetCount}/{opp.totalSkillsCount} Verified</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(opp.skills ?? []).map((skill, idx) => {
              const isMet = skill.status === 'met' || skill.met
              const isClose = skill.status === 'close'
              const assessmentRoute = getAssessmentRouteForSkill(skill.name)

              if (isMet) {
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs"
                    title={`Verified: ${skill.currentLevel}/${skill.requiredLevel}`}
                  >
                    <span className="mr-1 text-emerald-600 font-bold">✅</span>
                    {skill.name}
                  </span>
                )
              }

              if (isClose) {
                return (
                  <Link
                    key={idx}
                    href={assessmentRoute}
                    title={`Close gap: Take ${skill.name} assessment (${skill.statusLabel})`}
                    className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300/90 hover:bg-amber-100 hover:border-amber-400 hover:shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer group/gap"
                  >
                    <span className="mr-1 text-amber-600 font-bold">⚠️</span>
                    <span>{skill.name}</span>
                    <span className="ml-1 text-[10px] text-amber-700 font-medium">({skill.statusLabel})</span>
                    <ArrowRight className="h-2.5 w-2.5 ml-1 opacity-60 group-hover/gap:opacity-100 transition-opacity" />
                  </Link>
                )
              }

              // Missing or deficit > 15 pts
              return (
                <Link
                  key={idx}
                  href={assessmentRoute}
                  title={`Take ${skill.name} assessment to establish score`}
                  className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/90 hover:bg-rose-100 hover:border-rose-300 hover:shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer group/gap"
                >
                  <span className="mr-1 text-rose-500 font-bold">❌</span>
                  <span>{skill.name}</span>
                  <span className="ml-1 text-[10px] text-rose-600 font-medium">({skill.statusLabel || 'not assessed'})</span>
                  <ArrowRight className="h-2.5 w-2.5 ml-1 opacity-60 group-hover/gap:opacity-100 transition-opacity" />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Location & Metadata */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 font-medium my-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {opp.location}
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {opp.duration || 'Flexible'}
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <DeadlineBadge label={opp.deadlineLabel} isSoon={opp.isDeadlineSoon} isPassed={opp.isDeadlinePassed} />
          </div>
        </div>
      </div>

      <Link href={`/student/opportunities/${opp.id}`} className="block mt-auto">
        <Button
          className={`w-full h-10 rounded-xl font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
            opp.hasApplied
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs'
          }`}
          disabled={opp.isDeadlinePassed}
        >
          {opp.hasApplied ? 'View Application' : opp.isDeadlinePassed ? 'Closed' : 'View Opportunity & Apply'}
          {!opp.isDeadlinePassed && <ArrowRight className="h-3.5 w-3.5 ml-1.5" />}
        </Button>
      </Link>
    </div>
  )
}

export default function OpportunitiesPage() {
  const { isDemo, opportunities: demoOpps } = useDemo()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [workModeFilter, setWorkModeFilter] = useState("all")
  const [showAllLowMatch, setShowAllLowMatch] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasVerifiedSkills, setHasVerifiedSkills] = useState<boolean>(true)

  // Clear transient error banner after 4 seconds
  useEffect(() => {
    if (saveError) {
      const timer = setTimeout(() => setSaveError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [saveError])

  const loadOpportunities = useCallback(async () => {
    setLoading(true)

    // 1. Fetch student verified skills to drive genuine, single-path match calculations
    let studentScores: Record<string, number> = {}
    let verifiedCount = 0

    try {
      const skillsRes = await apiClient<{ success: boolean; data: any[] }>('/api/student/skills')
      if (skillsRes.success && Array.isArray(skillsRes.data) && skillsRes.data.length > 0) {
        const scoreMap: Record<string, number> = {}
        skillsRes.data.forEach((s: any) => {
          const name = s.skills?.name || s.name || s.skillName
          const isVerified = s.verification_status && s.verification_status !== 'self_declared'
          const level = Number(s.verified_level ?? s.current_level ?? 0)
          if (name && isVerified) {
            scoreMap[name] = level
            scoreMap[name.toLowerCase()] = level
            verifiedCount++
          }
        })
        studentScores = scoreMap
      }
    } catch {
      // Fall back to empty scores — no fake data
      verifiedCount = 0
    }

    const studentHasSkills = verifiedCount > 0
    setHasVerifiedSkills(studentHasSkills)

    if (!studentHasSkills) {
      setOpportunities([])
      setLoading(false)
      return
    }

    // 2. Fetch student's persisted saved opportunities
    let currentSavedIds = new Set<string>()
    try {
      const savedRes = await apiClient<{ success: boolean; data: string[] }>('/api/student/saved-opportunities')
      if (savedRes.success && Array.isArray(savedRes.data)) {
        currentSavedIds = new Set(savedRes.data)
        setSavedIds(currentSavedIds)
      }
    } catch {
      // Non-blocking fallback
    }

    // 3. Load opportunities list and compute match & breakdown in a single pass
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter !== 'All Types') params.set('type', typeFilter)
      if (workModeFilter !== 'all') params.set('work_mode', workModeFilter)

      const json = await apiClient<{ success: boolean; data: any[] }>(
        `/api/student/opportunities?${params.toString()}`
      )

      const rawList: OpportunityItem[] = (json.success && Array.isArray(json.data) && json.data.length > 0)
        ? json.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            company: item.company || item.industry_profiles?.organization_name || 'Partner Company',
            type: item.type || item.opportunity_type || 'Internship',
            location: item.location || 'Remote',
            workMode: (item.workMode || item.work_mode || 'remote').toLowerCase(),
            duration: item.duration || 'Flexible',
            deadline: item.deadline || '2026-12-31',
            deadlineLabel: item.deadlineLabel || 'Dec 31, 2026',
            description: item.description || '',
            requiredSkills: (item.requiredSkills || (item.opportunity_skills ?? []).map((os: any) => ({
              name: os.skills?.name || os.name || 'Skill',
              benchmark: os.minimum_level || os.benchmark || 70,
              importance: os.importance || 'Required',
            }))),
          }))
        : SEED_OPPORTUNITIES

      // Map each opportunity through single match computation pass
      const formatted: OpportunityCard[] = rawList.map(opp => {
        const match = calculateOpportunityMatch(opp, studentHasSkills ? studentScores : {})
        return {
          id: opp.id,
          title: opp.title,
          company: opp.company,
          type: opp.type,
          location: opp.location,
          workMode: opp.workMode,
          duration: opp.duration,
          deadline: opp.deadline,
          deadlineLabel: opp.deadlineLabel,
          isDeadlineSoon: false,
          isDeadlinePassed: false,
          matchPercentage: match.matchPercentage,
          readinessCategory: match.matchPercentage >= READY_THRESHOLD ? 'Ready' : match.matchPercentage >= ALMOST_READY_THRESHOLD ? 'Almost Ready' : 'Needs Preparation',
          skillsMetCount: match.skillsMetCount,
          totalSkillsCount: match.totalSkillsCount,
          mainBlocker: match.mainBlocker,
          skills: match.skills,
          isSaved: currentSavedIds.has(opp.id),
          hasApplied: false,
        }
      })

      setOpportunities(formatted)
    } catch {
      // Fallback
      const formatted: OpportunityCard[] = SEED_OPPORTUNITIES.map(opp => {
        const match = calculateOpportunityMatch(opp, studentHasSkills ? studentScores : {})
        return {
          id: opp.id,
          title: opp.title,
          company: opp.company,
          type: opp.type,
          location: opp.location,
          workMode: opp.workMode,
          duration: opp.duration,
          deadline: opp.deadline,
          deadlineLabel: opp.deadlineLabel,
          isDeadlineSoon: false,
          isDeadlinePassed: false,
          matchPercentage: match.matchPercentage,
          readinessCategory: match.matchPercentage >= READY_THRESHOLD ? 'Ready' : match.matchPercentage >= ALMOST_READY_THRESHOLD ? 'Almost Ready' : 'Needs Preparation',
          skillsMetCount: match.skillsMetCount,
          totalSkillsCount: match.totalSkillsCount,
          mainBlocker: match.mainBlocker,
          skills: match.skills,
          isSaved: currentSavedIds.has(opp.id),
          hasApplied: false,
        }
      })
      setOpportunities(formatted)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, workModeFilter])

  useEffect(() => {
    const timer = setTimeout(loadOpportunities, 250)
    return () => clearTimeout(timer)
  }, [loadOpportunities])

  const handleToggleSave = (id: string, saved: boolean) => {
    setOpportunities(prev =>
      prev.map(o => (o.id === id ? { ...o, isSaved: saved } : o))
    )
    setSavedIds(prev => {
      const next = new Set(prev)
      if (saved) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  // Filter opportunities according to search/dropdown filters
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (search) {
        const q = search.toLowerCase()
        const matchesQuery =
          opp.title.toLowerCase().includes(q) ||
          opp.company.toLowerCase().includes(q) ||
          (opp.skills ?? []).some(s => s.name.toLowerCase().includes(q))
        if (!matchesQuery) return false
      }
      if (typeFilter !== 'All Types' && opp.type.toLowerCase() !== typeFilter.toLowerCase()) {
        return false
      }
      if (workModeFilter !== 'all' && opp.workMode.toLowerCase() !== workModeFilter.toLowerCase()) {
        return false
      }
      return true
    })
  }, [opportunities, search, typeFilter, workModeFilter])

  // Feature 4: Split into "Ready to Apply" (>=70%) vs "Almost Ready" (40-69%)
  const readyToApply = useMemo(
    () => filteredOpportunities.filter(o => o.matchPercentage >= READY_THRESHOLD),
    [filteredOpportunities]
  )

  const almostReady = useMemo(
    () =>
      filteredOpportunities
        .filter(o => o.matchPercentage >= ALMOST_READY_THRESHOLD && o.matchPercentage < READY_THRESHOLD)
        .sort((a, b) => b.matchPercentage - a.matchPercentage),
    [filteredOpportunities]
  )

  const otherOpportunities = useMemo(
    () =>
      filteredOpportunities
        .filter(o => o.matchPercentage < ALMOST_READY_THRESHOLD)
        .sort((a, b) => b.matchPercentage - a.matchPercentage),
    [filteredOpportunities]
  )

  // Saved tab items
  const savedOpportunities = useMemo(
    () => filteredOpportunities.filter(o => o.isSaved),
    [filteredOpportunities]
  )

  // Feature 5: "Recommended for You" shelf top matches
  const topRecommended = useMemo(() => {
    return [...opportunities]
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 3)
  }, [opportunities])

  const TABS: { key: TabType; label: string; count?: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All Opportunities', count: filteredOpportunities.length, icon: <Briefcase className="h-4 w-4" /> },
    { key: 'saved', label: 'Saved', count: savedOpportunities.length, icon: <Bookmark className="h-4 w-4" /> },
  ]

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-[480px] -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Opportunity Hub</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Discover verified internships and career roles matched directly to your living Skill Passport benchmarks.
        </p>
      </div>

      {/* Transient Save/Bookmark Error Alert */}
      {saveError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── FEATURE 5: RECOMMENDED FOR YOU SECTION AT THE TOP ───────────────── */}
      {!hasVerifiedSkills ? (
        <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 p-6 sm:p-7 shadow-xs backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Personalized Recommendations Awaiting Assessment</h3>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              We need your verified skill ledger to rank and recommend relevant roles. Complete your initial benchmark assessment to unlock personalized recommendations.
            </p>
          </div>
          <Link href="/student/career" className="shrink-0">
            <Button className="h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs hover:-translate-y-0.5 transition-all">
              Complete your skill assessment to get personalized recommendations →
            </Button>
          </Link>
        </div>
      ) : topRecommended.length > 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recommended for You</h2>
                <p className="text-[11px] font-medium text-slate-500">
                  Highest-match opportunities calibrated to your authenticated skill ledger
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Top {topRecommended.length} Matches
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRecommended.map((opp) => (
              <div
                key={`rec-${opp.id}`}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 hover:bg-white hover:border-[var(--color-accent)]/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <MatchBadge pct={opp.matchPercentage} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {opp.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{opp.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{opp.company}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {opp.skillsMetCount}/{opp.totalSkillsCount} Skills Met
                  </span>
                  <Link href={`/student/opportunities/${opp.id}`}>
                    <span className="font-bold text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] inline-flex items-center gap-1">
                      View <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ─── FEATURE 3: ALL | SAVED FILTER TABS ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] self-start">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-[var(--color-accent)] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'saved' && (
          <span className="text-xs font-medium text-slate-500">
            Showing bookmarked opportunities persisted to your profile
          </span>
        )}
      </div>

      {/* Filter Search & Dropdowns */}
      <div className="flex flex-col lg:flex-row gap-3 p-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/70 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search roles, skills, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full lg:w-48 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
        >
          <option>All Types</option>
          <option>Internship</option>
          <option>Apprenticeship</option>
          <option>Job</option>
          <option>Training</option>
          <option>Workshop</option>
          <option>Mentorship</option>
        </Select>
        <Select
          value={workModeFilter}
          onChange={(e) => setWorkModeFilter(e.target.value)}
          className="w-full lg:w-36 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
        >
          <option value="all">All Modes</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </Select>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-[var(--color-accent)]" />
            <p className="text-sm font-medium text-slate-500">
              Evaluating skill match benchmarks and loading opportunities...
            </p>
          </div>
        </div>
      ) : activeTab === 'saved' ? (
        /* ─── SAVED TAB VIEW ──────────────────────────────────────────────── */
        savedOpportunities.length === 0 ? (
          <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-dashed border-slate-300 p-12 text-center shadow-sm max-w-md mx-auto space-y-3">
            <Bookmark className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-lg text-slate-900">No saved opportunities yet</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Bookmark roles you want to revisit across sessions. Click the bookmark icon in the top right of any card.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setActiveTab('all')}
                className="rounded-xl h-10 px-5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs"
              >
                Browse All Opportunities
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedOpportunities.map(opp => (
                <OpportunityCardItem
                  key={opp.id}
                  opp={opp}
                  onToggleSave={handleToggleSave}
                  onSaveError={setSaveError}
                />
              ))}
            </div>
          </div>
        )
      ) : filteredOpportunities.length === 0 ? (
        /* Empty Filter State */
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-dashed border-slate-300 p-12 text-center shadow-sm max-w-md mx-auto space-y-3">
          <Briefcase className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">No opportunities match your filter</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Try expanding your search keywords or resetting filters.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => { setSearch(''); setTypeFilter('All Types'); setWorkModeFilter('all') }}
              className="rounded-xl h-10 px-5 border-slate-200 text-slate-700 font-bold text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        /* ─── FEATURE 4: READY TO APPLY VS ALMOST READY GROUPS ────────────── */
        <div className="space-y-10">
          {/* Group 1: Ready to Apply (>= 70%) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Ready to Apply</h2>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                  {readyToApply.length} roles (≥{READY_THRESHOLD}% Match)
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Your authenticated skills satisfy industry benchmarks
              </span>
            </div>

            {readyToApply.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {readyToApply.map(opp => (
                  <OpportunityCardItem
                    key={opp.id}
                    opp={opp}
                    onToggleSave={handleToggleSave}
                    onSaveError={setSaveError}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500 font-medium">
                No roles currently reach the {READY_THRESHOLD}% threshold. Close targeted deficits in the &ldquo;Almost Ready&rdquo; section below to qualify!
              </div>
            )}
          </div>

          {/* Group 2: Almost Ready (40%–69%) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Almost Ready</h2>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                  {almostReady.length} roles ({ALMOST_READY_THRESHOLD}–{READY_THRESHOLD - 1}% Match)
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Sorted by match % • Tap any ⚠️ or ❌ tag to close point deficits
              </span>
            </div>

            {almostReady.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {almostReady.map(opp => (
                  <OpportunityCardItem
                    key={opp.id}
                    opp={opp}
                    onToggleSave={handleToggleSave}
                    onSaveError={setSaveError}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500 font-medium">
                No opportunities currently within the {ALMOST_READY_THRESHOLD}–{READY_THRESHOLD - 1}% range.
              </div>
            )}
          </div>

          {/* Group 3: Opportunities < 40% (Collapsed by default with toggle) */}
          {otherOpportunities.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                <span className="text-xs font-semibold text-slate-600">
                  {otherOpportunities.length} opportunities require significant prerequisite skills (&lt;{ALMOST_READY_THRESHOLD}% Match)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllLowMatch(!showAllLowMatch)}
                  className="rounded-xl h-8 px-3.5 border-slate-300 text-slate-700 font-bold text-xs self-start sm:self-auto hover:bg-slate-100"
                >
                  {showAllLowMatch
                    ? "Hide low-match opportunities"
                    : `Show all opportunities (${otherOpportunities.length} below ${ALMOST_READY_THRESHOLD}%)`}
                </Button>
              </div>

              {showAllLowMatch && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 animate-in fade-in">
                  {otherOpportunities.map(opp => (
                    <OpportunityCardItem
                      key={opp.id}
                      opp={opp}
                      onToggleSave={handleToggleSave}
                      onSaveError={setSaveError}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}