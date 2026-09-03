"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft, Building, MapPin, Briefcase, Calendar, CheckCircle2,
  AlertTriangle, Bot, AlertCircle, Loader2, Bookmark, BookmarkCheck,
  Clock, TrendingUp, ChevronRight, Sparkles
} from "lucide-react"
import { buildMatchExplanation } from "@/lib/intelligence/matching"

interface OpportunityDetail {
  id: string
  title: string
  company: string
  type: string
  location: string
  workMode: string
  duration: string
  deadline: string | null
  deadlineLabel: string
  isDeadlineSoon: boolean
  isDeadlinePassed: boolean
  description: string
  matchPercentage: number
  readinessCategory: string
  skillsMetCount: number
  totalSkillsCount: number
  mainBlocker: string | null
  skills: { name: string; met: boolean; currentLevel: number; requiredLevel: number; gap: number; importance: string }[]
  verifiedSkills: { name: string; score: string }[]
  missingSkills: { name: string; reqLevel: number; gap: number }[]
  readinessSummary: string
  recommendedAction: string
  nextSteps: { action: string; href: string }[]
  eligibilityDescription: string | null
}

function getDeadlineInfo(deadline: string | null): { label: string; isSoon: boolean; isPassed: boolean } {
  if (!deadline) return { label: 'Rolling Applications', isSoon: false, isPassed: false }
  const now = new Date()
  const d = new Date(deadline)
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'Closed', isSoon: false, isPassed: true }
  if (diffDays <= 7) return { label: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, isSoon: true, isPassed: false }
  return {
    label: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    isSoon: false,
    isPassed: false,
  }
}

