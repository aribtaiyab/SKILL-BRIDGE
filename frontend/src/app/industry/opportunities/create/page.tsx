"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Plus, X, AlertCircle, Loader2, Eye, Save } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface SkillEntry {
  name: string
  level: number
}

export default function CreateOpportunityPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [publishMode, setPublishMode] = useState<'draft' | 'published'>('published')

  const [skills, setSkills] = useState<SkillEntry[]>([
    { name: "Node.js", level: 80 },
    { name: "PostgreSQL", level: 75 }
  ])
  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState(70)

  const addSkill = () => {
    if (!newSkillName.trim()) return
    setSkills(prev => [...prev, { name: newSkillName.trim(), level: newSkillLevel }])
    setNewSkillName("")
    setNewSkillLevel(70)
  }

  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    const formData = new FormData(form)

    const title = String(formData.get('title') || '').trim()
    const description = String(formData.get('description') || '').trim()

    if (!title || title.length < 5) {
      setError("Role title must be at least 5 characters.")
      return
    }
    if (!description || description.length < 20) {
      setError("Description must be at least 20 characters.")
      return
    }

    startTransition(async () => {
      try {
        const body = {
          title,
          description,
          type: formData.get('type') || 'internship',
          location: formData.get('location') || '',
          work_mode: formData.get('work_mode') || 'hybrid',
          duration: formData.get('duration') || '',
          application_deadline: formData.get('deadline') || null,
          stipend: formData.get('stipend') ? Number(formData.get('stipend')) : null,
          spots_available: 1,
        }

        const json = await apiClient('/api/industry/opportunities', {
          method: 'POST',
          body: JSON.stringify(body),
        })

        if (!json.success) {
          setError(json.error?.message || 'Could not create opportunity. Please try again.')
          return
        }

        // If publishing (not draft), update status
        if (publishMode === 'published') {
          await apiClient(`/api/industry/opportunities/${json.data.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'published' }),
          })
        }

        setIsSuccess(true)
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 animate-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-[var(--color-success)] rounded-full flex items-center justify-center text-white mb-4 shadow-lg">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-h2 font-semibold text-center">
          {publishMode === 'published' ? 'Opportunity Published!' : 'Draft Saved!'}
        </h1>
        <p className="text-[var(--color-text-secondary)] text-center max-w-md">
          {publishMode === 'published'
            ? 'Your opportunity is now live. SkillBridge will match and notify qualified candidates.'
            : 'Your draft has been saved. Publish it when you\'re ready.'}
        </p>
        <div className="pt-6 flex gap-4">
          <Button variant="outline" onClick={() => router.push('/industry/opportunities')}>View Opportunities</Button>
          <Button onClick={() => router.push('/industry/candidates')}>View Matched Candidates</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <Link href="/industry/opportunities" className="inline-flex items-center text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Opportunities
      </Link>

      <div>
        <h1 className="text-h1 font-semibold">Create Opportunity</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Define role requirements to match with verified talent.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 text-[var(--color-critical)] text-sm border border-red-200 max-w-3xl">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <Card className="border-[var(--color-border-primary)] shadow-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Opportunity Type</label>
              <Select name="type" defaultValue="internship">
                <option value="internship">Internship</option>
                <option value="entry_level">Entry-Level Job</option>
                <option value="industrial_training">Industrial Training</option>
                <option value="mentorship">Mentorship Program</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role Title <span className="text-[var(--color-critical)]">*</span></label>
              <Input name="title" placeholder="e.g. Backend Developer Internship" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input name="location" placeholder="City, Country" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Work Setting</label>
                <Select name="work_mode" defaultValue="hybrid">
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <Input name="duration" placeholder="e.g. 6 Months" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Application Deadline</label>
                <Input name="deadline" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Stipend (USD, optional)</label>
              <Input name="stipend" type="number" placeholder="e.g. 1500" min="0" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description <span className="text-[var(--color-critical)]">*</span></label>
              <textarea
                name="description"
                className="w-full min-h-[120px] rounded-md border border-[var(--color-border-primary)] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                placeholder="Describe the role, responsibilities, and team..."
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-border-primary)] shadow-sm">
          <CardHeader>
            <CardTitle>Skill Requirements</CardTitle>
            <CardDescription>Define the exact skills needed. These power the matching engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-3 bg-[var(--color-surface-secondary)] p-3 rounded-lg border border-[var(--color-border-primary)]">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Score ≥ {skill.level}</Badge>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-critical)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-[var(--color-border-primary)]">
              <div className="flex-1">
                <Input
                  placeholder="Skill name (e.g. React, AWS)"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  placeholder="Min score"
                  value={newSkillLevel}
                  onChange={e => setNewSkillLevel(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              <Button type="button" variant="secondary" onClick={addSkill} className="shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button
            type="submit"
            variant="outline"
            disabled={isPending}
            onClick={() => setPublishMode('draft')}
          >
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => setPublishMode('published')}
          >
            {isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
              : <><Eye className="mr-2 h-4 w-4" /> Publish Opportunity</>}
          </Button>
        </div>
      </form>
    </div>
  )
}