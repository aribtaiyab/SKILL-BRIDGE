"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRight, Target, ShieldCheck, FileText, CheckCircle2, Clock,
  Briefcase, Sparkles, AlertCircle, ChevronRight, Layers,
  Award, TrendingUp, RefreshCw, Compass, ArrowUpRight, Check, XCircle
} from "lucide-react"
import { useAuth } from "@/lib/auth/context"
import { apiClient } from "@/lib/api-client"

interface SkillItem {
  id: string
  name: string
  category?: string
  currentLevel: number
  verifiedLevel: number
  verificationStatus: string
  statusLabel: 'Verified' | 'Assessed' | 'Self-Declared'
}

interface CareerTargetData {
  careerId?: string | null
  careerName?: string | null
  description?: string | null
  category?: string | null
  readinessPercentage?: number
  readinessCategory?: string
  priorityGap?: {
    skillName: string
    gap: number
    recommendation?: string
  } | null
  skills?: Array<{
    skillId: string
    skillName: string
    currentLevel: number
    requiredLevel: number
    gap: number
    isAssessed: boolean
    status: string
  }>
}

interface VerificationRequest {
  id: string
  skill_name: string
  verification_tier: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  academician_name?: string | null
  academician_institution?: string | null
  created_at: string
}

interface ApplicationItem {
  id: string
  status: string
  created_at: string
  opportunities: {
    id: string
    title: string
    opportunity_type: string
    location?: string
    industry_profiles?: { organization_name: string } | null
  } | null
}