export default function OpportunityDetailsPage() {
  const params = useParams()
  const opportunityId = typeof params?.id === 'string' ? params.id : ''

  const [opp, setOpp] = useState<OpportunityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [savingState, setSavingState] = useState(false)
  const [error, setError] = useState("")
  const [coverLetter, setCoverLetter] = useState("")

  const [proofCoverage, setProofCoverage] = useState<any>(null)

  useEffect(() => {
    if (!opportunityId) return
    setLoading(true)

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/opportunities/${opportunityId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/opportunities/${opportunityId}/readiness`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/applications`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/student/opportunities/saved`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/opportunities/${opportunityId}/proof`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([oppRes, readRes, appsRes, savedRes, proofRes]) => {
      const d = oppRes?.success ? oppRes.data : null
      const readData = readRes?.success ? readRes.data : null
      if (proofRes?.success && proofRes.data?.coverage) {
        setProofCoverage(proofRes.data.coverage)
      }

      // Check if already applied
      if (appsRes?.success && appsRes.data) {
        const alreadyApplied = (appsRes.data as any[]).some(
          (a: any) => a.opportunities?.id === opportunityId
        )
        if (alreadyApplied) setHasApplied(true)
      }

      // Check if saved
      if (savedRes?.success && savedRes.data) {
        const alreadySaved = (savedRes.data as any[]).some((s: any) => s.id === opportunityId)
        if (alreadySaved) setIsSaved(true)
      }

      const deadline = d?.deadline || null
      const deadlineInfo = getDeadlineInfo(deadline)

      const skills = readData
        ? readData.skills.map((s: any) => ({
            name: s.skillName,
            met: s.met,
            currentLevel: s.currentLevel,
            requiredLevel: s.requiredLevel,
            gap: s.gap,
            importance: s.importance || 'High',
          }))
        : (d?.opportunity_skills || []).map((os: any) => ({
            name: os.skills?.name || 'Skill',
            met: false,
            currentLevel: 0,
            requiredLevel: os.minimum_level || 60,
            gap: os.minimum_level || 60,
            importance: os.importance || 'High',
          }))

      const verifiedSkills = skills.filter((s: any) => s.met).map((s: any) => ({
        name: s.name,
        score: `${s.currentLevel} / ${s.requiredLevel} Req`,
      }))
      const missingSkills = skills.filter((s: any) => !s.met).map((s: any) => ({
        name: s.name,
        reqLevel: s.requiredLevel,
        gap: s.gap,
      }))

      // Build explanation using Phase 6 matching service
      let readinessSummary = 'View your readiness below.'
      let recommendedAction = ''
      let nextSteps: { action: string; href: string }[] = []

      if (readData) {
        const explanation = buildMatchExplanation(readData, opportunityId)
        readinessSummary = explanation.summary
        recommendedAction = explanation.recommendedAction
        nextSteps = explanation.nextSteps
      }

      setOpp({
        id: opportunityId,
        title: d?.title || 'Opportunity',
        company: d?.industry_profiles?.organization_name || 'Enterprise Partner',
        type: d?.opportunity_type || 'Internship',
        location: d?.location || 'Remote',
        workMode: d?.work_mode || 'hybrid',
        duration: d?.duration || 'Flexible',
        deadline,
        deadlineLabel: deadlineInfo.label,
        isDeadlineSoon: deadlineInfo.isSoon,
        isDeadlinePassed: deadlineInfo.isPassed,
        description: d?.description || 'Opportunity details provided by the host organization.',
        matchPercentage: readData?.matchPercentage || 0,
        readinessCategory: readData?.readinessCategory || '',
        skillsMetCount: readData?.skillsMetCount || 0,
        totalSkillsCount: readData?.totalSkillsCount || skills.length,
        mainBlocker: readData?.mainBlocker || null,
        skills,
        verifiedSkills,
        missingSkills,
        readinessSummary,
        recommendedAction,
        nextSteps,
        eligibilityDescription: d?.eligibility_description || null,
      })
    }).finally(() => setLoading(false))
  }, [opportunityId])

  const handleApply = async () => {
    setIsApplying(true)
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId, cover_letter: coverLetter }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setHasApplied(true)
      } else if (json.error?.code === 'DUPLICATE') {
        setHasApplied(true)
      } else if (json.error?.code === 'DEADLINE_PASSED') {
        setError('The deadline for this opportunity has passed.')
      } else if (json.error?.code === 'UNAUTHORIZED') {
        setError('Please sign in to apply for opportunities.')
      } else {
        setError(json.error?.message || 'Could not submit application. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsApplying(false)
    }
  }

  const handleSave = async () => {
    setSavingState(true)
    try {
      const method = isSaved ? 'DELETE' : 'POST'
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/opportunities/${opportunityId}/save`, { method })
      if (res.ok) setIsSaved(!isSaved)
    } catch {
      // noop
    } finally {
      setSavingState(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading opportunity...</p>
        </div>
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-10 w-10 text-[var(--color-critical)] mx-auto mb-3" />
        <h2 className="text-xl font-semibold mb-2">Opportunity Not Found</h2>
        <p className="text-[var(--color-text-secondary)] mb-6">This opportunity may have been removed or is no longer available.</p>
        <Link href="/student/opportunities">
          <Button>Back to Opportunities</Button>
        </Link>
      </div>
    )
  }

  const matchVariant = opp.matchPercentage >= 85 ? 'success' : opp.matchPercentage >= 65 ? 'warning' : 'critical'

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <Link href="/student/opportunities" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Opportunities
      </Link>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* LEFT: Opportunity Details */}
        <div className="flex-1 space-y-6">
          <Card className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline">{opp.type}</Badge>
                  {opp.isDeadlinePassed && <Badge variant="secondary">Closed</Badge>}
                  {opp.isDeadlineSoon && !opp.isDeadlinePassed && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                      <Clock className="h-3 w-3" /> {opp.deadlineLabel}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{opp.title}</h1>
                <p className="text-lg text-[var(--color-text-secondary)] mt-1">{opp.company}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-[var(--color-border-primary)] text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>{opp.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>{opp.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span>Deadline: {opp.deadlineLabel}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">About the Opportunity</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{opp.description}</p>
              </div>

              {/* Skill Breakdown Table */}
              {opp.skills.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Required Skills</h3>
                  <div className="space-y-2">
                    {opp.skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]">
                        <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${skill.met ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-warning)]/10'}`}>
                          {skill.met
                            ? <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                            : <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{skill.name}</span>
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {skill.currentLevel > 0 ? `${skill.currentLevel} / ${skill.requiredLevel}` : `Req: ${skill.requiredLevel}`}
                            </span>
                          </div>
                          <div className="relative h-1.5 w-full bg-[var(--color-border-primary)] rounded-full overflow-hidden">
                            <div
                              className={`absolute top-0 left-0 h-full rounded-full transition-all ${skill.met ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`}
                              style={{ width: `${skill.currentLevel > 0 ? Math.min(skill.currentLevel, 100) : 0}%` }}
                            />
                            <div className="absolute top-0 h-full w-0.5 bg-[var(--color-foreground)]/30" style={{ left: `${skill.requiredLevel}%` }} />
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{skill.importance}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {opp.eligibilityDescription && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Eligibility</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{opp.eligibilityDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Readiness Sidebar */}
        <div className="w-full md:w-80 space-y-4">
          {/* Readiness Score Card */}
          <Card className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">
                  Opportunity Readiness
                </p>
                {opp.matchPercentage > 0 ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-bold ${opp.matchPercentage >= 65 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                        {opp.matchPercentage}%
                      </span>
                      <Badge variant={matchVariant}>{opp.readinessCategory || 'Match'}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">{opp.readinessSummary}</p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Sign in to see your personalized readiness score.
                  </p>
                )}
              </div>

              {opp.verifiedSkills.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[var(--color-border-primary)]">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Satisfied</p>
                  {opp.verifiedSkills.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" /> {s.name}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">{s.score}</span>
                    </div>
                  ))}
                </div>
              )}

              {opp.missingSkills.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-[var(--color-border-primary)]">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Skill Gaps</p>
                  {opp.missingSkills.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-[var(--color-warning)]">
                        <AlertTriangle className="h-3.5 w-3.5" /> {s.name}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">Gap: {s.gap} pts</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Apply Section */}
              <div className="pt-3 space-y-3 border-t border-[var(--color-border-primary)]">
                {!hasApplied && !opp.isDeadlinePassed && (
                  <textarea
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Optional: Add a message to the employer..."
                    className="w-full min-h-[70px] rounded-md border border-[var(--color-border-primary)] p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none bg-transparent"
                  />
                )}
                {hasApplied ? (
                  <div className="p-3 bg-green-50 text-[var(--color-success)] rounded-lg text-center text-sm font-medium border border-green-200">
                    <CheckCircle2 className="inline-block mr-1.5 h-4 w-4" /> Application Submitted
                  </div>
                ) : opp.isDeadlinePassed ? (
                  <div className="p-3 bg-gray-50 text-gray-500 rounded-lg text-center text-sm border border-gray-200">
                    This opportunity is closed
                  </div>
                ) : (
                  <Button
                    className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Apply with Skill Passport'}
                  </Button>
                )}

                <button
                  onClick={handleSave}
                  disabled={savingState}
                  className="w-full flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  {isSaved
                    ? <><BookmarkCheck className="h-4 w-4 text-[var(--color-accent)]" /> Saved</>
                    : <><Bookmark className="h-4 w-4" /> Save for later</>}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* What to Do Next */}
          {opp.nextSteps.length > 0 && !hasApplied && (
            <Card className="border-[var(--color-border-primary)] shadow-sm">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--color-accent)]" /> What to do next
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">{opp.recommendedAction}</p>
                <div className="space-y-2">
                  {opp.nextSteps.map((step, i) => (
                    <Link key={i} href={step.href} className="flex items-center justify-between text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium group">
                      <span>{step.action}</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Coach CTA */}
          <Card className="border-[var(--color-border-primary)] shadow-sm bg-[var(--color-surface-secondary)]">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Ask the AI Coach</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Get a personalized preparation plan for this specific opportunity.
                  </p>
                  <Link href={`/student/ai-coach?opportunity=${opp.id}`} className="mt-3 block">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Get Coaching Plan
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}