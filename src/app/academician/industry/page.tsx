"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, TrendingUp, Building } from "lucide-react"

export default function AcademicianIndustryPage() {
  const demandTrends = [
    { skill: "Node.js Microservices", demandGrowth: "+28%", openingsCount: 64, benchmarkLevel: 80 },
    { skill: "PostgreSQL Database Design", demandGrowth: "+22%", openingsCount: 52, benchmarkLevel: 75 },
    { skill: "Cloud Containerization (Docker/K8s)", demandGrowth: "+35%", openingsCount: 78, benchmarkLevel: 65 },
    { skill: "REST API Security & JWT", demandGrowth: "+19%", openingsCount: 44, benchmarkLevel: 70 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Industry Skill Demand</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Real-time skill requirements from active hiring partners to calibrate course outcomes.</p>
      </div>

      <div className="space-y-4">
        {demandTrends.map((d, i) => (
          <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base">{d.skill}</h3>
                  <Badge variant="success">{d.demandGrowth} Growth</Badge>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Industry Benchmark Requirement: <strong className="text-[var(--color-foreground)]">{d.benchmarkLevel} / 100</strong>
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[var(--color-foreground)]">{d.openingsCount}</div>
                <span className="text-xs text-[var(--color-text-secondary)]">Active Opportunities</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
