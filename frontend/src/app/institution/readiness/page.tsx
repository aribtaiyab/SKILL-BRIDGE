"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Award, Building, CheckCircle2 } from "lucide-react"

export default function InstitutionReadinessPage() {
  const departmentReadiness = [
    { name: "Computer Science", students: 142, avgReadiness: 81, readyPercent: 68, topRole: "Backend Developer" },
    { name: "Software Engineering", students: 98, avgReadiness: 79, readyPercent: 64, topRole: "Full Stack Engineer" },
    { name: "Information Technology", students: 112, avgReadiness: 72, readyPercent: 54, topRole: "DevOps Engineer" },
    { name: "Data Science", students: 86, avgReadiness: 76, readyPercent: 61, topRole: "Data Analyst" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Cohort Career Readiness</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Aggregate workforce readiness metrics by academic program and specialization track.</p>
      </div>

      <div className="space-y-4">
        {departmentReadiness.map((dept, i) => (
          <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-base">{dept.name}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">{dept.students} enrolled candidates • Primary track: {dept.topRole}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--color-success)]">{dept.avgReadiness}%</div>
                    <span className="text-xs text-[var(--color-text-secondary)]">Average Readiness</span>
                  </div>
                  <Badge variant="success">{dept.readyPercent}% Job-Ready</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Progress value={dept.avgReadiness} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
