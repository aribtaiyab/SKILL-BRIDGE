"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, LineChart, Target, AlertTriangle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">Cohort Analytics</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Deep dive into cohort readiness and skill distribution.</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall Readiness Distribution</CardTitle>
                <CardDescription>Number of students by readiness tier</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-[var(--color-text-muted)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 pt-8">
              {[
                { label: "0-25%", count: 15, color: "bg-[var(--color-critical)]", height: "15%" },
                { label: "26-50%", count: 45, color: "bg-[var(--color-warning)]", height: "35%" },
                { label: "51-75%", count: 180, color: "bg-[var(--color-accent)]", height: "100%" },
                { label: "76-90%", count: 85, color: "bg-[var(--color-success)]", height: "55%" },
                { label: "91-100%", count: 17, color: "bg-[var(--color-success)]", height: "20%" },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{bar.count}</div>
                  <div className={`w-full ${bar.color} rounded-t opacity-90 hover:opacity-100 transition-opacity`} style={{ height: bar.height }}></div>
                  <div className="text-xs text-[var(--color-text-secondary)] rotate-45 sm:rotate-0 mt-2">{bar.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>6-Month Growth Trend</CardTitle>
                <CardDescription>Average cohort readiness over time</CardDescription>
              </div>
              <LineChart className="h-5 w-5 text-[var(--color-text-muted)]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center border border-[var(--color-border-subtle)] relative overflow-hidden">
               {/* Mock Line Chart Visualization */}
               <div className="absolute inset-0 p-8 flex items-end justify-between gap-0">
                 {[40, 45, 52, 60, 68, 72].map((val, i) => (
                   <div key={i} className="flex-1 flex flex-col justify-end items-center relative h-full">
                     {/* Data Point */}
                     <div className="h-3 w-3 bg-[var(--color-success)] rounded-full z-10 shadow-sm border-2 border-white absolute" style={{ bottom: `${val}%` }}></div>
                     {/* Connecting Line Mock (Pure CSS Visual Hack for Prototype) */}
                     {i < 5 && (
                       <div className="absolute w-full h-[2px] bg-[var(--color-success)]/50 origin-bottom-left" style={{ 
                         bottom: `calc(${val}% + 4px)`, 
                         left: '50%',
                         transform: `rotate(-${(i===0?5:i===1?7:i===2?8:i===3?8:4)}deg)`,
                         width: '100%' 
                       }}></div>
                     )}
                   </div>
                 ))}
               </div>
               
               <div className="absolute inset-x-8 bottom-2 flex justify-between text-xs text-[var(--color-text-secondary)]">
                 <span>Month 1</span>
                 <span>Month 2</span>
                 <span>Month 3</span>
                 <span>Month 4</span>
                 <span>Month 5</span>
                 <span>Current</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Category Performance</CardTitle>
          <CardDescription>Compare student proficiency against minimum industry benchmarks.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-6">
             {[
               { category: "Frontend Web Development", student: 82, benchmark: 75 },
               { category: "Backend & APIs", student: 65, benchmark: 80 },
               { category: "Database & SQL", student: 78, benchmark: 70 },
               { category: "DevOps & Cloud", student: 40, benchmark: 60 },
               { category: "Data Science Fundamentals", student: 60, benchmark: 65 },
             ].map((cat, i) => (
               <div key={i} className="space-y-2">
                 <div className="flex justify-between text-sm">
                   <span className="font-medium">{cat.category}</span>
                   <div className="flex gap-4">
                     <span className="text-[var(--color-text-secondary)]">Bench: {cat.benchmark}</span>
                     <span className={`font-bold ${cat.student >= cat.benchmark ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>Avg: {cat.student}</span>
                   </div>
                 </div>
                 <div className="relative h-3 bg-[var(--color-surface-secondary)] rounded-full overflow-hidden">
                   {/* Benchmark Indicator */}
                   <div className="absolute top-0 h-full w-[2px] bg-[var(--color-foreground)] z-10" style={{ left: `calc(${cat.benchmark}% - 1px)` }} />
                   
                   {/* Student Average */}
                   <div className={`absolute top-0 left-0 h-full ${cat.student >= cat.benchmark ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'}`} style={{ width: `${cat.student}%` }} />
                 </div>
               </div>
             ))}
           </div>
        </CardContent>
      </Card>
    </div>
  )
}