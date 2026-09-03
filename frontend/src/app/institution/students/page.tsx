"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, Shield, UserCheck, ArrowRight, Loader2 } from "lucide-react"

interface InstStudentItem {
  id: string
  name: string
  dept: string
  career: string
  readiness: number
  verifiedSkills: number
  status: string
}

export default function InstitutionStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [students, setStudents] = useState<InstStudentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/institution/students`)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStudents(json.data)
        } else {
          setStudents([
            { id: "1", name: "Sarah Jenkins", dept: "Computer Science", career: "Backend Developer", readiness: 78, verifiedSkills: 4, status: "Eligible" },
            { id: "2", name: "Alex Rivera", dept: "Software Engineering", career: "Frontend Developer", readiness: 85, verifiedSkills: 5, status: "Eligible" },
            { id: "3", name: "Jordan Lee", dept: "Information Technology", career: "Full Stack Engineer", readiness: 62, verifiedSkills: 3, status: "In Progress" },
            { id: "4", name: "Taylor Kim", dept: "Cybersecurity", career: "Security Analyst", readiness: 74, verifiedSkills: 4, status: "Eligible" },
            { id: "5", name: "Morgan Smith", dept: "Information Technology", career: "DevOps Engineer", readiness: 58, verifiedSkills: 2, status: "In Progress" },
          ])
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.career.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Institutional Student Directory</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Cross-cohort roster of verified student capabilities, readiness scores, and corporate placement eligibility.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search students by name, department, or career target..."
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
                      <Badge variant="outline" className="text-xs">{s.dept}</Badge>
                      <h3 className="font-semibold text-base">{s.name}</h3>
                      <Badge variant={s.status === "Eligible" ? "success" : "secondary"}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Target: <strong className="text-[var(--color-foreground)]">{s.career}</strong> • {s.verifiedSkills} Verified Skills on Passport</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-secondary)]">Readiness</p>
                      <p className="text-xl font-bold text-[var(--color-accent)]">{s.readiness}%</p>
                    </div>
                    <Link href="/institution/skill-gaps">
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
