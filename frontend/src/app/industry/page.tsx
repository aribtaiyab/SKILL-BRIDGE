"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users, PlusCircle, CheckCircle2, TrendingUp, User, FileText, Loader2, Sparkles } from "lucide-react"
import { getIndustryDashboardData, IndustryDashboardStats } from "@/lib/database/industry"
import { useDemo } from "@/lib/demo/demo-context"

export default function IndustryDashboardPage() {
  const { isDemo, opportunities } = useDemo()
  const [stats, setStats] = useState<IndustryDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      const topOpp = opportunities[0]
      setStats({
        activeOpportunities: opportunities.length,
        matchedCandidates: topOpp?.candidates?.length || 4,
        avgVerifiedSkillLevel: 78,
        recentApplications: topOpp?.candidates?.length || 4,
        candidates: (topOpp?.candidates || []).map(c => ({
          name: c.name,
          role: topOpp.title,
          match: c.matchPercentage,
          skills: c.skills.map(s => s.name),
        })),
        inDemandSkills: [
          { skill: "Java", demand: "High", trend: "up" },
          { skill: "Spring Boot", demand: "High", trend: "up" },
          { skill: "SQL & Databases", demand: "Medium", trend: "flat" },
          { skill: "AWS / Cloud", demand: "Medium", trend: "up" },
        ],
      })
      setLoading(false)
      return
    }

    async function load() {
      try {
        const data = await getIndustryDashboardData()
        setStats(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isDemo, opportunities])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading industry intelligence pipeline...</p>
        </div>
      </div>
    )
  }

  const s = stats!

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Industry Dashboard</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Overview of your talent pipeline and active opportunities.</p>
        </div>
        <Link href="/industry/opportunities/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Opportunity
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Active Opportunities</p>
              <Briefcase className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold">{s.activeOpportunities}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Matched Candidates</p>
              <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold">{s.matchedCandidates}</div>
            <p className="text-xs text-[var(--color-accent)] mt-1 font-medium">+5 since yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Avg. Verified Skill Level</p>
              <CheckCircle2 className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold text-[var(--color-success)]">{s.avgVerifiedSkillLevel}%</div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Recent Applications</p>
              <FileText className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-3xl font-bold">{s.recentApplications}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Top Matched Candidates</CardTitle>
              <CardDescription>Based on your active role requirements</CardDescription>
            </div>
            <Link href="/industry/candidates">
              <Button variant="ghost" size="sm" className="text-[var(--color-accent)]">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.candidates.map((candidate, i) => (
              <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-secondary)] transition-colors">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="h-10 w-10 bg-[var(--color-surface-secondary)] rounded-full flex items-center justify-center border border-[var(--color-border-primary)]">
                    <User className="h-5 w-5 text-[var(--color-text-secondary)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{candidate.name}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">Matches: {candidate.role}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {candidate.skills.map((skill, sIdx) => (
                        <span key={sIdx} className="text-[10px] bg-[var(--color-surface-card)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <Badge variant="success" className="bg-[var(--color-success)] text-white">{candidate.match}% Match</Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs">View Profile</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In-Demand Skills</CardTitle>
            <CardDescription>Most requested across your org</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.inDemandSkills.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.skill}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{item.demand}</Badge>
                  {item.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
                  ) : (
                    <div className="w-4" />
                  )}
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-[var(--color-border-primary)]">
              <Button variant="outline" className="w-full text-xs">Update Requirements</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}