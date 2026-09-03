"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, BookOpen, PlusCircle, CheckCircle2, Calendar } from "lucide-react"

export default function InstitutionInterventionsPage() {
  const interventions = [
    { title: "Targeted Async Programming Remediation Lab", targetSkill: "Node.js (15-pt deficit)", department: "Computer Science", enrolled: 65, status: "Active", progress: 68 },
    { title: "Containerization Boot Camp with Industry Mentors", targetSkill: "Docker & Kubernetes", department: "Information Technology", enrolled: 84, status: "Active", progress: 42 },
    { title: "Relational Database Indexing & Query Tuning", targetSkill: "SQL Architecture", department: "Software Engineering", enrolled: 52, status: "Completed", progress: 100 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Institutional Interventions</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Structured academic programs and bootcamps to systematically eliminate cohort skill deficits.</p>
        </div>
        <Button className="bg-[var(--color-accent)]"><PlusCircle className="mr-1.5 h-4 w-4" /> Launch Intervention</Button>
      </div>

      <div className="space-y-4">
        {interventions.map((item, i) => (
          <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{item.department}</Badge>
                    <h3 className="font-semibold text-base">{item.title}</h3>
                    <Badge variant={item.status === "Completed" ? "success" : "secondary"}>{item.status}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-accent)] font-medium">Target Benchmark: {item.targetSkill}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">{item.enrolled} Students</div>
                  <span className="text-xs text-[var(--color-text-secondary)]">{item.progress}% Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
