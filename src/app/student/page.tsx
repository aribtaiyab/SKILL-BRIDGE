"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Bot, Target, AlertTriangle, FileText, CheckCircle2, TrendingUp, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth/context"
import { CareerReadinessResult } from "@/lib/intelligence/engine"

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const [readiness, setReadiness] = useState<CareerReadinessResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/student/readiness')
        const json = await res.json()
        if (json.success && json.data) {
          setReadiness(json.data)
        }
      } catch (err) {
        console.warn("Failed to load student dashboard intelligence:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading skill intelligence...</p>
        </div>
      </div>
    )
  }

  const d = readiness || {
    careerName: 'Backend Developer',
    readinessPercentage: 78,
    readinessCategory: 'Ready',
    readinessVariant: 'success' as const,
    skills: [
      { skillId: 's1', skillName: 'Node.js', currentLevel: 65, requiredLevel: 80, gap: 15, status: 'critical' as const, isAssessed: true },
      { skillId: 's2', skillName: 'REST APIs', currentLevel: 72, requiredLevel: 75, gap: 3, status: 'needs_improvement' as const, isAssessed: true },
      { skillId: 's3', skillName: 'SQL', currentLevel: 82, requiredLevel: 70, gap: 0, status: 'ready' as const, isAssessed: true },
      { skillId: 's4', skillName: 'Git', currentLevel: 75, requiredLevel: 60, gap: 0, status: 'ready' as const, isAssessed: true },
    ],
    priorityGap: {
      skillName: 'Node.js',
      gap: 15,
      recommendation: 'Complete targeted practice and take the Node.js practical challenge to close the 15-point gap.',
    },
  }

  const studentName = profile?.full_name || user?.email?.split('@')[0] || 'Student'

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Welcome back, {studentName}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Here is your verified skill intelligence overview for today.</p>
        </div>
      </div>

      {/* Top Area: Readiness Overview */}
      <Card className="border-[var(--color-border-primary)] shadow-sm">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-primary)]">
            <div className="p-6 md:col-span-1 bg-[var(--color-surface-secondary)]">
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Career Target</p>
              <h3 className="text-h3 font-semibold text-[var(--color-foreground)] mb-4">{d.careerName}</h3>
              
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Career Readiness</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-[var(--color-success)]">{d.readinessPercentage}%</span>
                <Badge variant={d.readinessVariant || 'success'} className="mb-1 text-xs">{d.readinessCategory}</Badge>
              </div>
              <Progress value={d.readinessPercentage} className="h-2" />
            </div>

            <div className="p-6 md:col-span-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">Priority Insight</Badge>
                </div>
                <h4 className="font-semibold text-base mb-1">
                  {d.priorityGap ? `Top Focus: ${d.priorityGap.skillName} (${d.priorityGap.gap} pts to target)` : 'All Core Skill Benchmarks Satisfied'}
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {d.priorityGap?.recommendation || 'You are well-prepared for opportunities matching your career target.'}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link href="/student/assessment">
                  <Button size="sm">
                    Take Skill Assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/student/career">
                  <Button size="sm" variant="outline">
                    Explore Career Requirements
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Skills Breakdown & Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-[var(--color-border-primary)] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Skill Benchmark Breakdown</CardTitle>
                <CardDescription>Verified capability versus target career requirements</CardDescription>
              </div>
              <Link href="/student/skills">
                <Button variant="ghost" size="sm" className="text-xs text-[var(--color-accent)]">
                  View all skills
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {d.skills.map((skill) => (
                <div key={skill.skillId} className="space-y-1.5 p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{skill.skillName}</span>
                    <span className="text-xs font-semibold">{skill.currentLevel} / {skill.requiredLevel}</span>
                  </div>
                  <Progress value={(skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100} className="h-1.5" />
                  <div className="flex justify-between text-xs text-[var(--color-text-secondary)] pt-0.5">
                    <span>{skill.gap > 0 ? `${skill.gap} pts below benchmark` : 'Benchmark satisfied'}</span>
                    <span className="capitalize">{skill.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-[var(--color-border-primary)] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Intelligence Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/student/assessment" className="flex items-center justify-between p-3 rounded-md hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] transition-all">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="text-sm font-medium">Take Assessment</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </Link>

              <Link href="/student/skill-gap" className="flex items-center justify-between p-3 rounded-md hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] transition-all">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
                  <span className="text-sm font-medium">Skill Gap Analysis</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </Link>

              <Link href="/student/passport" className="flex items-center justify-between p-3 rounded-md hover:bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] transition-all">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                  <span className="text-sm font-medium">Skill Passport</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}