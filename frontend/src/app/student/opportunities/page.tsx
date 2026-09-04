"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Search, MapPin, Building, Calendar, CheckCircle2, AlertTriangle,
  Briefcase, Loader2, Bookmark, BookmarkCheck, Clock, TrendingUp, Sparkles
} from "lucide-react"

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
    return <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800">Closed</span>
  }
  if (isSoon) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 font-medium">
        <Clock className="h-3 w-3" />{label}
      </span>
    )
  }
  return <span className="text-xs text-[var(--color-text-secondary)]">Apply by {label}</span>
}

function MatchBadge({ pct }: { pct: number }) {
  const variant = pct >= 85 ? 'success' : pct >= 65 ? 'warning' : 'secondary'
  return <Badge variant={variant}>{pct}% Match</Badge>
}

function OpportunityCard({
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
      // noop
    } finally {
      setToggling(false)
    }
  }

  return (
    <Card className={`hover:shadow-md transition-all group border ${opp.isDeadlinePassed ? 'opacity-60' : ''}`}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MatchBadge pct={opp.matchPercentage} />
              <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded">
                {opp.type}
              </span>
              {opp.hasApplied && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                  Applied
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold group-hover:text-[var(--color-accent)] transition-colors truncate">
              {opp.title}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] mt-1">
              <Building className="h-3.5 w-3.5 shrink-0" /> {opp.company}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={toggling}
            className="ml-3 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
            title={opp.isSaved ? 'Unsave' : 'Save opportunity'}
          >
            {opp.isSaved
              ? <BookmarkCheck className="h-5 w-5 text-[var(--color-accent)]" />
              : <Bookmark className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[var(--color-text-secondary)] mb-4">
          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {opp.location}</div>
          <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {opp.duration || 'Flexible'}</div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="h-3.5 w-3.5" />
            <DeadlineBadge label={opp.deadlineLabel} isSoon={opp.isDeadlineSoon} isPassed={opp.isDeadlinePassed} />
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-[var(--color-border-primary)] space-y-3">
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
              Skills — {opp.skillsMetCount}/{opp.totalSkillsCount} Met
            </p>
            <div className="flex flex-wrap gap-1.5">
              {opp.skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded ${
                    skill.met
                      ? 'bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {skill.met
                    ? <CheckCircle2 className="h-3 w-3 mr-1" />
                    : <AlertTriangle className="h-3 w-3 mr-1" />}
                  {skill.name}
                </span>
              ))}
              {opp.skills.length > 4 && (
                <span className="text-xs text-[var(--color-text-muted)] px-1 py-1">+{opp.skills.length - 4} more</span>
              )}
            </div>
          </div>

          <Link href={`/student/opportunities/${opp.id}`} className="block">
            <Button
              className={`w-full ${opp.hasApplied ? 'bg-[var(--color-surface-secondary)] text-[var(--color-foreground)]' : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'}`}
              disabled={opp.isDeadlinePassed}
            >
              {opp.hasApplied ? 'View Application' : opp.isDeadlinePassed ? 'Closed' : 'View & Apply'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"

export default function OpportunitiesPage() {
  const { isDemo, opportunities: demoOpps } = useDemo()
  const [activeTab, setActiveTab] = useState<TabType>('recommended')
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [workModeFilter, setWorkModeFilter] = useState("all")

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
      if (activeTab === 'recommended') {
        const json = await apiClient('/api/student/opportunities/recommended?limit=30')
        if (json.success && json.data) {
          setOpportunities(json.data)
        } else {
          setOpportunities([])
        }
      } else if (activeTab === 'saved') {
        const json = await apiClient('/api/student/opportunities/saved')
        if (json.success && json.data) {
          setOpportunities(json.data.map((o: any) => ({ ...o, isSaved: true })))
        } else {
          setOpportunities([])
        }
      } else {
        // All opportunities
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (typeFilter !== 'All Types') params.set('type', typeFilter)
        if (workModeFilter !== 'all') params.set('work_mode', workModeFilter)
        params.set('limit', '40')

        const json = await apiClient(`/api/student/opportunities?${params.toString()}`)
        if (json.success && json.data) {
          setOpportunities(json.data)
        } else {
          setOpportunities([])
        }
      }
    } catch {
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }, [isDemo, demoOpps, activeTab, search, typeFilter, workModeFilter])

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-h1 font-semibold">Opportunity Hub</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Discover opportunities matched specifically to your verified skills.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--color-surface-secondary)] rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--color-surface-card)] text-[var(--color-foreground)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters — only shown on "All" tab */}
      {activeTab === 'all' && (
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search roles, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full lg:w-44">
            <option>All Types</option>
            <option>Internship</option>
            <option>Job</option>
            <option>Mentorship</option>
            <option>Industrial Training</option>
            <option>Workshop</option>
            <option>Research Collaboration</option>
          </Select>
          <Select value={workModeFilter} onChange={(e) => setWorkModeFilter(e.target.value)} className="w-full lg:w-36">
            <option value="all">All Modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </Select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              {activeTab === 'recommended' ? 'Computing your personalized matches...' : 'Loading...'}
            </p>
          </div>
        </div>
      ) : opportunities.length === 0 ? (
        <Card className="p-12 text-center bg-[var(--color-surface-secondary)] border-dashed">
          {activeTab === 'saved' ? (
            <>
              <Bookmark className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No saved opportunities</h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-4">
                Bookmark opportunities you want to revisit. Click the bookmark icon on any opportunity card.
              </p>
              <Button onClick={() => setActiveTab('recommended')}>
                <TrendingUp className="mr-2 h-4 w-4" /> See Recommendations
              </Button>
            </>
          ) : activeTab === 'recommended' ? (
            <>
              <Sparkles className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No recommendations yet</h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-4">
                Complete your skill assessments to get personalized opportunity recommendations.
              </p>
              <Link href="/student/assessment">
                <Button>Take Skill Assessment</Button>
              </Link>
            </>
          ) : (
            <>
              <Briefcase className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No opportunities found</h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
                No opportunities match your current filters. Try adjusting your search criteria.
              </p>
            </>
          )}
        </Card>
      ) : (
        <>
          {activeTab === 'recommended' && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
              <span>Ranked by your skill readiness and deadline urgency</span>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} onToggleSave={handleToggleSave} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}