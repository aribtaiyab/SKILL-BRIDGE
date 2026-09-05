"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  User,
  GraduationCap,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  FileCheck2,
  ExternalLink,
  BookOpen,
  Presentation,
  Mail,
  Phone,
  MapPin,
  Clock,
  Plus,
  Loader2,
  RefreshCw,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface StudentDetailData {
  student: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    phone: string | null
    bio: string | null
    location: string | null
    education: string
    graduationYear: number
    institution: string
    department: string
  }
  careerTarget: {
    id: string
    name: string
    description: string
    readiness: number
    readinessCategory: string
  } | null
  skillsBreakdown: Array<{
    skillId: string
    skillName: string
    category: string
    requiredLevel: number
    currentLevel: number
    isAssessed: boolean
    gap: number
    severity: 'critical' | 'needs_improvement' | 'ready'
    importance: string
    verificationStatus: string
    lastAssessedAt: string | null
  }>
  priorityGap: {
    skillId: string
    skillName: string
    gap: number
    severity: string
    requiredLevel: number
    currentLevel: number
  } | null
  recommendedAction: string
  assessmentHistory: Array<{
    id: string
    title: string
    type: string
    score: number
    status: string
    completedAt: string
  }>
  reassessments: Array<{
    id: string
    skillName: string
    previousScore: number
    newScore: number
    improvementPoints: number
    reassessedAt: string
  }>
  evidence: Array<{
    id: string
    skillName: string
    title: string
    description: string
    type: string
    githubUrl: string | null
    liveDemoUrl: string | null
    verificationStatus: string
    submittedAt: string
  }>
  mentorshipHistory: Array<{
    id: string
    skillName: string
    mentorName: string
    status: string
    notes: string | null
    startDate: string | null
    endDate: string | null
  }>
  workshopParticipation: Array<{
    workshopId: string
    title: string
    skillName: string
    status: string
    enrolledAt: string
    attendedAt: string | null
  }>
}