interface OpportunityItem {
  id: string
  title: string
  opportunity_type: string
  location?: string
  work_mode?: string
  organization_name?: string
  deadline?: string
}

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Real Data State
  const [careerTarget, setCareerTarget] = useState<CareerTargetData | null>(null)
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([])

  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const [
        readinessRes,
        careerTargetRes,
        skillsRes,
        verificationRes,
        applicationsRes,
        opportunitiesRes
      ] = await Promise.allSettled([
        apiClient<any>('/api/student/readiness'),
        apiClient<any>('/api/student/career-target'),
        apiClient<any>('/api/student/skills'),
        apiClient<any>('/api/verification/student/requests'),
        apiClient<any>('/api/applications'),
        apiClient<any>('/api/opportunities')
      ])

      // 1. Process Career Target & Readiness
      let resolvedTarget: CareerTargetData | null = null

      if (readinessRes.status === 'fulfilled' && readinessRes.value?.success && readinessRes.value?.data) {
        const d = readinessRes.value.data
        resolvedTarget = {
          careerId: d.careerId || null,
          careerName: d.careerName || null,
          readinessPercentage: d.readinessPercentage ?? 0,
          readinessCategory: d.readinessCategory || 'Initial Stage',
          priorityGap: d.priorityGap || null,
          skills: Array.isArray(d.skills) ? d.skills : []
        }
      } else if (careerTargetRes.status === 'fulfilled' && careerTargetRes.value?.success && careerTargetRes.value?.data) {
        const ct = careerTargetRes.value.data
        const targetObj = ct.career_targets || ct
        if (targetObj?.name || ct.target_career_id) {
          resolvedTarget = {
            careerId: targetObj?.id || ct.target_career_id,
            careerName: targetObj?.name || 'Target Role Selected',
            description: targetObj?.description || null,
            category: targetObj?.category || null,
            readinessPercentage: 0,
            readinessCategory: 'Not Assessed',
            skills: []
          }
        }
      }
      setCareerTarget(resolvedTarget)

      // 2. Process Skills
      if (skillsRes.status === 'fulfilled' && skillsRes.value?.success && Array.isArray(skillsRes.value.data)) {
        const mappedSkills: SkillItem[] = skillsRes.value.data.map((item: any) => {
          const vStatus = item.verification_status || 'self_declared'
          let statusLabel: 'Verified' | 'Assessed' | 'Self-Declared' = 'Self-Declared'
          if (['academically_verified', 'institution_verified', 'evidence_verified', 'approved'].includes(vStatus)) {
            statusLabel = 'Verified'
          } else if (['assessment_verified', 'practical_verified'].includes(vStatus)) {
            statusLabel = 'Assessed'
          }

          return {
            id: item.skill_id || item.id || Math.random().toString(),
            name: item.skills?.name || item.skill_name || item.name || 'Skill',
            category: item.skills?.category || item.category || 'General',
            currentLevel: Number(item.current_level ?? item.self_declared_level ?? 0),
            verifiedLevel: Number(item.verified_level ?? 0),
            verificationStatus: vStatus,
            statusLabel
          }
        })
        setSkills(mappedSkills)
      } else {
        setSkills([])
      }

      // 3. Process Verification Requests
      if (verificationRes.status === 'fulfilled') {
        const vData = verificationRes.value?.data || verificationRes.value?.requests || []
        if (Array.isArray(vData)) {
          setVerificationRequests(vData)
        } else {
          setVerificationRequests([])
        }
      } else {
        setVerificationRequests([])
      }

      // 4. Process Applications
      if (applicationsRes.status === 'fulfilled' && applicationsRes.value?.success && Array.isArray(applicationsRes.value.data)) {
        setApplications(applicationsRes.value.data)
      } else {
        setApplications([])
      }

      // 5. Process Opportunities
      if (opportunitiesRes.status === 'fulfilled') {
        const oppData = opportunitiesRes.value?.data || (Array.isArray(opportunitiesRes.value) ? opportunitiesRes.value : [])
        if (Array.isArray(oppData)) {
          setOpportunities(oppData.slice(0, 3).map((op: any) => ({
            id: op.id,
            title: op.title || 'Opportunity',
            opportunity_type: op.opportunity_type || op.type || 'Internship',
            location: op.location || 'Remote',
            work_mode: op.work_mode || op.workMode,
            organization_name: op.industry_profiles?.organization_name || op.company || op.organization || 'Industry Partner',
            deadline: op.deadline
          })))
        } else {
          setOpportunities([])
        }
      } else {
        setOpportunities([])
      }

    } catch (err) {
      console.warn("Failed to load real dashboard data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Derived Real Metrics
  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'
  
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const verifiedSkillsCount = useMemo(() => {
    return skills.filter(s => s.statusLabel === 'Verified' || s.verifiedLevel > 0).length
  }, [skills])

  const pendingVerificationCount = useMemo(() => {
    return verificationRequests.filter(r => r.status === 'pending' || r.status === 'in_review').length
  }, [verificationRequests])

  const approvedVerificationCount = useMemo(() => {
    return verificationRequests.filter(r => r.status === 'approved').length
  }, [verificationRequests])

  const activeApplicationsCount = useMemo(() => {
    return applications.filter(a => ['applied', 'shortlisted', 'under_review', 'interview'].includes(a.status)).length
  }, [applications])

  // Deterministic Next Action Resolution
  const nextAction = useMemo(() => {
    if (!careerTarget?.careerName && !careerTarget?.careerId) {
      return {
        title: "Define your Career Target",
        description: "Select your target engineering role to unlock deterministic readiness benchmarks and structured roadmap guidance.",
        buttonText: "Set Career Target",
        href: "/student/career",
        badge: "Initial Setup",
        badgeVariant: "bg-emerald-50 text-emerald-800 border-emerald-200"
      }
    }
    if (skills.length === 0) {
      return {
        title: "Add your Technical Skills",
        description: "Declare the languages, frameworks, and tools you know to evaluate your baseline against target requirements.",
        buttonText: "Add Skills",
        href: "/student/skills",
        badge: "Profile Step",
        badgeVariant: "bg-amber-50 text-amber-800 border-amber-200"
      }
    }
    const hasUnassessed = skills.some(s => s.statusLabel === 'Self-Declared')
    if (hasUnassessed) {
      return {
        title: "Validate your Skills with Assessment",
        description: "Take practical and standardized assessments to elevate your self-declared skills to verified capability benchmarks.",
        buttonText: "Take Assessment",
        href: "/student/assessment",
        badge: "Skill Assessment",
        badgeVariant: "bg-blue-50 text-blue-800 border-blue-200"
      }
    }
    if (pendingVerificationCount > 0) {
      return {
        title: "Track Academic Verification",
        description: `You have ${pendingVerificationCount} skill verification request(s) awaiting faculty review. Check their status.`,
        buttonText: "View Verifications",
        href: "/student/verification",
        badge: "In Review",
        badgeVariant: "bg-purple-50 text-purple-800 border-purple-200"
      }
    }
    if (activeApplicationsCount > 0) {
      return {
        title: "Track Active Applications",
        description: `You have ${activeApplicationsCount} submitted application(s). Monitor hiring stages and interview updates.`,
        buttonText: "View Applications",
        href: "/student/applications",
        badge: "Applications Active",
        badgeVariant: "bg-emerald-50 text-emerald-800 border-emerald-200"
      }
    }
    return {
      title: "Explore Matching Opportunities",
      description: "Discover verified industry internships and entry-level positions aligned with your validated skill profile.",
      buttonText: "Explore Opportunities",
      href: "/student/opportunities",
      badge: "Career Ready",
      badgeVariant: "bg-emerald-50 text-emerald-800 border-emerald-200"
    }
  }, [careerTarget, skills, pendingVerificationCount, activeApplicationsCount])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-16 bg-slate-100 rounded-2xl w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-100 rounded-3xl" />
          <div className="h-72 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {timeGreeting}, {studentName}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {careerTarget?.careerName 
              ? `Working towards ${careerTarget.careerName} with verified capability tracking.`
              : "Welcome to your SkillBridge command center. Track skills, verified credentials, and career readiness."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Link href="/student/profile">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs gap-1.5"
            >
              My Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Compact Real Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Skills */}
        <Link href="/student/skills" className="block group">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Skills</span>
              <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 transition-colors">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{skills.length}</span>
              <span className="text-[11px] text-slate-400">in profile</span>
            </div>
          </div>
        </Link>

        {/* Metric 2: Verified Skills */}
        <Link href="/student/passport" className="block group">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Verified Skills</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 tracking-tight">{verifiedSkillsCount}</span>
              <span className="text-[11px] text-slate-400">
                {skills.length > 0 ? `${Math.round((verifiedSkillsCount / skills.length) * 100)}% verified` : 'of 0 total'}
              </span>
            </div>
          </div>
        </Link>

        {/* Metric 3: Active Applications */}
        <Link href="/student/applications" className="block group">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Applications</span>
              <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-emerald-700 transition-colors">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{applications.length}</span>
              <span className="text-[11px] text-slate-400">
                {activeApplicationsCount > 0 ? `${activeApplicationsCount} in progress` : 'submitted'}
              </span>
            </div>
          </div>
        </Link>

        {/* Metric 4: Verification Requests */}
        <Link href="/student/verification" className="block group">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Verifications</span>
              <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-purple-700 transition-colors">
                <Award className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{verificationRequests.length}</span>
              <span className="text-[11px] text-slate-400">
                {pendingVerificationCount > 0 ? `${pendingVerificationCount} pending` : approvedVerificationCount > 0 ? `${approvedVerificationCount} approved` : 'requests'}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. "Your Next Step" Action Card */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${nextAction.badgeVariant}`}>
                {nextAction.badge}
              </span>
              <span className="text-xs font-semibold text-emerald-400">Recommended Priority</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {nextAction.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {nextAction.description}
            </p>
          </div>

          <div className="shrink-0 pt-1 sm:pt-0">
            <Link href={nextAction.href}>
              <Button className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all gap-1.5">
                {nextAction.buttonText} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Career Target & Readiness Section */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
        {careerTarget?.careerName ? (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Career Target</div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{careerTarget.careerName}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/student/career">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50">
                    Change Target
                  </Button>
                </Link>
                <Link href="/student/career">
                  <Button size="sm" className="h-8 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                    View Benchmark Roadmap <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              {/* Readiness Score */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Career Readiness</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                    {careerTarget.readinessCategory || 'Active Target'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                    {careerTarget.readinessPercentage ?? 0}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">calculated readiness</span>
                </div>
                <Progress value={careerTarget.readinessPercentage ?? 0} className="h-2" />
              </div>

              {/* Priority Focus */}
              <div className="md:col-span-2 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-600">Priority Skill Gap</div>
                {careerTarget.priorityGap ? (
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Focus Area: {careerTarget.priorityGap.skillName} ({careerTarget.priorityGap.gap} pts below benchmark)
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {careerTarget.priorityGap.recommendation || 'Complete assessment or submit verification to close this requirement.'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-bold text-slate-900">Core Benchmark Alignment</div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Your current assessed skills satisfy the foundational requirements for this target role.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Clean Empty State: No Career Target */
          <div className="text-center py-6 px-4 space-y-3">
            <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Define your career direction</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Choose a career target to personalize your SkillBridge dashboard with real readiness percentages and skill benchmarks.
              </p>
            </div>
            <div className="pt-1">
              <Link href="/student/career">
                <Button className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-2xs">
                  Set Career Target <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 5. Main 2-Column Grid: Skills Snapshot & Verification Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): My Skills Snapshot */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">My Skills Snapshot</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real verified and declared competencies in your profile</p>
            </div>
            <Link href="/student/skills">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg h-8 gap-1">
                View all skills ({skills.length}) <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {skills.length > 0 ? (
            <div className="space-y-3">
              {skills.slice(0, 5).map(skill => (
                <div key={skill.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{skill.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        skill.statusLabel === 'Verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : skill.statusLabel === 'Assessed'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {skill.statusLabel}
                      </span>
                    </div>
                    <span className="font-bold text-slate-700 font-mono">
                      {skill.currentLevel} <span className="text-slate-400 font-normal">/ 100</span>
                    </span>
                  </div>
                  <Progress value={skill.currentLevel} className="h-1.5" />
                </div>
              ))}
            </div>
          ) : (
            /* Clean Empty State: No Skills */
            <div className="text-center py-8 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">No skills added yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                  Declare your current technical competencies to begin building your verified capability profile.
                </p>
              </div>
              <Link href="/student/skills">
                <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1">
                  Add Skills <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Verification Snapshot */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Academician Verification</h3>
              <p className="text-xs text-slate-500 mt-0.5">Faculty review & verified credentials</p>
            </div>
            <Link href="/student/verification">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg h-8 gap-0.5 p-1.5">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {verificationRequests.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-base font-bold text-slate-900">{verificationRequests.length}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Submitted</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-base font-bold text-emerald-700">{approvedVerificationCount}</div>
                  <div className="text-[10px] text-emerald-800 font-medium">Verified</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                  <div className="text-base font-bold text-amber-700">{pendingVerificationCount}</div>
                  <div className="text-[10px] text-amber-800 font-medium">Pending</div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recent Submissions</div>
                {verificationRequests.slice(0, 3).map(req => (
                  <div key={req.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 truncate">{req.skill_name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {req.academician_name ? `Reviewer: ${req.academician_name}` : 'Awaiting Faculty Assignment'}
                      </div>
                    </div>
                    <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'secondary' : 'warning'} className="text-[10px] shrink-0 font-semibold">
                      {req.status === 'approved' ? 'Verified' : req.status === 'rejected' ? 'Needs Revision' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link href="/student/verification">
                  <Button variant="outline" size="sm" className="w-full h-8 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50">
                    Submit Another Skill for Verification
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Clean Empty State: No Verifications */
            <div className="text-center py-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">No verification requests yet</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                  Submit proof and project evidence to academic faculty to turn self-declared skills into accredited credentials.
                </p>
              </div>
              <Link href="/student/verification">
                <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1">
                  Verify a Skill <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 6. Applications & Opportunities Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Applications</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your submitted internship and job applications</p>
            </div>
            <Link href="/student/applications">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg h-8 gap-0.5">
                View all ({applications.length}) <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-2.5">
              {applications.slice(0, 3).map(app => (
                <div key={app.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{app.opportunities?.title || 'Application'}</div>
                    <div className="text-[11px] text-slate-500">
                      {app.opportunities?.industry_profiles?.organization_name || 'Industry Partner'}
                    </div>
                  </div>
                  <Badge variant={app.status === 'selected' ? 'success' : app.status === 'rejected' ? 'secondary' : 'outline'} className="capitalize text-[10px] font-semibold">
                    {app.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            /* Clean Empty State: No Applications */
            <div className="text-center py-6 space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">You haven't applied to any opportunities yet</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                  Browse open positions matching your verified skills and submit applications with your Skill Passport.
                </p>
              </div>
              <Link href="/student/opportunities">
                <Button size="sm" variant="outline" className="h-7.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-1">
                  Explore Opportunities <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Opportunities Snapshot */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Matching Opportunities</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real positions available for application</p>
            </div>
            <Link href="/student/opportunities">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg h-8 gap-0.5">
                Browse catalog <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {opportunities.length > 0 ? (
            <div className="space-y-2.5">
              {opportunities.map(op => (
                <div key={op.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{op.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {op.organization_name} • {op.location || 'Remote'}
                    </div>
                  </div>
                  <Link href={`/student/opportunities`}>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold gap-1">
                      View <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            /* Clean Empty State: No Opportunities */
            <div className="text-center py-6 space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">No open opportunities at this moment</div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                  Check back soon as partner institutions and employers publish new roles.
                </p>
              </div>
              <Link href="/student/opportunities">
                <Button size="sm" variant="outline" className="h-7.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-1">
                  View Opportunity Catalog <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}