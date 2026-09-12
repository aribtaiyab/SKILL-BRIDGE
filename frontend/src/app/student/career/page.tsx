"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search, ChevronRight, Code, Database, Shield, Layout, Settings,
  Loader2, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, TrendingUp,
  Brain, SlidersHorizontal, Target, BookOpen, Layers, Check, Clock,
  Smartphone, Briefcase, Cpu, ArrowDown, HelpCircle, FileText
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { CareerTargetOption } from "@/types"
import {
  CAREER_BENCHMARK_PROFILES,
  getCareerRoadmap,
  CareerRoadmapNode
} from "@/lib/benchmarks"

export interface CareerSkillItem {
  skillId: string
  skillName: string
  category: string
  requiredLevel: number
  importance: 'High' | 'Medium' | 'Low'
  weight: number
  selfDeclaredScore: number
  verifiedScore: number
  status: 'ready' | 'improve' | 'critical'
  isAssessed: boolean
  attemptCount: number
  latestScore: number | null
}

export interface RoadmapStage {
  stageNumber: number
  title: string
  description: string
  durationMinutes: number
  topics: string[]
  keyTakeaway: string
  careerRelevance: string
  isCompleted: boolean
}

export interface SkillRoadmapDetail {
  skill: string
  career: string
  overview: string
  initialScore: number
  targetScore: number
  gap: number
  estimatedHours: number
  prerequisites: string[]
  stages: RoadmapStage[]
  projects: string[]
  next_step: string
  source: 'ai_generated' | 'skillbridge_canonical'
}

