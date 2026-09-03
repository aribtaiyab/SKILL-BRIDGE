"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, CheckCircle2, AlertTriangle, ArrowRight, User, Loader2 } from "lucide-react"

interface StudentItem {
  id: string
  name: string
  career: string
  readiness: number
  priorityGap: string
  status: string
}

export default function AcademicianStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/academician/students')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStudents(json.data)
        } else {
          // Default cohort fallback if DB empty
          setStudents([
            { id: "1", name: "Sarah Jenkins", career: "Backend Developer", readiness: 78, priorityGap: "Node.js (15 pts)", status: "On Track" },
            { id: "2", name: "Alex Rivera", career: "Frontend Developer", readiness: 85, priorityGap: "TypeScript (8 pts)", status: "High Readiness" },
            { id: "3", name: "Jordan Lee", career: "Full Stack Engineer", readiness: 62, priorityGap: "Docker (30 pts)", status: "Needs Support" },
            { id: "4", name: "Taylor Kim", career: "Security Analyst", readiness: 74, priorityGap: "Network Cryptography (12 pts)", status: "On Track" },
            { id: "5", name: "Morgan Smith", career: "DevOps Engineer", readiness: 58, priorityGap: "CI/CD Pipelines (22 pts)", status: "Needs Support" },
          ])
        }
      })
      .catch(() => {
        setStudents([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.career.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Student Directory</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Track student career readiness, monitor critical skill gaps, and guide targeted progression.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search students by name or target career..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(s => (
            <Card key={s.id} className="border-[var(--color-border-primary)] shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{s.name}</h3>
                      <Badge variant={s.readiness >= 80 ? "success" : s.readiness >= 70 ? "secondary" : "warning"}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Target Career: <strong className="text-[var(--color-foreground)]">{s.career}</strong></p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-secondary)]">Readiness</p>
                      <p className="text-xl font-bold text-[var(--color-accent)]">{s.readiness}%</p>
                    </div>
                    <Link href="/academician/skill-gaps">
                      <Button size="sm" variant="outline">
                        Inspect Gaps <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
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
