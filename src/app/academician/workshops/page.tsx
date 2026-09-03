"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, PlusCircle, CheckCircle2 } from "lucide-react"

export default function AcademicianWorkshopsPage() {
  const workshops = [
    { title: "Mastering Asynchronous Control Flow & Streams", date: "Friday, Nov 10, 2023", time: "2:00 PM - 4:00 PM", enrolled: 42, capacity: 50, status: "Upcoming", skillTarget: "Node.js (15-pt gap focus)" },
    { title: "PostgreSQL Query Optimization & EXPLAIN ANALYZE", date: "Wednesday, Nov 15, 2023", time: "10:00 AM - 12:00 PM", enrolled: 35, capacity: 40, status: "Upcoming", skillTarget: "SQL Database Design" },
    { title: "Docker Containerization for Modern Web Apps", date: "Oct 28, 2023", time: "Completed", enrolled: 48, capacity: 50, status: "Completed", skillTarget: "Docker Basics" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Department Workshops & Labs</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Host hands-on technical labs to address critical cohort skill gaps.</p>
        </div>
        <Button className="bg-[var(--color-accent)]"><PlusCircle className="mr-1.5 h-4 w-4" /> Create Workshop</Button>
      </div>

      <div className="space-y-4">
        {workshops.map((w, i) => (
          <Card key={i} className="border-[var(--color-border-primary)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{w.title}</h3>
                    <Badge variant={w.status === "Upcoming" ? "secondary" : "success"}>{w.status}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-accent)] font-medium">Focus: {w.skillTarget}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5 pt-1">
                    <Calendar className="h-3.5 w-3.5" /> {w.date} • {w.time}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">{w.enrolled} / {w.capacity}</div>
                  <span className="text-xs text-[var(--color-text-secondary)]">Students Enrolled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
