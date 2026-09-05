"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Search, MapPin, Building, Calendar, CheckCircle2, AlertTriangle,
  Briefcase, Loader2, Bookmark, BookmarkCheck, Clock, TrendingUp, Sparkles, ArrowRight
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"
import { SEED_OPPORTUNITIES, calculateOpportunityMatch } from "@/lib/opportunities-seed"

interface OpportunityCard {
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
  skills: { name: string; met: boolean; currentLevel: number; requiredLevel: number }[]
  isSaved: boolean
  hasApplied: boolean
}

type TabType = 'recommended' | 'all' | 'saved'

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
  if (pct >= 85) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ring-1 ring-emerald-400/20 shadow-xs">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {pct}% Match
      </span>
    )
  }
  if (pct >= 65) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 ring-1 ring-sky-400/20 shadow-xs">
        <TrendingUp className="h-3 w-3 text-sky-600" /> {pct}% Match
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
}: {
  opp: OpportunityCard
  onToggleSave: (id: string, saved: boolean) => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    setToggling(true)
    try {
      const method = opp.isSaved ? 'DELETE' : 'POST'
      await apiClient(`/api/opportunities/${opp.id}/save`, { method })
      onToggleSave(opp.id, !opp.isSaved)
    } catch {
      onToggleSave(opp.id, !opp.isSaved)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      className={`group rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] hover:-translate-y-1.5 hover:shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)] hover:border-indigo-200/80 transition-all duration-300 flex flex-col justify-between ${
        opp.isDeadlinePassed ? 'opacity-60' : ''
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-3.5">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MatchBadge pct={opp.matchPercentage} />
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100/90 border border-slate-200/70 px-2.5 py-0.5 rounded-full">
                {opp.type}
              </span>
              {opp.hasApplied && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Applied
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {opp.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
              <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {opp.company}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={toggling}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/60 transition-all disabled:opacity-50 shrink-0"
            title={opp.isSaved ? 'Unsave' : 'Save opportunity'}
          >
            {opp.isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-indigo-600 fill-indigo-600/10" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 font-medium mb-4 pb-4 border-b border-slate-100">
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

        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Skill Match Alignment</span>
            <span className="text-slate-700 font-mono">{opp.skillsMetCount}/{opp.totalSkillsCount} Met</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {opp.skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  skill.met
                    ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80'
                    : 'bg-slate-50 text-slate-500 border-slate-200/60'
                }`}
              >
                {skill.met ? (
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                )}
                {skill.name}
              </span>
            ))}
            {opp.skills.length > 4 && (
              <span className="text-[11px] text-slate-400 font-medium px-1.5 py-1 self-center">
                +{opp.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      <Link href={`/student/opportunities/${opp.id}`} className="block mt-auto">
        <Button
          className={`w-full h-10 rounded-xl font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${
            opp.hasApplied
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
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
  const [activeTab, setActiveTab] = useState<TabType>('recommended')
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [workModeFilter, setWorkModeFilter] = useState("all")

  const getFallbackList = useCallback(() => {
    return SEED_OPPORTUNITIES.map(opp => {
      const match = calculateOpportunityMatch(opp)
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
        readinessCategory: match.matchPercentage >= 85 ? 'Ready' : 'Needs Improvement',
        skillsMetCount: match.skillsMetCount,
        totalSkillsCount: match.totalSkillsCount,
        mainBlocker: match.mainBlocker,
        skills: match.skills,
        isSaved: false,
        hasApplied: false,
      }
    })
  }, [])

  const loadOpportunities = useCallback(async () => {
    if (isDemo) {
      const formatted: OpportunityCard[] = demoOpps.map(o => ({
        id: o.id,
        title: o.title,
        company: o.company,
        type: o.type,
        location: o.location,
        workMode: o.workMode,
        duration: o.duration,
        deadline: o.deadline,
        deadlineLabel: o.deadlineLabel,
        isDeadlineSoon: o.isDeadlineSoon,
        isDeadlinePassed: o.isDeadlinePassed,
        matchPercentage: o.matchPercentage,
        readinessCategory: o.readinessCategory,
        skillsMetCount: o.skillsMetCount,
        totalSkillsCount: o.totalSkillsCount,
        mainBlocker: o.mainBlocker,
        skills: o.skills.map(s => ({
          name: s.name,
          met: s.met,
          currentLevel: s.currentLevel,
          requiredLevel: s.requiredLevel,
        })),
        isSaved: o.isSaved,
        hasApplied: o.hasApplied,
      }))

      if (activeTab === 'saved') {
        setOpportunities(formatted.filter(o => o.isSaved))
      } else {
        setOpportunities(formatted)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter !== 'All Types') params.set('type', typeFilter)
      if (workModeFilter !== 'all') params.set('work_mode', workModeFilter)

      const json = await apiClient<{ success: boolean; data: OpportunityCard[] }>(
        `/api/student/opportunities?${params.toString()}`
      )

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setOpportunities(json.data)
      } else {
        setOpportunities(getFallbackList())
      }
    } catch {
      setOpportunities(getFallbackList())
    } finally {
      setLoading(false)
    }
  }, [isDemo, demoOpps, activeTab, search, typeFilter, workModeFilter, getFallbackList])

  useEffect(() => {
    const timer = setTimeout(loadOpportunities, 250)
    return () => clearTimeout(timer)
  }, [loadOpportunities])

  const handleToggleSave = (id: string, saved: boolean) => {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, isSaved: saved } : o))
  }

  const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'recommended', label: 'Recommended', icon: <Sparkles className="h-4 w-4" /> },
    { key: 'all', label: 'All Opportunities', icon: <Briefcase className="h-4 w-4" /> },
    { key: 'saved', label: 'Saved', icon: <Bookmark className="h-4 w-4" /> },
  ]

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[480px] -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Opportunity Hub</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Discover verified internships and career roles matched directly to your living Skill Passport benchmarks.
        </p>
      </div>

      {/* Floating Segmented Tabs Dock */}
      <div className="inline-flex gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Floating Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-3 p-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/70 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search roles, skills, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full lg:w-48 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
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
          className="w-full lg:w-36 h-11 rounded-xl border-slate-200/80 bg-white text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
        >
          <option value="all">All Modes</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-500">
              {activeTab === 'recommended' ? 'Computing personalized opportunity matches...' : 'Loading opportunities...'}
            </p>
          </div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          {activeTab === 'saved' ? (
            <div className="max-w-md mx-auto space-y-3">
              <Bookmark className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-lg text-slate-900">No saved opportunities</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Bookmark opportunities you want to revisit. Click the bookmark icon on any opportunity card.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => setActiveTab('recommended')}
                  className="rounded-xl h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Explore Recommended
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              <Briefcase className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-lg text-slate-900">No opportunities match your filter</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Try expanding your search parameters or select &quot;All Types&quot;.
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
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map(opp => (
            <OpportunityCardItem
              key={opp.id}
              opp={opp}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}