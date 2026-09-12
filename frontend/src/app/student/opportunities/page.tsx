"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search, MapPin, Building, Calendar, CheckCircle2, AlertTriangle,
  Briefcase, Loader2, Bookmark, BookmarkCheck, Clock, TrendingUp, Sparkles, ArrowRight,
  XCircle, Check, X, AlertCircle, HelpCircle, Filter, ChevronRight
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import {
  SEED_OPPORTUNITIES,
  calculateOpportunityMatch,
  getAssessmentRouteForSkill,
  OpportunitySkillBreakdown,
  OpportunityItem,
  OpportunityMatchResult
} from "@/lib/opportunities-seed"

export interface OpportunityCardData {
  id: string
  title: string
  company: string
  type: string
  location: string
  workMode: string
  experience: string
  stipend?: string
  duration: string
  deadline: string
  deadlineLabel: string
  isDeadlineSoon: boolean
  isDeadlinePassed: boolean
  description: string
  responsibilities?: string[]
  eligibility?: string
  matchPercentage: number
  matchStatus: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Low Match'
  matchStatusVariant: 'success' | 'warning' | 'secondary' | 'critical'
  readyStatus: 'Ready to Apply' | 'Improve Skills First'
  isReadyToApply: boolean
  skillsMetCount: number
  totalSkillsCount: number
  mainBlocker: string | null
  matchedSkillNames: string[]
  missingSkillNames: string[]
  matchExplanation: string
  skills: OpportunitySkillBreakdown[]
  isSaved: boolean
  hasApplied: boolean
}

type FilterTab = 'all' | 'internship' | 'job' | 'saved' | 'high_match'
type SortOption = 'best_match' | 'deadline' | 'newest'

// Baseline student skills for deterministic demo calculations if DB profile is fresh
const DEMO_STUDENT_SKILLS_BASELINE: Record<string, number> = {
  "HTML": 80,
  "CSS": 80,
  "JavaScript": 85,
  "React": 60,
  "Git": 75,
  "Python": 80,
  "SQL": 75,
  "DSA": 80,
  "Problem Solving": 75,
  "OOP": 75,
  "Java": 70,
  "C++": 70,
  "Machine Learning": 60,
  "Data Structures": 80,
  "Linear Algebra": 65,
  "NumPy": 65,
  "Excel": 75,
  "Communication": 75,
}