import { useDemo } from "@/lib/demo/demo-context"

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const studentId = resolvedParams.id
  const router = useRouter()
  const { isDemo, demoService } = useDemo()

  const [data, setData] = useState<StudentDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mentorship Modal state
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [mentorNotes, setMentorNotes] = useState('')
  const [mentorStartDate, setMentorStartDate] = useState(new Date().toISOString().split('T')[0])
  const [mentorEndDate, setMentorEndDate] = useState('')
  const [submittingMentor, setSubmittingMentor] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const fetchStudent = async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemo) {
        const s = demoService.getStudentById(studentId)
        if (!s) {
          throw new Error('Student profile not found in demo dataset')
        }
        setData({
          student: {
            id: s.id,
            name: s.name,
            email: s.email,
            avatarUrl: s.avatarUrl,
            phone: s.phone,
            bio: s.bio,
            location: s.location,
            education: s.education,
            graduationYear: s.graduationYear,
            institution: s.institution,
            department: s.department,
          },
          careerTarget: {
            id: s.targetCareerId,
            name: s.targetCareerName,
            description: s.targetCareerDescription,
            readiness: s.readiness,
            readinessCategory: s.readinessCategory,
          },
          skillsBreakdown: s.skills.map(sk => ({
            skillId: sk.skillId,
            skillName: sk.skillName,
            category: sk.category,
            requiredLevel: sk.requiredLevel,
            currentLevel: sk.currentLevel,
            isAssessed: sk.isAssessed,
            gap: sk.gap,
            severity: sk.severity,
            importance: sk.importance,
            verificationStatus: sk.verificationStatus,
            lastAssessedAt: sk.lastAssessedAt,
          })),
          priorityGap: s.priorityGap,
          recommendedAction: s.recommendedAction,
          assessmentHistory: s.assessmentHistory,
          reassessments: s.reassessments,
          evidence: s.evidence,
          mentorshipHistory: s.mentorshipHistory,
          workshopParticipation: s.workshopParticipation,
        })
        if (s.skills.length > 0) {
          setSelectedSkillId(s.priorityGap?.skillId || s.skills[0].skillId)
        }
        setLoading(false)
        return
      }

      const res = await fetch(`/api/academia/students/${studentId}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load student details')
      }
      setData(json.data)
      if (json.data.skillsBreakdown?.length > 0) {
        setSelectedSkillId(json.data.priorityGap?.skillId || json.data.skillsBreakdown[0].skillId)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Could not load student profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudent()
  }, [studentId, isDemo])

  const handleStartMentorship = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSkillId) return

    try {
      setSubmittingMentor(true)

      if (isDemo) {
        demoService.addMentorship({
          studentId,
          skillId: selectedSkillId,
          notes: mentorNotes,
          startDate: mentorStartDate,
          endDate: mentorEndDate || null,
        })
        setActionSuccess(`Demo Simulation: 1-on-1 mentorship session established with ${data?.student.name || 'student'}! Visible in Mentorship Hub.`)
        setShowMentorModal(false)
        setMentorNotes('')
        fetchStudent()
        setTimeout(() => setActionSuccess(null), 5000)
        setSubmittingMentor(false)
        return
      }

      const res = await fetch('/api/academia/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          skillId: selectedSkillId,
          notes: mentorNotes,
          startDate: mentorStartDate,
          endDate: mentorEndDate || null,
          status: 'active',
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to initiate mentorship')
      }
      setActionSuccess('Mentorship established successfully! View progress in the Mentorship module.')
      setShowMentorModal(false)
      setMentorNotes('')
      fetchStudent()
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (err: any) {
      alert(err.message || 'Error initiating mentorship')
    } finally {
      setSubmittingMentor(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading student skill intelligence...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="p-8 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Student Profile Unavailable</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{error || 'This student profile could not be found or you do not have permission to view this department.'}</p>
          <div className="pt-2">
            <Link href="/academia/students">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Student Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { student, careerTarget, skillsBreakdown, priorityGap, recommendedAction, assessmentHistory, reassessments, evidence, mentorshipHistory, workshopParticipation } = data

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/academia/students">
            <button className="h-9 w-9 rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-card-hover)] flex items-center justify-center text-[var(--color-text-secondary)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{student.name}</h1>
            <p className="text-xs text-[var(--color-text-muted)]">{student.education} &bull; Class of {student.graduationYear} &bull; {student.institution}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowMentorModal(true)}
            className="bg-[var(--color-accent)] hover:opacity-90 text-white shadow-sm flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Initiate Mentorship
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-[var(--radius-card)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Student Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--color-text-primary)] truncate">{student.name}</h2>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{student.email}</p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                {student.department}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border-primary)] space-y-2 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              <span>{student.institution}</span>
            </div>
            {student.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span>{student.location}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span>{student.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Career Target & Overall Readiness */}
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Target Career Pathway</span>
            <Target className="h-4 w-4 text-[var(--color-accent)]" />
          </div>

          {careerTarget ? (
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{careerTarget.name}</h3>
              <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mt-1">{careerTarget.description}</p>

              <div className="mt-4 pt-3 border-t border-[var(--color-border-primary)]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Role Readiness</span>
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{careerTarget.readiness}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--color-surface-card-hover)] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      careerTarget.readiness >= 75
                        ? 'bg-emerald-500'
                        : careerTarget.readiness >= 50
                        ? 'bg-[var(--color-accent)]'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${careerTarget.readiness}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--color-text-muted)]">Status Tier:</span>
                  <span className="font-semibold text-[var(--color-accent)]">{careerTarget.readinessCategory}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[var(--color-text-muted)]">
              No target career selected by student yet.
            </div>
          )}
        </div>

        {/* Automated Faculty Guidance & Priority Gap */}
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Priority Action</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            {priorityGap ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{priorityGap.skillName}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                    priorityGap.severity === 'critical'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  }`}>
                    {priorityGap.severity === 'critical' ? 'Critical Deficit' : 'Near Benchmark'}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Current score: <span className="font-semibold text-[var(--color-text-primary)]">{priorityGap.currentLevel}</span> / Required: <span className="font-semibold text-[var(--color-text-primary)]">{priorityGap.requiredLevel}</span> (Gap: -{priorityGap.gap} pts)
                </p>
                <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--color-surface-card-hover)] border border-[var(--color-border-primary)] text-xs text-[var(--color-text-secondary)]">
                  {recommendedAction}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-bold">All Benchmarks Satisfied</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {recommendedAction}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--color-border-primary)] flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMentorModal(true)}
              className="text-xs"
            >
              Assign Faculty Action
            </Button>
          </div>
        </div>
      </div>

      {/* Role Benchmark Skills Breakdown */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Skill Benchmark Evaluation</h3>
            <p className="text-xs text-[var(--color-text-muted)]">Opportunity-specific requirement breakdown against industry criteria</p>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            Total Target Skills: <strong className="text-[var(--color-text-primary)]">{skillsBreakdown.length}</strong>
          </span>
        </div>

        {skillsBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
            No specific skill benchmarks associated with this career pathway yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-primary)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Skill Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Required Level</th>
                  <th className="py-3 px-4 text-center">Current Score</th>
                  <th className="py-3 px-4 text-center">Deficit (Gap)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Verification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-primary)] text-[var(--color-text-secondary)]">
                {skillsBreakdown.map((s) => (
                  <tr key={s.skillId} className="hover:bg-[var(--color-surface-card-hover)] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">{s.skillName}</td>
                    <td className="py-3 px-4 text-[var(--color-text-muted)]">{s.category}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{s.requiredLevel}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {s.isAssessed ? s.currentLevel : <span className="text-[var(--color-text-muted)] italic">Unassessed</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {s.gap > 0 ? (
                        <span className="text-rose-500 font-bold">-{s.gap} pts</span>
                      ) : (
                        <span className="text-emerald-500 font-bold">0 (Met)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : s.severity === 'needs_improvement'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}>
                        {s.severity === 'critical' ? 'Critical Deficit' : s.severity === 'needs_improvement' ? 'Developing' : 'Ready'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        s.verificationStatus === 'verified'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : s.verificationStatus === 'submitted'
                          ? 'text-amber-500'
                          : 'text-[var(--color-text-muted)]'
                      }`}>
                        {s.verificationStatus === 'verified' ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {s.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.gap > 0 && (
                        <button
                          onClick={() => {
                            setSelectedSkillId(s.skillId)
                            setShowMentorModal(true)
                          }}
                          className="text-[11px] text-[var(--color-accent)] hover:underline font-semibold"
                        >
                          Mentor Skill
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Practical Evidence & Proof of Competence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Practical Evidence Submissions */}
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Practical Evidence & Proof</h3>
            <span className="text-xs text-[var(--color-text-muted)]">{evidence.length} artifact(s)</span>
          </div>

          {evidence.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-card-hover)] rounded-[var(--radius-control)]">
              No evidence artifacts submitted by the student yet.
            </div>
          ) : (
            <div className="space-y-3">
              {evidence.map((item) => (
                <div key={item.id} className="p-4 rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] hover:border-[var(--color-accent)]/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)]">{item.title}</h4>
                      <p className="text-[11px] text-[var(--color-accent)] font-semibold mt-0.5">{item.skillName} &bull; {item.type}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.verificationStatus === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {item.verificationStatus}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-3 pt-2 border-t border-[var(--color-border-primary)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {item.githubUrl && (
                        <a href={item.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--color-accent)] hover:underline">
                          <ExternalLink className="h-3 w-3" /> GitHub Repo
                        </a>
                      )}
                      {item.liveDemoUrl && (
                        <a href={item.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--color-accent)] hover:underline">
                          <ExternalLink className="h-3 w-3" /> Live Demo
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Longitudinal Reassessment & Growth */}
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Reassessment & Progress Trajectory</h3>
            <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
          </div>

          {reassessments.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-card-hover)] rounded-[var(--radius-control)]">
              No reassessment records yet. Longitudinal growth will appear when the student retakes an assessment after faculty intervention.
            </div>
          ) : (
            <div className="space-y-3">
              {reassessments.map((r) => (
                <div key={r.id} className="p-3.5 rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)]">{r.skillName}</h4>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {new Date(r.reassessedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <div className="text-[var(--color-text-muted)] text-[10px]">Previous &rarr; New</div>
                      <div className="font-semibold text-[var(--color-text-primary)]">{r.previousScore} &rarr; {r.newScore}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      r.improvementPoints >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {r.improvementPoints >= 0 ? `+${r.improvementPoints}` : r.improvementPoints} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assessment Attempts Summary */}
          <div className="pt-4 border-t border-[var(--color-border-primary)]">
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-2">Recent Assessment Attempts</h4>
            {assessmentHistory.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No assessment attempts recorded.</p>
            ) : (
              <div className="space-y-2">
                {assessmentHistory.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border-primary)]/50 last:border-0">
                    <div>
                      <span className="font-medium text-[var(--color-text-primary)]">{a.title}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] block capitalize">{a.type} &bull; {new Date(a.completedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="font-mono font-bold text-[var(--color-text-primary)]">{a.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mentorship Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Initiate 1-on-1 Mentorship</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Pair with {student.name} to accelerate skill readiness</p>
              </div>
              <button
                onClick={() => setShowMentorModal(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStartMentorship} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Focus Skill</label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  required
                >
                  <option value="" disabled>Select a skill</option>
                  {skillsBreakdown.map((s) => (
                    <option key={s.skillId} value={s.skillId}>
                      {s.skillName} (Gap: -{s.gap} pts &bull; {s.severity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={mentorStartDate}
                    onChange={(e) => setMentorStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={mentorEndDate}
                    onChange={(e) => setMentorEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Guidance Plan & Notes</label>
                <textarea
                  rows={3}
                  value={mentorNotes}
                  onChange={(e) => setMentorNotes(e.target.value)}
                  placeholder="Outline planned check-ins, remedial assignments, or specific exercises..."
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border-primary)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMentorModal(false)}
                  disabled={submittingMentor}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingMentor}
                  className="bg-[var(--color-accent)] hover:opacity-90 text-white"
                >
                  {submittingMentor ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Assigning...
                    </>
                  ) : (
                    'Confirm Mentorship'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
