"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, CheckCircle2, Clock, XCircle, ArrowRight, UserCheck, Loader2 } from "lucide-react"

interface ApplicationItem {
  id: string
  status: string
  cover_letter: string | null
  created_at: string
  opportunities?: {
    id: string
    title: string
  }
  profiles?: {
    id: string
    full_name: string
    email: string
  }
}

export default function IndustryApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadApplications = useCallback(async () => {
    try {
      const url = statusFilter !== "all" ? `/api/industry/applications?status=${statusFilter}` : `/api/industry/applications`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success && json.data) {
        setApplications(json.data)
      }
    } catch {
      // Fallback applications for demo
      setApplications([
        {
          id: "app-1",
          status: "applied",
          cover_letter: "I have 92% readiness for the Frontend Intern position with verified React and TypeScript skills.",
          created_at: new Date().toISOString(),
          opportunities: { id: "opp-1", title: "Frontend Engineering Intern" },
          profiles: { id: "p-1", full_name: "Elena Rostova", email: "elena.rostova@university.edu" },
        },
        {
          id: "app-2",
          status: "shortlisted",
          cover_letter: "Excited about API architecture and microservices at TechFlow.",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          opportunities: { id: "opp-1", title: "Backend Developer Internship" },
          profiles: { id: "p-2", full_name: "Alex Rivera", email: "alex.rivera@tech.edu" },
        },
        {
          id: "app-3",
          status: "interview",
          cover_letter: "Verified 88% readiness for Junior API Developer.",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          opportunities: { id: "opp-2", title: "Junior API Developer" },
          profiles: { id: "p-3", full_name: "Jordan Lee", email: "jordan.lee@state.edu" },
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    setUpdatingId(appId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/industry/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      }
    } catch (err) {
      console.warn("Status update error:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied": return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Applied</Badge>
      case "shortlisted": return <Badge variant="warning"><UserCheck className="h-3 w-3 mr-1" /> Shortlisted</Badge>
      case "interview": return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Interview</Badge>
      case "selected": return <Badge variant="success">Selected</Badge>
      case "rejected": return <Badge variant="critical"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Candidate Applications</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Review applicant readiness, verify skill credentials, and manage candidate pipelines.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {["all", "applied", "shortlisted", "interview", "selected", "rejected"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className="capitalize text-xs"
          >
            {s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-[var(--color-border-primary)] shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">{app.profiles?.full_name || "Applicant"}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Applied for: <strong className="text-[var(--color-foreground)]">{app.opportunities?.title || "Opportunity"}</strong> • {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{app.profiles?.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {app.status === "applied" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, "shortlisted")}
                      >
                        Shortlist
                      </Button>
                    )}
                    {app.status === "shortlisted" && (
                      <Button
                        size="sm"
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, "interview")}
                      >
                        Schedule Interview
                      </Button>
                    )}
                    {app.status === "interview" && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, "selected")}
                      >
                        Select Candidate
                      </Button>
                    )}
                    {app.status !== "rejected" && app.status !== "selected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--color-critical)] hover:bg-red-50"
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, "rejected")}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>

                {app.cover_letter && (
                  <div className="p-3 bg-[var(--color-surface-secondary)] rounded-md border border-[var(--color-border-primary)] text-xs text-[var(--color-text-secondary)]">
                    <strong className="text-[var(--color-foreground)]">Note from candidate:</strong> {app.cover_letter}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <p className="text-sm text-[var(--color-text-secondary)]">No applications found under this status filter.</p>
        </Card>
      )}
    </div>
  )
}
