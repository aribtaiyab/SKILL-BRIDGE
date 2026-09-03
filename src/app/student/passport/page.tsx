"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield, CheckCircle2, FileText, Code, Share2, Download, Award,
  ExternalLink, Calendar, MapPin, Building, Loader2, Sparkles,
  Lock, Globe, Copy, Check, Eye, AlertCircle, ArrowUpRight, PlusCircle
} from "lucide-react"

interface PassportData {
  profile: {
    name: string
    email: string
    institution: string
    targetCareer: string
  }
  settings: {
    shareToken: string
    isPublic: boolean
    headline: string
    bio: string
    showSkills: boolean
    showProjects: boolean
    showCertifications: boolean
    showReadiness: boolean
  }
  skills: {
    id: string
    skillId: string
    name: string
    category: string
    currentLevel: number
    verificationStatus: string
    verificationBadge: {
      label: string
      shortLabel: string
      variant: string
      description: string
    }
    proofCount: number
    proofItems: { id: string; title: string; type: string; url?: string }[]
  }[]
  projects: any[]
  certifications: any[]
  auditRecords: {
    id: string
    skillName: string
    verificationType: string
    verifiedLevel: number
    source: string
    notes: string
    verifiedAt: string
  }[]
}

export default function PassportPage() {
  const [data, setData] = useState<PassportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const loadPassport = async () => {
    try {
      const res = await fetch('/api/student/passport')
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPassport()
  }, [])

  const togglePublic = async () => {
    if (!data) return
    setSavingSettings(true)
    try {
      const newPublicState = !data.settings.isPublic
      const res = await fetch('/api/student/passport/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newPublicState }),
      })
      const json = await res.json()
      if (json.success) {
        setData(prev => (prev ? { ...prev, settings: { ...prev.settings, isPublic: newPublicState } } : null))
      }
    } catch {
      // noop
    } finally {
      setSavingSettings(false)
    }
  }

  const copyShareLink = () => {
    if (!data?.settings.shareToken) return
    const url = `${window.location.origin}/passport/${data.settings.shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading Verified Skill Passport...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="p-12 text-center border-dashed">
        <AlertCircle className="h-10 w-10 text-[var(--color-critical)] mx-auto mb-3" />
        <h3 className="font-semibold text-lg mb-1">Could not load Skill Passport</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">Please try refreshing the page.</p>
        <Button onClick={loadPassport}>Retry</Button>
      </Card>
    )
  }

  const { profile, settings, skills, projects, certifications, auditRecords } = data
  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const verifiedSkillsCount = skills.filter(
    s => s.verificationStatus && s.verificationStatus !== 'self_declared'
  ).length
  const evidenceBackedCount = skills.filter(s => s.proofCount > 0).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-h1 font-semibold">Skill Passport</h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              <Shield className="h-3 w-3 mr-1 inline" /> Cryptographic Ledger
            </Badge>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Your verified professional capability record, immutable skill ledger, and proof portfolio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/student/evidence">
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-1.5 h-4 w-4" /> Add Evidence
            </Button>
          </Link>
          <Button size="sm" onClick={() => setShowShareModal(true)}>
            <Share2 className="mr-1.5 h-4 w-4" /> Share Passport
          </Button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl bg-[var(--color-surface-card)] border-[var(--color-border-primary)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Share Skill Passport</span>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-foreground)]"
                >
                  ✕
                </button>
              </CardTitle>
              <CardDescription>
                Publish a privacy-safe, shareable view for employers and academic institutions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)]">
                <div className="flex items-center gap-2">
                  {settings.isPublic ? (
                    <Globe className="h-4 w-4 text-[var(--color-success)]" />
                  ) : (
                    <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
                  )}
                  <span className="text-sm font-medium">
                    {settings.isPublic ? 'Passport is Public' : 'Passport is Private'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={settings.isPublic ? 'secondary' : 'default'}
                  onClick={togglePublic}
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : settings.isPublic ? (
                    'Make Private'
                  ) : (
                    'Publish Link'
                  )}
                </Button>
              </div>

              {settings.isPublic && (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--color-text-secondary)]">Public Link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/passport/${settings.shareToken}`}
                      className="text-xs flex-1 p-2 rounded border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-foreground)]"
                    />
                    <Button size="sm" variant="outline" onClick={copyShareLink}>
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <div className="pt-2">
                    <Link
                      href={`/passport/${settings.shareToken}`}
                      target="_blank"
                      className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview public view
                    </Link>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Public passports only display verified skills, selected projects, and public credentials. Your email,
                phone number, and private reviewer notes are never exposed.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: ID Card & Proof Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-[var(--color-border-primary)] shadow-md overflow-hidden">
            <div className="h-24 bg-[var(--color-accent)] relative">
              <div className="absolute -bottom-10 left-6 h-20 w-20 rounded-xl bg-[var(--color-surface-card)] p-1 border border-[var(--color-border-primary)] shadow-sm">
                <div className="h-full w-full bg-[var(--color-surface-secondary)] rounded-lg flex items-center justify-center text-xl font-bold text-[var(--color-foreground)]">
                  {initials}
                </div>
              </div>
            </div>
            <CardContent className="pt-14 pb-6 px-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Target: {profile.targetCareer}</p>
                {settings.headline && (
                  <p className="text-xs text-[var(--color-text-secondary)] italic mt-1">{settings.headline}</p>
                )}
              </div>

              <div className="space-y-2 text-sm text-[var(--color-text-secondary)] border-y border-[var(--color-border-primary)] py-3">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                  <span className="truncate">{profile.institution}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                  <span>Verified Identity</span>
                </div>
              </div>

              {/* Verification Stats */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--color-text-secondary)]">Verified Competencies:</span>
                  <strong className="text-[var(--color-foreground)]">
                    {verifiedSkillsCount} / {skills.length}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--color-text-secondary)]">Evidence-Supported Skills:</span>
                  <strong className="text-[var(--color-foreground)]">{evidenceBackedCount}</strong>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/student/evidence" className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> Manage Evidence Portfolio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Audit Verification Stamp */}
          <Card className="bg-[var(--color-surface-secondary)] border-[var(--color-border-primary)]">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Verification Assurance
                </h3>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                SkillBridge verification is multi-tiered: assessments measure foundational knowledge, practical tasks
                evaluate execution, and submitted evidence substantiates end-to-end production readiness.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Skills, Projects, Certifications, Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="skills">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
              <TabsTrigger value="certifications">Certs ({certifications.length})</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            {/* TAB: Verified Skills */}
            <TabsContent value="skills" className="space-y-4 mt-6">
              {skills.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    No skills assessed yet. Complete assessments to build your passport.
                  </p>
                </Card>
              ) : (
                skills.map(skill => (
                  <Card key={skill.id} className="border-[var(--color-border-primary)] hover:shadow-sm transition-all">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{skill.name}</h4>
                            <Badge variant={skill.verificationBadge.variant as any}>
                              {skill.verificationBadge.label}
                            </Badge>
                            {skill.proofCount > 0 && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {skill.proofCount} Proof Item{skill.proofCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {skill.category} • {skill.verificationBadge.description}
                          </p>

                          {/* Proof items if attached */}
                          {skill.proofItems.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-1.5">
                              {skill.proofItems.map((p, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[var(--color-surface-secondary)] text-[var(--color-foreground)] border border-[var(--color-border-subtle)]"
                                >
                                  <Code className="h-3 w-3 text-[var(--color-accent)]" />
                                  {p.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-2xl font-bold">
                            {skill.currentLevel}{' '}
                            <span className="text-xs font-normal text-[var(--color-text-secondary)]">/ 100</span>
                          </div>
                          <Link href={`/student/evidence?skill=${skill.skillId}`}>
                            <span className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-0.5 mt-1">
                              Attach Proof <ArrowUpRight className="h-3 w-3" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* TAB: Projects */}
            <TabsContent value="projects" className="space-y-4 mt-6">
              {projects.length > 0 ? (
                projects.map(p => (
                  <Card key={p.id} className="border-[var(--color-border-primary)]">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-base">{p.title}</h4>
                        {p.github_url && (
                          <a
                            href={p.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
                          >
                            Repository <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">{p.description}</p>
                      {p.technologies && p.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {p.technologies.map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed p-8 text-center text-sm text-[var(--color-text-secondary)]">
                  <Code className="h-8 w-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  No project evidence added yet. Add projects to substantiate your competencies.
                </Card>
              )}
            </TabsContent>

            {/* TAB: Certifications */}
            <TabsContent value="certifications" className="space-y-4 mt-6">
              {certifications.length > 0 ? (
                certifications.map(c => (
                  <Card key={c.id} className="border-[var(--color-border-primary)]">
                    <CardContent className="p-5 flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-base">{c.name}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Issuer: {c.issuing_organization}
                        </p>
                        {c.issue_date && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">Issued: {c.issue_date}</p>
                        )}
                      </div>
                      <Badge variant="outline">{c.verification_status || 'Submitted'}</Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed p-8 text-center text-sm text-[var(--color-text-secondary)]">
                  <Award className="h-8 w-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  No credentials attached yet.
                </Card>
              )}
            </TabsContent>

            {/* TAB: Audit Trail */}
            <TabsContent value="audit" className="space-y-4 mt-6">
              {auditRecords.length > 0 ? (
                auditRecords.map(ar => (
                  <div
                    key={ar.id}
                    className="p-4 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{ar.skillName}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(ar.verifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Source: <strong>{ar.source}</strong> (Level: {ar.verifiedLevel}/100)
                    </p>
                    {ar.notes && <p className="text-xs text-[var(--color-text-secondary)] italic">"{ar.notes}"</p>}
                  </div>
                ))
              ) : (
                <Card className="border-dashed p-8 text-center text-sm text-[var(--color-text-secondary)]">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  Official audit trail entries will be recorded as your skills and evidence are verified.
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}