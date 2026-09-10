"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search, ChevronRight, Code, Database, Shield, Layout, Settings,
  Loader2, AlertTriangle, ArrowRight, CheckCircle2, Sparkles, TrendingUp,
  Brain, Check, X, SlidersHorizontal, Microscope, ZapOff, Star, Compass,
  Award, HelpCircle, History, BookOpen, Target, ExternalLink
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { CareerTargetOption } from "@/types"
import { CareerReadinessResult } from "@/lib/intelligence/engine"
import { CAREER_BENCHMARK_PROFILES } from "@/lib/benchmarks"

interface CareerSkillItem {
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

interface DiagnosticAnalysis {
  strongSkills: Array<{ skillId: string; skillName: string; score: number }>
  moderateSkills: Array<{ skillId: string; skillName: string; score: number }>
  weakSkills: Array<{ skillId: string; skillName: string; score: number }>
  criticalGaps: Array<{ skillId: string; skillName: string; requiredLevel: number; selfDeclaredScore: number; verifiedScore: number; gap: number }>
}

interface SkillDetailData {
  skillId: string
  skillName: string
  category: string
  targetCareer: string
  requiredLevel: number
  selfDeclaredScore: number
  verifiedScore: number
  verificationStatus: string
  isAssessed: boolean
  gap: number
  whyItMatters: string
  testCurriculum: string[]
  targetAssessment: {
    id: string
    title: string
    skill: string
    timeLimitMinutes: number
    passingScore: number
  }
  attempts: Array<{
    attemptId: string
    attemptNumber: number
    score: number
    passed: boolean
    submittedAt: string
    verificationStatus: string
    delta?: number
  }>
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
  const [readinessData, setReadinessData] = useState<CareerReadinessResult | null>(null)
  const [loadingReadiness, setLoadingReadiness] = useState(false)
  const [persisting, setPersisting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // ─── Career Target Skills & Self-Confidence State ───────────────────────────
  const [careerSkills, setCareerSkills] = useState<CareerSkillItem[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [selfScores, setSelfScores] = useState<Record<string, number>>({})
  const [savingSelfScores, setSavingSelfScores] = useState(false)
  const [diagnostic, setDiagnostic] = useState<DiagnosticAnalysis | null>(null)

  // ─── Skill Detail Modal State ───────────────────────────────────────────────
  const [selectedSkillIdForModal, setSelectedSkillIdForModal] = useState<string | null>(null)
  const [skillDetail, setSkillDetail] = useState<SkillDetailData | null>(null)
  const [loadingSkillDetail, setLoadingSkillDetail] = useState(false)

  // ─── AI Learning Roadmap Modal State ───────────────────────────────────────
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapData, setRoadmapData] = useState<any>(null)

  // ─── AI Experience Extractor State ─────────────────────────────────────────
  const [isExtractorOpen, setIsExtractorOpen] = useState(false)
  const [experienceText, setExperienceText] = useState('')
  const [extractingAI, setExtractingAI] = useState(false)

  // Canonical assessment lookup
  const getAssessmentForSkill = (skillName?: string) => {
    const norm = (skillName || '').toLowerCase()
    if (norm.includes('react')) return { id: 'assess-l1-react-basics', skill: 'React.js', title: 'React Component Architecture & Hooks Benchmark' }
    if (norm.includes('mongo')) return { id: 'assess-l1-mongodb-core', skill: 'MongoDB', title: 'MongoDB Aggregations & Document Modeling Benchmark' }
    if (norm.includes('express')) return { id: 'assess-l1-express-core', skill: 'Express.js', title: 'Express.js Middleware Architecture & Routing Benchmark' }
    if (norm.includes('auth') || norm.includes('security')) return { id: 'assess-l1-auth-security', skill: 'Authentication', title: 'Authentication, JWT & Web Security Benchmark' }
    if (norm.includes('deploy') || norm.includes('cloud') || norm.includes('docker')) return { id: 'assess-l1-deployment-cloud', skill: 'Deployment', title: 'Containerization, Cloud Deployment & CI/CD Benchmark' }
    if (norm.includes('dsa') || norm.includes('problem') || norm.includes('algorithm')) return { id: 'assess-l1-dsa-core', skill: 'Problem Solving / DSA', title: 'Data Structures & Algorithmic Problem Solving Benchmark' }
    if (norm.includes('html')) return { id: 'assess-l1-html-basics', skill: 'HTML', title: 'Semantic HTML5 & Web Standards Benchmark' }
    if (norm.includes('css')) return { id: 'assess-l1-css-layouts', skill: 'CSS', title: 'Modern CSS, Flexbox & Responsive Layouts Benchmark' }
    if (norm.includes('sql') || norm.includes('database')) return { id: 'assess-l1-sql-indexing', skill: 'SQL', title: 'SQL Joins & Relational Indexing Benchmark' }
    if (norm.includes('rest') || norm.includes('api')) return { id: 'assess-l1-rest-design', skill: 'REST APIs', title: 'RESTful API Standards & Status Codes Benchmark' }
    if (norm.includes('git') || norm.includes('version')) return { id: 'assess-l1-git-workflows', skill: 'Git & Version Control', title: 'Git Workflows & Version Control Mastery' }
    if (norm.includes('js') || norm.includes('javascript')) return { id: 'assess-l1-javascript-core', skill: 'JavaScript', title: 'JavaScript Language Knowledge Benchmark' }
    if (norm.includes('node') || norm.includes('backend')) return { id: 'assess-l1-nodejs-loop', skill: 'Node.js', title: 'Node.js Event Loop & Concurrency Benchmark' }
    return { id: 'assess-l1-nodejs-loop', skill: skillName || 'Core Fundamentals', title: 'Knowledge Benchmark' }
  }

  const getVerificationBadgeInfo = (status?: string, isAssessed?: boolean, verifiedScore?: number) => {
    const norm = (status || '').toLowerCase().trim()
    if (norm === 'institution_verified' || norm === 'academic_verified' || norm === 'academia_verified') {
      return {
        label: 'Academically Verified',
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
    if (norm === 'assessment_verified' || (isAssessed && verifiedScore && verifiedScore > 0)) {
      return {
        label: 'Assessment Verified',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
        isVerified: true,
      }
    }
    if (norm === 'self_declared' || norm.includes('self')) {
      return {
        label: 'Self-Declared (Unassessed)',
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

  const filteredCareers = useMemo(
    () => careers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [careers, searchTerm]
  )

  const activeCareer = careers.find(c => c.id === selectedCareerId) || null

  // 1. Initial Load: Fetch career targets and active career target
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
        } else if (loadedList.length > 0) {
          // Default to Full Stack Developer if available, else first
          const defaultTarget = loadedList.find(c => c.slug === 'fullstack') || loadedList[0]
          setSelectedCareerId(defaultTarget.id)
        }
      } catch (err) {
        console.warn('Fallback to local career benchmarks:', err)
        if (defaultList.length > 0) {
          const defaultTarget = defaultList.find(c => c.slug === 'fullstack') || defaultList[0]
          setSelectedCareerId(defaultTarget.id)
        }
      }
    }

    loadData()
  }, [])

  // 2. Load Career Skills & Authoritative Readiness whenever active career changes
  const loadCareerTargetSkills = useCallback(async (careerId: string) => {
    setLoadingSkills(true)
    try {
      const res = await apiClient<{
        success: boolean
        career?: any
        skills: CareerSkillItem[]
        data?: CareerSkillItem[]
      }>(`/api/student/career-target/skills?career_id=${careerId}`)

      const skillsList = res.skills || res.data || []
      setCareerSkills(skillsList)

      // Initialize self-scores state
      const scoreMap: Record<string, number> = {}
      skillsList.forEach(s => {
        scoreMap[s.skillId] = s.selfDeclaredScore ?? 0
      })
      setSelfScores(scoreMap)

      // Derive initial diagnostic breakdown if skills have scores
      if (skillsList.some(s => s.selfDeclaredScore > 0)) {
        const strong = skillsList.filter(s => s.selfDeclaredScore >= 75).map(s => ({ skillId: s.skillId, skillName: s.skillName, score: s.selfDeclaredScore }))
        const moderate = skillsList.filter(s => s.selfDeclaredScore >= 50 && s.selfDeclaredScore < 75).map(s => ({ skillId: s.skillId, skillName: s.skillName, score: s.selfDeclaredScore }))
        const weak = skillsList.filter(s => s.selfDeclaredScore < 50).map(s => ({ skillId: s.skillId, skillName: s.skillName, score: s.selfDeclaredScore }))
        const critical = skillsList
          .filter(s => s.importance === 'High' && (s.selfDeclaredScore < 50 || s.verifiedScore < s.requiredLevel))
          .map(s => ({
            skillId: s.skillId,
            skillName: s.skillName,
            requiredLevel: s.requiredLevel,
            selfDeclaredScore: s.selfDeclaredScore,
            verifiedScore: s.verifiedScore,
            gap: Math.max(s.requiredLevel - s.verifiedScore, 0),
          }))
        setDiagnostic({ strongSkills: strong, moderateSkills: moderate, weakSkills: weak, criticalGaps: critical })
      } else {
        setDiagnostic(null)
      }
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
      setDiagnostic(null)
    } finally {
      setLoadingSkills(false)
    }
  }, [activeCareer])

  const loadReadiness = useCallback(async (careerId: string) => {
    setLoadingReadiness(true)
    try {
      const json = await apiClient<{ success: boolean; data: CareerReadinessResult | null }>(
        `/api/student/readiness?career_id=${careerId}`
      )
      if (json.success && json.data) {
        setReadinessData(json.data)
        return
      }
      setReadinessData(null)
    } catch (err) {
      console.warn('API readiness unavailable; setting null for honest state:', err)
      setReadinessData(null)
    } finally {
      setLoadingReadiness(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedCareerId) return
    loadCareerTargetSkills(selectedCareerId)
    loadReadiness(selectedCareerId)
  }, [selectedCareerId, loadCareerTargetSkills, loadReadiness])

  // Save selected career target to profile
  const handleSaveCareer = async () => {
    if (!selectedCareerId) return
    setPersisting(true)
    setSaveStatus(null)

    try {
      await apiClient('/api/student/career-target', {
        method: 'PATCH',
        body: JSON.stringify({ target_career_id: selectedCareerId }),
      })
      setSaveStatus('Career target set successfully!')
    } catch {
      setSaveStatus('Could not save career target — please try again.')
    } finally {
      setPersisting(false)
      setTimeout(() => setSaveStatus(null), 3500)
    }
  }

  // Handle saving Self-Declared confidence ratings
  const handleSaveSelfScores = async () => {
    if (!selectedCareerId || careerSkills.length === 0) return
    setSavingSelfScores(true)
    setSaveStatus(null)

    try {
      const payload = {
        careerTargetId: selectedCareerId,
        skills: careerSkills.map(s => ({
          skillId: s.skillId,
          selfScore: Number(selfScores[s.skillId] ?? 0),
        })),
      }

      const res = await apiClient<{
        success: boolean
        message: string
        diagnostic?: DiagnosticAnalysis
        skills?: CareerSkillItem[]
      }>('/api/student/career-target/skills', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (res.diagnostic) {
        setDiagnostic(res.diagnostic)
      }
      if (res.skills && res.skills.length > 0) {
        setCareerSkills(res.skills)
      }

      // Re-fetch authoritative readiness (will remain 0 if unassessed per zero-inflation rule)
      await loadReadiness(selectedCareerId)

      setSaveStatus('Self-declared ratings saved successfully! Initial diagnostic breakdown generated.')
    } catch (err: any) {
      setSaveStatus(err?.message || 'Failed to save self-declared ratings.')
    } finally {
      setSavingSelfScores(false)
      setTimeout(() => setSaveStatus(null), 4000)
    }
  }

  // Open Skill Detail Modal
  const handleOpenSkillDetail = async (skillId: string) => {
    setSelectedSkillIdForModal(skillId)
    setLoadingSkillDetail(true)
    try {
      const res = await apiClient<{ success: boolean; data: SkillDetailData }>(
        `/api/student/skills/${skillId}/detail`
      )
      if (res.success && res.data) {
        setSkillDetail(res.data)
      }
    } catch (err) {
      console.warn('Could not load detailed skill info:', err)
      const found = careerSkills.find(s => s.skillId === skillId)
      const targetAssessment = getAssessmentForSkill(found?.skillName)
      setSkillDetail({
        skillId,
        skillName: found?.skillName || 'Skill',
        category: found?.category || 'Technical',
        targetCareer: activeCareer?.name || 'Career',
        requiredLevel: found?.requiredLevel || 75,
        selfDeclaredScore: found?.selfDeclaredScore || 0,
        verifiedScore: found?.verifiedScore || 0,
        verificationStatus: found?.verifiedScore ? 'assessment_verified' : 'self_declared',
        isAssessed: !!found?.isAssessed,
        gap: Math.max((found?.requiredLevel || 75) - (found?.verifiedScore || 0), 0),
        whyItMatters: `Crucial foundation for professional full-stack development and industry production workloads.`,
        testCurriculum: ['Core architectural fundamentals', 'Performance best practices', 'Production debugging and fault tolerance'],
        targetAssessment: {
          id: targetAssessment.id,
          title: targetAssessment.title,
          skill: targetAssessment.skill,
          timeLimitMinutes: 10,
          passingScore: 70,
        },
        attempts: [],
      })
    } finally {
      setLoadingSkillDetail(false)
    }
  }

  // AI Targeted Roadmap Generator
  const handleGenerateRoadmap = async (targetSkillName?: string) => {
    const skillName = targetSkillName || readinessData?.priorityGap?.skillName || (careerSkills[0]?.skillName) || "Node.js"
    const targetSkill = careerSkills.find(s => s.skillName.toLowerCase() === skillName.toLowerCase())
    const currentScore = targetSkill ? targetSkill.verifiedScore : 0
    const targetScore = targetSkill ? targetSkill.requiredLevel : 80

    setRoadmapLoading(true)
    setRoadmapOpen(true)
    try {
      const json = await apiClient<{ success: boolean; data: { plan: any } }>('/api/ai/learning-plan', {
        method: 'POST',
        timeoutMs: 40000,
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
          extractedSkills: Array<{ skillId: string; skillName: string; confidence: number; suggestedLevel: number }>
        }
      }>('/api/ai/skill-map', {
        method: 'POST',
        body: JSON.stringify({
          text: experienceText,
          careerTarget: activeCareer?.name || 'Full Stack Developer',
        }),
      })

      if (json.success && json.data?.extractedSkills) {
        const newScores = { ...selfScores }
        json.data.extractedSkills.forEach(s => {
          const matched = careerSkills.find(cs =>
            cs.skillName.toLowerCase() === s.skillName.toLowerCase() ||
            cs.skillId === s.skillId
          )
          if (matched) {
            newScores[matched.skillId] = s.suggestedLevel
          }
        })
        setSelfScores(newScores)
        setIsExtractorOpen(false)
        setSaveStatus('Skills extracted and mapped to confidence sliders! Review and click Save.')
      }
    } catch (err) {
      console.warn('AI Extraction warning:', err)
    } finally {
      setExtractingAI(false)
    }
  }

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'backend': return <Database className="h-5 w-5" />
      case 'frontend': return <Layout className="h-5 w-5" />
      case 'fullstack': return <Code className="h-5 w-5" />
      case 'security': return <Shield className="h-5 w-5" />
      case 'devops': return <Settings className="h-5 w-5" />
      case 'data-analyst': case 'data-scientist': return <TrendingUp className="h-5 w-5" />
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
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Career Target & Skill Assessments</h1>
            <Badge className="bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border-[var(--color-border-primary)] text-xs font-semibold px-2.5 py-0.5">
              <Target className="h-3 w-3 mr-1 inline text-[var(--color-accent)]" /> Opportunity-Specific Engine
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Active Target: <strong className="text-slate-900 font-bold">{activeCareer ? activeCareer.name : 'None Selected'}</strong>. Rate your confidence, view diagnostics, and take verified skill assessments.
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
            onClick={() => setIsExtractorOpen(true)}
            className="h-10 px-4 rounded-xl border-[var(--color-border-primary)] bg-white/90 text-slate-700 font-semibold shadow-xs hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-secondary)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Brain className="h-4 w-4 text-[var(--color-accent)]" /> AI Resume Extractor
          </Button>
          <Button
            onClick={handleSaveCareer}
            disabled={!selectedCareerId || persisting}
            className="h-10 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold shadow-xs hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            {persisting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Active Target'}
          </Button>
        </div>
      </div>

      {saveStatus && (
        <div className="relative z-10 p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-sm font-medium flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          {saveStatus}
        </div>
      )}

      <div className="relative z-10 grid lg:grid-cols-3 gap-8">
        {/* Left: Searchable Career Tracks Dock */}
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

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
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

        {/* Right: Hero Readiness, Confidence Controls, and Skill Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Authoritative Career Readiness Hero Box */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-white/95 p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-100 pb-6">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] px-3 py-0.5 rounded-full mb-2">
                  <Shield className="h-3 w-3" /> Authoritative Readiness Ledger
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {activeCareer?.name || 'Full Stack Developer'}
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-xl">
                  {activeCareer?.description || 'Career readiness evaluated deterministically against live employer hiring requirements.'}
                </p>
              </div>

              {/* Authoritative Readiness Score (Strictly 0% if unverified) */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 shrink-0 min-w-[170px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Authoritative Readiness</span>
                <div className="text-4xl font-black text-slate-900">
                  {readinessData ? readinessData.readinessPercentage : 0}%
                </div>
                <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 ${
                  (readinessData?.readinessPercentage || 0) >= 75
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : (readinessData?.readinessPercentage || 0) >= 50
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {(readinessData?.readinessPercentage || 0) > 0 ? (readinessData?.readinessCategory || 'Not Assessed') : 'Not Assessed'}
                </span>
              </div>
            </div>

            {/* Zero-Inflation Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Zero-Inflation Verification Policy:</strong> Self-declared confidence ratings provide baseline calibration and receive <strong>0 verified credit</strong>. Your authoritative readiness score is calculated strictly from verified assessment results.
              </div>
            </div>

            {/* Cumulative Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Verified Benchmark Compliance</span>
                <span>{readinessData ? readinessData.readinessPercentage : 0} / 100 Points</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] transition-all duration-500"
                  style={{ width: `${readinessData ? readinessData.readinessPercentage : 0}%` }}
                />
              </div>
            </div>

            {/* Priority Gap Diagnostic */}
            {readinessData?.priorityGap && readinessData.priorityGap.gap > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-5 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="text-xs text-slate-700 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        Priority Deficit: {readinessData.priorityGap.skillName}
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
                              Take Targeted Assessment <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" /> View Roadmap
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── "How much do you know about this?" Self-Declared Confidence Section ─── */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-accent)] border border-[var(--color-border-primary)]">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">How much do you know about this?</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Rate your current confidence (0–100%) in each required skill for <strong className="text-slate-800">{activeCareer?.name}</strong>. This generates your initial diagnostic analysis.
                </p>
              </div>
              <Button
                onClick={handleSaveSelfScores}
                disabled={savingSelfScores || careerSkills.length === 0}
                className="h-9 px-5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-xs hover:-translate-y-0.5 transition-all shrink-0"
              >
                {savingSelfScores ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Ratings...</> : 'Save Confidence Ratings'}
              </Button>
            </div>

            {loadingSkills ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[var(--color-accent)]" />
              </div>
            ) : careerSkills.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                No required skills defined for this career track.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {careerSkills.map(cs => {
                  const currentScore = selfScores[cs.skillId] ?? 0
                  return (
                    <div
                      key={cs.skillId}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-slate-900 block">{cs.skillName}</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            Required: {cs.requiredLevel} pts • {cs.importance} Weight
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentScore}
                            onChange={(e) => {
                              const val = Math.min(Math.max(Number(e.target.value) || 0, 0), 100)
                              setSelfScores(prev => ({ ...prev, [cs.skillId]: val }))
                            }}
                            className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                          />
                          <span className="text-xs font-bold text-slate-500">%</span>
                        </div>
                      </div>

                      {/* Slider Control */}
                      <div className="space-y-1">
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
                        <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                          <span>0% (Beginner)</span>
                          <span className={`font-bold ${currentScore >= 75 ? 'text-emerald-600' : currentScore >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {currentScore >= 75 ? 'Strong' : currentScore >= 50 ? 'Moderate' : 'Developing'} ({currentScore}%)
                          </span>
                          <span>100% (Expert)</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Diagnostic Breakdown Card */}
            {diagnostic && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Self-Assessment Initial Diagnostic Breakdown
                  </h4>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  {/* Strong Skills */}
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1.5">
                    <span className="font-bold text-emerald-900 block">
                      Strong Skills ({diagnostic.strongSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {diagnostic.strongSkills.length === 0 ? (
                        <span className="text-slate-400 italic">None rated ≥75%</span>
                      ) : (
                        diagnostic.strongSkills.map(s => (
                          <span key={s.skillId} className="bg-white border border-emerald-300 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {s.skillName} ({s.score}%)
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Moderate Skills */}
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
                    <span className="font-bold text-amber-900 block">
                      Moderate Skills ({diagnostic.moderateSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {diagnostic.moderateSkills.length === 0 ? (
                        <span className="text-slate-400 italic">None rated 50–74%</span>
                      ) : (
                        diagnostic.moderateSkills.map(s => (
                          <span key={s.skillId} className="bg-white border border-amber-300 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {s.skillName} ({s.score}%)
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Weak Skills */}
                  <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/80 space-y-1.5">
                    <span className="font-bold text-rose-900 block">
                      Weak Skills ({diagnostic.weakSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {diagnostic.weakSkills.length === 0 ? (
                        <span className="text-slate-400 italic">None rated &lt;50%</span>
                      ) : (
                        diagnostic.weakSkills.map(s => (
                          <span key={s.skillId} className="bg-white border border-rose-300 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {s.skillName} ({s.score}%)
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Critical Gaps list */}
                {diagnostic.criticalGaps.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-100/70 border border-rose-300/80 text-xs text-rose-950 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>Identified Critical Gaps ({diagnostic.criticalGaps.length} high-priority skills needing assessment):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {diagnostic.criticalGaps.map(cg => {
                        const targetAssessment = getAssessmentForSkill(cg.skillName)
                        return (
                          <Link
                            key={cg.skillId}
                            href={`/student/assessment?skill=${encodeURIComponent(targetAssessment.skill)}&assessmentId=${targetAssessment.id}&autostart=true`}
                            className="inline-flex items-center gap-1 bg-white text-rose-800 font-bold border border-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <span>{cg.skillName}</span>
                            <span className="text-[10px] font-normal text-slate-500">({cg.gap} pts deficit)</span>
                            <ArrowRight className="h-3 w-3 text-rose-600" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Required Skills & Verification Ledger ───────────────────────────── */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 sm:p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Required Skills & Verification Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live verification status for all {careerSkills.length} required skills for {activeCareer?.name}. Click any skill to inspect attempt progression.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-2">
              {careerSkills.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                  <p className="text-sm font-medium text-slate-500">Loading required skills for role...</p>
                </div>
              ) : (
                careerSkills.map((skill) => {
                  const badge = getVerificationBadgeInfo(skill.status, skill.isAssessed, skill.verifiedScore)
                  const isUnassessed = !skill.isAssessed || skill.verifiedScore === 0
                  const isReady = skill.isAssessed && skill.verifiedScore >= skill.requiredLevel
                  const deficit = Math.max(skill.requiredLevel - (isUnassessed ? 0 : skill.verifiedScore), 0)
                  const targetAssessment = getAssessmentForSkill(skill.skillName)

                  return (
                    <div
                      key={skill.skillId}
                      className={`rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                        isReady
                          ? 'border-emerald-200/80 bg-emerald-50/40 text-emerald-900'
                          : isUnassessed
                          ? 'border-slate-200/80 bg-white text-slate-800'
                          : deficit > 20
                          ? 'border-rose-200/80 bg-rose-50/30 text-rose-900'
                          : 'border-amber-200/80 bg-amber-50/30 text-amber-900'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <button
                            onClick={() => handleOpenSkillDetail(skill.skillId)}
                            className="font-bold text-sm text-slate-900 hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>{skill.skillName}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </button>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                            {skill.importance} Weight
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${badge.badgeClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                            {badge.label}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isReady ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          isUnassessed ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          deficit > 20 ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isReady ? 'Benchmark Satisfied' : isUnassessed ? 'Not Assessed' : `${deficit} pts deficit`}
                        </span>
                      </div>

                      {/* Dual Score Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>
                            Verified Score: <strong className="text-slate-900">{isUnassessed ? '0 / 100 (Unverified)' : `${skill.verifiedScore} / 100`}</strong>
                          </span>
                          <span>
                            Target Required: <strong className="text-slate-900">{skill.requiredLevel} / 100</strong>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isReady ? 'bg-emerald-500' : isUnassessed ? 'bg-slate-300' : 'bg-amber-500'
                            }`}
                            style={{ width: `${isUnassessed ? 0 : Math.min((skill.verifiedScore / Math.max(skill.requiredLevel, 1)) * 100, 100)}%` }}
                          />
                        </div>

                        {/* Self-Declared baseline readout */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>
                            Self-Declared: <span className="font-semibold text-slate-700">{selfScores[skill.skillId] ?? skill.selfDeclaredScore ?? 0}% (unverified)</span>
                          </span>
                          {skill.attemptCount > 0 && (
                            <span className="font-medium text-[var(--color-accent)]">
                              {skill.attemptCount} assessment attempt{skill.attemptCount > 1 ? 's' : ''} recorded
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100/60 mt-2">
                        <button
                          onClick={() => handleOpenSkillDetail(skill.skillId)}
                          className="font-bold text-xs text-slate-600 hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
                        >
                          <History className="h-3.5 w-3.5 text-slate-400" /> View History & Curriculum
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGenerateRoadmap(skill.skillName)}
                            className="font-bold text-xs text-slate-600 hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3 text-[var(--color-accent)]" /> Roadmap
                          </button>
                          <Link href={`/student/assessment?skill=${encodeURIComponent(targetAssessment.skill)}&assessmentId=${targetAssessment.id}&autostart=true`}>
                            <Button
                              size="sm"
                              className={`h-7 px-3 text-xs font-bold rounded-lg transition-all ${
                                isUnassessed
                                  ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-xs'
                                  : isReady
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                              }`}
                            >
                              {isUnassessed ? 'Take Skill Assessment' : isReady ? 'Re-Assess' : 'Retake Assessment'}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE SKILL DETAIL MODAL ─────────────────────────────────── */}
      {selectedSkillIdForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] flex items-center justify-center">
                    <Target className="h-4 w-4" />
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {skillDetail?.skillName || 'Skill Detail'}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {skillDetail?.category || 'Technical'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Required for <strong>{skillDetail?.targetCareer || activeCareer?.name}</strong> • Official Benchmark & Attempt Progression
                </p>
              </div>
              <button
                onClick={() => setSelectedSkillIdForModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingSkillDetail ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)] mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Loading skill progression and curriculum...</p>
              </div>
            ) : skillDetail ? (
              <div className="space-y-6">
                {/* 3 Metric Stat Pillars */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Self-Declared</span>
                    <div className="text-2xl font-black text-amber-900 mt-0.5">{skillDetail.selfDeclaredScore}%</div>
                    <span className="text-[10px] font-semibold text-amber-700">Unverified Baseline</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Verified Score</span>
                    <div className="text-2xl font-black text-blue-900 mt-0.5">{skillDetail.verifiedScore} / 100</div>
                    <span className="text-[10px] font-semibold text-blue-700">
                      {skillDetail.isAssessed ? 'Officially Graded' : 'Not Assessed'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Target Benchmark</span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{skillDetail.requiredLevel} pts</div>
                    <span className={`text-[10px] font-bold ${skillDetail.gap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {skillDetail.gap > 0 ? `${skillDetail.gap} pts deficit` : 'Benchmark Met'}
                    </span>
                  </div>
                </div>

                {/* Why It Matters */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
                    <span>Why This Skill Matters</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {skillDetail.whyItMatters}
                  </p>
                </div>

                {/* Test Curriculum */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Assessment Curriculum & Competencies
                  </span>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {skillDetail.testCurriculum?.map((topic, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attempt Progression History */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Assessment Attempt History ({skillDetail.attempts?.length || 0})
                    </span>
                  </div>

                  {!skillDetail.attempts || skillDetail.attempts.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700">No assessment attempts recorded yet</p>
                      <p className="text-[11px] text-slate-500">
                        Take the official knowledge benchmark to earn verified points toward your Career Readiness score.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {skillDetail.attempts.map((att, i) => (
                        <div
                          key={att.attemptId || i}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center justify-center">
                              #{att.attemptNumber}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                Score: {att.score}%
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(att.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {att.delta !== undefined && att.delta !== 0 && (
                              <span className={`text-[11px] font-bold ${att.delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {att.delta > 0 ? `+${att.delta}%` : `${att.delta}%`}
                              </span>
                            )}
                            <Badge className={att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                              {att.passed ? 'Passed' : 'Needs Retake'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSkillIdForModal(null)}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Close
                  </Button>
                  <Link
                    href={`/student/assessment?skill=${encodeURIComponent(skillDetail.targetAssessment.skill)}&assessmentId=${skillDetail.targetAssessment.id}&autostart=true`}
                  >
                    <Button className="rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-5 shadow-sm">
                      Launch Skill Assessment <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── AI EXPERIENCE EXTRACTOR MODAL ──────────────────────────────────── */}
      {isExtractorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-8 w-8 rounded-xl bg-[var(--color-accent-light)] border border-[var(--color-border-primary)] text-[var(--color-accent)] flex items-center justify-center">
                    <Brain className="h-4 w-4" />
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">AI Resume & Experience Extractor</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Paste coursework summaries, resume bullets, or project readme descriptions. SkillBridge AI will parse your technical background and map confidence ratings automatically.
                </p>
              </div>
              <button
                onClick={() => setIsExtractorOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              rows={5}
              value={experienceText}
              onChange={(e) => setExperienceText(e.target.value)}
              placeholder="e.g. Built full stack apps using React, Node.js, Express, and MongoDB. Wrote REST APIs with JWT authentication, implemented Docker containers for deployment, and solved 200+ DSA algorithmic problems..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setIsExtractorOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtractWithAI}
                disabled={!experienceText.trim() || extractingAI}
                className="rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-5 shadow-sm"
              >
                {extractingAI ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Parse with AI</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI LEARNING ROADMAP MODAL ─────────────────────────────────────── */}
      {roadmapOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200">
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
                    <>Tailored 5-step curriculum for <strong className="text-slate-700">{roadmapData.skill}</strong> ({roadmapData.initialScore} → {roadmapData.targetScore} pts)</>
                  ) : (
                    <>Generating tailored skill closure strategy with Gemini AI...</>
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
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 via-white to-sky-50/40 border border-sky-200/70 text-xs text-slate-700 leading-relaxed font-medium">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sky-900 uppercase tracking-wider text-[10px]">Estimated Total Time</span>
                    <span className="font-bold text-sky-900 text-xs">~{roadmapData.estimatedTotalHours || 6} Hours</span>
                  </div>
                  <p>{roadmapData.summary}</p>
                </div>

                <div className="space-y-3">
                  {roadmapData.steps?.map((step: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:bg-white transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                            {step.stepNumber}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{step.title}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200">
                          {step.stepType} ({step.estimatedMinutes || 45}m)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-8">
                        {step.description}
                      </p>
                      {step.keyConcept && (
                        <div className="pl-8 pt-1 text-[11px] text-slate-500">
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-700">
                            Concept: {step.keyConcept}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Ready to test your knowledge?</span>
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
