"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, TrendingUp, Building, Presentation, Loader2, Info } from "lucide-react"
import { useDemo } from "@/lib/demo/demo-context"

interface IndustryTrend {
  skill: string
  category: string
  openingsCount: number
  benchmarkLevel: number
  demandGrowth: string
}

export default function AcademicianIndustryPage() {
  const { isDemo } = useDemo()
  const [trends, setTrends] = useState<IndustryTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      setTrends([
        { skill: "Spring Boot Microservices", category: "Backend", demandGrowth: "+35%", openingsCount: 12, benchmarkLevel: 85 },
        { skill: "PostgreSQL Database Design", category: "Database", demandGrowth: "+28%", openingsCount: 9, benchmarkLevel: 75 },
        { skill: "Docker & Container Architecture", category: "DevOps", demandGrowth: "+40%", openingsCount: 14, benchmarkLevel: 80 },
        { skill: "REST API Security & JWT", category: "Security", demandGrowth: "+22%", openingsCount: 8, benchmarkLevel: 75 },
        { skill: "React.js State Management", category: "Frontend", demandGrowth: "+18%", openingsCount: 10, benchmarkLevel: 80 },
      ])
      setLoading(false)
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/academician/industry`)
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setTrends(json.data)
        } else {
          setTrends([])
        }
      })
      .catch(() => setTrends([]))
      .finally(() => setLoading(false))
  }, [isDemo])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Aggregating live industry skill demand...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Industry Skill Demand Intelligence</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Real-time skill requirements extracted from active hiring partner opportunities to calibrate department curriculum.
          </p>
        </div>
      </div>

      {trends.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
            <Info className="h-6 w-6 text-[var(--color-accent)]" />
            <p className="text-sm">
              No active industry skill demand records found. As employers post opportunities, aggregated demand data will populate automatically.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {trends.map((d, i) => (
            <Card key={i} className="border-[var(--color-border-primary)] shadow-sm hover:border-[var(--color-accent)]/40 transition-colors">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base">{d.skill}</h3>
                    <Badge variant="success">{d.demandGrowth} Growth</Badge>
                    <span className="text-xs text-[var(--color-text-muted)]">• {d.category}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Target Benchmark Requirement: <strong className="text-[var(--color-foreground)]">{d.benchmarkLevel} / 100</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xl font-bold text-[var(--color-foreground)]">{d.openingsCount}</div>
                    <span className="text-xs text-[var(--color-text-secondary)]">Active Openings</span>
                  </div>

                  <Link href={`/academician/workshops?skill=${encodeURIComponent(d.skill)}`}>
                    <Button size="sm" className="bg-[var(--color-accent)] cursor-pointer">
                      <Presentation className="mr-1.5 h-3.5 w-3.5" /> Plan Lab
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
