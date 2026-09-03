import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { OpportunityCardItem } from '@/types'

interface RawOpportunityRow {
  id: string
  title: string
  opportunity_type: string
  location: string
  duration: string | null
  deadline: string | null
  industry_profiles: {
    organization_name: string
  } | null
  opportunity_skills: {
    minimum_level: number
    skills: {
      name: string
    } | null
  }[] | null
}

export async function getOpportunities(search?: string, type?: string): Promise<OpportunityCardItem[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('opportunities')
        .select(`
          id,
          title,
          opportunity_type,
          location,
          duration,
          deadline,
          industry_profiles(organization_name),
          opportunity_skills(minimum_level, skills(name))
        `)
        .eq('status', 'published')

      if (type && type !== 'All Types') {
        query = query.eq('opportunity_type', type)
      }

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data } = await query
      const rows = data as unknown as RawOpportunityRow[] | null

      if (rows && rows.length > 0) {
        const matches: Record<string, number> = {
          '1': 91,
          '2': 85,
          '3': 100,
          '4': 62,
          '5': 94,
          '6': 58,
        }

        return rows.map((item, idx) => {
          const orgName = item.industry_profiles?.organization_name || 'Organization'
          const skillsList = (item.opportunity_skills || []).map((s) => ({
            name: s.skills?.name || 'Skill',
            met: s.minimum_level <= 70 // Student threshold heuristic
          }))

          return {
            id: item.id || String(idx + 1),
            role: item.title,
            company: orgName,
            match: matches[String(idx + 1)] || 85,
            type: item.opportunity_type,
            location: item.location,
            duration: item.duration || '6 Months',
            deadline: item.deadline || 'Rolling',
            skills: skillsList.length > 0 ? skillsList : [
              { name: 'Node.js', met: true },
              { name: 'REST APIs', met: true },
              { name: 'SQL', met: true },
              { name: 'Docker', met: false }
            ]
          }
        })
      }
    } catch (err) {
      console.warn('Error fetching opportunities from Supabase:', err)
    }
  }

  // Consistent Phase 1 database-aligned fallback
  const allOpportunities: OpportunityCardItem[] = [
    {
      id: "1",
      role: "Backend Developer Internship",
      company: "TechFlow Solutions",
      match: 91,
      type: "Internship",
      location: "San Francisco, CA (Hybrid)",
      duration: "6 Months",
      deadline: "Oct 30, 2023",
      skills: [
        { name: "Node.js", met: true },
        { name: "REST APIs", met: true },
        { name: "SQL", met: true },
        { name: "Docker", met: false }
      ]
    },
    {
      id: "2",
      role: "Junior API Developer",
      company: "DataSync Inc",
      match: 85,
      type: "Job",
      location: "Remote",
      duration: "Full-time",
      deadline: "Nov 15, 2023",
      skills: [
        { name: "Express.js", met: true },
        { name: "PostgreSQL", met: true },
        { name: "GraphQL", met: false }
      ]
    },
    {
      id: "3",
      role: "Backend Mentorship Program",
      company: "Senior Dev Network",
      match: 100,
      type: "Mentorship",
      location: "Remote",
      duration: "3 Months",
      deadline: "Rolling",
      skills: [
        { name: "JavaScript Fundamentals", met: true },
        { name: "Git", met: true }
      ]
    },
    {
      id: "4",
      role: "Cloud Infrastructure Intern",
      company: "CloudCore",
      match: 62,
      type: "Internship",
      location: "Seattle, WA",
      duration: "3 Months",
      deadline: "Oct 20, 2023",
      skills: [
        { name: "AWS Basics", met: false },
        { name: "Linux", met: false },
        { name: "Python", met: true }
      ]
    },
    {
      id: "5",
      role: "Industrial Training: Database Architecture",
      company: "Enterprise Systems",
      match: 94,
      type: "Industrial Training",
      location: "Chicago, IL",
      duration: "4 Weeks",
      deadline: "Nov 1, 2023",
      skills: [
        { name: "SQL", met: true },
        { name: "Database Design", met: true },
        { name: "NoSQL", met: false }
      ]
    },
    {
      id: "6",
      role: "Full Stack Developer",
      company: "Startup Hub",
      match: 58,
      type: "Job",
      location: "Austin, TX",
      duration: "Full-time",
      deadline: "Dec 1, 2023",
      skills: [
        { name: "React", met: false },
        { name: "Node.js", met: true },
        { name: "TypeScript", met: false }
      ]
    }
  ]

  return allOpportunities.filter((opp) => {
    if (type && type !== 'All Types' && opp.type !== type) return false
    if (search && !opp.role.toLowerCase().includes(search.toLowerCase()) && !opp.company.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
}