export default function CareerTargetPage() {
  const defaultList: CareerTargetOption[] = CAREER_BENCHMARK_PROFILES.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    match: 0,
    opps: 0,
    description: c.description,
  }))

  const [careers, setCareers] = useState<CareerTargetOption[]>(defaultList)
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ─── Career Target Skills & Self-Score State ────────────────────────────────
  const [careerSkills, setCareerSkills] = useState<CareerSkillItem[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [selfScores, setSelfScores] = useState<Record<string, number>>({})
  const [savingSelfScores, setSavingSelfScores] = useState(false)
  const [hasSavedSkills, setHasSavedSkills] = useState(false)

  // ─── AI Skill Roadmap Modal State ──────────────────────────────────────────
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false)
  const [activeRoadmapSkill, setActiveRoadmapSkill] = useState<string | null>(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapDetail, setRoadmapDetail] = useState<SkillRoadmapDetail | null>(null)

  // Canonical assessment lookup
  const getAssessmentForSkill = (skillName?: string) => {
    const norm = (skillName || '').toLowerCase()
    if (norm.includes('react')) return { id: 'assess-l1-react-basics', skill: 'React.js', title: 'React Component Architecture & Hooks' }
    if (norm.includes('mongo')) return { id: 'assess-l1-mongodb-core', skill: 'MongoDB', title: 'MongoDB Aggregations & Document Modeling' }
    if (norm.includes('express')) return { id: 'assess-l1-express-core', skill: 'Express.js', title: 'Express.js Middleware & Routing' }
    if (norm.includes('auth') || norm.includes('security')) return { id: 'assess-l1-auth-security', skill: 'Authentication', title: 'Authentication, JWT & Web Security' }
    if (norm.includes('deploy') || norm.includes('docker') || norm.includes('cloud')) return { id: 'assess-l1-deployment-cloud', skill: 'Deployment', title: 'Containerization, Docker & Cloud Deployment' }
    if (norm.includes('dsa') || norm.includes('algorithm') || norm.includes('problem')) return { id: 'assess-l1-dsa-core', skill: 'Problem Solving / DSA', title: 'Data Structures & Algorithmic Problem Solving' }
    if (norm.includes('html')) return { id: 'assess-l1-html-basics', skill: 'HTML', title: 'Semantic HTML5 & Web Standards' }
    if (norm.includes('css')) return { id: 'assess-l1-css-layouts', skill: 'CSS', title: 'Modern CSS, Flexbox & Responsive Layouts' }
    if (norm.includes('sql') || norm.includes('database')) return { id: 'assess-l1-sql-indexing', skill: 'SQL', title: 'SQL Joins & Relational Indexing' }
    if (norm.includes('rest') || norm.includes('api')) return { id: 'assess-l1-rest-design', skill: 'REST APIs', title: 'RESTful API Standards & Status Codes' }
    if (norm.includes('git') || norm.includes('version')) return { id: 'assess-l1-git-workflows', skill: 'Git & Version Control', title: 'Git Workflows & Version Control Mastery' }
    if (norm.includes('js') || norm.includes('javascript')) return { id: 'assess-l1-javascript-core', skill: 'JavaScript', title: 'JavaScript Language Knowledge Benchmark' }
    if (norm.includes('node') || norm.includes('backend')) return { id: 'assess-l1-nodejs-loop', skill: 'Node.js', title: 'Node.js Event Loop & Asynchronous Architecture' }
    if (norm.includes('python')) return { id: 'assess-l1-python-core', skill: 'Python', title: 'Python Core & Data Structures' }
    return { id: 'assess-l1-nodejs-loop', skill: skillName || 'Core Fundamentals', title: `${skillName || 'Skill'} Knowledge Benchmark` }
  }

  // Filter career list by search term
  const filteredCareers = useMemo(() => {
    if (!searchTerm.trim()) return careers
    const query = searchTerm.toLowerCase().trim()
    return careers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.slug.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    )
  }, [careers, searchTerm])

  const activeCareer = careers.find(c => c.id === selectedCareerId || c.slug === selectedCareerId) || careers[0] || null

  // Dynamic Career Roadmap steps for the currently selected career
  const activeRoadmapNodes = useMemo(() => {
    if (!activeCareer) return getCareerRoadmap('fullstack')
    return getCareerRoadmap(activeCareer.slug || activeCareer.id)
  }, [activeCareer])

  // 1. Initial Load: Fetch careers catalog & student's active career target
  useEffect(() => {
    async function loadInitialData() {
      try {
        const careersRes = await apiClient<{
          success: boolean
          data: Array<{ id: string; name: string; slug: string; description?: string | null; category?: string }>
        }>('/api/student/career-targets')

        let loadedList = defaultList
        if (careersRes.data && careersRes.data.length > 0) {
          loadedList = careersRes.data.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            match: 0,
            opps: 0,
            description: c.description || undefined,
          }))
          setCareers(loadedList)
        }

        const targetRes = await apiClient<{
          success: boolean
          data: {
            target_career_id?: string | null
            career_targets?: { id?: string; name?: string; slug?: string } | null
          } | null
        }>('/api/student/career-target')

        let activeId =
          targetRes.data?.target_career_id ||
          targetRes.data?.career_targets?.id

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const targetSlug = params.get('target')
          if (targetSlug) {
            const matched = loadedList.find(c => c.slug === targetSlug || c.id === targetSlug)
            if (matched) activeId = matched.id
          }
        }

        if (activeId) {
          setSelectedCareerId(activeId)
        } else if (loadedList.length > 0) {
          const defaultTarget = loadedList.find(c => c.slug === 'fullstack') || loadedList.find(c => c.slug === 'frontend') || loadedList[0]
          setSelectedCareerId(defaultTarget.id)
        }
      } catch (err) {
        console.warn('Fallback to local career benchmarks:', err)
        if (defaultList.length > 0) {
          setSelectedCareerId(defaultList[0].id)
        }
      }
    }

    loadInitialData()
  }, [])

  // 2. Load Career Skills whenever selected career changes
  const loadCareerSkills = useCallback(async (careerId: string) => {
    setLoadingSkills(true)
    try {
      const res = await apiClient<{
        success: boolean
        skills?: CareerSkillItem[]
        data?: CareerSkillItem[]
      }>(`/api/student/career-target/skills?career_id=${careerId}`)

      const skillsList = res.skills || res.data || []
      setCareerSkills(skillsList)

      const scoreMap: Record<string, number> = {}
      let anyScoreExists = false
      skillsList.forEach(s => {
        const score = s.selfDeclaredScore ?? 0
        scoreMap[s.skillId] = score
        if (score > 0 || s.verifiedScore > 0) anyScoreExists = true
      })
      setSelfScores(scoreMap)
      setHasSavedSkills(anyScoreExists)
    } catch (err) {
      console.warn('Could not load career target skills from API, using benchmark fallback:', err)
      const benchmark = CAREER_BENCHMARK_PROFILES.find(c => c.id === careerId || c.slug === activeCareer?.slug) || CAREER_BENCHMARK_PROFILES[0]
      const fallbackList: CareerSkillItem[] = Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: b.skillId || `skill-${benchmark.slug}-${idx + 1}`,
        skillName: name,
        category: b.category || 'Engineering',
        requiredLevel: b.required,
        importance: b.weight >= 0.1 ? 'High' : 'Medium',
        weight: b.weight,
        selfDeclaredScore: 0,
        verifiedScore: 0,
        status: 'critical',
        isAssessed: false,
        attemptCount: 0,
        latestScore: null,
      }))
      setCareerSkills(fallbackList)
      const scoreMap: Record<string, number> = {}
      fallbackList.forEach(s => { scoreMap[s.skillId] = 0 })
      setSelfScores(scoreMap)
      setHasSavedSkills(false)
    } finally {
      setLoadingSkills(false)
    }
  }, [activeCareer])

  useEffect(() => {
    if (!selectedCareerId) return
    loadCareerSkills(selectedCareerId)
  }, [selectedCareerId, loadCareerSkills])

  // Save selected career target to profile
  const handleSelectCareer = async (careerId: string) => {
    setSelectedCareerId(careerId)
    try {
      await apiClient('/api/student/career-target', {
        method: 'PATCH',
        body: JSON.stringify({ target_career_id: careerId }),
      })
    } catch {
      // Ignored
    }
  }

  // 3. Save Skills (Bulk save to Supabase student_skills)
  const handleSaveSkills = async () => {
    if (!selectedCareerId || careerSkills.length === 0) return
    setSavingSelfScores(true)
    setSaveStatus(null)
    setSaveError(null)

    try {
      const payload = {
        careerTargetId: selectedCareerId,
        skills: careerSkills.map(s => ({
          skillId: s.skillId,
          skillName: s.skillName,
          selfScore: Number(selfScores[s.skillId] ?? 0),
        })),
      }

      const res = await apiClient<{
        success: boolean
        message: string
        skills?: CareerSkillItem[]
      }>('/api/student/career-target/skills', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res.success) {
        setHasSavedSkills(true)
        setSaveStatus('Skills saved successfully to your profile! Real skill gaps have been calculated below.')
        await loadCareerSkills(selectedCareerId)
      } else {
        setSaveError('Failed to save skills. Please try again.')
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save skills.')
    } finally {
      setSavingSelfScores(false)
      setTimeout(() => {
        setSaveStatus(null)
        setSaveError(null)
      }, 5000)
    }
  }

  // 4. Open AI-Generated Skill Roadmap Modal
  const handleOpenSkillRoadmap = async (skillName: string, skillId?: string) => {
    setActiveRoadmapSkill(skillName)
    setRoadmapModalOpen(true)
    setRoadmapLoading(true)
    setRoadmapDetail(null)

    const targetSkill = careerSkills.find(s => s.skillName.toLowerCase() === skillName.toLowerCase() || (skillId && s.skillId === skillId))
    const currentScore = targetSkill ? (targetSkill.verifiedScore > 0 ? targetSkill.verifiedScore : (selfScores[targetSkill.skillId] ?? 0)) : 50
    const targetScore = targetSkill ? targetSkill.requiredLevel : 80

    try {
      const res = await apiClient<{
        success: boolean
        data: SkillRoadmapDetail
      }>('/api/ai/skill-roadmap', {
        method: 'POST',
        timeoutMs: 35000,
        body: JSON.stringify({
          skill_id: skillId || targetSkill?.skillId,
          skill_name: skillName,
          career_target_id: selectedCareerId,
          career_target_name: activeCareer?.name || 'Software Engineer',
          currentScore,
          targetScore,
        }),
      })

      if (res.success && res.data) {
        setRoadmapDetail(res.data)
      }
    } catch (err) {
      console.warn('Could not fetch AI roadmap:', err)
    } finally {
      setRoadmapLoading(false)
    }
  }

  // 5. Authoritative Skill Gap & Priority Calculations
  const calculatedSkillGaps = useMemo(() => {
    return careerSkills.map(s => {
      const selfScore = selfScores[s.skillId] ?? s.selfDeclaredScore ?? 0
      const currentScore = s.verifiedScore > 0 ? s.verifiedScore : selfScore
      const gap = Math.max(s.requiredLevel - currentScore, 0)
      const gapRatio = s.requiredLevel > 0 ? gap / s.requiredLevel : 0

      // Weights: High = 1.0, Medium = 0.7, Low = 0.4
      const importanceWeight = s.importance === 'High' ? 1.0 : s.importance === 'Medium' ? 0.7 : 0.4
      const priorityScore = gapRatio * importanceWeight

      // Classification: gap = 0 -> ready, gap 1-14 -> improve, gap >= 15 -> critical
      const tier: 'critical' | 'improve' | 'ready' =
        gap === 0 ? 'ready' : gap >= 15 ? 'critical' : 'improve'

      return {
        skillId: s.skillId,
        skillName: s.skillName,
        category: s.category,
        requiredLevel: s.requiredLevel,
        currentScore,
        selfDeclaredScore: selfScore,
        verifiedScore: s.verifiedScore,
        isVerified: s.verifiedScore > 0,
        gap,
        gapRatio,
        importance: s.importance,
        priorityScore,
        tier,
      }
    }).sort((a, b) => {
      if (a.tier === 'ready' && b.tier !== 'ready') return 1
      if (b.tier === 'ready' && a.tier !== 'ready') return -1
      return b.priorityScore - a.priorityScore
    })
  }, [careerSkills, selfScores])

  // Highest priority weak skill for "What Should I Learn First?"
  const topPrioritySkill = useMemo(() => {
    const weakSkills = calculatedSkillGaps.filter(s => s.gap > 0)
    return weakSkills.length > 0 ? weakSkills[0] : null
  }, [calculatedSkillGaps])

  const criticalGaps = useMemo(() => calculatedSkillGaps.filter(s => s.tier === 'critical'), [calculatedSkillGaps])
  const improveGaps = useMemo(() => calculatedSkillGaps.filter(s => s.tier === 'improve'), [calculatedSkillGaps])
  const readySkills = useMemo(() => calculatedSkillGaps.filter(s => s.tier === 'ready'), [calculatedSkillGaps])

  const getIcon = (slug?: string) => {
    switch (slug) {
      case 'backend': case 'python-developer': case 'java-developer': return <Database className="h-4 w-4" />
      case 'frontend': return <Layout className="h-4 w-4" />
      case 'mobile-developer': return <Smartphone className="h-4 w-4" />
      case 'fullstack': case 'software-engineer': return <Code className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'devops': return <Settings className="h-4 w-4" />
      case 'data-analyst': case 'data-scientist': return <TrendingUp className="h-4 w-4" />
      case 'business-analyst': return <Briefcase className="h-4 w-4" />
      case 'ai-ml': case 'ai-engineer': return <Brain className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-20 max-w-7xl mx-auto">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">CAREER TARGET</h1>
            <Badge className="bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border-[var(--color-border-primary)] text-[11px] font-bold px-2 py-0.5">
              <Target className="h-3 w-3 mr-1 inline text-[var(--color-accent)]" /> Skill Intelligence
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select your target career, declare your proficiency, identify priority skill gaps, and follow your progression roadmap.
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* TWO-PANEL LAYOUT                                                         */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ─── LEFT SIDE: CAREER TARGET SELECTION (4 cols on lg) ───────────────── */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 sticky top-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Target Careers
            </h2>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredCareers.length} roles
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search careers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:bg-white transition-all"
            />
          </div>

          {/* Vertical Career List */}
          <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredCareers.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No career matches found for &quot;{searchTerm}&quot;.
              </div>
            ) : (
              filteredCareers.map((career) => {
                const isSelected = activeCareer?.id === career.id || activeCareer?.slug === career.slug
                return (
                  <div
                    key={career.id}
                    onClick={() => handleSelectCareer(career.id)}
                    className={`cursor-pointer rounded-xl p-2.5 transition-all duration-150 border ${
                      isSelected
                        ? 'border-[var(--color-accent)] bg-blue-50/60 ring-1 ring-[var(--color-accent)]/30 shadow-2xs'
                        : 'border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getIcon(career.slug)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className={`font-bold text-xs truncate ${isSelected ? 'text-[var(--color-accent-hover)] font-black' : 'text-slate-900'}`}>
                            {career.name}
                          </h3>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[var(--color-accent)] shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {career.description || 'Industry competency benchmark.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT SIDE: 6-STEP CAREER JOURNEY (8 cols on lg) ────────────────── */}
        <div className="lg:col-span-8 space-y-5">
          {activeCareer ? (
            <>
              {/* ──────────────────────────────────────────────────────────────── */}
              {/* STEP 1: SELECTED CAREER HEADER (Compact & Elegant)               */}
              {/* ──────────────────────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2 py-0.5 rounded-md">
                        Selected Career
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {careerSkills.length} Required Skills
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {activeCareer.name}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                      {activeCareer.description || 'Comprehensive competency profile and progressive career path.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenSkillRoadmap(careerSkills[0]?.skillName || activeRoadmapNodes[0]?.skillName || 'Core Fundamentals')}
                      className="rounded-xl text-xs font-bold text-[var(--color-accent-hover)] hover:bg-[var(--color-surface-secondary)] border-slate-200 h-8 px-3"
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-[var(--color-accent)]" /> AI Roadmap
                    </Button>
                  </div>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────────── */}
              {/* STEP 2: YOUR SKILLS (Compact Skill Rows / Rating Cards)          */}
              {/* ──────────────────────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      YOUR SKILLS
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      What does this career require and how much do you know? Rate your current level (0–100).
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                    Score: 0 (Beginner) → 100 (Expert)
                  </span>
                </div>

                {loadingSkills ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
                  </div>
                ) : careerSkills.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200">
                    No required skills configured for this career.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {careerSkills.map((cs) => {
                      const currentScore = selfScores[cs.skillId] ?? 0
                      const isVerified = cs.verifiedScore > 0
                      const isReady = currentScore >= cs.requiredLevel

                      return (
                        <div
                          key={cs.skillId}
                          className={`rounded-xl border p-3 transition-all ${
                            isReady
                              ? 'border-emerald-200/80 bg-emerald-50/20'
                              : 'border-slate-200/80 bg-slate-50/40 hover:bg-white'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {/* Skill Info & Benchmarks */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-900">
                                  {cs.skillName}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  Required: <strong className="text-slate-800">{cs.requiredLevel}</strong>
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[var(--color-accent)]">
                                  Your: <strong className={isReady ? 'text-emerald-700' : 'text-slate-800'}>{currentScore}</strong>
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  isVerified
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isVerified ? 'ASSESSMENT VERIFIED' : 'SELF DECLARED'}
                                </span>
                              </div>
                            </div>

                            {/* Direct Number Input */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <span className="text-[11px] font-medium text-slate-400">Level:</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={currentScore}
                                onChange={(e) => {
                                  const val = Math.min(Math.max(Number(e.target.value) || 0, 0), 100)
                                  setSelfScores(prev => ({ ...prev, [cs.skillId]: val }))
                                }}
                                className="w-12 px-1.5 py-0.5 text-center font-bold text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                              />
                              <span className="text-[11px] font-semibold text-slate-400">/ 100</span>
                            </div>
                          </div>

                          {/* Slider */}
                          <div className="mt-2 flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={currentScore}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setSelfScores(prev => ({ ...prev, [cs.skillId]: val }))
                              }}
                              className="w-full accent-[var(--color-accent)] cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                            />
                            <span className={`text-[10px] font-bold shrink-0 w-20 text-right ${
                              isReady ? 'text-emerald-600' : currentScore >= 40 ? 'text-amber-600' : 'text-slate-400'
                            }`}>
                              {isReady ? '✓ Target Met' : `${Math.max(cs.requiredLevel - currentScore, 0)} pts gap`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ──────────────────────────────────────────────────────────────── */}
                {/* STEP 3: SAVE SKILLS (Compact Natural Button & Status Bar)        */}
                {/* ──────────────────────────────────────────────────────────────── */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    {saveStatus && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        {saveStatus}
                      </div>
                    )}
                    {saveError && (
                      <div className="p-2.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        {saveError}
                      </div>
                    )}
                    {!saveStatus && !saveError && (
                      <p className="text-[11px] text-slate-400">
                        Saving calculates your authoritative Skill Gap and priority target below.
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSaveSkills}
                    disabled={savingSelfScores || careerSkills.length === 0}
                    className="h-9 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs hover:-translate-y-0.5 transition-all shrink-0 w-full sm:w-auto"
                  >
                    {savingSelfScores ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Save My Skills
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────────── */}
              {/* STEP 4: WHAT SHOULD I LEARN FIRST? (Compact Priority Card)       */}
              {/* ──────────────────────────────────────────────────────────────── */}
              {hasSavedSkills && topPrioritySkill && (
                <div className="bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 rounded-2xl border border-amber-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🎯</span>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                        WHAT SHOULD I LEARN FIRST?
                      </h3>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                      Highest Priority Gap
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-7 space-y-1">
                      <h4 className="text-base font-black text-slate-900">
                        {topPrioritySkill.skillName}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Addressing this <span className="font-bold text-slate-800">{topPrioritySkill.gap} point gap</span> in {topPrioritySkill.importance.toLowerCase()} importance competency yields your fastest readiness increase for {activeCareer.name}.
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <span className="text-slate-500">Your level: <strong className="text-slate-800">{topPrioritySkill.currentScore} / 100</strong></span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">Required: <strong className="text-slate-800">{topPrioritySkill.requiredLevel} / 100</strong></span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-700 font-bold">Gap: {topPrioritySkill.gap} pts</span>
                      </div>
                    </div>

                    <div className="sm:col-span-5 flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0">
                      {(() => {
                        const targetAssessment = getAssessmentForSkill(topPrioritySkill.skillName)
                        return (
                          <Link
                            href={`/student/assessment?skill=${encodeURIComponent(targetAssessment.skill)}&assessmentId=${targetAssessment.id}&autostart=true`}
                            className="w-full sm:w-auto"
                          >
                            <Button size="sm" className="w-full sm:w-auto h-8 px-3.5 rounded-xl text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs">
                              Start Assessment <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        )
                      })()}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSkillRoadmap(topPrioritySkill.skillName, topPrioritySkill.skillId)}
                        className="w-full sm:w-auto h-8 px-3 rounded-xl text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100 bg-white"
                      >
                        <Sparkles className="mr-1 h-3 w-3 text-amber-600" /> View Roadmap
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────────── */}
              {/* STEP 5: YOUR SKILL GAP (Compact Grouped Critical / Improve / Ready) */}
              {/* ──────────────────────────────────────────────────────────────── */}
              {hasSavedSkills && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                        YOUR SKILL GAP
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Categorized gap analysis against canonical {activeCareer.name} benchmark.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-rose-600">🔴 {criticalGaps.length} Critical</span>
                      <span className="text-amber-600">🟠 {improveGaps.length} Improve</span>
                      <span className="text-emerald-600">🟢 {readySkills.length} Ready</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {/* 🔴 Critical Gaps */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-rose-900 uppercase tracking-wider flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" /> Critical ({criticalGaps.length})
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">Gap ≥ 15</span>
                      </div>
                      <div className="space-y-1.5">
                        {criticalGaps.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-2">No critical skill gaps.</p>
                        ) : (
                          criticalGaps.map(g => (
                            <div
                              key={g.skillId}
                              className="p-2.5 rounded-lg bg-white border border-rose-100 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 truncate">{g.skillName}</span>
                                <span className="text-[10px] font-bold text-slate-500">{g.currentScore}/{g.requiredLevel}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                                <span className="text-rose-600 font-bold">Gap: {g.gap} pts</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenSkillRoadmap(g.skillName, g.skillId)}
                                    className="text-[var(--color-accent)] font-bold hover:underline"
                                  >
                                    Roadmap
                                  </button>
                                  <span className="text-slate-200">|</span>
                                  {(() => {
                                    const a = getAssessmentForSkill(g.skillName)
                                    return (
                                      <Link
                                        href={`/student/assessment?skill=${encodeURIComponent(a.skill)}&assessmentId=${a.id}&autostart=true`}
                                        className="text-amber-700 font-bold hover:underline"
                                      >
                                        Assess
                                      </Link>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 🟠 Needs Improvement */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-amber-900 uppercase tracking-wider flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Needs Improvement ({improveGaps.length})
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Gap 1–14</span>
                      </div>
                      <div className="space-y-1.5">
                        {improveGaps.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-2">No moderate gaps.</p>
                        ) : (
                          improveGaps.map(g => (
                            <div
                              key={g.skillId}
                              className="p-2.5 rounded-lg bg-white border border-amber-100 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 truncate">{g.skillName}</span>
                                <span className="text-[10px] font-bold text-slate-500">{g.currentScore}/{g.requiredLevel}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                                <span className="text-amber-600 font-bold">Gap: {g.gap} pts</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenSkillRoadmap(g.skillName, g.skillId)}
                                    className="text-[var(--color-accent)] font-bold hover:underline"
                                  >
                                    Roadmap
                                  </button>
                                  <span className="text-slate-200">|</span>
                                  {(() => {
                                    const a = getAssessmentForSkill(g.skillName)
                                    return (
                                      <Link
                                        href={`/student/assessment?skill=${encodeURIComponent(a.skill)}&assessmentId=${a.id}&autostart=true`}
                                        className="text-amber-700 font-bold hover:underline"
                                      >
                                        Assess
                                      </Link>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 🟢 Ready */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[11px] text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Ready ({readySkills.length})
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Gap 0</span>
                      </div>
                      <div className="space-y-1.5">
                        {readySkills.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-2">No skills at target benchmark yet.</p>
                        ) : (
                          readySkills.map(g => (
                            <div
                              key={g.skillId}
                              className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 truncate">{g.skillName}</span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              </div>
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                                <span className="text-emerald-700 font-bold">Score: {g.currentScore}/{g.requiredLevel}</span>
                                <button
                                  onClick={() => handleOpenSkillRoadmap(g.skillName, g.skillId)}
                                  className="text-[var(--color-accent)] font-bold hover:underline"
                                >
                                  Roadmap
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────────── */}
              {/* STEP 6: CAREER ROADMAP (Positioned at Bottom of Right Panel)     */}
              {/* ──────────────────────────────────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      CAREER ROADMAP — {activeCareer.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Step-by-step career progression path. Click any stage to inspect learning details or start assessment.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {activeRoadmapNodes.length} Steps
                  </span>
                </div>

                {/* Horizontal Scrollable Connected Roadmap Nodes */}
                <div className="relative overflow-x-auto pb-2 pt-1">
                  <div className="flex items-stretch gap-2.5 min-w-max">
                    {activeRoadmapNodes.map((node, idx) => {
                      const matchedSkill = careerSkills.find(s => s.skillName.toLowerCase() === node.skillName.toLowerCase())
                      const currentScore = matchedSkill ? (matchedSkill.verifiedScore > 0 ? matchedSkill.verifiedScore : (selfScores[matchedSkill.skillId] ?? 0)) : 0
                      const isMet = matchedSkill && matchedSkill.requiredLevel > 0 && currentScore >= matchedSkill.requiredLevel

                      return (
                        <div key={idx} className="flex items-center gap-2.5">
                          <div
                            onClick={() => handleOpenSkillRoadmap(node.skillName)}
                            className={`cursor-pointer rounded-xl p-3 border transition-all duration-150 w-48 shrink-0 flex flex-col justify-between hover:shadow-sm hover:-translate-y-0.5 ${
                              isMet
                                ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                                : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                  Step {node.step}
                                </span>
                                {isMet ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                    <Check className="h-2.5 w-2.5" /> Ready
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-400">
                                    {node.category}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                                {node.title}
                              </h4>
                              <p className="text-[10px] font-semibold text-[var(--color-accent)] mt-0.5">
                                {node.skillName}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                                {node.description}
                              </p>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-medium">
                                Level: <strong className="text-slate-700">{currentScore}/100</strong>
                              </span>
                              <span className="text-[var(--color-accent)] font-bold flex items-center gap-0.5">
                                Roadmap <ChevronRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>

                          {/* Arrow connector between steps */}
                          {idx < activeRoadmapNodes.length - 1 && (
                            <div className="text-slate-300 shrink-0 select-none">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              Please select a career target from the left panel.
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* AI SKILL ROADMAP MODAL                                                   */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {roadmapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]">
                    {roadmapDetail?.source === 'ai_generated' ? 'AI Learning Roadmap' : 'SkillBridge Roadmap'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{activeCareer?.name}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {activeRoadmapSkill} Learning Roadmap
                </h3>
              </div>
              <button
                onClick={() => setRoadmapModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {roadmapLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent)]" />
                  <p className="text-xs font-medium text-slate-600">Generating structured learning path for {activeRoadmapSkill}...</p>
                </div>
              ) : roadmapDetail ? (
                <div className="space-y-4">
                  {/* Overview Banner */}
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold text-slate-900 mb-0.5">Roadmap Overview:</p>
                    {roadmapDetail.overview}
                  </div>

                  {/* Prerequisites */}
                  {roadmapDetail.prerequisites && roadmapDetail.prerequisites.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Prerequisites</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {roadmapDetail.prerequisites.map((p, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stages Timeline */}
                  <div className="space-y-2.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Learning Stages ({roadmapDetail.stages.length})</h4>
                    <div className="space-y-2.5">
                      {roadmapDetail.stages.map((stage) => (
                        <div key={stage.stageNumber} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                              <span className="h-5 w-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">
                                {stage.stageNumber}
                              </span>
                              {stage.title}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3" /> {stage.durationMinutes} min
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{stage.description}</p>

                          {stage.topics && stage.topics.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1">
                              {stage.topics.map((t, tIdx) => (
                                <span key={tIdx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Immediate Next Step */}
                  {roadmapDetail.next_step && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                      <span className="font-bold block text-emerald-950">Recommended Immediate Action:</span>
                      <p>{roadmapDetail.next_step}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Failed to load roadmap details.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setRoadmapModalOpen(false)} className="text-xs h-8">
                Close
              </Button>
              {activeRoadmapSkill && (() => {
                const targetAssessment = getAssessmentForSkill(activeRoadmapSkill)
                return (
                  <Link href={`/student/assessment?skill=${encodeURIComponent(targetAssessment.skill)}&assessmentId=${targetAssessment.id}&autostart=true`}>
                    <Button size="sm" className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-xs h-8">
                      Take {activeRoadmapSkill} Assessment <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
