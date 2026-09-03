"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Shield, TrendingUp, Code, Database, Layout, Server, GitBranch, Loader2 } from "lucide-react"
import { getStudentSkillsCategories } from "@/lib/database/student"
import { SkillCategoryGroup } from "@/types"

export default function SkillsPage() {
  const [categories, setCategories] = useState<SkillCategoryGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const groups = await getStudentSkillsCategories()
        setCategories(groups)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes("Backend")) return <Server className="h-5 w-5" />
    if (categoryName.includes("Database")) return <Database className="h-5 w-5" />
    if (categoryName.includes("Tools") || categoryName.includes("Infrastructure")) return <GitBranch className="h-5 w-5" />
    return <Layout className="h-5 w-5" />
  }

  const getVerificationBadge = (level: string) => {
    switch(level) {
      case "Verified Evidence":
        return <Badge className="bg-[var(--color-foreground)] text-white"><Shield className="h-3 w-3 mr-1" /> Evidence Verified</Badge>
      case "Practical":
        return <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Practical Verified</Badge>
      case "Assessment":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Assessment Verified</Badge>
      default:
        return <Badge variant="secondary">Self-Declared</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading your skill portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-semibold">My Skills</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage and verify your skill portfolio.</p>
        </div>
        <Button>
          <Code className="mr-2 h-4 w-4" /> Add New Skill
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-foreground)] rounded-full text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Verified Skills</p>
              <p className="text-2xl font-bold">4</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-accent)] rounded-full text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Assessment Passed</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-surface-secondary)] border-none">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-warning)] rounded-full text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Self-Declared</p>
              <p className="text-2xl font-bold">4</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {categories.map((category, idx) => (
          <Card key={idx}>
            <CardHeader className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border-primary)] py-4">
              <CardTitle className="text-base flex items-center gap-2">
                {getCategoryIcon(category.category)}
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--color-border-primary)]">
                {category.skills.map((skill, sIdx) => (
                  <div key={sIdx} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface-secondary)] transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between sm:justify-start gap-4">
                        <h4 className="font-semibold">{skill.name}</h4>
                        {getVerificationBadge(skill.verification)}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">{skill.level} • Score: {skill.score}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Link href="/student/evidence">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Shield className="h-3.5 w-3.5 mr-1 text-[var(--color-accent)]" /> Attach Proof
                        </Button>
                      </Link>
                      {skill.verification === "Self-Declared" ? (
                        <Link href="/student/assessment">
                          <Button size="sm" className="border-[var(--color-accent)] text-white">
                            Take Assessment
                          </Button>
                        </Link>
                      ) : skill.status === "gap" || skill.status === "improve" ? (
                        <Link href="/student/assessment">
                          <Button size="sm" variant="secondary">
                            Improve
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/student/passport">
                          <Button size="sm" variant="ghost" className="text-[var(--color-text-secondary)]">
                            In Passport
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}