export default function StudentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityCardData[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sortBy, setSortBy] = useState<SortOption>('best_match')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Modals state
  const [selectedOppForWhyMatch, setSelectedOppForWhyMatch] = useState<OpportunityCardData | null>(null)
  const [selectedOppForApply, setSelectedOppForApply] = useState<OpportunityCardData | null>(null)
  const [coverLetter, setCoverLetter] = useState("")
  const [isSubmittingApp, setIsSubmittingApp] = useState(false)
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null)
  const [applyErrorMsg, setApplyErrorMsg] = useState<string | null>(null)

  // 1. Load Data
  const loadOpportunities = useCallback(async () => {
    setLoading(true)

    // A. Fetch student verified skills from DB
    let studentScores: Record<string, number> = { ...DEMO_STUDENT_SKILLS_BASELINE }

    try {
      const skillsRes = await apiClient<{ success: boolean; data: any[] }>('/api/student/skills')
      if (skillsRes.success && Array.isArray(skillsRes.data) && skillsRes.data.length > 0) {
        skillsRes.data.forEach((s: any) => {
          const name = s.skills?.name || s.name || s.skillName
          const isVerified = s.verification_status && s.verification_status !== 'self_declared'
          const level = Number(s.verified_level ?? s.current_level ?? s.self_declared_level ?? 0)
          if (name && level > 0) {
            studentScores[name] = level
            studentScores[name.toLowerCase()] = level
          }
        })
      }
    } catch {
      // Use fallback baseline
    }

    // B. Fetch saved opportunity IDs
    let currentSavedIds = new Set<string>()
    try {
      const savedRes = await apiClient<{ success: boolean; data?: string[]; savedOpportunityIds?: string[] }>(
        '/api/student/saved-opportunities'
      )
      const ids = savedRes.data || savedRes.savedOpportunityIds || []
      if (Array.isArray(ids)) {
        currentSavedIds = new Set(ids)
        setSavedIds(currentSavedIds)
      }
    } catch {
      // Non-blocking
    }

    // C. Fetch already applied opportunity IDs
    let currentAppliedIds = new Set<string>()
    try {
      const appsRes = await apiClient<{ success: boolean; data?: any[] }>('/api/applications')
      if (appsRes.success && Array.isArray(appsRes.data)) {
        appsRes.data.forEach((app: any) => {
          const oppId = app.opportunities?.id || app.opportunity_id
          if (oppId) currentAppliedIds.add(String(oppId))
        })
        setAppliedIds(currentAppliedIds)
      }
    } catch {
      // Non-blocking
    }

    // D. Fetch all published opportunities
    try {
      const json = await apiClient<{ success: boolean; data: any[] }>('/api/opportunities')
      const rawList: OpportunityItem[] = (json.success && Array.isArray(json.data) && json.data.length > 0)
        ? json.data.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            company: item.company || item.company_name || item.industry_profiles?.organization_name || 'Enterprise Partner',
            type: item.type || item.opportunity_type || 'Internship',
            location: item.location || 'Remote',
            workMode: (item.workMode || item.work_setting || item.work_mode || 'hybrid').toLowerCase(),
            experience: item.experience || '0–1 years',
            stipend: item.stipend || undefined,
            duration: item.duration || '6 Months',
            deadline: item.deadline ? item.deadline.split('T')[0] : '2026-09-30',
            deadlineLabel: item.deadlineLabel || (item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Sep 2026'),
            description: item.description || '',
            responsibilities: item.responsibilities || [],
            eligibility: item.eligibility || 'Open to CS/IT students and recent graduates.',
            requiredSkills: item.requiredSkills || (item.opportunity_skills || []).map((os: any) => ({
              name: os.name || os.skill_name || os.skills?.name || 'Core Skill',
              benchmark: Number(os.benchmark || os.required_score || os.minimum_level || 75),
              importance: os.importance || 'Required',
            })),
          }))
        : SEED_OPPORTUNITIES

      // Combine rawList ensuring standard seed opportunities exist
      const existingIds = new Set(rawList.map(o => o.id))
      const combined = [...rawList]
      SEED_OPPORTUNITIES.forEach(seed => {
        if (!existingIds.has(seed.id)) {
          combined.push(seed)
        }
      })

      // Map through deterministic matching
      const mappedCards: OpportunityCardData[] = combined.map(opp => {
        const match = calculateOpportunityMatch(opp, studentScores)
        const d = new Date(opp.deadline)
        const now = new Date()
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return {
          id: opp.id,
          title: opp.title,
          company: opp.company,
          type: opp.type,
          location: opp.location,
          workMode: opp.workMode,
          experience: opp.experience || '0–1 years',
          stipend: opp.stipend,
          duration: opp.duration,
          deadline: opp.deadline,
          deadlineLabel: opp.deadlineLabel,
          isDeadlineSoon: diffDays <= 7 && diffDays >= 0,
          isDeadlinePassed: diffDays < 0,
          description: opp.description,
          responsibilities: opp.responsibilities,
          eligibility: opp.eligibility,
          matchPercentage: match.matchPercentage,
          matchStatus: match.matchStatus,
          matchStatusVariant: match.matchStatusVariant,
          readyStatus: match.readyStatus,
          isReadyToApply: match.isReadyToApply,
          skillsMetCount: match.skillsMetCount,
          totalSkillsCount: match.totalSkillsCount,
          mainBlocker: match.mainBlocker,
          matchedSkillNames: match.matchedSkillNames,
          missingSkillNames: match.missingSkillNames,
          matchExplanation: match.matchExplanation,
          skills: match.skills,
          isSaved: currentSavedIds.has(opp.id),
          hasApplied: currentAppliedIds.has(opp.id),
        }
      })

      setOpportunities(mappedCards)
    } catch {
      // Fallback directly to SEED_OPPORTUNITIES
      const mappedCards: OpportunityCardData[] = SEED_OPPORTUNITIES.map(opp => {
        const match = calculateOpportunityMatch(opp, studentScores)
        return {
          id: opp.id,
          title: opp.title,
          company: opp.company,
          type: opp.type,
          location: opp.location,
          workMode: opp.workMode,
          experience: opp.experience || '0–1 years',
          stipend: opp.stipend,
          duration: opp.duration,
          deadline: opp.deadline,
          deadlineLabel: opp.deadlineLabel,
          isDeadlineSoon: false,
          isDeadlinePassed: false,
          description: opp.description,
          responsibilities: opp.responsibilities,
          eligibility: opp.eligibility,
          matchPercentage: match.matchPercentage,
          matchStatus: match.matchStatus,
          matchStatusVariant: match.matchStatusVariant,
          readyStatus: match.readyStatus,
          isReadyToApply: match.isReadyToApply,
          skillsMetCount: match.skillsMetCount,
          totalSkillsCount: match.totalSkillsCount,
          mainBlocker: match.mainBlocker,
          matchedSkillNames: match.matchedSkillNames,
          missingSkillNames: match.missingSkillNames,
          matchExplanation: match.matchExplanation,
          skills: match.skills,
          isSaved: currentSavedIds.has(opp.id),
          hasApplied: currentAppliedIds.has(opp.id),
        }
      })
      setOpportunities(mappedCards)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOpportunities()
  }, [loadOpportunities])

  // Save / Bookmark Handler
  const handleToggleSave = async (oppId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const currentlySaved = savedIds.has(oppId)
    const nextSaved = !currentlySaved

    // Optimistic UI update
    setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, isSaved: nextSaved } : o))
    setSavedIds(prev => {
      const copy = new Set(prev)
      if (nextSaved) copy.add(oppId)
      else copy.delete(oppId)
      return copy
    })

    try {
      await apiClient('/api/student/saved-opportunities', {
        method: 'POST',
        body: JSON.stringify({ opportunityId: oppId }),
      })
    } catch {
      // Revert
      setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, isSaved: currentlySaved } : o))
      setSavedIds(prev => {
        const copy = new Set(prev)
        if (currentlySaved) copy.add(oppId)
        else copy.delete(oppId)
        return copy
      })
      setSaveError('Failed to update bookmark. Please try again.')
    }
  }

  // Submit Application Handler
  const handleSubmitApplication = async () => {
    if (!selectedOppForApply) return
    setIsSubmittingApp(true)
    setApplyErrorMsg(null)

    const oppId = selectedOppForApply.id

    try {
      const res = await apiClient<{ success: boolean; error?: { message?: string } }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          opportunity_id: oppId,
          cover_letter: coverLetter.trim() || undefined,
        }),
      })

      if (res.success) {
        setAppliedIds(prev => new Set(prev).add(oppId))
        setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, hasApplied: true } : o))
        setApplySuccessMsg('Application submitted successfully! Your application is now visible to the employer.')
        setTimeout(() => {
          setSelectedOppForApply(null)
          setApplySuccessMsg(null)
          setCoverLetter("")
        }, 1800)
      } else {
        setApplyErrorMsg(res.error?.message || 'Could not submit application.')
      }
    } catch (err: any) {
      setApplyErrorMsg(err?.message || 'Application submission failed. Please try again.')
    } finally {
      setIsSubmittingApp(false)
    }
  }

  // Filtered & Sorted Opportunities
  const filteredAndSortedOpportunities = useMemo(() => {
    let result = opportunities

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase().trim()
      result = result.filter(o =>
        o.title.toLowerCase().includes(query) ||
        o.company.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.skills.some(s => s.name.toLowerCase().includes(query))
      )
    }

    // Tab filter
    if (activeTab === 'internship') {
      result = result.filter(o => o.type.toLowerCase().includes('intern'))
    } else if (activeTab === 'job') {
      result = result.filter(o => o.type.toLowerCase().includes('job') || o.type.toLowerCase().includes('entry'))
    } else if (activeTab === 'saved') {
      result = result.filter(o => o.isSaved)
    } else if (activeTab === 'high_match') {
      result = result.filter(o => o.matchPercentage >= 70)
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'best_match') {
        return b.matchPercentage - a.matchPercentage
      }
      if (sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      if (sortBy === 'newest') {
        return b.id.localeCompare(a.id)
      }
      return 0
    })
  }, [opportunities, search, activeTab, sortBy])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-h1 font-bold text-slate-900">Opportunity Hub</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Verified Marketplace
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Explore industry-verified internships, jobs, and development opportunities matching your skill competencies.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, companies, skills..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* ─── FILTER TABS & SORT ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Opportunities ({opportunities.length})
          </button>
          <button
            onClick={() => setActiveTab('internship')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'internship'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Internships ({opportunities.filter(o => o.type.toLowerCase().includes('intern')).length})
          </button>
          <button
            onClick={() => setActiveTab('job')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'job'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Full-Time Jobs ({opportunities.filter(o => o.type.toLowerCase().includes('job')).length})
          </button>
          <button
            onClick={() => setActiveTab('high_match')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'high_match'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            High Match ≥ 70% ({opportunities.filter(o => o.matchPercentage >= 70).length})
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" /> Saved ({savedIds.size})
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span className="font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="best_match">Best Match</option>
            <option value="deadline">Nearest Deadline</option>
            <option value="newest">Recently Posted</option>
          </select>
        </div>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {saveError}
        </div>
      )}

      {/* ─── OPPORTUNITIES GRID ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            <p className="text-xs font-medium text-slate-500">Loading opportunity matches...</p>
          </div>
        </div>
      ) : filteredAndSortedOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAndSortedOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="group rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 p-6 shadow-[0_8px_25px_-8px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_20px_45px_-12px_rgba(15,23,42,0.12)] hover:border-[var(--color-accent)]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Company & Bookmark */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                      {opp.company}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[var(--color-accent)] transition-colors mt-0.5">
                      {opp.title}
                    </h3>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => handleToggleSave(opp.id, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-[var(--color-accent)] hover:bg-slate-50 transition-all shrink-0"
                    title={opp.isSaved ? 'Saved to bookmarks' : 'Save opportunity'}
                    aria-label={opp.isSaved ? 'Saved to bookmarks' : 'Save opportunity'}
                  >
                    {opp.isSaved ? (
                      <BookmarkCheck className="h-5 w-5 text-[var(--color-accent)] fill-[var(--color-accent)]" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Subheader: Type, Location, Work Mode */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-3 flex-wrap">
                  <span className="font-semibold text-slate-700">{opp.type}</span>
                  <span>•</span>
                  <span>{opp.location}</span>
                  <span>•</span>
                  <span className="capitalize">{opp.workMode}</span>
                  <span>•</span>
                  <span className="text-slate-600 font-semibold">{opp.experience}</span>
                </div>

                {/* Short Description */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {opp.description}
                </p>

                {/* Skills Row */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {opp.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                          s.met
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Match Intelligence Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                          opp.matchPercentage >= 70
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : opp.matchPercentage >= 50
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {opp.matchPercentage}% Match
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          opp.isReadyToApply ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {opp.isReadyToApply ? '✓ Ready to Apply' : '• Improve Skills First'}
                      </span>
                    </div>

                    {/* Why this match trigger */}
                    <button
                      onClick={() => setSelectedOppForWhyMatch(opp)}
                      className="text-[11px] font-bold text-[var(--color-accent)] hover:underline flex items-center gap-0.5"
                    >
                      Why this match? <HelpCircle className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {opp.matchExplanation}
                  </p>
                </div>

                {/* Deadline */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Deadline: <strong className="text-slate-700">{opp.deadlineLabel}</strong></span>
                  </div>
                  {opp.stipend && (
                    <span className="font-bold text-slate-700">{opp.stipend}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Apply & Details */}
              <div className="flex items-center gap-2 pt-1">
                {opp.hasApplied ? (
                  <Button
                    variant="outline"
                    disabled
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-slate-100 text-emerald-700 border-emerald-200 cursor-default"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" /> Applied ✓
                  </Button>
                ) : (
                  <Button
                    onClick={() => setSelectedOppForApply(opp)}
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs"
                  >
                    Apply Now
                  </Button>
                )}

                <Link href={`/student/opportunities/${opp.id}`}>
                  <Button
                    variant="outline"
                    className="h-9 px-3 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5 ml-0.5 text-slate-400" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto space-y-3">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No opportunities found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search terms or filter settings to explore more opportunities.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearch("")
              setActiveTab('all')
            }}
            className="rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {/* ─── MODAL: "WHY THIS MATCH?" BREAKDOWN ─────────────────────────────── */}
      {selectedOppForWhyMatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Match Intelligence</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedOppForWhyMatch.company} — {selectedOppForWhyMatch.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOppForWhyMatch(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Score header */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-slate-50 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {selectedOppForWhyMatch.matchPercentage}% Match
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  {selectedOppForWhyMatch.matchStatus} • {selectedOppForWhyMatch.readyStatus}
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {selectedOppForWhyMatch.skillsMetCount}/{selectedOppForWhyMatch.totalSkillsCount} Skills Met
              </span>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-4 w-4" /> Verified Matching Skills ({selectedOppForWhyMatch.matchedSkillNames.length})
                </span>
                <div className="space-y-1.5">
                  {selectedOppForWhyMatch.skills.filter(s => s.met).map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span> {s.name}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                        {s.currentLevel} / {s.requiredLevel} pts (Benchmark Met)
                      </span>
                    </div>
                  ))}
                  {selectedOppForWhyMatch.matchedSkillNames.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No verified matching skills established yet.</p>
                  )}
                </div>
              </div>

              {selectedOppForWhyMatch.missingSkillNames.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4" /> Skills Needing Improvement ({selectedOppForWhyMatch.missingSkillNames.length})
                  </span>
                  <div className="space-y-1.5">
                    {selectedOppForWhyMatch.skills.filter(s => !s.met).map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center px-3 py-2 rounded-xl bg-amber-50/40 border border-amber-100 text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="text-amber-600 font-bold">×</span> {s.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-amber-800">
                            {s.currentLevel > 0 ? `${s.currentLevel}/${s.requiredLevel} pts` : 'Not Assessed'}
                          </span>
                          <Link
                            href={getAssessmentRouteForSkill(s.name)}
                            className="text-[10px] font-bold text-[var(--color-accent)] hover:underline flex items-center"
                          >
                            Assess <ArrowRight className="h-2.5 w-2.5 ml-0.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Context Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <strong>Match Guidance:</strong> {selectedOppForWhyMatch.matchExplanation}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedOppForWhyMatch(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Close
              </Button>
              {!selectedOppForWhyMatch.hasApplied && (
                <Button
                  onClick={() => {
                    const opp = selectedOppForWhyMatch
                    setSelectedOppForWhyMatch(null)
                    setSelectedOppForApply(opp)
                  }}
                  className="rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-4"
                >
                  Apply Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: APPLY TO OPPORTUNITY ───────────────────────────────────── */}
      {selectedOppForApply && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Application Portal</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Apply to {selectedOppForApply.company}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Role: <strong className="text-slate-800">{selectedOppForApply.title}</strong> • {selectedOppForApply.type}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedOppForApply(null)
                  setApplyErrorMsg(null)
                  setApplySuccessMsg(null)
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {applySuccessMsg ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-sm">Application Sent!</h4>
                <p className="text-xs text-emerald-700">{applySuccessMsg}</p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Your Match Rating:</span>
                    <strong className="text-slate-900 font-bold">{selectedOppForApply.matchPercentage}% ({selectedOppForApply.matchStatus})</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Application Deadline:</span>
                    <strong className="text-slate-900 font-bold">{selectedOppForApply.deadlineLabel}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Candidate Cover Note (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Describe your practical experience, projects, or why you are a strong fit for this role..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                  />
                </div>

                {applyErrorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {applyErrorMsg}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOppForApply(null)}
                    disabled={isSubmittingApp}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitApplication}
                    disabled={isSubmittingApp}
                    className="rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-5"
                  >
                    {isSubmittingApp ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...</> : 'Confirm & Submit Application'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}