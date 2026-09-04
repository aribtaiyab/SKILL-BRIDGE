"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { GraduationCap, Briefcase, Users, Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { completeOnboardingAction, saveRoleAction } from "@/lib/auth/actions"
import { useAuth } from "@/lib/auth/context"
import { UserRole } from "@/types/database"

type Role = UserRole | null

// ─── Progress Indicator ───────────────────────────────────────────────────────
function ProgressSteps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
            step < current ? 'bg-[var(--color-accent)] text-white' :
            step === current ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]/30 ring-offset-2' :
            'bg-[var(--color-border-primary)] text-[var(--color-text-muted)]'
          }`}>
            {step < current ? <CheckCircle2 className="h-4 w-4" /> : step}
          </div>
          {step < total && <div className={`w-8 h-px transition-colors ${step < current ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-primary)]'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, profile, loading, refreshProfile } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role>(null)
  const [error, setError] = useState("")

  // Student form state
  const [studentData, setStudentData] = useState({
    educationLevel: '', institution: '', department: '',
    graduationYear: '', experienceLevel: '', location: ''
  })

  // Industry form state
  const [industryData, setIndustryData] = useState({
    organizationName: '', industryType: '', organizationSize: '',
    location: '', website: '', description: ''
  })

  // Academician form state
  const [academicianData, setAcademicianData] = useState({
    institution: '', department: '', designation: '',
    teachingArea: '', mentorshipInterest: false
  })

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
        return
      }
      // Already onboarded — go to dashboard
      if (profile?.onboarding_completed && profile.role) {
        const dashMap: Record<string, string> = {
          student: '/student', industry: '/industry',
          academician: '/academician', institution: '/academician'
        }
        router.replace(dashMap[profile.role] || '/student')
      }
      // Pre-populate role if already saved
      if (profile?.role) setRole(profile.role as Role)
    }
  }, [loading, user, profile, router])

  const totalSteps = 3

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole)
    setError("")
  }

  const handleNext = () => {
    if (step === 1) {
      if (!role) { setError("Please select a role to continue."); return }
      setError("")
      // Persist role selection immediately so it survives refresh
      startTransition(async () => {
        await saveRoleAction(role)
        await refreshProfile()
        setStep(2)
      })
    } else if (step === 2) {
      // Validate required fields
      if (role === 'student' && !studentData.educationLevel) {
        setError("Please select your education level."); return
      }
      if (role === 'industry' && !industryData.organizationName.trim()) {
        setError("Organization name is required."); return
      }
      if (role === 'academician' && !academicianData.institution.trim()) {
        setError("Institution name is required."); return
      }
      setError("")
      setStep(3)
    }
  }

  const handleComplete = () => {
    if (!role) return
    setError("")

    const dataMap: Record<string, any> = {
      student: studentData,
      industry: industryData,
      academician: academicianData,
    }

    startTransition(async () => {
      const result = await completeOnboardingAction(role, dataMap[role])
      if (result.success && result.redirectTo) {
        await refreshProfile()
        router.push(result.redirectTo)
        router.refresh()
      } else if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.')
        setStep(2)
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
      </div>
    )
  }

  const roles = [
    { id: "student" as Role, label: "Student", icon: <GraduationCap className="h-6 w-6" />, desc: "Assess skills and find opportunities" },
    { id: "industry" as Role, label: "Industry", icon: <Briefcase className="h-6 w-6" />, desc: "Hire verified talent and post opportunities" },
    { id: "academician" as Role, label: "Academia", icon: <Users className="h-6 w-6" />, desc: "Mentor students and track skill gaps" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-card)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent)] text-white">SC</div>
          SkillBridge Connect
        </div>
        <div className="flex items-center gap-4">
          <ProgressSteps current={step} total={totalSteps} />
          <span className="text-xs text-[var(--color-text-secondary)] hidden sm:block">Step {step} of {totalSteps}</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[640px]">

          {/* ── Step 1: Role Selection ── */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-2">
                <h1 className="text-h2 font-semibold">How do you want to use SkillBridge?</h1>
                <p className="text-[var(--color-text-secondary)]">Select your primary role to customize your experience.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {roles.map((r) => (
                  <Card
                    key={r.id}
                    className={`cursor-pointer transition-all ${role === r.id ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-secondary)]'}`}
                    onClick={() => handleRoleSelect(r.id)}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className={`p-3 rounded-full ${role === r.id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}>
                        {r.icon}
                      </div>
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{r.desc}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} disabled={!role || isPending} size="lg">
                  {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Continue →'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Role Details ── */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
              {role === 'student' && (
                <>
                  <div className="text-center space-y-2">
                    <h1 className="text-h2 font-semibold">Tell us about yourself</h1>
                    <p className="text-[var(--color-text-secondary)]">This helps us personalize your skill intelligence dashboard.</p>
                  </div>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      {error && <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Education Level <span className="text-[var(--color-critical)]">*</span></label>
                        <Select value={studentData.educationLevel} onChange={e => setStudentData(d => ({ ...d, educationLevel: e.target.value }))}>
                          <option value="">Select education level...</option>
                          <option value="undergraduate">Undergraduate (B.S. / B.E.)</option>
                          <option value="postgraduate">Postgraduate (M.S. / M.Tech)</option>
                          <option value="diploma">Diploma</option>
                          <option value="bootcamp">Bootcamp / Certificate</option>
                        </Select>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Institution</label>
                          <Input placeholder="e.g. MIT, Stanford" value={studentData.institution} onChange={e => setStudentData(d => ({ ...d, institution: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Department</label>
                          <Input placeholder="e.g. Computer Science" value={studentData.department} onChange={e => setStudentData(d => ({ ...d, department: e.target.value }))} />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Expected Graduation Year</label>
                          <Select value={studentData.graduationYear} onChange={e => setStudentData(d => ({ ...d, graduationYear: e.target.value }))}>
                            <option value="">Select year...</option>
                            {[2025, 2026, 2027, 2028, 2029].map(y => <option key={y} value={String(y)}>{y}</option>)}
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Current Experience</label>
                          <Select value={studentData.experienceLevel} onChange={e => setStudentData(d => ({ ...d, experienceLevel: e.target.value }))}>
                            <option value="">Select experience...</option>
                            <option value="none">No formal experience</option>
                            <option value="intern">Internship / Projects</option>
                            <option value="junior">1–2 years</option>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Location (optional)</label>
                        <Input placeholder="City, Country" value={studentData.location} onChange={e => setStudentData(d => ({ ...d, location: e.target.value }))} />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {role === 'industry' && (
                <>
                  <div className="text-center space-y-2">
                    <h1 className="text-h2 font-semibold">Tell us about your organization</h1>
                    <p className="text-[var(--color-text-secondary)]">Help students understand where they'd be working.</p>
                  </div>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      {error && <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Organization Name <span className="text-[var(--color-critical)]">*</span></label>
                        <Input placeholder="e.g. TechFlow Solutions" value={industryData.organizationName} onChange={e => setIndustryData(d => ({ ...d, organizationName: e.target.value }))} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Industry Type</label>
                          <Select value={industryData.industryType} onChange={e => setIndustryData(d => ({ ...d, industryType: e.target.value }))}>
                            <option value="">Select industry...</option>
                            <option value="software">Software / Tech</option>
                            <option value="fintech">Fintech</option>
                            <option value="healthcare">Healthcare / Medtech</option>
                            <option value="edtech">EdTech</option>
                            <option value="consulting">Consulting</option>
                            <option value="other">Other</option>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Organization Size</label>
                          <Select value={industryData.organizationSize} onChange={e => setIndustryData(d => ({ ...d, organizationSize: e.target.value }))}>
                            <option value="">Select size...</option>
                            <option value="startup">Startup (1–50)</option>
                            <option value="sme">SME (51–500)</option>
                            <option value="enterprise">Enterprise (500+)</option>
                          </Select>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <Input placeholder="City, Country" value={industryData.location} onChange={e => setIndustryData(d => ({ ...d, location: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Website (optional)</label>
                          <Input placeholder="https://..." value={industryData.website} onChange={e => setIndustryData(d => ({ ...d, website: e.target.value }))} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {role === 'academician' && (
                <>
                  <div className="text-center space-y-2">
                    <h1 className="text-h2 font-semibold">Your academic profile</h1>
                    <p className="text-[var(--color-text-secondary)]">Help us connect you with the right students.</p>
                  </div>
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      {error && <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Institution <span className="text-[var(--color-critical)]">*</span></label>
                        <Input placeholder="e.g. MIT" value={academicianData.institution} onChange={e => setAcademicianData(d => ({ ...d, institution: e.target.value }))} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Department</label>
                          <Input placeholder="e.g. Computer Science" value={academicianData.department} onChange={e => setAcademicianData(d => ({ ...d, department: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Designation</label>
                          <Select value={academicianData.designation} onChange={e => setAcademicianData(d => ({ ...d, designation: e.target.value }))}>
                            <option value="">Select designation...</option>
                            <option value="professor">Professor</option>
                            <option value="associate_professor">Associate Professor</option>
                            <option value="assistant_professor">Assistant Professor</option>
                            <option value="lecturer">Lecturer</option>
                            <option value="researcher">Researcher</option>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Teaching / Research Area</label>
                        <Input placeholder="e.g. Software Engineering, Data Science" value={academicianData.teachingArea} onChange={e => setAcademicianData(d => ({ ...d, teachingArea: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <input
                          id="mentorship"
                          type="checkbox"
                          className="h-4 w-4 rounded border-[var(--color-border-primary)] accent-[var(--color-accent)]"
                          checked={academicianData.mentorshipInterest}
                          onChange={e => setAcademicianData(d => ({ ...d, mentorshipInterest: e.target.checked }))}
                        />
                        <label htmlFor="mentorship" className="text-sm font-medium cursor-pointer">
                          I&apos;m interested in mentoring students
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => { setStep(1); setError("") }}>← Back</Button>
                <Button onClick={handleNext} disabled={isPending}>
                  {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Review & Complete →'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review & Complete ── */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
              <div className="text-center space-y-2">
                <h1 className="text-h2 font-semibold">You&apos;re almost there!</h1>
                <p className="text-[var(--color-text-secondary)]">Review your setup and complete your SkillBridge profile.</p>
              </div>

              <Card className="border-[var(--color-accent)]/40">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-border-primary)]">
                    <div className="h-10 w-10 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-semibold">
                      {role === 'student' ? <GraduationCap className="h-5 w-5" /> :
                       role === 'industry' ? <Briefcase className="h-5 w-5" /> :
                       role === 'academician' ? <Users className="h-5 w-5" /> :
                       <Building2 className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-semibold capitalize">{role === 'academician' ? 'Academia' : role} Account</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{user?.email}</div>
                    </div>
                  </div>

                  {role === 'student' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-[var(--color-text-secondary)]">Education:</span><br /><span className="font-medium capitalize">{studentData.educationLevel || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Institution:</span><br /><span className="font-medium">{studentData.institution || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Department:</span><br /><span className="font-medium">{studentData.department || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Graduation:</span><br /><span className="font-medium">{studentData.graduationYear || '—'}</span></div>
                    </div>
                  )}
                  {role === 'industry' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-[var(--color-text-secondary)]">Organization:</span><br /><span className="font-medium">{industryData.organizationName || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Industry:</span><br /><span className="font-medium capitalize">{industryData.industryType || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Size:</span><br /><span className="font-medium capitalize">{industryData.organizationSize || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Location:</span><br /><span className="font-medium">{industryData.location || '—'}</span></div>
                    </div>
                  )}
                  {role === 'academician' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-[var(--color-text-secondary)]">Institution:</span><br /><span className="font-medium">{academicianData.institution || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Department:</span><br /><span className="font-medium">{academicianData.department || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Designation:</span><br /><span className="font-medium capitalize">{academicianData.designation || '—'}</span></div>
                      <div><span className="text-[var(--color-text-secondary)]">Teaching Area:</span><br /><span className="font-medium">{academicianData.teachingArea || '—'}</span></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => { setStep(2); setError("") }}>← Edit Details</Button>
                <Button onClick={handleComplete} disabled={isPending} size="lg">
                  {isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up your dashboard...</>
                    : '🎉 Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}