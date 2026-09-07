"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Users,
  Presentation,
  BookOpen,
  Filter,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SkillGapItem {
  skillId: string
  skillName: string
  category: string
  affectedStudentsCount: number
  avgCurrentLevel: number
  industryBenchmark: number
  avgGap: number
  severity: 'critical' | 'needs_improvement' | 'ready'
  relatedCareers: string[]
  suggestedAction: string
}

interface GapSummary {
  criticalCount: number
  needsImprovementCount: number
  readyCount: number
  totalGapsTracked: number
  uniqueStudentsAffected: number
}

import { useDemo } from "@/lib/demo/demo-context"

export default function AcademiaSkillGapsPage() {
  const { isDemo, demoService } = useDemo()
  const [gaps, setGaps] = useState<SkillGapItem[]>([])
  const [summary, setSummary] = useState<GapSummary>({
    criticalCount: 0,
    needsImprovementCount: 0,
    readyCount: 0,
    totalGapsTracked: 0,
    uniqueStudentsAffected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [careerFilter, setCareerFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  // Workshop Creation Modal
  const [showWorkshopModal, setShowWorkshopModal] = useState(false)
  const [targetSkill, setTargetSkill] = useState<{ id: string; name: string } | null>(null)
  const [workshopTitle, setWorkshopTitle] = useState('')
  const [workshopDate, setWorkshopDate] = useState('')
  const [workshopDuration, setWorkshopDuration] = useState('2 Hours')
  const [workshopCapacity, setWorkshopCapacity] = useState(35)
  const [submittingWorkshop, setSubmittingWorkshop] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchGaps = async () => {
    try {
      setLoading(true)

      if (isDemo) {
        const res = demoService.getAggregatedSkillGaps(careerFilter, severityFilter)
        setGaps(res.gaps as any)
        setSummary(res.summary)
        setLoading(false)
        return
      }

      const params = new URLSearchParams()
      if (careerFilter !== 'all') params.append('career', careerFilter)
      if (severityFilter !== 'all') params.append('severity', severityFilter)

      const res = await fetch(`/api/academia/skill-gaps?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setGaps(json.data.gaps || [])
        setSummary(json.data.summary || {
          criticalCount: 0,
          needsImprovementCount: 0,
          readyCount: 0,
          totalGapsTracked: 0,
          uniqueStudentsAffected: 0,
        })
      }
    } catch (err) {
      console.error('Failed to fetch skill gaps:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGaps()
  }, [careerFilter, severityFilter, isDemo])

  const openWorkshopModalForSkill = (skillId: string, skillName: string) => {
    setTargetSkill({ id: skillId, name: skillName })
    setWorkshopTitle(`Hands-On Masterclass: ${skillName} Intensive`)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 3)
    setWorkshopDate(tomorrow.toISOString().split('T')[0])
    setShowWorkshopModal(true)
  }

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetSkill || !workshopTitle || !workshopDate) return

    try {
      setSubmittingWorkshop(true)

      if (isDemo) {
        demoService.addWorkshop({
          title: workshopTitle,
          skillId: targetSkill.id,
          date: workshopDate,
          duration: workshopDuration,
          capacity: workshopCapacity,
          description: `Targeted academic workshop aimed at closing cohort deficit in ${targetSkill.name}.`,
        })
        setShowWorkshopModal(false)
        setToastMessage(`Demo Simulation: Workshop "${workshopTitle}" staged in your session! Open in Workshops view.`)
        setTimeout(() => setToastMessage(null), 5000)
        setSubmittingWorkshop(false)
        return
      }

      const res = await fetch('/api/academia/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: workshopTitle,
          skillId: targetSkill.id,
          date: workshopDate,
          duration: workshopDuration,
          capacity: workshopCapacity,
          description: `Targeted academic workshop aimed at closing cohort deficit in ${targetSkill.name}.`,
          status: 'scheduled',
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create workshop')
      }
      setShowWorkshopModal(false)
      setToastMessage(`Workshop "${workshopTitle}" published successfully! Registered for students.`)
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      alert(err.message || 'Error creating workshop')
    } finally {
      setSubmittingWorkshop(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Cohort Skill Gaps & Deficit Heatmap
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Aggregated opportunity-specific deficit analysis across your enrolled student body
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/academia/workshops">
            <Button variant="outline" className="text-xs flex items-center gap-1.5">
              <Presentation className="h-3.5 w-3.5" />
              Manage Workshops
            </Button>
          </Link>
          <Link href="/academia/interventions">
            <Button variant="outline" className="text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              Intervention Hub
            </Button>
          </Link>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-[var(--radius-card)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Critical Gaps</span>
            <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{summary.criticalCount}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">&ge; 15 pts below industry benchmark</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Needs Improvement</span>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{summary.needsImprovementCount}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">1 &ndash; 14 pts from benchmark</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Benchmarks Met</span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{summary.readyCount}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Full industry benchmark satisfied</p>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Students Affected</span>
            <div className="h-8 w-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{summary.uniqueStudentsAffected}</div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Unique learners with active deficits</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Deficit Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Deficits (&ge;15 pts)</option>
            <option value="needs_improvement">Developing (1-14 pts)</option>
            <option value="ready">Ready (0 pts)</option>
          </select>

          <select
            value={careerFilter}
            onChange={(e) => setCareerFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="all">All Career Tracks</option>
            <option value="Backend">Backend Engineering</option>
            <option value="Frontend">Frontend Engineering</option>
            <option value="Full Stack">Full Stack</option>
            <option value="Cloud">Cloud / DevOps</option>
            <option value="Data">Data & AI</option>
          </select>

          {(severityFilter !== 'all' || careerFilter !== 'all') && (
            <button
              onClick={() => {
                setSeverityFilter('all')
                setCareerFilter('all')
              }}
              className="text-xs text-[var(--color-accent)] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Aggregated Table */}
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Skill Competency Deficits</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Grouped by skill across all career targets in your department</p>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            Showing <strong className="text-[var(--color-text-primary)]">{gaps.length}</strong> aggregated skill(s)
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            <p className="text-xs text-[var(--color-text-muted)]">Analyzing cohort skill deficits...</p>
          </div>
        ) : gaps.length === 0 ? (
          <div className="py-16 text-center space-y-2 px-4">
            <Info className="h-8 w-8 text-[var(--color-text-muted)] mx-auto" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">No skill deficits detected</p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
              Either your students have met all role benchmarks, or no students have taken assessments for the selected filter criteria yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-card-hover)]/30 text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Skill & Category</th>
                  <th className="py-3 px-4 text-center">Affected Students</th>
                  <th className="py-3 px-4 text-center">Cohort Avg Score</th>
                  <th className="py-3 px-4 text-center">Industry Benchmark</th>
                  <th className="py-3 px-4 text-center">Deficit Gap</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4">Recommended Action</th>
                  <th className="py-3 px-4 text-right">Faculty Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-primary)] text-[var(--color-text-secondary)]">
                {gaps.map((item) => (
                  <tr key={item.skillId} className="hover:bg-[var(--color-surface-card-hover)] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[var(--color-text-primary)]">{item.skillName}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{item.category}</div>
                      {item.relatedCareers?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.relatedCareers.slice(0, 2).map((c, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-surface-card-hover)] text-[var(--color-text-muted)] border border-[var(--color-border-primary)]">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
                        <Users className="h-3 w-3 text-[var(--color-text-muted)]" />
                        {item.affectedStudentsCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium">
                      {item.avgCurrentLevel}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium">
                      {item.industryBenchmark}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {item.avgGap > 0 ? (
                        <span className={item.avgGap >= 15 ? 'text-rose-500' : 'text-amber-500'}>
                          -{item.avgGap} pts
                        </span>
                      ) : (
                        <span className="text-emerald-500">0 (Met)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : item.severity === 'needs_improvement'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}>
                        {item.severity === 'critical' ? 'Critical Deficit' : item.severity === 'needs_improvement' ? 'Developing' : 'Ready'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-[11px] text-[var(--color-text-secondary)]">
                      {item.suggestedAction}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openWorkshopModalForSkill(item.skillId, item.skillName)}
                          className="h-7 text-[11px] px-2.5 flex items-center gap-1 border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
                        >
                          <Presentation className="h-3 w-3" />
                          Schedule Workshop
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workshop Schedule Modal */}
      {showWorkshopModal && targetSkill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Schedule Targeted Workshop</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Address deficit in {targetSkill.name}</p>
              </div>
              <button
                onClick={() => setShowWorkshopModal(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateWorkshop} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Workshop Title</label>
                <input
                  type="text"
                  value={workshopTitle}
                  onChange={(e) => setWorkshopTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Date</label>
                  <input
                    type="date"
                    value={workshopDate}
                    onChange={(e) => setWorkshopDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Duration</label>
                  <select
                    value={workshopDuration}
                    onChange={(e) => setWorkshopDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="1 Hour">1 Hour</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="Half Day">Half Day (3-4 Hours)</option>
                    <option value="Full Day">Full Day (6 Hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Student Capacity</label>
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={workshopCapacity}
                  onChange={(e) => setWorkshopCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-primary)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWorkshopModal(false)}
                  disabled={submittingWorkshop}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingWorkshop}
                  className="bg-[var(--color-accent)] hover:opacity-90 text-white"
                >
                  {submittingWorkshop ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Workshop'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
