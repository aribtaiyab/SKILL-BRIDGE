"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Building2,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/lib/auth/context"
import { UserRole } from "@/types/database"

interface RoleOption {
  id: UserRole
  title: string
  subtitle: string
  description: string
  badge: string
  icon: typeof GraduationCap
  destination: string
  highlights: string[]
}

const ROLES: RoleOption[] = [
  {
    id: "student",
    title: "Student & Candidate",
    subtitle: "Undergraduate / Graduate / Job Seeker",
    description: "Discover career pathways, take verified skill assessments, bridge gaps, and share your living verified skill passport.",
    badge: "Most Popular",
    icon: GraduationCap,
    destination: "/student",
    highlights: ["AI Career Navigator", "Verified Skill Passport", "Direct Internship Matching"],
  },
  {
    id: "academician",
    title: "Academia & Faculty",
    subtitle: "Professors, Instructors & Mentors",
    description: "Monitor student cohort readiness, track curriculum alignment with industry demands, and launch skill interventions.",
    badge: "Faculty",
    icon: BookOpen,
    destination: "/academia",
    highlights: ["Cohort Readiness Analytics", "Curriculum Gap Insights", "Workshop Interventions"],
  },
  {
    id: "industry",
    title: "Industry Partner",
    subtitle: "Recruiters, Hiring Managers & Enterprise",
    description: "Publish opportunity requirements, benchmark candidate verified scores, and hire pre-calibrated engineering talent.",
    badge: "Enterprise",
    icon: Briefcase,
    destination: "/industry",
    highlights: ["Verified Talent Sourcing", "Job Role Publishing", "Deterministic Scorecards"],
  },
  {
    id: "institution",
    title: "Institution & Campus",
    subtitle: "Deans, Department Heads & Placement Leads",
    description: "Gain campus-wide placement analytics, compare departmental outcomes, and streamline corporate hiring partnerships.",
    badge: "Campus",
    icon: Building2,
    destination: "/academia",
    highlights: ["Institutional Dashboard", "Department Benchmarking", "Accreditation Support"],
  },
]

export default function SelectRolePage() {
  const router = useRouter()
  const { user, profile, loading, refreshProfile } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login")
        return
      }

      if (profile?.role) {
        const destMap: Record<UserRole, string> = {
          student: "/student",
          industry: "/industry",
          academician: "/academia",
          institution: "/academia",
        }
        const dest = destMap[profile.role] || "/student"
        router.replace(dest)
      }
    }
  }, [loading, user, profile, router])

  const handleSelectRole = async (role: UserRole) => {
    setError(null)
    setSelectedRole(role)
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/profile/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update role. Please try again.")
        setIsSubmitting(false)
        return
      }

      await refreshProfile()

      const targetDashboard = data.redirectTo || (role === "student" ? "/student" : role === "industry" ? "/industry" : "/academia")
      router.push(targetDashboard)
      router.refresh()
    } catch (err) {
      console.error("Role update request error:", err)
      setError("Network error while selecting role. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (loading || (user && profile?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-500">
            {profile?.role ? "Redirecting to your dashboard..." : "Loading your account..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs mb-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Welcome to SkillBridge Connect
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Choose Your Experience
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Select your role to tailor your workspace, diagnostic benchmarks, and dashboards.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ROLES.map((role) => {
            const Icon = role.icon
            const isThisRoleSubmitting = isSubmitting && selectedRole === role.id

            return (
              <Card
                key={role.id}
                className={`relative group cursor-pointer transition-all duration-300 border-2 rounded-2xl ${
                  selectedRole === role.id
                    ? "border-emerald-600 shadow-lg bg-emerald-50/30"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-xl bg-white"
                } ${isSubmitting && selectedRole !== role.id ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => {
                  if (!isSubmitting) handleSelectRole(role.id)
                }}
              >
                <CardContent className="p-6 flex flex-col h-full justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Top Row: Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-transform group-hover:scale-105">
                        <Icon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <Badge variant="outline" className="text-xs font-bold bg-slate-50 border-slate-200 text-slate-700">
                        {role.badge}
                      </Badge>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {role.title}
                      </h2>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        {role.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {role.description}
                    </p>

                    {/* Highlights */}
                    <ul className="space-y-1.5 pt-3 border-t border-slate-100">
                      {role.highlights.map((item, idx) => (
                        <li key={idx} className="flex items-center text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mt-2 font-bold h-10 rounded-xl"
                    variant={selectedRole === role.id ? "default" : "outline"}
                    disabled={isSubmitting}
                  >
                    {isThisRoleSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up workspace...
                      </>
                    ) : (
                      <>
                        Continue as {role.title.split(" ")[0]}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Logged in as <span className="font-bold text-slate-700">{user?.email}</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
