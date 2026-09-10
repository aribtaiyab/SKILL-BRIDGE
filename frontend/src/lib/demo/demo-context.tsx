"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  DemoStudent,
  DemoOpportunity,
  INITIAL_DEMO_STUDENT,
  INITIAL_DEMO_OPPORTUNITIES,
  DEMO_ACADEMICIAN_DATA,
  DEMO_INSTITUTION_DATA,
  DEMO_COHORT_STUDENTS,
} from "./demo-data"
import { demoService } from "./demo-service"

export type DemoRole = 'student' | 'industry' | 'academician' | 'institution'

interface DemoContextType {
  isDemo: boolean
  demoRole: DemoRole
  student: DemoStudent
  opportunities: DemoOpportunity[]
  academicianData: typeof DEMO_ACADEMICIAN_DATA
  institutionData: typeof DEMO_INSTITUTION_DATA
  cohortStudents: typeof DEMO_COHORT_STUDENTS
  demoService: typeof demoService
  enterDemo: (role?: DemoRole) => void
  exitDemo: () => void
  switchDemoRole: (role: DemoRole) => void
  submitAssessment: (skillName: string, score: number) => void
  completePracticalTask: (skillName: string) => void
  addEvidence: (skillName: string, proofTitle: string, url?: string) => void
  resetDemo: () => void
}

