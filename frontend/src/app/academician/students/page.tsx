"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search, Filter, CheckCircle2, AlertTriangle, ArrowRight,
  User, Loader2, BookOpen, X, Award, ExternalLink, Calendar
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"

interface StudentItem {
  id: string
  name: string
  email: string
  career: string
  readiness: number
  priorityGap: string
  verifiedSkills: number
  totalSkills: number
  status: string
  educationLevel?: string
  department?: string
  graduationYear?: string
}

interface StudentDetail {
  student: {
    id: string
    name: string
    email: string
    educationLevel?: string
    institutionName?: string
    department?: string
    graduationYear?: string
    location?: string
  }
  careerTarget: {
    title: string
    targetScore: number
    readinessScore: number
  } | null
  skills: {
    id: string
    skillId: string
    name: string
    category: string
    currentLevel: number
    requiredLevel: number
    gap: number
    gapCategory: string
    verificationStatus: string
  }[]
  reassessments: {
    id: string
    skillName: string
    previousScore: number
    newScore: number
    gain: number
    date: string
  }[]
}

export default function AcademicianStudentsPage() {
  const { isDemo, cohortStudents } = useDemo()
  const [searchTerm, setSearchTerm] = useState("")
  const [careerFilter, setCareerFilter] = useState("all")
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)

  // Selected student for detail modal
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadStudents = useCallback(async () => {
    if (isDemo) {
      setStudents(cohortStudents.map((c: any) => {
        const primaryGapObj = (c.skills || []).find((s: any) => (s.gap || 0) > 0)
        const gapSkill = primaryGapObj?.name || 'Spring Boot'
        const gapPts = primaryGapObj?.gap || 19
        const readiness = c.readinessPercentage || 85
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          career: c.targetCareer || 'Backend Developer',
          readiness,
          priorityGap: `${gapSkill} (${gapPts} pts gap)`,
          verifiedSkills: 3,
          totalSkills: (c.skills || []).length || 3,
          status: readiness >= 80 ? 'High Readiness' : readiness >= 70 ? 'On Track' : 'Needs Support',
          educationLevel: 'Undergraduate',
          department: c.department || 'Computer Science',
          graduationYear: String(c.graduationYear || '2026'),
        }
      }))
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/academician/students`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setStudents(json.data)
      } else {
        setStudents([])
      }
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [isDemo, cohortStudents])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const openStudentDetail = async (id: string) => {
    setSelectedId(id)
    setDetailLoading(true)

    if (isDemo) {
      const found = cohortStudents.find((c: any) => c.id === id) as any
      if (found) {
        setStudentDetail({
          student: {
            id: found.id,
            name: found.name,
            email: found.email,
            educationLevel: 'B.Tech',
            institutionName: found.institution || 'Apex Institute of Technology',
            department: found.department || 'Computer Science & Engineering',
            graduationYear: String(found.graduationYear || '2026'),
          },
          careerTarget: {
            title: found.targetCareer || 'Backend Developer',
            targetScore: 85,
            readinessScore: found.readinessPercentage || 85,
          },
          skills: (found.skills || []).map((sk: any, idx: number) => ({
            id: `sk-${idx}`,
            skillId: `s-${idx}`,
            name: sk.name,
            category: 'Technical',
            currentLevel: sk.currentLevel ?? sk.current ?? 70,
            requiredLevel: sk.requiredLevel ?? sk.required ?? 75,
            gap: sk.gap || 0,
            gapCategory: (sk.gap || 0) === 0 ? 'Ready' : (sk.gap || 0) >= 15 ? 'Critical' : 'Needs Improvement',
            verificationStatus: sk.verificationStatus || (sk.met ? 'assessment_verified' : 'self_declared'),
          })),
          reassessments: (found.reassessmentHistory || []).map((r: any, i: number) => ({
            id: `re-${i}`,
            skillName: r.skillName,
            previousScore: r.baselineScore,
            newScore: r.currentScore,
            gain: r.gain,
            date: r.date,
          })),
        })
      }
      setDetailLoading(false)
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/academician/students/${id}`)
      const json = await res.json()
      if (json.success && json.data) {
        setStudentDetail(json.data)
      }
    } catch {
      setStudentDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const careers = Array.from(new Set(students.map(s => s.career))).filter(Boolean)

  const filtered = students.filter(s => {
    const matchesSearch = !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.career.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.priorityGap.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCareer = careerFilter === 'all' || s.career === careerFilter
    return matchesSearch && matchesCareer
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Student Cohort Directory</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Track individual student readiness, review verified skills, and coordinate technical interventions.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by student name, email, career, or skill gap..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        {careers.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-[var(--color-text-secondary)] shrink-0" />
            <select
              value={careerFilter}
              onChange={e => setCareerFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
            >
              <option value="all">All Career Tracks</option>
              {careers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No students found matching your search or filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => (
            <Card key={s.id} className="border-[var(--color-border-primary)] shadow-sm hover:border-[var(--color-accent)]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{s.name}</h3>
                      <Badge variant={s.readiness >= 80 ? "success" : s.readiness >= 70 ? "secondary" : "warning"}>
                        {s.status}
                      </Badge>
                      {s.educationLevel && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          • {s.educationLevel} ({s.graduationYear || '2026'})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Target Career: <strong className="text-[var(--color-foreground)]">{s.career}</strong>
                    </p>
                    <p className="text-xs text-[var(--color-critical)] pt-0.5">
                      Priority Gap: <strong>{s.priorityGap}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-secondary)]">Career Readiness</p>
                      <p className="text-xl font-bold text-[var(--color-accent)]">{s.readiness}%</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => openStudentDetail(s.id)}
                    >
                      View Student Profile <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-[var(--color-border-primary)] pb-4">
              <div>
                <h2 className="text-h2 font-semibold">{studentDetail?.student.name || 'Student Candidate'}</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {studentDetail?.student.email} • {studentDetail?.student.department || 'Computer Science'}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
              </div>
            ) : studentDetail ? (
              <div className="space-y-6">
                {/* Career Target & Readiness */}
                {studentDetail.careerTarget && (
                  <div className="p-4 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)]">Primary Career Target</p>
                      <p className="text-base font-semibold">{studentDetail.careerTarget.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-secondary)]">Readiness Score</p>
                      <p className="text-2xl font-bold text-[var(--color-accent)]">
                        {studentDetail.careerTarget.readinessScore}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Skills with Verification Levels */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Skill Breakdown & Verification</h3>
                  <div className="space-y-2">
                    {studentDetail.skills.map((sk, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-[var(--color-border-primary)] flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{sk.name}</span>
                            <Badge variant={sk.gapCategory === 'Ready' ? 'success' : sk.gapCategory === 'Critical' ? 'critical' : 'warning'}>
                              {sk.gapCategory}
                            </Badge>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            Current: <strong>{sk.currentLevel}/100</strong> • Benchmark: {sk.requiredLevel}/100
                            {sk.gap > 0 && <span className="text-[var(--color-critical)]"> (-{sk.gap} pts gap)</span>}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {sk.verificationStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reassessments / Progression History */}
                {studentDetail.reassessments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Reassessment & Improvement History</h3>
                    <div className="space-y-2">
                      {studentDetail.reassessments.map((r, i) => (
                        <div key={i} className="p-3 rounded-lg bg-[var(--color-surface-secondary)] text-xs flex justify-between items-center">
                          <div>
                            <span className="font-medium">{r.skillName}</span>
                            <span className="text-[var(--color-text-secondary)]"> ({r.date})</span>
                            <p className="text-[var(--color-text-muted)] mt-0.5">{r.previousScore} → {r.newScore} pts</p>
                          </div>
                          <Badge variant="success">+{r.gain} pts gain</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-primary)]">
                  <Link href={`/academician/mentorship`}>
                    <Button size="sm" className="bg-[var(--color-accent)] cursor-pointer">
                      <BookOpen className="mr-1.5 h-4 w-4" /> Schedule Mentorship
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
