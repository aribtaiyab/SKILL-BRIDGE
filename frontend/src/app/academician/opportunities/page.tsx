"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Briefcase, Building2, MapPin, Calendar,
  Loader2, Filter, Info, ExternalLink
} from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"
import { apiClient } from "@/lib/api-client"

interface AcademicOpportunity {
  id: string
  title: string
  description: string
  type: string
  audience: string
  organizationName: string
  location: string
  isRemote: boolean
  duration: string
  deadline: string
  skills: {
    skillId: string
    name: string
    minLevel: number
    isRequired: boolean
  }[]
}

export default function AcademicianOpportunitiesPage() {
  const { isDemo } = useDemo()
  const [opportunities, setOpportunities] = useState<AcademicOpportunity[]>([])
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setOpportunities([
        {
          id: "opp-acad-1",
          title: "Faculty Research Fellowship in Distributed Cloud Systems",
          description: "Collaborative academic-industry research program on high-throughput microservices architecture and observability.",
          type: "Faculty Internship",
          audience: "academician",
          organizationName: "TechNova Solutions",
          location: "Bangalore / Hybrid",
          isRemote: true,
          duration: "3 Months",
          deadline: "Oct 30, 2026",
          skills: [
            { skillId: "s1", name: "Distributed Systems", minLevel: 85, isRequired: true },
            { skillId: "s2", name: "Cloud Architecture", minLevel: 80, isRequired: true },
          ],
        },
        {
          id: "opp-acad-2",
          title: "Faculty Development Program (FDP): Modern Full-Stack & AI Engineering",
          description: "1-week immersive training for faculty on integrating real-world production APIs, testing pipelines, and AI into curriculum.",
          type: "FDP",
          audience: "academician",
          organizationName: "National Skill Council & TechNova",
          location: "Remote",
          isRemote: true,
          duration: "1 Week",
          deadline: "Nov 15, 2026",
          skills: [
            { skillId: "s3", name: "Modern Web APIs", minLevel: 75, isRequired: true },
            { skillId: "s4", name: "AI Integration", minLevel: 70, isRequired: false },
          ],
        },
        {
          id: "opp-acad-3",
          title: "Industry Guest Lecture & Curriculum Advisory Series",
          description: "Deliver keynote masterclasses on system design and mentor student cohort capstone projects.",
          type: "Guest Lectures",
          audience: "academician",
          organizationName: "CloudScale Systems",
          location: "Hybrid",
          isRemote: true,
          duration: "Semester-long",
          deadline: "Rolling",
          skills: [
            { skillId: "s5", name: "System Design", minLevel: 85, isRequired: true },
          ],
        },
      ])
      setLoading(false)
      return
    }

    apiClient(`/api/academician/opportunities?type=${typeFilter}`)
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setOpportunities(json.data)
        } else {
          setOpportunities([])
        }
      })
      .catch(() => setOpportunities([]))
      .finally(() => setLoading(false))
  }, [isDemo, typeFilter])

  const types = ["all", "Faculty Internship", "FDP", "Industrial Training", "Consultancy", "Collaborative Research", "Guest Lectures"]

  const filtered = opportunities.filter(opp =>
    typeFilter === 'all' || opp.type.toLowerCase() === typeFilter.toLowerCase()
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Academic & Faculty Opportunities</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Explore industry fellowships, faculty development programs (FDPs), research collaborations, and mentorship initiatives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
          >
            <option value="all">All Opportunity Types</option>
            {types.filter(t => t !== 'all').map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
            <Info className="h-6 w-6 text-[var(--color-accent)]" />
            <p className="text-sm">
              No academic opportunities available matching this filter.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(opp => (
            <Card key={opp.id} className="border-[var(--color-border-primary)] shadow-sm hover:border-[var(--color-accent)]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{opp.title}</h3>
                      <Badge variant="secondary">{opp.type}</Badge>
                      {opp.isRemote && <Badge variant="outline">Remote</Badge>}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-[var(--color-foreground)]">
                        <Building2 className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                        {opp.organizationName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        {opp.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        Duration: {opp.duration} • Deadline: {opp.deadline}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] pt-1 leading-relaxed">
                      {opp.description}
                    </p>

                    {opp.skills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">Requirements:</span>
                        {opp.skills.map((sk, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {sk.name} ({sk.minLevel}/100)
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-2 sm:pt-0">
                    <Button size="sm" className="bg-[var(--color-accent)] cursor-pointer">
                      Apply / Express Interest
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
