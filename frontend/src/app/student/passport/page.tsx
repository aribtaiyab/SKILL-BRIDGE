"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck, Award, GraduationCap, MapPin, Mail, Phone,
  Globe, ExternalLink, Edit3, Plus,
  Trash2, Layers, CheckCircle2, AlertCircle, Sparkles,
  Calendar, Briefcase, FileCode, Check, Loader2, X, RefreshCw,
  FolderGit2, Code2, ArrowUpRight
} from 'lucide-react'

// Brand Icons
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.69 1.69 0 0 0 0-3.38 1.69 1.69 0 0 0 0 3.38m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

interface SkillItem {
  id: string
  name: string
  category?: string
  score: number
  verification_status: string
  levelLabel: string
  badgeLabel: string
  badgeVariant: 'verified' | 'practical' | 'assessment' | 'self_declared'
}

interface ProjectItem {
  id: string
  title: string
  description: string
  technologies: string[]
  github_url?: string | null
  project_url?: string | null
  created_at?: string
}

interface CertificationItem {
  id: string
  name: string
  issuing_organization: string
  issue_date?: string | null
  credential_url?: string | null
}

interface PassportProfile {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  bio?: string
  phone?: string
  location?: string
  college_name?: string
  degree?: string
  branch?: string
  academic_year?: string
  graduation_year?: number
  education?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  target_role?: string | null
}

