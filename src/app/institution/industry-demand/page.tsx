"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, TrendingUp, Users, CheckCircle2 } from "lucide-react"

export default function InstitutionIndustryDemandPage() {
  const hiringPartnersDemand = [
    { skill: "Node.js & Backend Architecture", activePartners: 18, openRoles: 64, cohortReady: 52, alignmentRate: 81 },
    { skill: "PostgreSQL & Database Systems", activePartners: 14, openRoles: 48, cohortReady: 65, alignmentRate: 88 },
    { skill: "Cloud Containerization (Docker)", activePartners: 22, openRoles: 76, cohortReady: 31, alignmentRate: 54 },
    { skill: "REST API Security & JWT", activePartners: 12, openRoles: 38, cohortReady: 44, alignmentRate: 78 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Industry Skill Demand Intelligence</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Aggregated hiring requirements from corporate partners compared against institutional readiness.</p>
      </div>

      <div className="space-y-4">
        {hiringPartnersDemand.map((item, i) => (
          <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{item.skill}</h3>
                    <Badge variant={item.alignmentRate >= 75 ? "success" : "warning"}>
                      {item.alignmentRate}% Institutional Alignment
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Demanded by <strong className="text-[var(--color-foreground)]">{item.activePartners} corporate partners</strong> ({item.openRoles} openings)
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-[var(--color-foreground)]">{item.cohortReady} students</div>
                  <span className="text-xs text-[var(--color-text-secondary)]">Verified Ready for Placement</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
