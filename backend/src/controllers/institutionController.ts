import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { getSupabaseAdmin } from '../config/supabase.js'

export async function getInstitutionInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    res.status(200).json({
      data: {
        totalEnrolled: 1250,
        overallReadinessIndex: 79,
        placementRate: 84,
        departmentBreakdown: [
          { department: 'Computer Science', readiness: 84, studentCount: 450 },
          { department: 'Information Technology', readiness: 81, studentCount: 380 },
          { department: 'Data Science', readiness: 78, studentCount: 220 },
          { department: 'Software Engineering', readiness: 75, studentCount: 200 },
        ],
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getInstitutionStudents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return res.status(200).json({ data: [] })

    const { data, error } = await supabase
      .from('student_profiles')
      .select('profile_id, education, graduation_year, profiles(full_name, email), career_targets(name), student_skills(current_score)')

    if (error) return res.status(500).json({ success: false, error: 'Could not fetch students' })
    res.status(200).json({ data: data || [] })
  } catch (err) {
    next(err)
  }
}
