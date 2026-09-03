import { getSupabasePublic } from '../config/supabase.js'
import { isSupabaseConfigured } from '../config/env.js'
import { ApplicationCardItem } from '../types/index.js'

const supabase = getSupabasePublic()

const DEFAULT_STUDENT_ID = '00000000-0000-0000-0000-000000000001'

interface RawApplicationRow {
  id: string
  opportunity_id: string
  current_status: string
  applied_at: string
  updated_at: string
  opportunities: {
    title: string
    industry_profiles: {
      organization_name: string
    } | null
  } | null
  application_status_history: {
    status: string
    note: string | null
    changed_at: string
  }[] | null
}

export async function getStudentApplications(studentId: string = DEFAULT_STUDENT_ID): Promise<ApplicationCardItem[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          opportunity_id,
          current_status,
          applied_at,
          updated_at,
          opportunities(title, industry_profiles(organization_name)),
          application_status_history(status, note, changed_at)
        `)
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false })

      const rows = data as unknown as RawApplicationRow[] | null

      if (rows && rows.length > 0) {
        return rows.map((app) => {
          const statusCapitalized = app.current_status.charAt(0).toUpperCase() + app.current_status.slice(1)
          
          return {
            id: app.id,
            opportunityId: app.opportunity_id,
            role: app.opportunities?.title || 'Role',
            company: app.opportunities?.industry_profiles?.organization_name || 'Organization',
            status: statusCapitalized,
            dateApplied: new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            lastUpdate: new Date(app.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            match: 91,
            timeline: (app.application_status_history || []).map(h => ({
              status: h.status.charAt(0).toUpperCase() + h.status.slice(1),
              date: new Date(h.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              completed: true
            }))
          }
        })
      }
    } catch (err) {
      console.warn('Error fetching applications from Supabase:', err)
    }
  }

  // Consistent Phase 1 database-aligned fallback
  return [
    {
      id: "1",
      opportunityId: "1",
      role: "Backend Developer Internship",
      company: "TechFlow Solutions",
      status: "Shortlisted",
      dateApplied: "Oct 15, 2023",
      lastUpdate: "Oct 18, 2023",
      match: 91,
      timeline: [
        { status: "Applied", date: "Oct 15, 2023", completed: true },
        { status: "Skill Verified", date: "Oct 16, 2023", completed: true },
        { status: "Shortlisted", date: "Oct 18, 2023", completed: true },
        { status: "Interview", date: "Pending", completed: false },
      ]
    },
    {
      id: "2",
      opportunityId: "2",
      role: "API Engineer",
      company: "DataSync Inc",
      status: "Applied",
      dateApplied: "Oct 20, 2023",
      lastUpdate: "Oct 20, 2023",
      match: 85,
      timeline: [
        { status: "Applied", date: "Oct 20, 2023", completed: true },
        { status: "Under Review", date: "Pending", completed: false },
        { status: "Interview", date: "", completed: false },
      ]
    },
    {
      id: "3",
      opportunityId: "6",
      role: "Full Stack Developer",
      company: "Startup Hub",
      status: "Rejected",
      dateApplied: "Sep 10, 2023",
      lastUpdate: "Sep 25, 2023",
      match: 58,
      feedback: "Strong backend skills, but requires more React experience for this specific role.",
      timeline: [
        { status: "Applied", date: "Sep 10, 2023", completed: true },
        { status: "Reviewed", date: "Sep 15, 2023", completed: true },
        { status: "Not Selected", date: "Sep 25, 2023", completed: true },
      ]
    },
    {
      id: "4",
      opportunityId: "3",
      role: "Backend Mentorship",
      company: "Senior Dev Network",
      status: "Selected",
      dateApplied: "Aug 05, 2023",
      lastUpdate: "Aug 20, 2023",
      match: 100,
      timeline: [
        { status: "Applied", date: "Aug 05, 2023", completed: true },
        { status: "Match Confirmed", date: "Aug 10, 2023", completed: true },
        { status: "Selected", date: "Aug 20, 2023", completed: true },
      ]
    }
  ]
}

export async function submitApplication(opportunityId: string, studentId: string = DEFAULT_STUDENT_ID): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          opportunity_id: opportunityId,
          student_id: studentId,
          current_status: 'applied'
        } as never)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, message: 'You have already applied to this opportunity.' }
        }
        return { success: false, message: error.message }
      }

      const inserted = data as unknown as { id: string } | null

      if (inserted) {
        await supabase.from('application_status_history').insert({
          application_id: inserted.id,
          status: 'applied',
          note: 'Application submitted through SkillBridge Connect.'
        } as never)
      }

      return { success: true, message: 'Application successfully submitted!' }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Application submission error'
      return { success: false, message: errorMsg }
    }
  }

  return { success: true, message: 'Application submitted (Simulation mode).' }
}
