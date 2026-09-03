"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, MessageSquare, CheckCircle2 } from "lucide-react"

export default function AcademicianMentorshipPage() {
  const activeMentees = [
    { name: "Sarah Jenkins", career: "Backend Developer", nextSession: "Tomorrow, 2:00 PM", topic: "Node.js Streams Architecture & Error Handling", status: "Active" },
    { name: "Jordan Lee", career: "Full Stack Engineer", nextSession: "Thursday, 10:00 AM", topic: "Docker Multi-stage builds & deployment", status: "Scheduled" },
    { name: "Taylor Kim", career: "Security Analyst", nextSession: "Friday, 3:30 PM", topic: "Cryptography & JWT token refresh design", status: "Scheduled" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Mentorship & Office Hours</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Provide 1-on-1 technical coaching and guide students through targeted skill gap interventions.</p>
        </div>
        <Button className="bg-[var(--color-accent)]">Schedule Session</Button>
      </div>

      <div className="space-y-4">
        {activeMentees.map((m, i) => (
          <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{m.name}</h3>
                    <Badge variant="success">{m.status}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">Target: <strong className="text-[var(--color-foreground)]">{m.career}</strong></p>
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 pt-1">
                    <Calendar className="h-3.5 w-3.5 text-[var(--color-accent)]" /> {m.nextSession}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] pt-0.5">Focus: {m.topic}</p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Notes</Button>
                  <Button size="sm">Join Session</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
