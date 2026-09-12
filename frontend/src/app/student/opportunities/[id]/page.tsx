"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Building, MapPin, Briefcase, Calendar, CheckCircle2,
  AlertTriangle, AlertCircle, Loader2, Bookmark, BookmarkCheck,
  Clock, TrendingUp, ChevronRight, Check, X, ArrowRight, ShieldCheck, DollarSign
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import {
  SEED_OPPORTUNITIES,
  calculateOpportunityMatch,
  getAssessmentRouteForSkill,
  OpportunityItem,
  OpportunityMatchResult
} from "@/lib/opportunities-seed"

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

export default function OpportunityDetailsPage() {
  const params = useParams()
  const opportunityId = typeof params?.id === 'string' ? params.id : ''

  const [opp, setOpp] = useState<OpportunityItem | null>(null)
  const [matchResult, setMatchResult] = useState<OpportunityMatchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [togglingSave, setTogglingSave] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!opportunityId) return
    setLoading(true)

    let foundOpp: OpportunityItem | null = null

    // 1. Fetch Opportunity details
    try {
      const res = await apiClient<{ success: boolean; data: OpportunityItem }>(`/api/opportunities/${opportunityId}`)
      if (res.success && res.data) {
        foundOpp = res.data
      }
    } catch {
      // Fallback
    }

    if (!foundOpp) {
      foundOpp = SEED_OPPORTUNITIES.find(o => o.id === opportunityId) || null
    }

    setOpp(foundOpp)

    // 2. Fetch Student Skills for Match Calculation
    let studentScores: Record<string, number> = { ...DEMO_STUDENT_SKILLS_BASELINE }
    try {
      const skillsRes = await apiClient<{ success: boolean; data: any[] }>('/api/student/skills')
      if (skillsRes.success && Array.isArray(skillsRes.data) && skillsRes.data.length > 0) {
        skillsRes.data.forEach((s: any) => {
          const name = s.skills?.name || s.name || s.skillName
          const level = Number(s.verified_level ?? s.current_level ?? s.self_declared_level ?? 0)
          if (name && level > 0) {
            studentScores[name] = level
            studentScores[name.toLowerCase()] = level
          }
        })
      }
    } catch {
      // Use baseline
    }

    if (foundOpp) {
      const match = calculateOpportunityMatch(foundOpp, studentScores)
      setMatchResult(match)
    }

    // 3. Check if Applied
    try {
      const appsRes = await apiClient<{ success: boolean; data?: any[] }>('/api/applications')
      if (appsRes.success && Array.isArray(appsRes.data)) {
        const already = appsRes.data.some(
          (a: any) => String(a.opportunities?.id || a.opportunity_id) === String(opportunityId)
        )
        setHasApplied(already)
      }
    } catch {
      // Non-blocking
    }

    // 4. Check if Saved
    try {
      const savedRes = await apiClient<{ success: boolean; data?: string[]; savedOpportunityIds?: string[] }>(
        '/api/student/saved-opportunities'
      )
      const ids = savedRes.data || savedRes.savedOpportunityIds || []
      if (Array.isArray(ids)) {
        setIsSaved(ids.includes(opportunityId))
      }
    } catch {
      // Non-blocking
    }

    setLoading(false)
  }, [opportunityId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleSave = async () => {
    if (!opportunityId || togglingSave) return
    setTogglingSave(true)
    const nextSaved = !isSaved
    setIsSaved(nextSaved)

    try {
      await apiClient('/api/student/saved-opportunities', {
        method: 'POST',
        body: JSON.stringify({ opportunityId }),
      })
    } catch {
      setIsSaved(!nextSaved)
    } finally {
      setTogglingSave(false)
    }
  }

  const handleApply = async () => {
    if (!opportunityId) return
    setIsApplying(true)
    setErrorMsg(null)

    try {
      const res = await apiClient<{ success: boolean; error?: { message?: string } }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          opportunity_id: opportunityId,
          cover_letter: coverLetter.trim() || undefined,
        }),
      })

      if (res.success) {
        setHasApplied(true)
        setApplySuccessMsg('Application submitted successfully! The employer can now review your skill profile.')
        setTimeout(() => {
          setShowApplyModal(false)
          setApplySuccessMsg(null)
          setCoverLetter("")
        }, 1800)
      } else {
        setErrorMsg(res.error?.message || 'Failed to submit application.')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error submitting application.')
    } finally {
      setIsApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-xs font-medium text-slate-500">Loading opportunity details...</p>
        </div>
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto p-8 space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Opportunity Not Found</h2>
        <p className="text-xs text-slate-500">
          This opportunity may have been closed or is temporarily unavailable.
        </p>
        <Link href="/student/opportunities">
          <Button size="sm" className="rounded-xl font-bold text-xs">
            Back to Opportunities
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16 max-w-5xl mx-auto">
      {/* ─── BREADCRUMB ──────────────────────────────────────────────────────── */}
      <Link
        href="/student/opportunities"
        className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Opportunity Hub
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ─── LEFT COLUMN: OPPORTUNITY CONTENT (2 cols) ────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200/80 rounded-3xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                    {opp.company}
                  </span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {opp.title}
                  </h1>
                </div>

                <button
                  onClick={handleToggleSave}
                  disabled={togglingSave}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[var(--color-accent)] hover:bg-slate-50 transition-all shrink-0"
                  title={isSaved ? 'Saved to bookmarks' : 'Save opportunity'}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-5 w-5 text-[var(--color-accent)] fill-[var(--color-accent)]" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-white">
                  {opp.type}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <MapPin className="inline h-3.5 w-3.5 mr-1 text-slate-400" /> {opp.location}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                  {opp.workMode}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <Briefcase className="inline h-3.5 w-3.5 mr-1 text-slate-400" /> {opp.experience || '0–1 years'}
                </span>
              </div>

              {/* About Description */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  About the Opportunity
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {opp.description}
                </p>
              </div>

              {/* Key Responsibilities */}
              {opp.responsibilities && opp.responsibilities.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Key Responsibilities
                  </h3>
                  <ul className="space-y-1.5 pl-1">
                    {opp.responsibilities.map((r, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-[var(--color-accent)] font-bold shrink-0 mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Eligibility */}
              {opp.eligibility && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Eligibility Criteria
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {opp.eligibility}
                  </p>
                </div>
              )}

              {/* Required Skills Table */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Required Competencies & Benchmarks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {matchResult?.skills.map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                        s.met
                          ? 'bg-emerald-50/60 border-emerald-200/90 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          {s.met ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-amber-500 font-bold">×</span>
                          )}
                          <span>{s.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Benchmark: {s.requiredLevel} pts
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-xs">
                          {s.currentLevel > 0 ? `${s.currentLevel} pts` : 'Unassessed'}
                        </span>
                        {!s.met && (
                          <Link
                            href={getAssessmentRouteForSkill(s.name)}
                            className="block text-[10px] font-bold text-[var(--color-accent)] hover:underline mt-0.5"
                          >
                            Take Benchmark →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN: MATCH INTELLIGENCE & APPLY (1 col) ──────────────── */}
        <div className="space-y-6">
          {/* Match Intelligence Card */}
          <Card className="border border-slate-200/80 rounded-3xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Your Skill Match
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {matchResult?.readyStatus}
                </span>
              </div>

              {/* Large Score */}
              <div className="text-center py-2 space-y-1">
                <div className="text-4xl font-black text-slate-900 tracking-tight">
                  {matchResult?.matchPercentage}%
                </div>
                <div className="text-xs font-bold text-slate-600">
                  {matchResult?.matchStatus} ({matchResult?.skillsMetCount} of {matchResult?.totalSkillsCount} Skills Met)
                </div>
              </div>

              {/* Why you match */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block">Why You Match:</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {matchResult?.matchExplanation}
                </p>
              </div>

              {/* Matched list */}
              {matchResult && matchResult.matchedSkillNames.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> You already match:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pl-4">
                    {matchResult.matchedSkillNames.map((name, idx) => (
                      <span key={idx} className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        ✓ {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing list */}
              {matchResult && matchResult.missingSkillNames.length > 0 && (
                <div className="space-y-1.5 text-xs pt-2">
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Skills to improve:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pl-4">
                    {matchResult.missingSkillNames.map((name, idx) => (
                      <span key={idx} className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                        × {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadline & Compensation */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>Application Deadline:</span>
                  <strong className="text-slate-900 font-bold">{opp.deadlineLabel}</strong>
                </div>
                {opp.stipend && (
                  <div className="flex justify-between items-center">
                    <span>Stipend / CTC:</span>
                    <strong className="text-slate-900 font-bold">{opp.stipend}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Duration:</span>
                  <strong className="text-slate-900 font-bold">{opp.duration}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                {hasApplied ? (
                  <Button
                    disabled
                    className="w-full h-10 rounded-xl text-xs font-bold bg-slate-100 text-emerald-700 border border-emerald-200 cursor-default"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" /> Applied ✓
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowApplyModal(true)}
                    className="w-full h-10 rounded-xl text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs"
                  >
                    Apply for this Opportunity
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleToggleSave}
                  className="w-full h-10 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  {isSaved ? 'Saved in Bookmarks' : 'Save Opportunity'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── MODAL: APPLY TO OPPORTUNITY ───────────────────────────────────── */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Application Submission</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Apply to {opp.company}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Role: <strong className="text-slate-800">{opp.title}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApplyModal(false)
                  setErrorMsg(null)
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
                    <span>Your Match:</span>
                    <strong className="text-slate-900 font-bold">{matchResult?.matchPercentage}% ({matchResult?.matchStatus})</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Deadline:</span>
                    <strong className="text-slate-900 font-bold">{opp.deadlineLabel}</strong>
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
                    placeholder="Highlight your key verified skills, projects, and why you are interested in this position..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setShowApplyModal(false)}
                    disabled={isApplying}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-5"
                  >
                    {isApplying ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...</> : 'Confirm & Submit Application'}
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