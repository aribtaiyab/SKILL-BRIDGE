"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Briefcase, Award, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { getInstitutionDashboardData, InstitutionDashboardStats } from "@/lib/database/institution"
import { useDemo } from "@/lib/demo/demo-context"

export default function InstitutionDashboardPage() {
  const { isDemo, institutionData } = useDemo()
  const [stats, setStats] = useState<InstitutionDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setStats({
        totalStudents: `${institutionData.totalStudentsEnrolled}`,
        overallReadiness: institutionData.overallReadiness,
        industryPlacements: 34,
        verifiedSkills: "184",
        departments: institutionData.departments.map(d => ({
          dept: d.name,
          score: d.avgReadiness,
          target: 80,
        })),
        topHiringPartners: [
          { name: "TechNova Solutions", hires: 12, avgMatch: 88 },
          { name: "Apex Cloud Labs", hires: 8, avgMatch: 82 },
        ],
      })
      setLoading(false)
      return
    }

    async function load() {
      try {
        const data = await getInstitutionDashboardData()
        setStats(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isDemo, institutionData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading institution analytics overview...</p>
        </div>
      </div>
    )
  }

  const s = stats!

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Institution Overview</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">High-level readiness and placement metrics for your student body.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Report</Button>
          <Link href="/institution/analytics">
             <Button>Deep Dive <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total Students</p>
              <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold">{s.totalStudents}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Across 4 departments</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Overall Readiness</p>
              <TrendingUp className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-success)]">{s.overallReadiness}%</div>
            <p className="text-xs text-[var(--color-success)] font-medium mt-1">↑ 4% vs last semester</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Industry Placements</p>
              <Briefcase className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold">{s.industryPlacements}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Offers accepted</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Verified Skills</p>
              <Award className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-accent)]">{s.verifiedSkills}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Total skills verified</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Readiness</CardTitle>
            <CardDescription>Average readiness score by department against their target careers.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
               {s.departments.map((d, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="font-medium">{d.dept}</span>
                     <span>
                       <span className={`font-bold ${d.score >= d.target ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>{d.score}%</span>
                     </span>
                   </div>
                   <div className="relative h-2 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
                     <div className="absolute top-0 left-0 h-full bg-[var(--color-border-primary)]" style={{ width: `${d.target}%` }} />
                     <div className={`absolute top-0 left-0 h-full ${d.score >= d.target ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`} style={{ width: `${d.score}%` }} />
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Hiring Partners</CardTitle>
            <CardDescription>Organizations hiring the most verified students.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {s.topHiringPartners.map((partner, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)] transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="h-8 w-8 bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] rounded flex items-center justify-center text-xs font-bold text-[var(--color-text-secondary)]">
                       {partner.name.substring(0,2).toUpperCase()}
                     </div>
                     <div>
                       <h4 className="font-semibold text-sm">{partner.name}</h4>
                       <p className="text-xs text-[var(--color-text-secondary)]">Avg Match: {partner.avgMatch}%</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-lg">{partner.hires}</div>
                     <div className="text-[10px] text-[var(--color-text-secondary)] uppercase">Hires</div>
                   </div>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}