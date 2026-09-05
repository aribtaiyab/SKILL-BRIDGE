"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Users, Search, Filter, ArrowRight, AlertTriangle,
  CheckCircle2, Loader2, Sparkles, UserCheck, ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api-client"

interface StudentItem {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  careerTarget: string
  careerTargetId: string | null
  education: string
  graduationYear: number
  isAssessed: boolean
  readiness: number
  readinessCategory: string
  priorityGap: string
  topGapSkill: string | null
  topGapPoints: number
  verifiedSkillsCount: number
  totalSkillsCount: number
  hasPendingEvidence: boolean
}

import { useDemo } from "@/lib/demo/demo-context"

export default function AcademiaStudentsPage() {
  const { isDemo, demoService } = useDemo()
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [readinessFilter, setReadinessFilter] = useState("all")
  const [assessmentFilter, setAssessmentFilter] = useState("all")

  useEffect(() => {
    setLoading(true)

    if (isDemo) {
      const res = demoService.getStudents(search, 'all', readinessFilter, assessmentFilter)
      const mapped: StudentItem[] = res.students.map(s => {
        const full = demoService.getStudentById(s.id)
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          avatarUrl: s.avatarUrl,
          careerTarget: s.targetCareer,
          careerTargetId: s.targetCareerId,
          education: s.education,
          graduationYear: s.graduationYear,
          isAssessed: s.isAssessed,
          readiness: s.readiness,
          readinessCategory: s.readinessCategory,
          priorityGap: s.priorityGap ? `${s.priorityGap.skillName} (-${s.priorityGap.gap} pts)` : 'None',
          topGapSkill: s.priorityGap ? s.priorityGap.skillName : null,
          topGapPoints: s.priorityGap ? s.priorityGap.gap : 0,
          verifiedSkillsCount: full ? full.skills.filter(sk => sk.verificationStatus === 'verified').length : 0,
          totalSkillsCount: full ? full.skills.length : 0,
          hasPendingEvidence: full ? full.evidence.some(e => e.verificationStatus === 'submitted') : false,
        }
      })
      setStudents(mapped)
      setLoading(false)
      return
    }

    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (readinessFilter !== 'all') params.append('readiness', readinessFilter)
    if (assessmentFilter !== 'all') params.append('assessed', assessmentFilter)

    apiClient<{ success: boolean; data: StudentItem[] }>(`/api/academia/students?${params.toString()}`)
      .then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setStudents(res.data)
        } else {
          setStudents([])
        }
      })
      .catch(err => {
        console.warn('Students fetch error:', err)
        setStudents([])
      })
      .finally(() => setLoading(false))
  }, [search, readinessFilter, assessmentFilter, isDemo, demoService])

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              Authorized Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Cohort Students
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Student placement readiness metrics, measured gap severities, and direct academic interventions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/academia/mentorship">
            <Button size="sm" className="rounded-xl h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20">
              Schedule Mentorship
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-4 sm:p-5 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <Input
            placeholder="Search student name, email, or gap..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={readinessFilter}
            onChange={(e) => setReadinessFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700"
          >
            <option value="all">All Readiness Brackets</option>
            <option value="ready">Ready (70%+)</option>
            <option value="developing">Developing (50-69%)</option>
            <option value="critical">Critical (&lt;50%)</option>
          </select>

          <select
            value={assessmentFilter}
            onChange={(e) => setAssessmentFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700"
          >
            <option value="all">All Assessment Statuses</option>
            <option value="assessed">Assessed Students</option>
            <option value="unassessed">Unassessed Students</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold text-slate-500">Filtering authorized students...</p>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No students found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || readinessFilter !== 'all' || assessmentFilter !== 'all'
              ? 'Try adjusting your search or filters to locate students.'
              : 'No student accounts are currently enrolled in your institution or department. Real student records will appear automatically when students enroll.'}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Student Identity</th>
                  <th className="py-3.5 px-4">Target Career</th>
                  <th className="py-3.5 px-4">Placement Readiness</th>
                  <th className="py-3.5 px-4">Priority Skill Gap</th>
                  <th className="py-3.5 px-4">Assessment & Proof</th>
                  <th className="py-3.5 px-5 text-right">Academic Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((std) => (
                  <tr key={std.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {std.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{std.name}</div>
                          <div className="text-[11px] text-slate-400">{std.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {std.careerTarget}
                    </td>

                    <td className="py-4 px-4">
                      {std.isAssessed ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{std.readiness}%</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              std.readiness >= 70
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : std.readiness >= 50
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {std.readinessCategory}
                            </span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                std.readiness >= 70 ? 'bg-emerald-500' : std.readiness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${std.readiness}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassessed</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {std.topGapPoints > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="h-3 w-3 text-rose-500" />
                          {std.topGapSkill} (-{std.topGapPoints} pts)
                        </span>
                      ) : std.isAssessed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Met Benchmarks
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending evaluation</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-[11px] text-slate-600">
                        <div>{std.verifiedSkillsCount} Verified Competencies</div>
                        {std.hasPendingEvidence && (
                          <span className="text-[10px] font-bold text-amber-600 mt-0.5 block">Evidence Pending Review</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Link href={`/academia/students/${std.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-xl text-xs font-bold border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          View Student Detail <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