const DemoContext = createContext<DemoContextType | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isDemo, setIsDemo] = useState<boolean>(false)
  const [demoRole, setDemoRole] = useState<DemoRole>('student')
  const [student, setStudent] = useState<DemoStudent>(INITIAL_DEMO_STUDENT)
  const [opportunities, setOpportunities] = useState<DemoOpportunity[]>(INITIAL_DEMO_OPPORTUNITIES)

  // Initialize demo state from URL query or sessionStorage or cookie
  useEffect(() => {
    const isDemoQuery = searchParams.get('demo') === 'true'
    const storedDemo = typeof window !== 'undefined' ? sessionStorage.getItem('sb_demo_mode') === 'true' : false
    const cookieDemo = typeof document !== 'undefined' && document.cookie.includes('sb_demo_mode=true')
    const storedRole = (typeof window !== 'undefined' ? sessionStorage.getItem('sb_demo_role') : null) as DemoRole | null

    if (isDemoQuery || storedDemo || cookieDemo) {
      setIsDemo(true)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sb_demo_mode', 'true')
        document.cookie = 'sb_demo_mode=true; path=/; max-age=86400; SameSite=Lax'
      }
      if (pathname.startsWith('/industry')) {
        setDemoRole('industry')
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sb_demo_role', 'industry')
          localStorage.setItem('activeRole', 'industry')
          localStorage.setItem('demo_persona', 'industry')
        }
      } else if (pathname.startsWith('/academia') || pathname.startsWith('/academician')) {
        setDemoRole('academician')
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sb_demo_role', 'academician')
          localStorage.setItem('activeRole', 'academia')
          localStorage.setItem('demo_persona', 'academia')
          localStorage.setItem('role', 'faculty')
        }
      } else if (pathname.startsWith('/institution')) {
        setDemoRole('institution')
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sb_demo_role', 'institution')
          localStorage.setItem('activeRole', 'institution')
          localStorage.setItem('demo_persona', 'institution')
          localStorage.setItem('role', 'faculty')
        }
      } else if (pathname.startsWith('/student')) {
        setDemoRole('student')
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sb_demo_role', 'student')
          localStorage.setItem('activeRole', 'student')
          localStorage.setItem('demo_persona', 'student')
        }
      } else if (storedRole) {
        setDemoRole(storedRole)
      } else {
        setDemoRole('student')
      }
    }
  }, [searchParams, pathname])

  // Recalculate student readiness & opportunity matching on skill mutation
  const recalculateStudent = useCallback((updatedSkills: DemoStudent['skills']) => {
    // Career Readiness Formula: Average across required skills of min(100, (score / benchmark) * 100)
    let totalScoreContrib = 0
    let maxGap = 0
    let priorityGapObj: DemoStudent['priorityGap'] = null

    const processedSkills = updatedSkills.map(s => {
      const gap = Math.max(s.requiredLevel - s.currentLevel, 0)
      const contrib = Math.min(100, (s.currentLevel / s.requiredLevel) * 100)
      totalScoreContrib += contrib

      const status: 'critical' | 'needs_improvement' | 'ready' =
        gap === 0 ? 'ready' : gap >= 20 ? 'critical' : 'needs_improvement'

      if (gap > maxGap) {
        maxGap = gap
        priorityGapObj = {
          skillName: s.name,
          gap,
          currentLevel: s.currentLevel,
          requiredLevel: s.requiredLevel,
          recommendation: `Complete targeted ${s.name} practice to close the ${gap}-point gap.`,
        }
      }

      return {
        ...s,
        gap,
        status,
      }
    })

    const readinessPct = Math.round(totalScoreContrib / Math.max(1, processedSkills.length))
    const readinessCategory = readinessPct >= 80 ? 'Ready' : readinessPct >= 65 ? 'Needs Improvement' : 'Critical Gaps'
    const readinessVariant: 'success' | 'warning' | 'critical' =
      readinessPct >= 80 ? 'success' : readinessPct >= 65 ? 'warning' : 'critical'

    const verifiedCount = processedSkills.filter(
      s => s.verificationStatus === 'practical_verified' || s.verificationStatus === 'evidence_verified'
    ).length

    const proofCoverage = Math.round((verifiedCount / Math.max(1, processedSkills.length)) * 100)

    setStudent(prev => ({
      ...prev,
      readinessPercentage: readinessPct,
      readinessCategory,
      readinessVariant,
      skills: processedSkills,
      priorityGap: priorityGapObj,
      passport: {
        ...prev.passport,
        verifiedSkillsCount: verifiedCount,
        proofCoveragePercentage: proofCoverage,
      },
    }))

    // Recalculate Opportunity Match for Student & Industry
    setOpportunities(prevOpps =>
      prevOpps.map(opp => {
        let oppScoreContrib = 0
        let oppBlocker: string | null = null
        let skillsMet = 0

        const oppSkills = opp.skills.map(os => {
          const matchingStudentSkill = processedSkills.find(ps => ps.name.toLowerCase() === os.name.toLowerCase())
          const studentScore = matchingStudentSkill ? matchingStudentSkill.currentLevel : 0
          const met = studentScore >= os.requiredLevel
          if (met) skillsMet += 1

          const contrib = Math.min(100, (studentScore / os.requiredLevel) * 100)
          oppScoreContrib += contrib

          const gap = Math.max(os.requiredLevel - studentScore, 0)
          if (gap > 0 && !oppBlocker) {
            oppBlocker = `${os.name} (${gap} pts gap)`
          }

          return {
            ...os,
            currentLevel: studentScore,
            met,
          }
        })

        const matchPercentage = Math.round(oppScoreContrib / Math.max(1, oppSkills.length))
        const readinessCategory = matchPercentage >= 80 ? 'Ready' : matchPercentage >= 65 ? 'Needs Improvement' : 'Critical Gaps'

        return {
          ...opp,
          matchPercentage,
          readinessCategory,
          skillsMetCount: skillsMet,
          mainBlocker: oppBlocker,
          skills: oppSkills,
        }
      })
    )
  }, [])

  const enterDemo = useCallback((role: DemoRole = 'student') => {
    setIsDemo(true)
    setDemoRole(role)
    setStudent(INITIAL_DEMO_STUDENT)
    setOpportunities(INITIAL_DEMO_OPPORTUNITIES)
    if (typeof window !== 'undefined') {
      const activeStr = (role === 'academician' || role === 'institution') ? 'academia' : role
      sessionStorage.setItem('sb_demo_mode', 'true')
      sessionStorage.setItem('sb_demo_role', role)
      localStorage.setItem('activeRole', activeStr)
      localStorage.setItem('demo_persona', activeStr)
      if (role === 'academician' || role === 'institution') {
        localStorage.setItem('role', 'faculty')
      }
      document.cookie = 'sb_demo_mode=true; path=/; max-age=86400; SameSite=Lax'
    }
    const targetRoute =
      role === 'industry'
        ? '/industry?demo=true'
        : role === 'academician' || role === 'institution'
        ? '/academia?demo=true'
        : '/student?demo=true'
    router.push(targetRoute)
  }, [router])

  const exitDemo = useCallback(() => {
    setIsDemo(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sb_demo_mode')
      sessionStorage.removeItem('sb_demo_role')
      localStorage.removeItem('activeRole')
      localStorage.removeItem('demo_persona')
      document.cookie = 'sb_demo_mode=; path=/; max-age=0'
    }
    router.push('/')
  }, [router])

  const switchDemoRole = useCallback((role: DemoRole) => {
    setDemoRole(role)
    if (typeof window !== 'undefined') {
      const activeStr = (role === 'academician' || role === 'institution') ? 'academia' : role
      sessionStorage.setItem('sb_demo_role', role)
      localStorage.setItem('activeRole', activeStr)
      localStorage.setItem('demo_persona', activeStr)
      if (role === 'academician' || role === 'institution') {
        localStorage.setItem('role', 'faculty')
      }
    }
    const targetRoute =
      role === 'industry'
        ? '/industry?demo=true'
        : role === 'academician' || role === 'institution'
        ? '/academia?demo=true'
        : '/student?demo=true'
    router.push(targetRoute)
  }, [router])

  const submitAssessment = useCallback((skillName: string, score: number) => {
    setStudent(prev => {
      const existing = prev.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase())
      const baseline = existing ? existing.currentLevel : score

      const updatedSkills = prev.skills.map(s => {
        if (s.name.toLowerCase() === skillName.toLowerCase()) {
          return {
            ...s,
            currentLevel: score,
            isAssessed: true,
            verificationStatus: s.verificationStatus === 'self_declared' ? ('assessment_verified' as const) : s.verificationStatus,
            verificationLabel: s.verificationStatus === 'self_declared' ? 'Assessment Verified' : s.verificationLabel,
          }
        }
        return s
      })

      // Add to history if improved
      const updatedHistory = [...prev.reassessmentHistory]
      if (score !== baseline) {
        updatedHistory.unshift({
          skillName,
          baselineScore: baseline,
          currentScore: score,
          gain: score - baseline,
          date: new Date().toISOString().split('T')[0],
        })
      }

      recalculateStudent(updatedSkills)
      return {
        ...prev,
        reassessmentHistory: updatedHistory,
      }
    })
  }, [recalculateStudent])

  const completePracticalTask = useCallback((skillName: string) => {
    setStudent(prev => {
      const updatedSkills = prev.skills.map(s => {
        if (s.name.toLowerCase() === skillName.toLowerCase()) {
          return {
            ...s,
            verificationStatus: 'practical_verified' as const,
            verificationLabel: 'Practical Verified',
          }
        }
        return s
      })
      recalculateStudent(updatedSkills)
      return prev
    })
  }, [recalculateStudent])

  const addEvidence = useCallback((skillName: string, proofTitle: string, url: string = 'https://github.com/aditi/project') => {
    setStudent(prev => {
      const updatedSkills = prev.skills.map(s => {
        if (s.name.toLowerCase() === skillName.toLowerCase()) {
          const newProof = {
            id: `proof-${Date.now()}`,
            title: proofTitle,
            type: 'github_repo',
            url,
            verifiedAt: new Date().toISOString().split('T')[0],
          }
          return {
            ...s,
            verificationStatus: 'evidence_verified' as const,
            verificationLabel: 'Evidence Verified',
            proofCount: (s.proofCount || 0) + 1,
            proofItems: [...(s.proofItems || []), newProof],
          }
        }
        return s
      })
      recalculateStudent(updatedSkills)
      return prev
    })
  }, [recalculateStudent])

  const resetDemo = useCallback(() => {
    setStudent(INITIAL_DEMO_STUDENT)
    setOpportunities(INITIAL_DEMO_OPPORTUNITIES)
  }, [])

  const contextValue = useMemo(() => ({
    isDemo,
    demoRole,
    student,
    opportunities,
    academicianData: DEMO_ACADEMICIAN_DATA,
    institutionData: DEMO_INSTITUTION_DATA,
    cohortStudents: DEMO_COHORT_STUDENTS,
    demoService,
    enterDemo,
    exitDemo,
    switchDemoRole,
    submitAssessment,
    completePracticalTask,
    addEvidence,
    resetDemo,
  }), [
    isDemo,
    demoRole,
    student,
    opportunities,
    enterDemo,
    exitDemo,
    switchDemoRole,
    submitAssessment,
    completePracticalTask,
    addEvidence,
    resetDemo,
  ])

  return (
    <DemoContext.Provider value={contextValue}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider')
  }
  return context
}
