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
    title: "Student & Job Seeker",
    subtitle: "Undergraduate / Graduate / Learner",
    description: "Discover career pathways, take verified skill assessments, bridge gap areas, and apply for high-fit industry opportunities.",
    badge: "Most Popular",
    icon: GraduationCap,
    destination: "/student",
    highlights: ["AI Career Navigator", "Verified Skill Passport", "Direct Job Applications"],
  },
  {
    id: "academician",
    title: "Academia & Faculty",
    subtitle: "Professors, Instructors & Mentors",
    description: "Monitor student cohort readiness, track curriculum alignment with industry demands, and launch skill interventions.",
    badge: "Educator",
    icon: BookOpen,
    destination: "/academia",
    highlights: ["Cohort Readiness Analytics", "Curriculum Gap Insights", "Student Mentorship"],
  },
  {
    id: "industry",
    title: "Industry Partner",
    subtitle: "Recruiters, Hiring Managers & Enterprise Leads",
    description: "Publish job & internship roles, benchmark candidate readiness scores, and hire pre-verified talent pipelines.",
    badge: "Enterprise",
    icon: Briefcase,
    destination: "/industry",
    highlights: ["Verified Talent Sourcing", "Job Role Publishing", "Applicant Scorecards"],
  },
  {
    id: "institution",
    title: "Institution & University",
    subtitle: "Deans, Department Heads & Campus Leadership",
    description: "Gain campus-wide employment analytics, compare departmental outcomes, and streamline corporate partnerships.",
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

  // Protect route and enforce: once role is set, redirect to that role's dashboard
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

      // Refresh AuthContext so client state has the updated role
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

  // Loading state while checking user / profile
  if (loading || (user && profile?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            {profile?.role ? "Redirecting to your dashboard..." : "Loading your account..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] border border-[var(--color-accent)]/20 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to SkillBridge Connect
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-foreground)]">
            Choose Your Experience
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Select the role that best describes your goals today. We will tailor your workspace, verification tools, and dashboards accordingly.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-4 rounded-lg bg-red-50 text-[var(--color-critical)] text-sm border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
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
                className={`relative group cursor-pointer transition-all duration-200 border-2 ${
                  selectedRole === role.id
                    ? "border-[var(--color-accent)] shadow-md bg-[var(--color-accent-light)]/20"
                    : "border-[var(--color-border-primary)] hover:border-[var(--color-accent)]/60 hover:shadow-sm bg-[var(--color-surface-card)]"
                } ${isSubmitting && selectedRole !== role.id ? "opacity-60 pointer-events-none" : ""}`}
                onClick={() => {
                  if (!isSubmitting) handleSelectRole(role.id)
                }}
              >
                <CardContent className="p-6 flex flex-col h-full justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Top Row: Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] flex items-center justify-center transition-transform group-hover:scale-105">
                        <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold bg-white/80">
                        {role.badge}
                      </Badge>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
                        {role.title}
                      </h2>
                      <p className="text-xs font-medium text-[var(--color-text-muted)] mt-0.5">
                        {role.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {role.description}
                    </p>

                    {/* Highlights */}
                    <ul className="space-y-1.5 pt-2 border-t border-[var(--color-border-primary)]/50">
                      {role.highlights.map((item, idx) => (
                        <li key={idx} className="flex items-center text-xs text-[var(--color-text-secondary)]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-accent)] mr-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mt-2 font-medium"
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
          <p className="text-xs text-[var(--color-text-muted)]">
            Logged in as <span className="font-semibold text-[var(--color-foreground)]">{user?.email}</span>. You can change workspace roles in settings later if authorized.
          </p>
        </div>
      </div>
    </div>
  )
}
