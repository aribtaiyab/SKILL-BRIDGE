"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Shield, CheckCircle2, Award, Code, Building, Lock,
  ExternalLink, Loader2, Sparkles, ArrowLeft
} from "lucide-react"

export default function PublicPassportPage() {
  const params = useParams()
  const shareToken = typeof params?.shareToken === 'string' ? params.shareToken : ''

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!shareToken) return

    fetch(`/api/passport/${shareToken}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setData(json.data)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [shareToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Verifying skill ledger...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
        <Card className="w-full max-w-md text-center p-8 border-dashed">
          <Lock className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Private or Unavailable</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            This Skill Passport is private or the link has expired.
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to SkillBridge
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Branding Banner */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[var(--color-accent)]" />
            <span className="font-bold text-lg">SkillBridge Passport</span>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            ✓ Verified Candidate Record
          </Badge>
        </div>

        {/* Candidate Header */}
        <Card className="border-[var(--color-border-primary)] shadow-sm">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Verified Candidate</h1>
              {data.headline && (
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">{data.headline}</p>
              )}
              {data.institutionName && (
                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" /> {data.institutionName}
                </p>
              )}
            </div>
            <div className="bg-[var(--color-surface-secondary)] px-4 py-3 rounded-xl border border-[var(--color-border-primary)] text-center shrink-0">
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-semibold">
                Verified Skills
              </p>
              <p className="text-2xl font-bold text-[var(--color-accent)]">{data.skills?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Bio if present */}
        {data.bio && (
          <Card className="border-[var(--color-border-primary)]">
            <CardContent className="p-6">
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                About Candidate
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{data.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Verified Skills Section */}
        {data.skills && data.skills.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--color-accent)]" /> Verified Competencies
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.skills.map((skill: any, idx: number) => (
                <Card key={idx} className="border-[var(--color-border-primary)] hover:border-[var(--color-accent)] transition-colors">
                  <CardContent className="p-5 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-base">{skill.skillName}</h4>
                        <Badge variant={skill.verificationBadge?.variant as any || 'outline'}>
                          {skill.verificationBadge?.label || skill.verificationStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)]">{skill.category}</p>
                      {skill.proofCount > 0 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
                          {skill.proofCount} Verified Proof Artifact{skill.proofCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{skill.level}</div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">SCORE</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Verified Projects Section */}
        {data.projects && data.projects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Code className="h-5 w-5 text-[var(--color-accent)]" /> Verified Project Proof
            </h2>
            <div className="space-y-3">
              {data.projects.map((p: any, idx: number) => (
                <Card key={idx} className="border-[var(--color-border-primary)]">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-base">{p.title}</h4>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                        >
                          View Repository / Demo <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{p.description}</p>
                    {p.skills && p.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.skills.map((t: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-[var(--color-accent)]" /> Credentials & Certifications
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.certifications.map((c: any, idx: number) => (
                <Card key={idx} className="border-[var(--color-border-primary)]">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-sm">{c.name}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">{c.issuingOrganization}</p>
                    </div>
                    <Badge variant="outline">{c.verificationStatus}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-[var(--color-border-primary)] text-xs text-[var(--color-text-muted)] space-y-1">
          <p>SkillBridge Connect • AI-Powered Skill Intelligence & Academia–Industry Collaboration</p>
          <p>This public capability record is cryptographically verified against institutional assessment standards.</p>
        </div>
      </div>
    </div>
  )
}
