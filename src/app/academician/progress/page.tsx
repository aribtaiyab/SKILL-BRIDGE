"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Award, Users, CheckCircle2 } from "lucide-react"

export default function AcademicianProgressPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-h1 font-semibold">Cohort Progression & Growth</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Measure semester-over-semester technical capability improvements across academic departments.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Average Readiness</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--color-success)]">76%</span>
              <span className="text-sm font-medium text-[var(--color-success)] flex items-center mb-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +14% vs Semester Start
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Assessments Completed</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold">342</span>
              <span className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Across 128 students
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Practical Pass Rate</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--color-accent)]">84%</span>
              <span className="text-sm font-medium text-[var(--color-success)] flex items-center mb-1">
                <TrendingUp className="h-4 w-4 mr-1" /> +9%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
