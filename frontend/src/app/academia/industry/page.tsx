"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Briefcase,
  TrendingUp,
  BarChart3,
  Building2,
  Presentation,
  Loader2,
  Info,
  Sparkles,
  ArrowRight,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDemo } from "@/lib/demo/demo-context"
import { demoService } from "@/lib/demo/demo-service"
import { apiClient } from "@/lib/api-client"

interface IndustryDemandData {
  hasEnoughData: boolean
  message?: string
  totalOpportunitiesCount: number
  topSkills: Array<{
    name: string
    category: string
    count: number
    percentage: number
  }>
  topRoles: Array<{
    title: string
    count: number
    percentage: number
  }>
}

export default function AcademiaIndustryPage() {
  const { isDemo } = useDemo()
  const [data, setData] = useState<IndustryDemandData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDemand = async () => {
    try {
      setLoading(true)
      if (isDemo) {
        setData(demoService.getIndustryDemand())
        setLoading(false)
        return
      }

      const json = await apiClient<{ success: boolean; data: IndustryDemandData }>('/api/academia/industry')
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Error fetching industry demand:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDemand()
  }, [isDemo])

  return (
    <div className="space-y-8">
      {/* Demo Notice */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Demo Sandbox:</strong> Real-time hiring signals computed deterministically from corporate partner listings.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Real Industry Hiring Demand
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Real-time skill and role demand aggregated directly from published industry opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/academia/opportunities">
            <Button variant="outline" className="text-xs flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              View Opportunity Hub
            </Button>
          </Link>
          <Link href="/academia/skill-gaps">
            <Button variant="outline" className="text-xs flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Cohort Gaps
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-xs text-[var(--color-text-muted)]">Analyzing market hiring signals...</p>
        </div>
      ) : !data || !data.hasEnoughData || data.totalOpportunitiesCount === 0 ? (
        <div className="p-12 text-center rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] space-y-4 max-w-2xl mx-auto">
          <Info className="h-10 w-10 text-[var(--color-text-muted)] mx-auto" />
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
            Awaiting Sufficient Industry Data
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {data?.message || 'SkillBridge Connect computes industry demand strictly from verified opportunities published by corporate hiring partners. As partners publish roles, live frequency and hiring trends will populate automatically.'}
          </p>
          <div className="pt-2">
            <Link href="/academia/opportunities">
              <Button size="sm" className="bg-[var(--color-accent)] text-white text-xs">
                Browse Active Opportunities
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Active Opportunities</span>
              <div className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{data.totalOpportunitiesCount}</div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Published corporate openings</p>
            </div>

            <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Top In-Demand Competency</span>
              <div className="mt-3 text-2xl font-bold text-[var(--color-accent)]">
                {data.topSkills[0]?.name || 'Full Stack Development'}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Requested in {data.topSkills[0]?.percentage || 0}% of postings
              </p>
            </div>

            <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Leading Job Role</span>
              <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {data.topRoles[0]?.title || 'Software Engineer'}
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                {data.topRoles[0]?.percentage || 0}% of all published positions
              </p>
            </div>
          </div>

          {/* Grid of Top Skills and Roles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top In-Demand Skills */}
            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Most Requested Skills</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Frequencies across verified industry requirements</p>
                </div>
                <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
              </div>

              <div className="space-y-4 pt-2">
                {data.topSkills.map((s, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--color-text-primary)]">{s.name}</span>
                      <span className="font-mono text-[var(--color-text-muted)]">{s.count} postings ({s.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-surface-card-hover)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Hiring Roles */}
            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">In-Demand Roles & Titles</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Active hiring quotas by opportunity title</p>
                </div>
                <Briefcase className="h-4 w-4 text-emerald-600" />
              </div>

              <div className="space-y-4 pt-2">
                {data.topRoles.map((r, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--color-text-primary)]">{r.title}</span>
                      <span className="font-mono text-[var(--color-text-muted)]">{r.count} role(s) ({r.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-surface-card-hover)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
