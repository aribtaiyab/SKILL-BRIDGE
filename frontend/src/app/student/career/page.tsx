"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Search, ChevronRight, Code, Database, Shield, Layout, Settings,
  Loader2, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, TrendingUp,
  Brain, FileText, Check, X, SlidersHorizontal, Microscope, ZapOff, Star
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { CareerTargetOption } from "@/types"
import { CareerReadinessResult } from "@/lib/intelligence/engine"
import { CAREER_BENCHMARK_PROFILES } from "@/lib/benchmarks"

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
  const [selectedCareerId, setSelectedCareerId] = useState<string>(defaultList[0].id)
  const [loadingCareers, setLoadingCareers] = useState(false)
  const [readinessData, setReadinessData] = useState<CareerReadinessResult | null>(null)
  const [loadingReadiness, setLoadingReadiness] = useState(false)
  const [persisting, setPersisting] = useState(false)
  const [savingSkillId, setSavingSkillId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // ─── Self-Rating state (Task 1) ────────────────────────────────────────────
  // self_rating_label values: 'never_used' | 'basic' | 'comfortable' | 'strong'
  // These are stored in student_self_ratings, NEVER in student_skills/skill_scores
  const [selfRatingOpen, setSelfRatingOpen] = useState(false)
  const selfRatingSkipped = useRef(false)
  const [selfRatings, setSelfRatings] = useState<Record<string, string>>({})   // skill_id → label
  const [savingSelfRatings, setSavingSelfRatings] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)

  // ─── AI Learning Roadmap Modal State ───────────────────────────────────────
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapData, setRoadmapData] = useState<any>(null)

  // ─── Calibration Insight state (Task 4) ────────────────────────────────────
  interface CalibrationPair {
    skillId: string
    skillName: string
    selfRatingLabel: string      // raw label, e.g. 'comfortable'
    selfRatingDisplay: string    // capitalised, e.g. 'Comfortable'
    verifiedScore: number
    requiredLevel: number
    isOverconfident: boolean     // verified < midpoint by ≥20
  }
  const [calibrationPairs, setCalibrationPairs] = useState<CalibrationPair[]>([])

  // Midpoints used ONLY to detect meaningful self-vs-verified mismatch — never displayed as scores
  const RATING_MIDPOINTS: Record<string, number> = {
    never_used:  10,
    basic:       35,
    comfortable: 65,
    strong:      90,
  }
  const RATING_DISPLAY: Record<string, string> = {
    never_used:  'Never used',
    basic:       'Basic',
    comfortable: 'Comfortable',
    strong:      'Strong',
  }

  const getVerificationBadgeInfo = (status?: string, isAssessed?: boolean, currentLevel?: number) => {
    const norm = (status || '').toLowerCase().trim()
    if (norm === 'institution_verified') {
      return {
        label: 'Institution Verified',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotClass: 'bg-indigo-500',
        isVerified: true,
      }
    }
    if (norm === 'evidence_verified') {
      return {
        label: 'Evidence Verified',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500',
        isVerified: true,
      }
    }
    if (norm === 'practical_verified') {
      return {
        label: 'Practical Verified',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        isVerified: true,
      }
    }
    if (norm === 'assessment_verified') {
      return {
        label: 'Assessment Verified',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
        isVerified: true,
      }
    }
    if (norm === 'self_declared' || (norm.includes('self') && currentLevel && currentLevel > 0)) {
      return {
        label: 'Self Declared',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        isVerified: false,
      }
    }
    return {
      label: 'Not Assessed',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400',
      isVerified: false,
    }
  }

  const getAssessmentForSkill = (skillName?: string) => {
    const norm = (skillName || '').toLowerCase()
    if (norm.includes('rest') || norm.includes('api')) {
      return { id: 'assess-l1-rest-design', skill: 'REST APIs', title: 'RESTful API Standards & Status Codes' }
    }
    if (norm.includes('sql') || norm.includes('database') || norm.includes('query')) {
      return { id: 'assess-l1-sql-indexing', skill: 'SQL', title: 'SQL Joins & Relational Indexing Benchmark' }
    }
    if (norm.includes('node')) {
      return { id: 'assess-l1-nodejs-loop', skill: 'Node.js', title: 'Node.js Event Loop & Concurrency Benchmark' }
    }
    if (norm.includes('git') || norm.includes('version')) {
      return { id: 'assess-l1-git-workflows', skill: 'Git & Version Control', title: 'Git Workflows & Version Control Mastery' }
    }
    if (norm.includes('react')) {
      return { id: 'assess-l1-react-basics', skill: 'React', title: 'React Component Architecture & Hooks Benchmark' }
    }
    return { id: 'assess-l1-backend-core', skill: skillName || 'Core Fundamentals', title: 'Knowledge Benchmark' }
  }

  const filteredCareers = useMemo(
    () => careers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [careers, searchTerm]
  )

  const activeCareer = careers.find(c => c.id === selectedCareerId) || careers[0]

  // Skill Discovery & Self-Declaration State
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false)
  const [discoveryTab, setDiscoveryTab] = useState<'role' | 'ai'>('role')
  const [experienceText, setExperienceText] = useState('')
  const [extractingAI, setExtractingAI] = useState(false)
  const [careerSkills, setCareerSkills] = useState<Array<{ skillId: string; skillName: string; category: string; requiredLevel: number; importance: string }>>([])
  const [declaredFamiliarity, setDeclaredFamiliarity] = useState<Record<string, { level: number; familiarity: string }>>({})
  const [savingDeclarations, setSavingDeclarations] = useState(false)

  // Fetch career required skills when modal opens
  const loadDiscoverySkills = async () => {
    if (!selectedCareerId) return
    try {
      const json = await apiClient<{ success: boolean; data: any[] }>(`/api/career-targets/${selectedCareerId}/skills`)
      if (json.success && json.data && json.data.length > 0) {
        setCareerSkills(json.data)
      } else {
        // Fallback from benchmark
        const benchmark = CAREER_BENCHMARK_PROFILES.find(c => c.id === selectedCareerId || c.slug === activeCareer?.slug) || CAREER_BENCHMARK_PROFILES[0]
        setCareerSkills(Object.entries(benchmark.skills).map(([name, b], idx) => ({
          skillId: `skill-${benchmark.slug}-${idx + 1}`,
          skillName: name,
          category: 'Technical',
          requiredLevel: b.required,
          importance: b.weight >= 0.3 ? 'High' : b.weight >= 0.2 ? 'Medium' : 'Low',
        })))
      }
    } catch {
      const benchmark = CAREER_BENCHMARK_PROFILES.find(c => c.id === selectedCareerId || c.slug === activeCareer?.slug) || CAREER_BENCHMARK_PROFILES[0]
      setCareerSkills(Object.entries(benchmark.skills).map(([name, b], idx) => ({
        skillId: `skill-${benchmark.slug}-${idx + 1}`,
        skillName: name,
        category: 'Technical',
        requiredLevel: b.required,
        importance: b.weight >= 0.3 ? 'High' : b.weight >= 0.2 ? 'Medium' : 'Low',
      })))
    }
  }

  // AI Targeted Roadmap Generator
  const handleGenerateRoadmap = async (targetSkillName?: string) => {
    const skillName = targetSkillName || readinessData?.priorityGap?.skillName || (readinessData?.skills && readinessData.skills[0]?.skillName) || "Node.js"
    const targetSkill = readinessData?.skills?.find(s => s.skillName.toLowerCase() === skillName.toLowerCase())
    const currentScore = targetSkill ? targetSkill.currentLevel : (readinessData?.priorityGap?.currentLevel || 50)
    const targetScore = targetSkill ? targetSkill.requiredLevel : (readinessData?.priorityGap?.requiredLevel || 80)

    setRoadmapLoading(true)
    setRoadmapOpen(true)
    try {
      const json = await apiClient<{ success: boolean; data: { plan: any } }>('/api/ai/learning-plan', {
        method: 'POST',
        body: JSON.stringify({
          skill: skillName,
          careerTarget: activeCareer?.name || 'Software Engineer',
          currentScore,
          targetScore,
        }),
      })
      if (json.success && json.data?.plan) {
        setRoadmapData(json.data.plan)
      }
    } catch (err) {
      console.warn('Could not load AI roadmap:', err)
    } finally {
      setRoadmapLoading(false)
    }
  }

  // Handle AI Skill Extraction
  const handleExtractWithAI = async () => {
    if (!experienceText.trim()) return
    setExtractingAI(true)
    try {
      const json = await apiClient<{
        success: boolean
        data: {
          extractedSkills: Array<{ skillId: string; skillName: string; confidence: number; category: string; suggestedLevel: number }>
        }
      }>('/api/ai/skill-map', {
        method: 'POST',
        body: JSON.stringify({
          text: experienceText,
          careerTarget: activeCareer?.name || 'Software Engineer',
        }),
      })

      if (json.success && json.data?.extractedSkills) {
        const newDeclared = { ...declaredFamiliarity }
        json.data.extractedSkills.forEach(s => {
          const fam = s.suggestedLevel >= 75 ? 'proficient' : s.suggestedLevel >= 55 ? 'intermediate' : 'beginner'
          newDeclared[s.skillId] = { level: s.suggestedLevel, familiarity: fam }
        })
        setDeclaredFamiliarity(newDeclared)
      }
    } catch (err) {
      console.warn('AI Extraction warning:', err)
    } finally {
      setExtractingAI(false)
    }
  }

  // Submit declared skills
  const handleSaveDeclarations = async () => {
    setSavingDeclarations(true)
    try {
      const payload = Object.entries(declaredFamiliarity).map(([skillId, val]) => ({
        skillId,
        familiarityLevel: val.familiarity,
        selfDeclaredLevel: val.level,
      }))

      if (payload.length > 0) {
        await apiClient('/api/student/skills/declare', {
          method: 'POST',
          body: JSON.stringify({ declaredSkills: payload }),
        })
      }

      // Re-fetch readiness data
      const json = await apiClient<{ success: boolean; data: CareerReadinessResult | null }>(
        `/api/student/readiness?career_id=${selectedCareerId}`
      )
      if (json.success && json.data) {
        setReadinessData(json.data)
      }

      setSaveStatus('Declared baseline skills saved successfully! Skill gaps updated.')
      setIsDiscoveryOpen(false)
    } catch (err) {
      console.warn('Declaration error:', err)
      setSaveStatus('Could not save declared skills — please try again.')
      setIsDiscoveryOpen(false)
    } finally {
      setSavingDeclarations(false)
      setTimeout(() => setSaveStatus(null), 3500)
    }
  }

  // 1. Initial Load: Fetch from API, fall back to built-in benchmarks with zero crash
  useEffect(() => {
    async function loadData() {
      try {
        const careersResponse = await apiClient<{
          success: boolean
          data: Array<{ id: string; name: string; slug: string; description?: string | null; category?: string }>
        }>('/api/student/career-targets')

        let loadedList = defaultList
        if (careersResponse.data && careersResponse.data.length > 0) {
          loadedList = careersResponse.data.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            match: 0,
            opps: 0,
            description: c.description || undefined,
          }))
          setCareers(loadedList)
        }

        const targetResponse = await apiClient<{
          success: boolean
          data: {
            target_career_id?: string | null
            career_targets?: { id?: string; name?: string; slug?: string } | null
          } | null
        }>('/api/student/career-target')

        let activeId =
          targetResponse.data?.target_career_id ||
          targetResponse.data?.career_targets?.id

        // Check URL parameters for direct target or roadmap action
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const targetSlug = params.get('target')
          const action = params.get('action')

          if (targetSlug) {
            const matchedCareer = loadedList.find(c => c.slug === targetSlug || c.id === targetSlug)
            if (matchedCareer) {
              activeId = matchedCareer.id
            }
          }

          if (action === 'roadmap') {
            setTimeout(() => {
              handleGenerateRoadmap()
            }, 800)
          }
        }

        if (activeId) {
          setSelectedCareerId(activeId)
        }
      } catch (err) {
        // Zero crash rule: quietly fallback to local benchmarks
        console.warn('Using client-side deterministic career targets:', err)
      }
    }

    loadData()
  }, [])

  // 2. Load Readiness: API fetch with instant deterministic calculation fallback
  useEffect(() => {
    async function loadReadiness() {
      if (!selectedCareerId) return

      setLoadingReadiness(true)
      const benchmarkProfile =
        CAREER_BENCHMARK_PROFILES.find(c => c.id === selectedCareerId || c.slug === activeCareer?.slug) ||
        CAREER_BENCHMARK_PROFILES[0]

      try {
        const json = await apiClient<{ success: boolean; data: CareerReadinessResult | null }>(
          `/api/student/readiness?career_id=${selectedCareerId}`
        )
        if (json.success && json.data && json.data.skills && json.data.skills.length > 0) {
          setReadinessData(json.data)
          return
        }

        // API returned empty data — do NOT fabricate scores. Show the empty state.
        throw new Error('No readiness skills returned from API')
      } catch (err) {
        // Honest fail-safe: without real assessment/skill data we must never invent
        // verified scores or readiness. Leave readinessData null so the UI shows an
        // empty state directing the student to take the assessment.
        console.warn('API readiness unavailable or empty; showing assessment CTA instead of fabricated scores:', err)
        setReadinessData(null)
      } finally {
        // ALWAYS clear loading — this is the fix for the infinite spinner
        setLoadingReadiness(false)
      }
    }

    loadReadiness()
  }, [selectedCareerId, activeCareer])

  // ─── Load existing self-ratings when career changes (Task 1 / 2) ───────────
  useEffect(() => {
    if (!selectedCareerId) return
    selfRatingSkipped.current = false  // reset skip flag on career change
    setAiSummary(null)  // reset AI summary on career change

    async function loadSelfRatings() {
      try {
        const json = await apiClient<{ success: boolean; data: Array<{ skill_id: string; self_rating_label: string }> }>(
          `/api/student/self-ratings/${selectedCareerId}`
        )
        if (json.success && json.data && json.data.length > 0) {
          const map: Record<string, string> = {}
          json.data.forEach(r => { map[r.skill_id] = r.self_rating_label })
          setSelfRatings(map)
          // Ratings already exist — don't show modal
        } else {
          setSelfRatings({})
          // No ratings yet — load skill list then open modal
          await loadDiscoverySkills()
          setSelfRatingOpen(true)
        }
      } catch {
        // API unavailable — open modal anyway so user can rate (will save optimistically)
        setSelfRatings({})
        await loadDiscoverySkills()
        setSelfRatingOpen(true)
      }
    }

    loadSelfRatings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCareerId])

  // ─── Compute calibration pairs whenever readinessData refreshes (Task 4) ───
  useEffect(() => {
    if (!readinessData) return
    const rawSelfRatings = (readinessData as any).selfRatings as Array<{
      skill_id: string; skill_name: string; self_rating_label: string; verified_score: number; required_level: number
    }> | undefined

    if (!rawSelfRatings || rawSelfRatings.length === 0) {
      // Fall back to client-side selfRatings map cross-referenced with readinessData.skills
      if (Object.keys(selfRatings).length === 0) {
        setCalibrationPairs([])
        return
      }
      const pairs: CalibrationPair[] = []
      readinessData.skills.forEach(skill => {
        const label = selfRatings[skill.skillId]
        if (!label || !skill.isAssessed || skill.currentLevel <= 0) return
        const midpoint = RATING_MIDPOINTS[label] ?? -1
        if (midpoint < 0) return
        const diff = Math.abs(midpoint - skill.currentLevel)
        if (diff < 20) return
        pairs.push({
          skillId: skill.skillId,
          skillName: skill.skillName,
          selfRatingLabel: label,
          selfRatingDisplay: RATING_DISPLAY[label] || label,
          verifiedScore: skill.currentLevel,
          requiredLevel: skill.requiredLevel,
          isOverconfident: midpoint > skill.currentLevel,
        })
      })
      setCalibrationPairs(pairs)
      return
    }

    const pairs: CalibrationPair[] = []
    rawSelfRatings.forEach(sr => {
      const midpoint = RATING_MIDPOINTS[sr.self_rating_label] ?? -1
      if (midpoint < 0 || sr.verified_score < 0) return
      const diff = Math.abs(midpoint - sr.verified_score)
      if (diff < 20) return
      pairs.push({
        skillId: sr.skill_id,
        skillName: sr.skill_name,
        selfRatingLabel: sr.self_rating_label,
        selfRatingDisplay: RATING_DISPLAY[sr.self_rating_label] || sr.self_rating_label,
        verifiedScore: sr.verified_score,
        requiredLevel: sr.required_level,
        isOverconfident: midpoint > sr.verified_score,
      })
    })
    setCalibrationPairs(pairs)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readinessData, selfRatings])

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
    } catch {
      // Honest failure message — do not claim success when persistence failed
      setSaveStatus('Could not save career target — please try again.')
    } finally {
      setPersisting(false)
      setTimeout(() => setSaveStatus(null), 3500)
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
      const json = await apiClient<{ success: boolean; data: CareerReadinessResult | null }>(
        `/api/student/readiness?career_id=${selectedCareerId}`
      )
      if (json.success && json.data) setReadinessData(json.data)
    } catch {
      // Local optimistic update
      if (readinessData) {
        const updatedSkills = readinessData.skills.map(s =>
          s.skillId === skillId ? { ...s, currentLevel: Number(level), isAssessed: true } : s
        )
        setReadinessData({ ...readinessData, skills: updatedSkills })
      }
    } finally {
      setSavingSkillId(null)
    }
  }

  // ─── Self-Rating modal handlers ─────────────────────────────────────────────
  const handleSelfRatingSave = async () => {
    const ratingEntries = Object.entries(selfRatings)
    if (ratingEntries.length === 0) return
    setSavingSelfRatings(true)
    try {
      const json = await apiClient<{ success: boolean; data: { stored: number; persisted: boolean; summary?: string } }>('/api/student/self-ratings', {
        method: 'POST',
        body: JSON.stringify({
          career_target_id: selectedCareerId,
          ratings: ratingEntries.map(([skill_id, self_rating_label]) => ({ skill_id, self_rating_label })),
        }),
      })
      if (json.data?.summary) {
        setAiSummary(json.data.summary)
      } else {
        setAiSummary('Insight generation temporarily unavailable')
      }
    } catch {
      setAiSummary('Insight generation temporarily unavailable')
    } finally {
      setSavingSelfRatings(false)
      setSelfRatingOpen(false)
    }
  }

  const handleSelfRatingSkip = () => {
    selfRatingSkipped.current = true
    setSelfRatings({})
    setSelfRatingOpen(false)
  }

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'backend': return <Database className="h-5 w-5" />
      case 'frontend': return <Layout className="h-5 w-5" />
      case 'fullstack': return <Code className="h-5 w-5" />
      case 'security': return <Shield className="h-5 w-5" />
      case 'devops': return <Settings className="h-5 w-5" />
      case 'data-analyst': return <TrendingUp className="h-5 w-5" />
      default: return <Database className="h-5 w-5" />
    }
  }

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Background ambient lighting orbs */}
      <div className="absolute -top-12 -right-12 h-72 w-72 rounded-full bg-[var(--color-accent)]/8 blur-3xl pointer-events-none" />
      <div className="absolute top-96 -left-12 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">What career are you aiming for?</h1>
            <Badge className="bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border-[var(--color-border-primary)] text-xs font-semibold px-2.5 py-0.5">
              <Sparkles className="h-3 w-3 mr-1 inline text-[var(--color-accent)]" /> Opportunity-Specific Engine
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Active Target: <strong className="text-slate-900 font-bold">{activeCareer?.name || 'Selected Role'}</strong>. Evaluate readiness against real benchmarks, declare known skills, and take assessments to verify competencies.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => handleGenerateRoadmap()}
            className="h-10 px-4 rounded-xl border-[var(--color-border-primary)] bg-white/90 text-[var(--color-accent-hover)] font-semibold shadow-xs hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-[var(--color-accent)]" /> Generate AI Roadmap
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsDiscoveryOpen(true)
              loadDiscoverySkills()
            }}
            className="h-10 px-4 rounded-xl border-[var(--color-border-primary)] bg-white/90 text-slate-700 font-semibold shadow-xs hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Brain className="h-4 w-4 text-[var(--color-accent)]" /> Discover & Declare Skills
          </Button>
          <Button
            onClick={handleSaveCareer}
            disabled={!selectedCareerId || persisting}
            className="h-10 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            {persisting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Career Target'}
          </Button>
        </div>
      </div>

      {saveStatus && (
        <div className="relative z-10 p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-sm font-medium flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          {saveStatus}
        </div>
      )}

      <div className="relative z-10 grid lg:grid-cols-3 gap-8">
        {/* Left: Floating Segmented Role Dock */}
        <div className="space-y-4 lg:col-span-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search career tracks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/80 bg-white/90 text-sm font-medium text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
            />
          </div>

          <div className="space-y-2.5">
            {filteredCareers.map((career) => {
              const isSelected = selectedCareerId === career.id
              return (
                <div
                  key={career.id}
                  onClick={() => setSelectedCareerId(career.id)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border ${
                    isSelected
                      ? 'border-[var(--color-accent)] bg-gradient-to-r from-[var(--color-surface-secondary)]/80 via-white to-[var(--color-surface-secondary)]/40 ring-2 ring-[var(--color-accent)]/20 shadow-xs -translate-y-0.5'
                      : 'border-slate-200/70 bg-white/85 hover:border-[var(--color-accent)]/40 hover:bg-white hover:-translate-y-1 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-accent)] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-[var(--color-accent-light)] group-hover:text-[var(--color-accent)]'
                      }`}>
                        {getIcon(career.slug)}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm leading-tight ${isSelected ? 'text-[var(--color-foreground)]' : 'text-slate-800'}`}>
                          {career.name}
                        </h4>
                        <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {career.description || 'Calibrated benchmark track'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-[var(--color-accent)] translate-x-0.5' : 'text-slate-300'}`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Floating Hero Benchmark & Gap Cards */}
        <div className="lg:col-span-2 space-y-6">
          {loadingReadiness ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 min-h-[340px] flex items-center justify-center backdrop-blur-xl shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            </div>
          ) : readinessData ? (
            <>
              {/* Floating Hero Container */}
              <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-white/95 p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-100 pb-6">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-3 py-0.5 rounded-full mb-2">
                      <Shield className="h-3 w-3" /> Target Role Benchmark
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {(readinessData.careerName && readinessData.careerName !== 'Career')
                        ? readinessData.careerName
                        : (activeCareer?.name || 'Career Benchmark')}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 max-w-xl">
                      {activeCareer?.description || 'Career readiness evaluated deterministically against live employer hiring requirements.'}
                    </p>
                  </div>

                  {/* Readiness Metric */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Readiness Score</span>
                    <div className="text-4xl font-black text-slate-900">{readinessData.readinessPercentage}%</div>
                    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 ${
                      readinessData.readinessPercentage >= 80
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : readinessData.readinessPercentage >= 65
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {readinessData.readinessCategory}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Cumulative Benchmark Compliance</span>
                    <span>{readinessData.readinessPercentage} / 100 Points</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] transition-all duration-500"
                      style={{ width: `${readinessData.readinessPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Floating AI Diagnostic Box */}
                {readinessData.priorityGap && (
                  <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-5 shadow-sm">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            Diagnostic Priority: {readinessData.priorityGap.skillName}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {readinessData.priorityGap.gap} pts deficit
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {readinessData.priorityGap.recommendation}
                        </p>
                        <div className="pt-2 flex items-center gap-2.5 flex-wrap">
                          {(() => {
                            const targetAssessment = getAssessmentForSkill(readinessData.priorityGap.skillName)
                            return (
                              <Link href={`/student/assessment?skill=${encodeURIComponent(targetAssessment.skill)}&assessmentId=${targetAssessment.id}&autostart=true`}>
                                <Button size="sm" className="h-8 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:-translate-y-0.5 transition-all">
                                  Start Targeted Assessment <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )
                          })()}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateRoadmap(readinessData.priorityGap?.skillName)}
                            className="h-8 text-xs font-semibold rounded-xl border-amber-300 text-amber-800 hover:bg-amber-100 bg-white/80 shadow-xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Generate AI Roadmap
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Required Skills & Gap Status Cards */}
              <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Required Skills & Benchmark Readiness</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Calibrated to actual role benchmarks with 6-tier verification ledger</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsDiscoveryOpen(true)
                      loadDiscoverySkills()
                    }}
                    className="text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] rounded-xl"
                  >
                    Declare Familiarity →
                  </Button>
                </div>

                <div className="space-y-3.5 pt-2">
                  {readinessData.skills.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                      <p className="text-sm font-medium text-slate-500">Benchmark data not available for this role yet</p>
                    </div>
                  ) : (
                    readinessData.skills.map((skill) => {
                    const badge = getVerificationBadgeInfo(skill.verificationStatus, skill.isAssessed, skill.currentLevel)
                    const isUnassessed = !skill.isAssessed || badge.label === 'Not Assessed'
                    const isSelfDeclared = badge.label === 'Self Declared'
                    const isReady = !isUnassessed && skill.status === 'ready'
                    const isCritical = !isUnassessed && skill.status === 'critical'

                    const cardStyle = isUnassessed
                      ? 'border-slate-200/80 bg-slate-50/40 text-slate-700'
                      : isSelfDeclared
                      ? 'border-amber-200/80 bg-amber-50/30 text-slate-900'
                      : isReady
                      ? 'border-emerald-200/80 bg-emerald-50/40 text-emerald-900'
                      : isCritical
                      ? 'border-rose-200/80 bg-rose-50/40 text-rose-900'
                      : 'border-amber-200/80 bg-amber-50/40 text-amber-900'

                    const targetAssessment = getAssessmentForSkill(skill.skillName)

                    return (
                      <div
                        key={skill.skillId}
                        className={`rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${cardStyle}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{skill.skillName}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                              {skill.importance} Weight
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${badge.badgeClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                              {badge.label}
                            </span>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isUnassessed ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            isReady ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            isCritical ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {isUnassessed ? 'Not Assessed' : isReady ? 'Ready' : isCritical ? 'Critical Gap' : 'Needs Improvement'}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>
                              Verified Status: <strong className="text-slate-900">{isUnassessed ? 'Not Assessed' : isSelfDeclared ? `Self-Declared (${skill.currentLevel} pts - Unverified)` : `${skill.currentLevel} / 100`}</strong>
                            </span>
                            <span>Required: <strong className="text-slate-900">{skill.requiredLevel} / 100</strong></span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/80 overflow-hidden border border-slate-200/40">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isUnassessed ? 'bg-slate-200' : isSelfDeclared ? 'bg-amber-400' : isReady ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${isUnassessed ? 0 : Math.min((skill.currentLevel / Math.max(skill.requiredLevel, 1)) * 100, 100)}%` }}
                            />
                          </div>

                          {/* Task 2 — Self-Rated label. Always shows "(unverified)". Never styled like verified data. */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-medium text-slate-500">
                              Self-Rated <span className="font-normal text-slate-400">(unverified)</span>:
                            </span>
                            {selfRatings[skill.skillId] ? (
                              <span className="text-[11px] font-semibold text-slate-600 italic">
                                &ldquo;{RATING_DISPLAY[selfRatings[skill.skillId]] || selfRatings[skill.skillId]}&rdquo;
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Not rated</span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100/60 mt-2">
                          <span className="font-medium">
                            {isUnassessed
                              ? `Requires ${skill.requiredLevel} pts • Establish baseline score with benchmark assessment`
                              : isSelfDeclared
                              ? `Self-declared at ${skill.currentLevel} pts • Needs official verification to count toward readiness`
                              : skill.gap > 0
                              ? `${skill.gap} points to close deficit`
                              : 'Benchmark requirement satisfied'}
                          </span>
                          <div className="flex items-center gap-2">
                            {skill.gap > 0 && (
                              <button
                                onClick={() => handleGenerateRoadmap(skill.skillName)}
                                className="font-bold text-xs text-slate-600 hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3 text-[var(--color-accent)]" /> Roadmap
                              </button>
                            )}
                            <Link href={`/student/assessment?skill=${encodeURIComponent(targetAssessment.skill)}&assessmentId=${targetAssessment.id}&autostart=true`}>
                              <Button
                                size="sm"
                                variant={isUnassessed || isSelfDeclared ? "default" : "outline"}
                                className={`h-7 px-3 text-xs font-bold rounded-lg transition-all ${
                                  isUnassessed || isSelfDeclared
                                    ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {isUnassessed ? 'Verify Skill' : isSelfDeclared ? 'Verify Skill' : skill.gap > 0 ? 'Improve Score' : 'Re-Assess'}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  }))}
                </div>
              </div>

              {/* Gemini AI Narrative Calibration Insight */}
              {aiSummary && (
                <div className="rounded-3xl border border-[var(--color-border-primary)] bg-white/95 p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] text-[var(--color-accent)]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Self-Declared Profile AI Insight</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Gemini AI narrative calibration analysis • Explanatory reflection (does not modify verified readiness scores)
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-emerald-50/40 border border-emerald-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium shadow-xs">
                    <p>{aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Task 4 — Calibration Insight section */}
              {calibrationPairs.length > 0 && (
                <div className="rounded-3xl border border-[var(--color-border-primary)] bg-white/95 p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] text-[var(--color-accent)]">
                      <Microscope className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">Calibration Insights</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Where your self-assessment differs meaningfully from your verified score
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {calibrationPairs.map(pair => (
                      <div
                        key={pair.skillId}
                        className={`rounded-2xl border p-4 ${
                          pair.isOverconfident
                            ? 'border-amber-200/80 bg-amber-50/40'
                            : 'border-emerald-200/80 bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            pair.isOverconfident ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {pair.isOverconfident ? <ZapOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-700">
                              🔍 Calibration Insight — {pair.skillName}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {pair.isOverconfident ? (
                                <>
                                  You rated yourself &ldquo;{pair.selfRatingDisplay}&rdquo;, but your verified score is{' '}
                                  <strong className="text-slate-800">{pair.verifiedScore}/{pair.requiredLevel}</strong>.
                                  {' '}This is a bigger gap than expected — worth prioritizing.
                                </>
                              ) : (
                                <>
                                  You rated yourself &ldquo;{pair.selfRatingDisplay}&rdquo;, but your verified score is{' '}
                                  <strong className="text-slate-800">{pair.verifiedScore}/{pair.requiredLevel}</strong>{' '}
                                  — you&apos;re actually stronger here than you realized.
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 min-h-[280px] flex items-center justify-center p-8 text-center backdrop-blur-sm">
              <p className="text-sm font-medium text-slate-500">Choose a career target from the list to evaluate your readiness.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── SELF-RATING MODAL (Task 1) ─────────────────────────────────────── */}
      {selfRatingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[88vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-8 w-8 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] text-[var(--color-accent)] flex items-center justify-center">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Self-Rating</h3>
                </div>
                <p className="text-xs text-slate-500 max-w-sm">
                  How confident are you in each skill required for{' '}
                  <strong className="text-slate-700">{activeCareer?.name}</strong>?
                  These are <span className="font-semibold text-[var(--color-text-secondary)]">not</span> your verified scores
                  — they help surface useful comparisons after assessment.
                </p>
              </div>
              <button
                onClick={handleSelfRatingSkip}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Skip self-rating"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notice banner — always visible */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px] text-amber-800 leading-relaxed font-medium">
              <strong>Note:</strong> These self-ratings are opinion-based and are{' '}
              <strong>never</strong> used in your Career Readiness %, Priority Gap, or Opportunity Match scores.
              They only appear alongside your verified data to help you reflect on calibration.
            </div>

            {/* Per-skill rating controls */}
            <div className="space-y-3">
              {careerSkills.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
                </div>
              ) : (
                careerSkills.map(cs => {
                  const currentLabel = selfRatings[cs.skillId] || ''
                  return (
                    <div key={cs.skillId} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{cs.skillName}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white border px-2 py-0.5 rounded-md">
                          Required: {cs.requiredLevel} pts
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          { label: 'Never used', value: 'never_used' },
                          { label: 'Basic',      value: 'basic' },
                          { label: 'Comfortable', value: 'comfortable' },
                          { label: 'Strong',     value: 'strong' },
                        ] as const).map(opt => {
                          const isChosen = currentLabel === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setSelfRatings(prev => ({ ...prev, [cs.skillId]: opt.value }))
                              }
                              className={`py-2 px-1 rounded-xl text-[11px] font-semibold border transition-all ${
                                isChosen
                                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleSelfRatingSkip}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
              >
                Skip this step
              </button>
              <Button
                onClick={handleSelfRatingSave}
                disabled={savingSelfRatings || Object.keys(selfRatings).length === 0}
                className="h-9 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-sm"
              >
                {savingSelfRatings
                  ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</>
                  : `Save ratings (${Object.keys(selfRatings).length}/${careerSkills.length})`
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SKILL DISCOVERY & SELF-DECLARATION MODAL ───────────────────────── */}
      {isDiscoveryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] flex items-center justify-center">
                    <Brain className="h-4 w-4" />
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Skill Discovery & Baseline Declaration</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Declare baseline familiarity for <strong>{activeCareer?.name}</strong> or extract skills from past experience with AI.
                </p>
              </div>
              <button
                onClick={() => setIsDiscoveryOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
              <button
                onClick={() => setDiscoveryTab('role')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  discoveryTab === 'role' ? 'bg-white text-[var(--color-accent)] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Role Benchmark Skills
              </button>
              <button
                onClick={() => setDiscoveryTab('ai')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  discoveryTab === 'ai' ? 'bg-white text-[var(--color-accent)] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Experience Extractor
              </button>
            </div>

            {discoveryTab === 'role' ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl">
                  <strong>Notice:</strong> Declared skills set your baseline starting point in your Skill Passport (`Self-Declared`). To earn verified credits toward your Career Readiness, take the corresponding knowledge and practical assessments.
                </p>

                <div className="space-y-3">
                  {careerSkills.map((cs) => {
                    const current = declaredFamiliarity[cs.skillId] || { level: 0, familiarity: 'none' }
                    return (
                      <div key={cs.skillId} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-slate-900">{cs.skillName}</span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white border px-2 py-0.5 rounded-md">
                            Req: {cs.requiredLevel} pts
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Unfamiliar', fam: 'none', lvl: 0 },
                            { label: 'Beginner', fam: 'beginner', lvl: 35 },
                            { label: 'Intermediate', fam: 'intermediate', lvl: 60 },
                            { label: 'Proficient', fam: 'proficient', lvl: 80 },
                          ].map((opt) => {
                            const isChosen = current.familiarity === opt.fam
                            return (
                              <button
                                key={opt.fam}
                                type="button"
                                onClick={() => {
                                  setDeclaredFamiliarity(prev => ({
                                    ...prev,
                                    [cs.skillId]: { level: opt.lvl, familiarity: opt.fam },
                                  }))
                                }}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                                  isChosen
                                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-[var(--color-accent)]/50'
                                }`}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Paste coursework summaries, resume bullets, or project readme descriptions. SkillBridge AI will semantically map your experience to official skill standards.
                </p>

                <textarea
                  rows={4}
                  value={experienceText}
                  onChange={(e) => setExperienceText(e.target.value)}
                  placeholder="e.g. Built a RESTful API using Node.js and Express with PostgreSQL database. Implemented JWT authentication, Docker containers, and wrote automated unit tests with Jest..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                />

                <Button
                  onClick={handleExtractWithAI}
                  disabled={!experienceText.trim() || extractingAI}
                  className="w-full h-10 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-sm"
                >
                  {extractingAI ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing with AI...</> : <><Sparkles className="mr-2 h-4 w-4" /> Extract Skills with AI</>}
                </Button>

                {Object.keys(declaredFamiliarity).length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                    <span className="text-xs font-bold text-emerald-900 block">Identified & Mapped Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(declaredFamiliarity).map(([id, val]) => {
                        const sName = careerSkills.find(c => c.skillId === id)?.skillName || id
                        return (
                          <span key={id} className="text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-lg">
                            {sName}: {val.familiarity} ({val.level} pts)
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setIsDiscoveryOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDeclarations}
                disabled={savingDeclarations || Object.keys(declaredFamiliarity).length === 0}
                className="rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-5 shadow-sm"
              >
                {savingDeclarations ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Confirm & Save Baseline'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI LEARNING ROADMAP MODAL ─────────────────────────────────────── */}
      {roadmapOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-8 w-8 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Targeted Learning Roadmap</h3>
                </div>
                <p className="text-xs text-slate-500">
                  {roadmapData?.skill ? (
                    <>Personalized 5-step strategy for <strong className="text-slate-700">{roadmapData.skill}</strong> ({roadmapData.initialScore} → {roadmapData.targetScore} pts) in <strong className="text-slate-700">{activeCareer?.name}</strong></>
                  ) : (
                    <>Generating tailored skill closure strategy...</>
                  )}
                </p>
              </div>
              <button
                onClick={() => setRoadmapOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {roadmapLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)] mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Architecting your 5-step learning milestones with Gemini AI...</p>
              </div>
            ) : roadmapData ? (
              <div className="space-y-5">
                {/* Summary Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 via-white to-sky-50/40 border border-sky-200/70 text-xs text-slate-700 leading-relaxed font-medium">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sky-900 uppercase tracking-wider text-[10px]">Estimated Study Time</span>
                    <span className="font-bold text-sky-900 text-xs">~{roadmapData.estimatedTotalHours || 6} Hours Total</span>
                  </div>
                  <p>{roadmapData.summary}</p>
                </div>

                {/* Steps List */}
                <div className="space-y-3">
                  {roadmapData.steps?.map((step: any, idx: number) => {
                    const typeColors: Record<string, { bg: string; text: string; border: string }> = {
                      understand: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                      learn: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
                      practice: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                      build: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                      reassess: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                    }
                    const badge = typeColors[step.stepType] || typeColors.learn

                    return (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-white hover:border-slate-300 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                              {step.stepNumber}
                            </span>
                            <span className="font-bold text-sm text-slate-900">{step.title}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {step.stepType} ({step.estimatedMinutes || 45}m)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-8">
                          {step.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] pl-8 pt-1 text-slate-500">
                          {step.keyConcept && (
                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-700">
                              Concept: {step.keyConcept}
                            </span>
                          )}
                          {step.careerRelevance && (
                            <span className="text-slate-500 italic">
                              • {step.careerRelevance}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Ready to begin? Start with practice or verify your baseline directly.
                  </span>
                  {(() => {
                    const cardTarget = getAssessmentForSkill(roadmapData.skill)
                    return (
                      <Link href={`/student/assessment?skill=${encodeURIComponent(cardTarget.skill)}&assessmentId=${cardTarget.id}&autostart=true`}>
                        <Button className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs">
                          Start Assessment Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )
                  })()}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 min-h-[340px] flex flex-col items-center justify-center text-center px-6 py-10 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)]">
                  <ZapOff className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-4">No assessed skill data yet</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                  Your readiness is calculated from real assessment results only — we never invent scores.
                  Take your first skill assessment to establish a verified baseline.
                </p>
                <Link href="/student/assessment">
                  <Button className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs mt-5">
                    Start Skill Assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
