"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, ChevronRight, Code, Database, Shield, Layout, Settings, Loader2, AlertTriangle, ArrowRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { CareerTargetOption } from "@/types"
import { CareerReadinessResult } from "@/lib/intelligence/engine"

export default function CareerTargetPage() {
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null)
  const [careers, setCareers] = useState<CareerTargetOption[]>([])
  const [loadingCareers, setLoadingCareers] = useState(true)
  const [readinessData, setReadinessData] = useState<CareerReadinessResult | null>(null)
  const [loadingReadiness, setLoadingReadiness] = useState(true)
  const [persisting, setPersisting] = useState(false)
  const [savingSkillId, setSavingSkillId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const filteredCareers = useMemo(() => careers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [careers, searchTerm])
  const activeCareer = careers.find(c => c.id === selectedCareerId) || careers[0]

  useEffect(() => {
    async function loadData() {
      try {
        const careersResponse = await apiClient<{ success: boolean; data: Array<{ id: string; name: string; slug: string; description?: string | null; category?: string }> }>('/api/student/career-targets')
        const list = (careersResponse.data || []).map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          match: 0,
          opps: 0,
          description: c.description || undefined,
        }))
        setCareers(list)

        const targetResponse = await apiClient<{ success: boolean; data: { target_career_id?: string | null; career_targets?: { id?: string; name?: string; slug?: string } | null } | null }>('/api/student/career-target')
        const targetCareer = targetResponse.data?.career_targets || null
        const currentCareerId = targetResponse.data?.target_career_id || targetCareer?.id || null
        if (currentCareerId) {
          setSelectedCareerId(currentCareerId)
        } else if (list[0]) {
          setSelectedCareerId(list[0].id)
        }
      } catch (err) {
        console.warn('Could not load career target data:', err)
      } finally {
        setLoadingCareers(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    async function loadReadiness() {
      if (!selectedCareerId) {
        setReadinessData(null)
        setLoadingReadiness(false)
        return
      }

      setLoadingReadiness(true)
      try {
        const json = await apiClient<{ success: boolean; data: CareerReadinessResult | null }>(`/api/student/readiness?career_id=${selectedCareerId}`)
        if (json.success && json.data) {
          setReadinessData(json.data)
        } else {
          setReadinessData(null)
        }
      } catch (err) {
        console.warn('Could not load readiness:', err)
        setReadinessData(null)
      } finally {
        setLoadingReadiness(false)
      }
    }

    if (!loadingCareers) {
      loadReadiness()
    }
  }, [selectedCareerId, loadingCareers])

  const handleSaveCareer = async () => {
    if (!selectedCareerId) return
    setPersisting(true)
    setSaveStatus(null)

    try {
      await apiClient('/api/student/career-target', {
        method: 'PATCH',
        body: JSON.stringify({ target_career_id: selectedCareerId }),
      })
      setSaveStatus('Career target saved successfully.')
    } catch (err: any) {
      setSaveStatus(err?.message || 'Unable to save career target.')
    } finally {
      setPersisting(false)
    }
  }

  const handleSelfDeclare = async (skillId: string, level: string) => {
    if (!level) return
    setSavingSkillId(skillId)
    try {
      await apiClient('/api/student/skills', {
        method: 'POST',
        body: JSON.stringify({ skill_id: skillId, self_declared_level: Number(level) }),
      })
      const json = await apiClient<{ success: boolean; data: CareerReadinessResult | null }>(`/api/student/readiness?career_id=${selectedCareerId}`)
      if (json.success && json.data) setReadinessData(json.data)
    } catch (err: any) {
      setSaveStatus(err?.message || 'Unable to save your skill information.')
    } finally {
      setSavingSkillId(null)
    }
  }

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'backend': return <Database className="h-5 w-5" />
      case 'frontend': return <Layout className="h-5 w-5" />
      case 'fullstack': return <Code className="h-5 w-5" />
      case 'security': return <Shield className="h-5 w-5" />
      case 'devops': return <Settings className="h-5 w-5" />
      default: return <Database className="h-5 w-5" />
    }
  }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 font-semibold">Career Target</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Select your target role to evaluate readiness, required skills, and real career gaps.</p>
        </div>
        <Button onClick={handleSaveCareer} disabled={!selectedCareerId || persisting}>
          {persisting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Career Target'}
        </Button>
      </div>

      {saveStatus && <p className="text-sm text-[var(--color-success)]">{saveStatus}</p>}

      <div className="grid lg:grid-cols-3 gap-8">
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
                onClick={() => setSelectedCareerId(career.id)}
                className={`cursor-pointer transition-all border ${
                  selectedCareerId === career.id 
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] ring-1 ring-[var(--color-accent)]' 
                    : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${
                      selectedCareerId === career.id 
                        ? 'bg-[var(--color-accent)] text-white' 
                        : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
                    }`}>
                      {getIcon(career.slug)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{career.name}</h4>
                      <span className="text-xs text-[var(--color-text-secondary)]">{career.description || 'Career track'}</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${selectedCareerId === career.id ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {loadingReadiness ? (
            <Card className="min-h-[300px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
            </Card>
          ) : readinessData ? (
            <>
              <Card className="border-[var(--color-border-primary)] shadow-sm bg-[var(--color-surface-card)]">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">Target Benchmark</Badge>
                      <CardTitle className="text-h2 font-semibold">{readinessData.careerName || activeCareer?.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {activeCareer?.description || 'Career readiness based on the selected target.'}
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

              <Card className="border-[var(--color-border-primary)] shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Required Skills & Current Verified Scores</CardTitle>
                  <CardDescription>Each required skill is mapped to real industry benchmarks and the user’s scored data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {readinessData.skills.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">No skill requirements configured for this career yet.</p>
                  ) : readinessData.skills.map((skill) => (
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
                          <span>Current Verified: <strong className="text-[var(--color-foreground)]">{skill.isAssessed ? skill.currentLevel : 'Not Assessed'}</strong></span>
                          <span>Required: <strong className="text-[var(--color-foreground)]">{skill.requiredLevel}</strong></span>
                        </div>
                        <Progress value={(skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100} className="h-1.5" />
                      </div>

                      {!skill.isAssessed && (
                        <div className="flex flex-col gap-2 rounded-md border border-dashed border-[var(--color-border-primary)] p-3 text-xs">
                          <span className="text-[var(--color-text-secondary)]">Tell us your current level. This will remain Self-Declared until assessed.</span>
                          <select
                            defaultValue=""
                            disabled={savingSkillId === skill.skillId}
                            onChange={(event) => handleSelfDeclare(skill.skillId, event.target.value)}
                            className="rounded-md border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] px-2 py-1.5 text-sm"
                          >
                            <option value="">Not Assessed</option>
                            {[0, 20, 40, 60, 75, 90, 100].map(level => <option key={level} value={level}>{level} / 100</option>)}
                          </select>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] pt-1">
                        <span>{skill.gap > 0 ? `${skill.gap} points to close` : 'Requirement satisfied'}</span>
                        <Link href="/student/assessment">
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-[var(--color-accent)] hover:underline p-0">
                            Verify Skill <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="min-h-[250px] flex items-center justify-center border-dashed">
              <p className="text-sm text-[var(--color-text-secondary)]">Choose a career target to view readiness and skill requirements.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
