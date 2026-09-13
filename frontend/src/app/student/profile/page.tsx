"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  User, Mail, Phone, MapPin, GraduationCap, Calendar,
  ShieldCheck, Award, Target, Layers, ArrowRight,
  Edit3, Check, Loader2, Sparkles, ExternalLink, RefreshCw,
  FileText, Briefcase, CheckCircle2, ChevronRight, AlertCircle, X
} from "lucide-react"

interface StudentProfileData {
  profile_id: string
  full_name: string
  email: string
  avatar_url?: string | null
  bio?: string
  phone?: string
  location?: string
  education?: string
  graduation_year?: number
  experience_level?: string
  target_career_id?: string | null
  career_targets?: {
    id: string
    name: string
    slug?: string
    description?: string
  } | null
  created_at?: string
}

interface SkillItem {
  id: string
  name: string
  currentLevel: number
  verifiedLevel: number
  verificationStatus: string
  statusLabel: 'Verified' | 'Assessed' | 'Self-Declared'
}

export default function StudentProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null)
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [verificationCount, setVerificationCount] = useState({ total: 0, verified: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  // Edit Profile Modal
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    phone: '',
    location: '',
    education: '',
    graduation_year: 2026,
    experience_level: 'Student / Entry-level'
  })

  const loadProfile = async () => {
    try {
      const [pRes, sRes, vRes] = await Promise.allSettled([
        apiClient<any>('/api/student/profile'),
        apiClient<any>('/api/student/skills'),
        apiClient<any>('/api/verification/student/requests')
      ])

      if (pRes.status === 'fulfilled' && pRes.value?.success && pRes.value?.data) {
        const pd = pRes.value.data
        setProfileData(pd)
        setEditForm({
          full_name: pd.full_name || '',
          bio: pd.bio || '',
          phone: pd.phone || '',
          location: pd.location || '',
          education: pd.education || 'Undergraduate Computer Science',
          graduation_year: pd.graduation_year || 2026,
          experience_level: pd.experience_level || 'Student / Entry-level'
        })
      }

      if (sRes.status === 'fulfilled' && sRes.value?.success && Array.isArray(sRes.value.data)) {
        const mapped: SkillItem[] = sRes.value.data.map((item: any) => {
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
            currentLevel: Number(item.current_level ?? item.self_declared_level ?? 0),
            verifiedLevel: Number(item.verified_level ?? 0),
            verificationStatus: vStatus,
            statusLabel
          }
        })
        setSkills(mapped)
      }

      if (vRes.status === 'fulfilled') {
        const vData = vRes.value?.data || vRes.value?.requests || []
        if (Array.isArray(vData)) {
          const total = vData.length
          const verified = vData.filter((r: any) => r.status === 'approved').length
          const pending = vData.filter((r: any) => r.status === 'pending' || r.status === 'in_review').length
          setVerificationCount({ total, verified, pending })
        }
      }
    } catch (err) {
      console.warn("Notice loading profile data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)

    try {
      const res = await apiClient<any>('/api/student/profile', {
        method: 'PATCH',
        body: JSON.stringify(editForm)
      })

      if (res?.success) {
        setSaveSuccess(true)
        if (refreshProfile) await refreshProfile()
        await loadProfile()
        setTimeout(() => {
          setIsEditing(false)
          setSaveSuccess(false)
        }, 800)
      }
    } catch (err) {
      console.warn("Failed to update student profile:", err)
    } finally {
      setSaving(false)
    }
  }

  // Deterministic Profile Completeness Calculation
  const completenessDetails = useMemo(() => {
    const checks = [
      {
        label: "Basic Contact & Identity",
        weight: 20,
        completed: Boolean(profileData?.full_name && profileData?.email)
      },
      {
        label: "Education & Institution Details",
        weight: 20,
        completed: Boolean(profileData?.education && profileData?.graduation_year)
      },
      {
        label: "Technical Skills Portfolio",
        weight: 20,
        completed: skills.length > 0
      },
      {
        label: "About Me / Professional Bio",
        weight: 20,
        completed: Boolean(profileData?.bio && profileData.bio.trim().length > 10)
      },
      {
        label: "Target Career Direction",
        weight: 20,
        completed: Boolean(profileData?.target_career_id || profileData?.career_targets?.name)
      }
    ]

    const totalPercentage = checks.reduce((sum, item) => sum + (item.completed ? item.weight : 0), 0)

    return {
      percentage: totalPercentage,
      checks
    }
  }, [profileData, skills])

  const initials = (profileData?.full_name || 'ST')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-100 rounded-3xl" />
          <div className="md:col-span-2 h-72 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Profile Header Card */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center text-2xl font-black shadow-sm shrink-0">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {profileData?.full_name || 'Student'}
                </h1>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                  Verified Student
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {profileData?.email || user?.email}
                </span>
                {profileData?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {profileData.location}
                  </span>
                )}
                {profileData?.education && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> {profileData.education}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setIsEditing(true)}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </Button>
            <Link href="/student/passport">
              <Button
                variant="outline"
                className="h-9 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs gap-1.5"
              >
                <Award className="h-3.5 w-3.5 text-emerald-600" /> Skill Passport
              </Button>
            </Link>
          </div>
        </div>

        {/* Deterministic Profile Completion Meter */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Profile Completeness:</span>
              <span className="text-xs font-extrabold text-emerald-700">{completenessDetails.percentage}%</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {completenessDetails.percentage === 100 
                ? 'All foundational profile parameters satisfied' 
                : 'Complete remaining fields to strengthen institutional and industry visibility'}
            </span>
          </div>

          <Progress value={completenessDetails.percentage} className="h-2 mb-4" />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            {completenessDetails.checks.map((c, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 ${
                  c.completed
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {c.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className="truncate">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Profile Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: About & Academic Summary */}
        <div className="space-y-6">
          {/* About Me */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">About Me</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
              >
                Edit
              </Button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {profileData?.bio || "No professional summary added yet. Add a short bio describing your engineering interests and technical goals."}
            </p>
          </div>

          {/* Academic Background */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Education & Institution</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Education Level</span>
                <span className="font-semibold text-slate-800">{profileData?.education || 'Undergraduate'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Graduation Year</span>
                <span className="font-semibold text-slate-800">{profileData?.graduation_year || '2026'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Experience Stage</span>
                <span className="font-semibold text-slate-800">{profileData?.experience_level || 'Student / Entry-level'}</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Navigation</h3>
            <Link href="/student/career" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" /> Career Target & Gap
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/student/skills" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-600" /> Manage Skills Portfolio
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/student/verification" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-600" /> Academician Verification
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Right Column: Skills & Career Focus */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Career Target Card */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Career Direction</h3>
                <p className="text-xs text-slate-500 mt-0.5">Your declared target engineering role and requirements</p>
              </div>
              <Link href="/student/career">
                <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1">
                  Change Target <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            {profileData?.career_targets?.name || profileData?.target_career_id ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Configured Target</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{profileData.career_targets?.name || 'Selected Engineering Target'}</div>
                  {profileData.career_targets?.description && (
                    <p className="text-xs text-slate-600 mt-1 max-w-lg">{profileData.career_targets.description}</p>
                  )}
                </div>
                <Link href="/student/career">
                  <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0">
                    View Benchmark Roadmap
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="text-xs font-bold text-slate-900">No Career Target Configured</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Set your career target to receive targeted skill gap evaluations against industry benchmarks.
                </p>
                <div className="pt-2">
                  <Link href="/student/career">
                    <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1">
                      Set Career Target <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Skills Portfolio */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Skills Portfolio</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real verified, assessed, and declared technical competencies</p>
              </div>
              <Link href="/student/skills">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg h-8 gap-0.5">
                  Manage Skills ({skills.length}) <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map(skill => (
                  <div key={skill.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{skill.name}</span>
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
                    <div className="flex items-center gap-2">
                      <Progress value={skill.currentLevel} className="h-1.5 flex-1" />
                      <span className="text-[11px] font-mono font-bold text-slate-600">{skill.currentLevel}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="text-xs font-bold text-slate-900">No skills declared yet</div>
                <p className="text-[11px] text-slate-500">Add the programming languages and technical tools you are proficient in.</p>
                <div className="pt-2">
                  <Link href="/student/skills">
                    <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1">
                      Add Skills <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Student Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Professional Bio / About</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Briefly describe your engineering background, project focus, and career goals..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Education Level</label>
                  <input
                    type="text"
                    value={editForm.education}
                    onChange={e => setEditForm(prev => ({ ...prev, education: e.target.value }))}
                    placeholder="e.g. Undergraduate CS"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={editForm.graduation_year}
                    onChange={e => setEditForm(prev => ({ ...prev, graduation_year: parseInt(e.target.value) || 2026 }))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Profile updated successfully!
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