export default function SkillPassportPage() {
  const { user, profile: authProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Real Data State
  const [passportProfile, setPassportProfile] = useState<PassportProfile | null>(null)
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [certifications, setCertifications] = useState<CertificationItem[]>([])

  // Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null)
  const [isAddCertOpen, setIsAddCertOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Edit Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    college_name: '',
    degree: '',
    branch: '',
    academic_year: '',
    graduation_year: 2026,
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
  })

  // Project Form State
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    technologies: '',
    github_url: '',
    project_url: '',
  })

  // Certification Form State
  const [certForm, setCertForm] = useState({
    name: '',
    issuing_organization: '',
    issue_date: '',
    credential_url: '',
  })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Determine skill level label from score (0-100)
  const getLevelLabel = (score: number): string => {
    if (score >= 85) return 'Advanced'
    if (score >= 70) return 'Strong'
    if (score >= 55) return 'Intermediate'
    if (score >= 35) return 'Developing'
    return 'Beginner'
  }

  // Determine verification badge style
  const getVerificationDetails = (status: string) => {
    switch (status) {
      case 'academically_verified':
      case 'institution_verified':
      case 'evidence_verified':
      case 'approved':
        return { label: '✓ Academically Verified', variant: 'verified' as const }
      case 'practical_verified':
        return { label: '✓ Practical Verified', variant: 'practical' as const }
      case 'assessment_verified':
        return { label: '✓ Assessment Verified', variant: 'assessment' as const }
      default:
        return { label: '○ Self-Declared', variant: 'self_declared' as const }
    }
  }

  const loadPassportData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const [profileRes, skillsRes, projectsRes, certsRes] = await Promise.allSettled([
        apiClient<any>('/api/student/profile'),
        apiClient<any>('/api/student/skills'),
        apiClient<any>('/api/student/projects'),
        apiClient<any>('/api/student/certifications')
      ])

      // 1. Process Profile
      if (profileRes.status === 'fulfilled' && profileRes.value?.success && profileRes.value?.data) {
        const pd = profileRes.value.data
        const mappedProf: PassportProfile = {
          id: pd.profile_id || user?.id || '',
          name: pd.full_name || authProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
          email: pd.email || user?.email || '',
          avatar_url: pd.avatar_url || authProfile?.avatar_url || user?.user_metadata?.avatar_url || null,
          bio: pd.bio || '',
          phone: pd.phone || '',
          location: pd.location || '',
          college_name: pd.college_name || '',
          degree: pd.degree || pd.education || '',
          branch: pd.branch || '',
          academic_year: pd.academic_year || '',
          graduation_year: pd.graduation_year || 2026,
          education: pd.education || '',
          linkedin_url: pd.linkedin_url || '',
          github_url: pd.github_url || '',
          portfolio_url: pd.portfolio_url || '',
          target_role: pd.career_targets?.name || null
        }
        setPassportProfile(mappedProf)
        setProfileForm({
          full_name: mappedProf.name,
          bio: mappedProf.bio || '',
          location: mappedProf.location || '',
          phone: mappedProf.phone || '',
          college_name: mappedProf.college_name || '',
          degree: mappedProf.degree || '',
          branch: mappedProf.branch || '',
          academic_year: mappedProf.academic_year || '',
          graduation_year: mappedProf.graduation_year || 2026,
          linkedin_url: mappedProf.linkedin_url || '',
          github_url: mappedProf.github_url || '',
          portfolio_url: mappedProf.portfolio_url || '',
        })
      }

      // 2. Process Skills
      if (skillsRes.status === 'fulfilled' && skillsRes.value?.success && Array.isArray(skillsRes.value.data)) {
        const mappedSkills: SkillItem[] = skillsRes.value.data.map((item: any) => {
          const score = Number(item.current_level ?? item.self_declared_level ?? 50)
          const vStatus = item.verification_status || 'self_declared'
          const vInfo = getVerificationDetails(vStatus)
          return {
            id: item.skill_id || item.id || Math.random().toString(),
            name: item.skills?.name || item.skill_name || item.name || 'Skill',
            category: item.skills?.category || item.category || 'Core Skill',
            score,
            verification_status: vStatus,
            levelLabel: getLevelLabel(score),
            badgeLabel: vInfo.label,
            badgeVariant: vInfo.variant
          }
        })
        setSkills(mappedSkills)
      } else {
        setSkills([])
      }

      // 3. Process Projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value?.success && Array.isArray(projectsRes.value.data)) {
        setProjects(projectsRes.value.data)
      } else {
        setProjects([])
      }

      // 4. Process Certifications
      if (certsRes.status === 'fulfilled' && certsRes.value?.success && Array.isArray(certsRes.value.data)) {
        setCertifications(certsRes.value.data)
      } else {
        setCertifications([])
      }

    } catch (err) {
      console.warn("Notice loading passport data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, authProfile])

  useEffect(() => {
    loadPassportData()
  }, [loadPassportData])

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await apiClient<any>('/api/student/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm)
      })
      if (res?.success) {
        showToast('Passport profile updated successfully')
        if (refreshProfile) await refreshProfile()
        await loadPassportData(true)
        setIsEditProfileOpen(false)
      } else {
        showToast(res?.error || 'Failed to update profile')
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating profile')
    } finally {
      setActionLoading(false)
    }
  }

  // Create or Update Project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const techArray = projectForm.technologies
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      if (editingProject) {
        const res = await apiClient<any>(`/api/student/projects/${editingProject.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: projectForm.title,
            description: projectForm.description,
            technologies: techArray,
            github_url: projectForm.github_url || null,
            project_url: projectForm.project_url || null,
          })
        })
        if (res?.success) {
          showToast('Project updated successfully')
          await loadPassportData(true)
          setIsAddProjectOpen(false)
          setEditingProject(null)
        }
      } else {
        const res = await apiClient<any>(`/api/student/projects`, {
          method: 'POST',
          body: JSON.stringify({
            title: projectForm.title,
            description: projectForm.description,
            technologies: techArray,
            github_url: projectForm.github_url || null,
            project_url: projectForm.project_url || null,
          })
        })
        if (res?.success) {
          showToast('Project added to passport')
          await loadPassportData(true)
          setIsAddProjectOpen(false)
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving project')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Project
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to remove this project?')) return
    try {
      const res = await apiClient<any>(`/api/student/projects/${id}`, {
        method: 'DELETE'
      })
      if (res?.success) {
        showToast('Project removed')
        await loadPassportData(true)
      }
    } catch (err: any) {
      showToast(err?.message || 'Error removing project')
    }
  }

  // Create Certification
  const handleSaveCertification = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await apiClient<any>('/api/student/certifications', {
        method: 'POST',
        body: JSON.stringify(certForm)
      })
      if (res?.success) {
        showToast('Certification added to passport')
        await loadPassportData(true)
        setIsAddCertOpen(false)
        setCertForm({ name: '', issuing_organization: '', issue_date: '', credential_url: '' })
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving certification')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Certification
  const handleDeleteCertification = async (id: string) => {
    if (!confirm('Are you sure you want to remove this certification?')) return
    try {
      const res = await apiClient<any>(`/api/student/certifications/${id}`, {
        method: 'DELETE'
      })
      if (res?.success) {
        showToast('Certification removed')
        await loadPassportData(true)
      }
    } catch (err: any) {
      showToast(err?.message || 'Error removing certification')
    }
  }

  // Deterministic Profile Completeness (0-100%)
  const completeness = useMemo(() => {
    const checks = [
      { name: 'Full Name', met: Boolean(passportProfile?.name) },
      { name: 'College / Institution', met: Boolean(passportProfile?.college_name) },
      { name: 'Degree & Branch', met: Boolean(passportProfile?.degree && passportProfile?.branch) },
      { name: 'Short Bio', met: Boolean(passportProfile?.bio && passportProfile.bio.length >= 10) },
      { name: 'Skills Added', met: skills.length > 0 },
      { name: 'Projects Added', met: projects.length > 0 },
      { name: 'Professional Links', met: Boolean(passportProfile?.github_url || passportProfile?.linkedin_url) },
    ]

    const metCount = checks.filter(c => c.met).length
    const score = Math.round((metCount / checks.length) * 100)
    const missing = checks.filter(c => !c.met).map(c => c.name)

    return { score, missing }
  }, [passportProfile, skills, projects])

  const initials = (passportProfile?.name || 'ST')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const openProjectModal = (proj?: ProjectItem) => {
    if (proj) {
      setEditingProject(proj)
      setProjectForm({
        title: proj.title,
        description: proj.description,
        technologies: proj.technologies.join(', '),
        github_url: proj.github_url || '',
        project_url: proj.project_url || '',
      })
    } else {
      setEditingProject(null)
      setProjectForm({
        title: '',
        description: '',
        technologies: '',
        github_url: '',
        project_url: '',
      })
    }
    setIsAddProjectOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse pb-16 max-w-5xl mx-auto">
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="md:col-span-2 h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. PROFILE HEADER ─── */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {passportProfile?.name || 'Student Name'}
                </h1>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-semibold">
                  Official Skill Passport
                </Badge>
              </div>

              {/* Degree · Branch · Year */}
              <div className="text-xs sm:text-sm font-semibold text-slate-700">
                {passportProfile?.degree || passportProfile?.branch ? (
                  <span>
                    {[passportProfile.degree, passportProfile.branch, passportProfile.academic_year].filter(Boolean).join(' · ')}
                  </span>
                ) : (
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="text-xs text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    + Add your degree & branch
                  </button>
                )}
              </div>

              {/* College / Institution & Location */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-0.5">
                {passportProfile?.college_name ? (
                  <span className="flex items-center gap-1 text-slate-600">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    {passportProfile.college_name}
                  </span>
                ) : (
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    + Add your college
                  </button>
                )}

                {passportProfile?.location && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {passportProfile.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0">
            <Button
              onClick={() => setIsEditProfileOpen(true)}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Passport
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPassportData(true)}
              disabled={refreshing}
              className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
              {refreshing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </div>

        {/* Professional Links Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {passportProfile?.linkedin_url ? (
              <a
                href={passportProfile.linkedin_url.startsWith('http') ? passportProfile.linkedin_url : `https://${passportProfile.linkedin_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-white hover:border-blue-200 transition-all font-medium"
              >
                <LinkedinIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>LinkedIn</span>
                <ArrowUpRight className="h-3 w-3 text-slate-400" />
              </a>
            ) : (
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 text-xs transition-colors"
              >
                <Plus className="h-3 w-3" /> Add LinkedIn
              </button>
            )}

            {passportProfile?.github_url ? (
              <a
                href={passportProfile.github_url.startsWith('http') ? passportProfile.github_url : `https://${passportProfile.github_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 transition-all font-medium"
              >
                <GithubIcon className="h-3.5 w-3.5 text-slate-900" />
                <span>GitHub</span>
                <ArrowUpRight className="h-3 w-3 text-slate-400" />
              </a>
            ) : (
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 text-xs transition-colors"
              >
                <Plus className="h-3 w-3" /> Add GitHub
              </button>
            )}

            {passportProfile?.portfolio_url ? (
              <a
                href={passportProfile.portfolio_url.startsWith('http') ? passportProfile.portfolio_url : `https://${passportProfile.portfolio_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-white hover:border-emerald-200 transition-all font-medium"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                <span>Portfolio</span>
                <ArrowUpRight className="h-3 w-3 text-slate-400" />
              </a>
            ) : (
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 text-xs transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Portfolio
              </button>
            )}
          </div>

          {/* Compact Profile Completeness Pill */}
          <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 font-medium">Completeness:</span>
            <span className="font-bold text-emerald-700">{completeness.score}%</span>
            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${completeness.score}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. ABOUT ME SECTION ─── */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">About Me</h2>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            Edit
          </button>
        </div>

        {passportProfile?.bio ? (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
            {passportProfile.bio}
          </p>
        ) : (
          <div className="py-2 flex items-center justify-between text-xs text-slate-500">
            <span>Tell people a little about yourself, your engineering focus, and what you love building.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="h-7 text-[11px] rounded-lg border-slate-200 text-slate-700"
            >
              + Add Bio
            </Button>
          </div>
        )}
      </div>

      {/* ─── 3. SKILLS PORTFOLIO ─── */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Verified Skills Portfolio</h2>
            <p className="text-xs text-slate-500 mt-0.5">Assessed and officially verified capabilities</p>
          </div>
          <Link href="/student/skills">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg h-8 gap-1">
              Manage Skills ({skills.length}) <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{skill.name}</div>
                    <div className="text-[11px] font-semibold text-slate-500">{skill.levelLabel}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    skill.badgeVariant === 'verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : skill.badgeVariant === 'practical'
                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                      : skill.badgeVariant === 'assessment'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {skill.badgeLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Progress value={skill.score} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-mono font-bold text-slate-500">{skill.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">No skills added yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Declare and assess skills to build your verified Skill Passport.
              </p>
            </div>
            <Link href="/student/skills">
              <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1">
                + Add Skills
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ─── 4. PROJECTS SECTION ─── */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Projects Showcase</h2>
            <p className="text-xs text-slate-500 mt-0.5">What you have built and deployed</p>
          </div>
          <Button
            size="sm"
            onClick={() => openProjectModal()}
            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Project
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(proj => (
              <div
                key={proj.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">{proj.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openProjectModal(proj)}
                        className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded flex items-center justify-center"
                        title="Edit Project"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="h-6 w-6 text-slate-400 hover:text-rose-600 rounded flex items-center justify-center"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                  )}
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Technology Tags */}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {proj.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    {proj.github_url && (
                      <a
                        href={proj.github_url.startsWith('http') ? proj.github_url : `https://${proj.github_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                      >
                        <GithubIcon className="h-3.5 w-3.5" /> Code Repo
                      </a>
                    )}
                    {proj.project_url && (
                      <a
                        href={proj.project_url.startsWith('http') ? proj.project_url : `https://${proj.project_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        <Globe className="h-3.5 w-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">No projects added yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Showcase your applications, systems, and open-source contributions.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => openProjectModal()}
              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="h-3 w-3" /> Add First Project
            </Button>
          </div>
        )}
      </div>

      {/* ─── 5. EDUCATION & CERTIFICATIONS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education Section */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Education</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 font-semibold"
            >
              Edit
            </Button>
          </div>

          {passportProfile?.college_name || passportProfile?.degree ? (
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {[passportProfile?.degree, passportProfile?.branch].filter(Boolean).join(' — ') || 'Undergraduate Degree'}
              </div>
              <div className="text-slate-600 font-medium flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-emerald-700 shrink-0" />
                {passportProfile?.college_name || 'Institution not specified'}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 text-slate-500 pt-1 font-medium text-[11px]">
                {passportProfile?.academic_year && <span>Current Year: {passportProfile.academic_year}</span>}
                {passportProfile?.graduation_year && <span>Graduation: {passportProfile.graduation_year}</span>}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <div className="text-xs font-bold text-slate-800">Add your college & degree</div>
              <p className="text-[11px] text-slate-500">Provide education details for employer verification.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditProfileOpen(true)}
                className="h-7 text-xs rounded-lg border-slate-200 text-slate-700 mt-1"
              >
                + Add Education
              </Button>
            </div>
          )}
        </div>

        {/* Certifications Section */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Certifications & Achievements</h2>
            <Button
              size="sm"
              onClick={() => setIsAddCertOpen(true)}
              className="h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>

          {certifications.length > 0 ? (
            <div className="space-y-2.5">
              {certifications.map(cert => (
                <div
                  key={cert.id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 truncate">{cert.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {cert.issuing_organization} {cert.issue_date ? `· ${cert.issue_date}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url.startsWith('http') ? cert.credential_url : `https://${cert.credential_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-6 px-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-0.5"
                      >
                        Verify <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteCertification(cert.id)}
                      className="h-6 w-6 text-slate-400 hover:text-rose-600 rounded flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <div className="text-xs font-bold text-slate-800">No certifications added yet</div>
              <p className="text-[11px] text-slate-500">Include industry certifications, awards, and hackathon achievements.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddCertOpen(true)}
                className="h-7 text-xs rounded-lg border-slate-200 text-slate-700 mt-1"
              >
                + Add Certification
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL 1: EDIT PASSPORT PROFILE ─── */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Skill Passport</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Personal Info */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Identity</div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Short Bio (~250 chars)</label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={profileForm.bio}
                    onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Describe your engineering focus, what systems you like building, and career interests..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={e => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Delhi, India"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Phone (Optional)</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Background</div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">College / Institution</label>
                  <input
                    type="text"
                    value={profileForm.college_name}
                    onChange={e => setProfileForm(prev => ({ ...prev, college_name: e.target.value }))}
                    placeholder="e.g. Dr. Akhilesh Das Gupta Institute of Professional Studies"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Degree</label>
                    <input
                      type="text"
                      value={profileForm.degree}
                      onChange={e => setProfileForm(prev => ({ ...prev, degree: e.target.value }))}
                      placeholder="e.g. B.Tech"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Branch / Major</label>
                    <input
                      type="text"
                      value={profileForm.branch}
                      onChange={e => setProfileForm(prev => ({ ...prev, branch: e.target.value }))}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={profileForm.academic_year}
                      onChange={e => setProfileForm(prev => ({ ...prev, academic_year: e.target.value }))}
                      placeholder="e.g. 2nd Year"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Graduation Year</label>
                    <input
                      type="number"
                      value={profileForm.graduation_year}
                      onChange={e => setProfileForm(prev => ({ ...prev, graduation_year: parseInt(e.target.value) || 2026 }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Links */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Professional Links</div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={profileForm.linkedin_url}
                    onChange={e => setProfileForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GitHub URL</label>
                  <input
                    type="text"
                    value={profileForm.github_url}
                    onChange={e => setProfileForm(prev => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/username"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Portfolio URL</label>
                  <input
                    type="text"
                    value={profileForm.portfolio_url}
                    onChange={e => setProfileForm(prev => ({ ...prev, portfolio_url: e.target.value }))}
                    placeholder="https://yourportfolio.dev"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={actionLoading}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD / EDIT PROJECT ─── */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProject ? 'Edit Project' : 'Add Project to Passport'}
              </h3>
              <button
                onClick={() => setIsAddProjectOpen(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Project Title</label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={e => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g. Scalable Distributed Queue Service"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={e => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Explain the purpose, system architecture, and outcomes of this project..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Technologies (comma separated)</label>
                <input
                  type="text"
                  value={projectForm.technologies}
                  onChange={e => setProjectForm(prev => ({ ...prev, technologies: e.target.value }))}
                  placeholder="e.g. Node.js, Redis, PostgreSQL, Docker"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GitHub Repository URL</label>
                  <input
                    type="text"
                    value={projectForm.github_url}
                    onChange={e => setProjectForm(prev => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/user/repo"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Live Demo URL</label>
                  <input
                    type="text"
                    value={projectForm.project_url}
                    onChange={e => setProjectForm(prev => ({ ...prev, project_url: e.target.value }))}
                    placeholder="https://demo.app"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddProjectOpen(false)}
                  disabled={actionLoading}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {actionLoading ? 'Saving...' : editingProject ? 'Update Project' : 'Add Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD CERTIFICATION ─── */}
      {isAddCertOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Certification / Achievement</h3>
              <button
                onClick={() => setIsAddCertOpen(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCertification} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Certification Name / Award</label>
                <input
                  type="text"
                  value={certForm.name}
                  onChange={e => setCertForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. AWS Certified Cloud Practitioner / Hackathon 1st Place"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Issuing Body / Organization</label>
                <input
                  type="text"
                  value={certForm.issuing_organization}
                  onChange={e => setCertForm(prev => ({ ...prev, issuing_organization: e.target.value }))}
                  required
                  placeholder="e.g. Amazon Web Services / HackerRank / University"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={certForm.issue_date}
                    onChange={e => setCertForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Credential URL (Optional)</label>
                  <input
                    type="text"
                    value={certForm.credential_url}
                    onChange={e => setCertForm(prev => ({ ...prev, credential_url: e.target.value }))}
                    placeholder="https://credly.com/..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddCertOpen(false)}
                  disabled={actionLoading}
                  className="rounded-xl border-slate-200 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {actionLoading ? 'Saving...' : 'Add to Passport'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}