"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Award, Users, Presentation, GitMerge, Clock, Calendar,
  CheckCircle2, ArrowRight, Loader2, Sparkles, BookOpen, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"

interface ExperienceData {
  academician: {
    name: string
    email: string
    designation: string
    teachingArea: string | null
  }
  stats: {
    totalStudentsMentored: number
    activeMentorshipsCount: number
    completedMentorshipsCount: number
    workshopsConductedCount: number
    upcomingWorkshopsCount: number
    interventionsContributedCount: number
    supportedSkillsCount: number
    supportedSkills: string[]
  }
  mentorships: Array<{
    id: string
    studentName: string
    studentEmail: string
    skillName: string
    status: string
    notes: string
    startDate: string
    endDate: string | null
    createdAt: string
  }>
  workshops: Array<{
    id: string
    title: string
    description: string
    skillName: string
    date: string
    duration: string
    capacity: number
    status: string
  }>
  recentActivity: Array<{
    id: string
    type: 'mentorship' | 'workshop' | 'intervention'
    title: string
    timestamp: string
    status: string
  }>
}

import { useDemo } from "@/lib/demo/demo-context"

export default function MyExperiencePage() {
  const { isDemo, demoService } = useDemo()
  const [data, setData] = useState<ExperienceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      const exp = demoService.getMyExperience()
      const mentorships = demoService.getMentorships()
      const workshops = demoService.getWorkshops()
      setData({
        academician: {
          name: exp.facultyName,
          email: 'ananya.sharma@dtu.ac.in',
          designation: exp.designation,
          teachingArea: 'Full Stack Development, Web Technologies & Databases',
        },
        stats: {
          totalStudentsMentored: exp.metrics.studentsMentoredCount,
          activeMentorshipsCount: exp.metrics.activeMentorshipsCount,
          completedMentorshipsCount: exp.metrics.completedMentorshipsCount,
          workshopsConductedCount: exp.metrics.workshopsConductedCount,
          upcomingWorkshopsCount: 4,
          interventionsContributedCount: exp.metrics.interventionsLedCount,
          supportedSkillsCount: exp.skillDomains.length,
          supportedSkills: exp.skillDomains.map(s => s.name),
        },
        mentorships: mentorships.map(m => ({
          id: m.id,
          studentName: m.studentName,
          studentEmail: m.studentEmail,
          skillName: m.skillName,
          status: m.status,
          notes: m.notes,
          startDate: m.startDate,
          endDate: m.endDate,
          createdAt: m.createdAt,
        })),
        workshops: workshops.map(w => ({
          id: w.id,
          title: w.title,
          description: w.description,
          skillName: w.skillName,
          date: w.date,
          duration: w.duration,
          capacity: w.capacity,
          status: w.status,
        })),
        recentActivity: exp.recentActivity.map(a => ({
          id: a.id,
          type: (a.badge === 'Mentorship' ? 'mentorship' : a.badge === 'Workshop' ? 'workshop' : 'intervention') as any,
          title: `${a.title} — ${a.detail}`,
          timestamp: a.date,
          status: a.badge,
        })),
      })
      setLoading(false)
      return
    }

    apiClient<{ success: boolean; data: ExperienceData }>('/api/academia/experience')
      .then(res => {
        if (res?.success && res.data) {
          setData(res.data)
        }
      })
      .catch(err => console.warn('Experience fetch error:', err))
      .finally(() => setLoading(false))
  }, [isDemo, demoService])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Retrieving academician activity history...</p>
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const acad = data?.academician
  const mentorships = data?.mentorships || []
  const workshops = data?.workshops || []
  const activities = data?.recentActivity || []

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              Contribution Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Experience & Institutional Activity
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Authentic record of your student mentorships, workshops conducted, and cohort interventions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/academia/mentorship">
            <Button size="sm" className="rounded-xl h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
              New Mentorship
            </Button>
          </Link>
          <Link href="/academia/workshops">
            <Button size="sm" variant="outline" className="rounded-xl h-9 px-3.5 border-slate-200 text-slate-700 font-bold text-xs">
              Create Workshop
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 sm:p-7 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-indigo-500/20">
            {acad?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'FA'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{acad?.name}</h2>
            <p className="text-xs font-semibold text-indigo-600">{acad?.designation || 'Academician'} • {acad?.email}</p>
            {acad?.teachingArea && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Domain: {acad.teachingArea}</p>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Verified Status</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mt-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active Academic Contributor
          </span>
        </div>
      </div>

      {/* Real Aggregate Contribution Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/90 border border-slate-200/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Students Mentored</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats?.totalStudentsMentored || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Direct 1-on-1 coaching</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/90 border border-slate-200/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workshops Led</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats?.workshopsConductedCount || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">{stats?.upcomingWorkshopsCount || 0} upcoming/scheduled</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/90 border border-slate-200/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Interventions</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats?.interventionsContributedCount || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Remedial programs deployed</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/90 border border-slate-200/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skills Supported</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats?.supportedSkillsCount || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Technical competency areas</p>
        </div>
      </div>

      {/* Activity Logs & Mentorship History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Contributions Stream */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Activity & Contribution Timeline</h3>
            <p className="text-xs text-slate-500">Chronological history of your institutional interventions</p>
          </div>

          {activities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed">
              No recent activity records. Start a mentorship session or create a workshop to build your verified academic contribution history.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{act.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mentorship Records */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/70 p-6 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assigned Mentorship Sessions</h3>
              <p className="text-xs text-slate-500">Students receiving targeted faculty guidance</p>
            </div>
            <Link href="/academia/mentorship">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600">
                Manage →
              </Button>
            </Link>
          </div>

          {mentorships.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed">
              No mentorship sessions active. Click &quot;New Mentorship&quot; to assign focused coaching.
            </div>
          ) : (
            <div className="space-y-3">
              {mentorships.slice(0, 5).map(m => (
                <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">{m.studentName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium">{m.skillName}</p>
                  <p className="text-[11px] text-slate-500 italic truncate">&quot;{m.notes}&quot;</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
