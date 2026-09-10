"use client"

import { useState, useEffect } from "react"
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Award,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDemo } from "@/lib/demo/demo-context"
import { demoService } from "@/lib/demo/demo-service"
import { apiClient } from "@/lib/api-client"

interface AcademicianProfileData {
  id: string
  name: string
  email: string
  role: string
  designation: string
  teachingArea: string
  institution: string
  department: string
  bio: string
  phone: string
  location: string
  avatarUrl: string | null
  joinedDate: string
}

export default function AcademiaProfilePage() {
  const { isDemo } = useDemo()
  const [profile, setProfile] = useState<AcademicianProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [teachingArea, setTeachingArea] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')

  const fetchProfile = async () => {
    try {
      setLoading(true)
      if (isDemo) {
        const p = demoService.getProfile()
        const demoProf: AcademicianProfileData = {
          id: p.id,
          name: p.name,
          email: p.email,
          role: 'academician',
          designation: p.designation,
          teachingArea: p.teachingArea,
          institution: p.institution,
          department: p.department,
          bio: p.bio,
          phone: p.phone,
          location: p.location,
          avatarUrl: null,
          joinedDate: p.joinedDate,
        }
        setProfile(demoProf)
        setName(demoProf.name)
        setDesignation(demoProf.designation)
        setTeachingArea(demoProf.teachingArea)
        setBio(demoProf.bio)
        setPhone(demoProf.phone)
        setLocation(demoProf.location)
        setLoading(false)
        return
      }

      const json = await apiClient<{ success: boolean; data: AcademicianProfileData }>('/api/academia/profile')
      if (json.success && json.data) {
        setProfile(json.data)
        setName(json.data.name || '')
        setDesignation(json.data.designation || '')
        setTeachingArea(json.data.teachingArea || '')
        setBio(json.data.bio || '')
        setPhone(json.data.phone || '')
        setLocation(json.data.location || '')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [isDemo])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (isDemo) {
        demoService.updateProfile({
          name,
          designation,
          teachingArea: teachingArea,
          bio,
          phone,
          location,
        })
        setToastMessage('Faculty profile updated successfully! (Demo session)')
        fetchProfile()
        setTimeout(() => setToastMessage(null), 4000)
        return
      }

      const json = await apiClient.patch<{ success: boolean }>('/api/academia/profile', {
        name,
        designation,
        teachingArea,
        bio,
        phone,
        location,
      })
      if (!json.success) {
        throw new Error((json as any).error || 'Failed to update profile')
      }
      setToastMessage('Faculty profile updated successfully!')
      fetchProfile()
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        <p className="text-xs text-[var(--color-text-muted)]">Loading faculty credentials...</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Demo Notice */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Demo Sandbox:</strong> Viewing Dr. Ananya Sharma&apos;s verified faculty credentials. Edits update session state safely.
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
          Faculty Profile & Institutional Credentials
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Manage your verified academic designation, research domains, and contact coordinates
        </p>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-[var(--radius-card)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
            {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{profile.name}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Verified Academician
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-medium">{profile.designation}</p>
            <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1">
              <Building2 className="h-3.5 w-3.5" />
              {profile.department} &bull; {profile.institution}
            </p>
          </div>
        </div>

        <div className="text-xs text-[var(--color-text-muted)] sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--color-border-primary)]">
          <div>Member since</div>
          <div className="font-semibold text-[var(--color-text-primary)]">{profile.joinedDate}</div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} className="rounded-[var(--radius-card)] bg-[var(--color-surface-card)] border border-[var(--color-border-primary)] shadow-sm p-6 space-y-6">
        <div className="border-b border-[var(--color-border-primary)] pb-4">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Academic & Contact Information</h3>
          <p className="text-xs text-[var(--color-text-muted)]">These details appear on your verified workshops, recommendations, and mentorship records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Academic Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card-hover)] text-[var(--color-text-muted)] cursor-not-allowed"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1 block">Institutional email cannot be modified directly</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Designation</label>
            <input
              type="text"
              placeholder="e.g. Professor & Head of Department"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Primary Teaching Area / Domain</label>
            <input
              type="text"
              placeholder="e.g. Cloud Systems, Distributed Architecture, Data Engineering"
              value={teachingArea}
              onChange={(e) => setTeachingArea(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Institution</label>
            <input
              type="text"
              value={profile.institution}
              disabled
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card-hover)] text-[var(--color-text-muted)] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Department</label>
            <input
              type="text"
              value={profile.department}
              disabled
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card-hover)] text-[var(--color-text-muted)] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Campus Office / Location</label>
            <input
              type="text"
              placeholder="e.g. Block IV, Room 302, North Campus"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Biography & Research Focus</label>
          <textarea
            rows={4}
            placeholder="Share your academic background, laboratory initiatives, publications, or mentoring interests..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-[var(--radius-control)] border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-primary)]">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[var(--color-accent)] hover:opacity-90 text-white flex items-center gap-2 text-xs shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
