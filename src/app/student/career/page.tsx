"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, Target, Briefcase, ChevronRight, Code, Database, Shield, Layout, Settings, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react"
import { getCareerTargets } from "@/lib/database/student"
import { CareerTargetOption } from "@/types"
import { CareerReadinessResult } from "@/lib/intelligence/engine"

export default function CareerTargetPage() {
  const [selectedCareer, setSelectedCareer] = useState("backend")
  const [careers, setCareers] = useState<CareerTargetOption[]>([])
  const [loadingCareers, setLoadingCareers] = useState(true)
  const [readinessData, setReadinessData] = useState<CareerReadinessResult | null>(null)
  const [loadingReadiness, setLoadingReadiness] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const list = await getCareerTargets()
        setCareers(list)
      } finally {
        setLoadingCareers(false)
      }
    }
    load()
  }, [])

  // Load live readiness for selected career
  useEffect(() => {
    async function loadReadiness() {
      setLoadingReadiness(true)
      try {
        const careerObj = careers.find(c => c.slug === selectedCareer)
        const url = careerObj?.id ? `/api/student/readiness?career_id=${careerObj.id}` : `/api/student/readiness`
        const res = await fetch(url)
        const json = await res.json()
        if (json.success && json.data) {
          setReadinessData(json.data)
        }
      } catch (err) {
        console.warn("Could not load readiness:", err)
      } finally {
        setLoadingReadiness(false)
      }
    }
    if (careers.length > 0) {
      loadReadiness()
    }
  }, [selectedCareer, careers])

  const getIcon = (slug: string) => {
    switch (slug) {
      case "backend": return <Database className="h-5 w-5" />
      case "frontend": return <Layout className="h-5 w-5" />
      case "fullstack": return <Code className="h-5 w-5" />
      case "security": return <Shield className="h-5 w-5" />
      case "devops": return <Settings className="h-5 w-5" />
      default: return <Database className="h-5 w-5" />
    }
  }

  const filteredCareers = careers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCareer = careers.find(c => c.slug === selectedCareer) || careers[0]

  if (loadingCareers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading career intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Career Target</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Select your target role to evaluate your readiness and specific skill gaps.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Career List */}
        <div className="space-y-4 lg:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input 
              type="text"
              placeholder="Search careers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-2">
            {filteredCareers.map((career) => (
              <Card 
                key={career.id}
                onClick={() => setSelectedCareer(career.slug)}
                className={`cursor-pointer transition-all border ${
                  selectedCareer === career.slug 
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] ring-1 ring-[var(--color-accent)]" 
                    : "border-[var(--color-border-primary)] hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)]"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${
                      selectedCareer === career.slug 
                        ? "bg-[var(--color-accent)] text-white" 
                        : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]"
                    }`}>
                      {getIcon(career.slug)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{career.name}</h4>
                      <span className="text-xs text-[var(--color-text-secondary)]">{career.opps || 12} opportunities</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${selectedCareer === career.slug ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic Intelligence for Selected Career */}
        <div className="lg:col-span-2 space-y-6">
          {loadingReadiness ? (
            <Card className="min-h-[300px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            </Card>
          ) : readinessData ? (
            <>
              {/* Readiness Banner */}
              <Card className="border-[var(--color-border-primary)] shadow-sm bg-[var(--color-surface-card)]">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">Target Benchmark</Badge>
                      <CardTitle className="text-h2 font-semibold">{readinessData.careerName || activeCareer?.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {activeCareer?.description || "High-demand engineering role focusing on API design, database systems, and service architecture."}
                      </CardDescription>
                    </div>
                    <div className="text-center sm:text-right shrink-0">
                      <div className="text-4xl font-bold text-[var(--color-success)]">{readinessData.readinessPercentage}%</div>
                      <Badge variant={readinessData.readinessVariant} className="mt-1">
                        {readinessData.readinessCategory}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                      <span>Overall Weighted Readiness</span>
                      <span>{readinessData.readinessPercentage}% Met</span>
                    </div>
                    <Progress value={readinessData.readinessPercentage} className="h-2" />
                  </div>

                  {readinessData.priorityGap && (
                    <div className="p-3.5 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-[var(--color-critical)] shrink-0 mt-0.5" />
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-foreground)]">Priority Gap: {readinessData.priorityGap.skillName}</strong> ({readinessData.priorityGap.gap} pts below requirement).
                        <p className="mt-0.5">{readinessData.priorityGap.recommendation}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Required Skills Breakdown */}
              <Card className="border-[var(--color-border-primary)] shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Required Skills & Current Verified Scores</CardTitle>
                  <CardDescription>Each skill is evaluated against industry minimum requirement levels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {readinessData.skills.map((skill) => (
                    <div key={skill.skillId} className="p-4 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{skill.skillName}</span>
                          <Badge variant="outline" className="text-xs">{skill.importance} Priority</Badge>
                        </div>
                        <Badge variant={skill.status === 'ready' ? 'success' : skill.status === 'critical' ? 'critical' : 'warning'}>
                          {skill.status === 'ready' ? 'Ready' : skill.status === 'critical' ? 'Critical Gap' : 'Needs Improvement'}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
                          <span>Current Verified: <strong className="text-[var(--color-foreground)]">{skill.currentLevel}</strong></span>
                          <span>Required: <strong className="text-[var(--color-foreground)]">{skill.requiredLevel}</strong></span>
                        </div>
                        <Progress value={(skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100} className="h-1.5" />
                      </div>

                      <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] pt-1">
                        <span>{skill.gap > 0 ? `${skill.gap} points to close` : 'Requirement satisfied'}</span>
                        <Link href="/student/assessment">
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-[var(--color-accent)] hover:underline p-0">
                            Verify Skill →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}