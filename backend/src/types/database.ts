export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'industry' | 'academician' | 'institution'
export type VerificationStatus = 'self_declared' | 'assessment_verified' | 'practical_verified' | 'evidence_verified' | 'institution_verified'
export type AssessmentType = 'knowledge' | 'practical'
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned'
export type GapStatus = 'critical' | 'needs_improvement' | 'ready'
export type ImprovementPlanStatus = 'recommended' | 'active' | 'completed' | 'abandoned'
export type OpportunityStatus = 'draft' | 'published' | 'closed' | 'archived'
export type WorkMode = 'remote' | 'onsite' | 'hybrid'
export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'selected' | 'rejected' | 'withdrawn'
export type MentorshipStatus = 'requested' | 'active' | 'completed' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: UserRole
          avatar_url: string | null
          phone: string | null
          bio: string | null
          location: string | null
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: UserRole
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: UserRole
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          location?: string | null
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          language: string
          email_notifications: boolean
          opportunity_notifications: boolean
          readiness_notifications: boolean
          privacy_visibility: string
          accessibility_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          language?: string
          email_notifications?: boolean
          opportunity_notifications?: boolean
          readiness_notifications?: boolean
          privacy_visibility?: string
          accessibility_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          language?: string
          email_notifications?: boolean
          opportunity_notifications?: boolean
          readiness_notifications?: boolean
          privacy_visibility?: string
          accessibility_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      student_profiles: {
        Row: {
          profile_id: string
          education: string | null
          institution_id: string | null
          department_id: string | null
          graduation_year: number | null
          experience_level: string | null
          target_career_id: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          education?: string | null
          institution_id?: string | null
          department_id?: string | null
          graduation_year?: number | null
          experience_level?: string | null
          target_career_id?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          education?: string | null
          institution_id?: string | null
          department_id?: string | null
          graduation_year?: number | null
          experience_level?: string | null
          target_career_id?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      industry_profiles: {
        Row: {
          profile_id: string
          organization_name: string
          industry_type: string
          organization_size: string | null
          location: string | null
          website: string | null
          description: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          organization_name: string
          industry_type?: string
          organization_size?: string | null
          location?: string | null
          website?: string | null
          description?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          organization_name?: string
          industry_type?: string
          organization_size?: string | null
          location?: string | null
          website?: string | null
          description?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      academician_profiles: {
        Row: {
          profile_id: string
          institution_id: string | null
          department_id: string | null
          designation: string | null
          teaching_area: string | null
          mentorship_interest: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          institution_id?: string | null
          department_id?: string | null
          designation?: string | null
          teaching_area?: string | null
          mentorship_interest?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          institution_id?: string | null
          department_id?: string | null
          designation?: string | null
          teaching_area?: string | null
          mentorship_interest?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      institution_profiles: {
        Row: {
          profile_id: string
          institution_id: string | null
          institution_name: string
          institution_type: string
          location: string | null
          website: string | null
          description: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          institution_id?: string | null
          institution_name: string
          institution_type?: string
          location?: string | null
          website?: string | null
          description?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          institution_id?: string | null
          institution_name?: string
          institution_type?: string
          location?: string | null
          website?: string | null
          description?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      institutions: {
        Row: {
          id: string
          name: string
          type: string
          location: string | null
          website: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string
          location?: string | null
          website?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          location?: string | null
          website?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          institution_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      career_targets: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          slug: string
          category: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          category?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      career_target_skills: {
        Row: {
          id: string
          career_target_id: string
          skill_id: string
          required_level: number
          importance: string
          created_at: string
        }
        Insert: {
          id?: string
          career_target_id: string
          skill_id: string
          required_level: number
          importance?: string
          created_at?: string
        }
        Update: {
          id?: string
          career_target_id?: string
          skill_id?: string
          required_level?: number
          importance?: string
          created_at?: string
        }
      }
      student_skills: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          self_declared_level: number
          current_level: number
          verified_level: number
          verification_status: VerificationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          self_declared_level?: number
          current_level?: number
          verified_level?: number
          verification_status?: VerificationStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          self_declared_level?: number
          current_level?: number
          verified_level?: number
          verification_status?: VerificationStatus
          created_at?: string
          updated_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          title: string
          description: string | null
          skill_id: string | null
          career_target_id: string | null
          difficulty: string
          assessment_type: AssessmentType
          time_limit: number
          total_questions: number
          passing_score: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          skill_id?: string | null
          career_target_id?: string | null
          difficulty?: string
          assessment_type?: AssessmentType
          time_limit?: number
          total_questions?: number
          passing_score?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          skill_id?: string | null
          career_target_id?: string | null
          difficulty?: string
          assessment_type?: AssessmentType
          time_limit?: number
          total_questions?: number
          passing_score?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assessment_questions: {
        Row: {
          id: string
          assessment_id: string
          question_text: string
          question_type: string
          difficulty: string
          points: number
          order_index: number
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          question_text: string
          question_type?: string
          difficulty?: string
          points?: number
          order_index?: number
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          question_text?: string
          question_type?: string
          difficulty?: string
          points?: number
          order_index?: number
          explanation?: string | null
          created_at?: string
        }
      }
      assessment_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          order_index: number
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          order_index?: number
          is_correct?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          option_text?: string
          order_index?: number
          is_correct?: boolean
          created_at?: string
        }
      }
      assessment_attempts: {
        Row: {
          id: string
          assessment_id: string
          student_id: string
          started_at: string
          completed_at: string | null
          score: number | null
          percentage: number | null
          status: AttemptStatus
          attempt_number: number
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          student_id: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          percentage?: number | null
          status?: AttemptStatus
          attempt_number?: number
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          student_id?: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          percentage?: number | null
          status?: AttemptStatus
          attempt_number?: number
          created_at?: string
        }
      }
      assessment_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_id: string | null
          answer_text: string | null
          is_correct: boolean | null
          points_earned: number | null
          answered_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          points_earned?: number | null
          answered_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          points_earned?: number | null
          answered_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          owner_id: string
          document_type: string
          file_name: string
          storage_path: string
          mime_type: string | null
          file_size: number | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          document_type?: string
          file_name: string
          storage_path: string
          mime_type?: string | null
          file_size?: number | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          document_type?: string
          file_name?: string
          storage_path?: string
          mime_type?: string | null
          file_size?: number | null
          uploaded_at?: string
        }
      }
      skill_scores: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          source: string
          score: number
          assessment_attempt_id: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          source?: string
          score: number
          assessment_attempt_id?: string | null
          recorded_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          source?: string
          score?: number
          assessment_attempt_id?: string | null
          recorded_at?: string
        }
      }
      skill_gaps: {
        Row: {
          id: string
          student_id: string
          career_target_id: string
          skill_id: string
          required_score: number
          current_score: number
          gap_score: number
          priority: string
          status: GapStatus
          calculated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          career_target_id: string
          skill_id: string
          required_score: number
          current_score: number
          gap_score: number
          priority?: string
          status?: GapStatus
          calculated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          career_target_id?: string
          skill_id?: string
          required_score?: number
          current_score?: number
          gap_score?: number
          priority?: string
          status?: GapStatus
          calculated_at?: string
        }
      }
      skill_evidence: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          evidence_type: string
          title: string
          description: string | null
          url: string | null
          document_id: string | null
          verification_status: VerificationStatus
          submitted_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          evidence_type?: string
          title: string
          description?: string | null
          url?: string | null
          document_id?: string | null
          verification_status?: VerificationStatus
          submitted_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          evidence_type?: string
          title?: string
          description?: string | null
          url?: string | null
          document_id?: string | null
          verification_status?: VerificationStatus
          submitted_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
      }
      verification_records: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          evidence_id: string | null
          verification_type: string
          verified_level: number
          verified_by: string | null
          verification_source: string
          notes: string | null
          verified_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          evidence_id?: string | null
          verification_type?: string
          verified_level: number
          verified_by?: string | null
          verification_source?: string
          notes?: string | null
          verified_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          evidence_id?: string | null
          verification_type?: string
          verified_level?: number
          verified_by?: string | null
          verification_source?: string
          notes?: string | null
          verified_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          student_id: string
          title: string
          description: string | null
          project_url: string | null
          github_url: string | null
          technologies: string[]
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          description?: string | null
          project_url?: string | null
          github_url?: string | null
          technologies?: string[]
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          description?: string | null
          project_url?: string | null
          github_url?: string | null
          technologies?: string[]
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_skills: {
        Row: {
          id: string
          project_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          skill_id?: string
          created_at?: string
        }
      }
      certifications: {
        Row: {
          id: string
          student_id: string
          name: string
          issuing_organization: string
          issue_date: string | null
          expiry_date: string | null
          credential_url: string | null
          document_id: string | null
          verification_status: VerificationStatus
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          name: string
          issuing_organization: string
          issue_date?: string | null
          expiry_date?: string | null
          credential_url?: string | null
          document_id?: string | null
          verification_status?: VerificationStatus
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          name?: string
          issuing_organization?: string
          issue_date?: string | null
          expiry_date?: string | null
          credential_url?: string | null
          document_id?: string | null
          verification_status?: VerificationStatus
          created_at?: string
        }
      }
      improvement_plans: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          target_score: number
          starting_score: number
          status: ImprovementPlanStatus
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          target_score: number
          starting_score: number
          status?: ImprovementPlanStatus
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          target_score?: number
          starting_score?: number
          status?: ImprovementPlanStatus
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      improvement_activities: {
        Row: {
          id: string
          improvement_plan_id: string
          title: string
          description: string | null
          activity_type: string
          duration_minutes: number
          order_index: number
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          improvement_plan_id: string
          title: string
          description?: string | null
          activity_type?: string
          duration_minutes?: number
          order_index?: number
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          id?: string
          improvement_plan_id?: string
          title?: string
          description?: string | null
          activity_type?: string
          duration_minutes?: number
          order_index?: number
          completed?: boolean
          completed_at?: string | null
        }
      }
      reassessments: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          previous_score: number
          new_score: number
          improvement_plan_id: string | null
          assessment_attempt_id: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          previous_score: number
          new_score: number
          improvement_plan_id?: string | null
          assessment_attempt_id?: string | null
          recorded_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          previous_score?: number
          new_score?: number
          improvement_plan_id?: string | null
          assessment_attempt_id?: string | null
          recorded_at?: string
        }
      }
      progress_history: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          score: number
          recorded_at: string
          source: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          score: number
          recorded_at?: string
          source?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          score?: number
          recorded_at?: string
          source?: string
        }
      }
      ai_recommendations: {
        Row: {
          id: string
          student_id: string
          skill_id: string | null
          recommendation_type: string
          title: string
          description: string
          priority: string
          status: string
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          skill_id?: string | null
          recommendation_type?: string
          title: string
          description: string
          priority?: string
          status?: string
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string | null
          recommendation_type?: string
          title?: string
          description?: string
          priority?: string
          status?: string
          created_at?: string
          expires_at?: string | null
        }
      }
      opportunities: {
        Row: {
          id: string
          industry_id: string
          title: string
          description: string
          opportunity_type: string
          location: string
          work_mode: WorkMode
          duration: string | null
          deadline: string | null
          eligibility_description: string | null
          target_audience: string | null
          status: OpportunityStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          industry_id: string
          title: string
          description: string
          opportunity_type?: string
          location?: string
          work_mode?: WorkMode
          duration?: string | null
          deadline?: string | null
          eligibility_description?: string | null
          target_audience?: string | null
          status?: OpportunityStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          industry_id?: string
          title?: string
          description?: string
          opportunity_type?: string
          location?: string
          work_mode?: WorkMode
          duration?: string | null
          deadline?: string | null
          eligibility_description?: string | null
          target_audience?: string | null
          status?: OpportunityStatus
          created_at?: string
          updated_at?: string
        }
      }
      opportunity_skills: {
        Row: {
          id: string
          opportunity_id: string
          skill_id: string
          minimum_level: number
          importance: string
          created_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          skill_id: string
          minimum_level: number
          importance?: string
          created_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          skill_id?: string
          minimum_level?: number
          importance?: string
          created_at?: string
        }
      }
      opportunity_eligibility: {
        Row: {
          id: string
          opportunity_id: string
          min_education: string | null
          graduation_year: number | null
          experience_level: string | null
          department_id: string | null
          institution_id: string | null
          location_requirements: string | null
          created_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          min_education?: string | null
          graduation_year?: number | null
          experience_level?: string | null
          department_id?: string | null
          institution_id?: string | null
          location_requirements?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          min_education?: string | null
          graduation_year?: number | null
          experience_level?: string | null
          department_id?: string | null
          institution_id?: string | null
          location_requirements?: string | null
          created_at?: string
        }
      }
      opportunity_matches: {
        Row: {
          id: string
          opportunity_id: string
          student_id: string
          match_percentage: number
          eligibility_status: boolean
          skill_match_percentage: number
          explanation: string | null
          missing_skills: Json
          calculated_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          student_id: string
          match_percentage: number
          eligibility_status?: boolean
          skill_match_percentage: number
          explanation?: string | null
          missing_skills?: Json
          calculated_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          student_id?: string
          match_percentage?: number
          eligibility_status?: boolean
          skill_match_percentage?: number
          explanation?: string | null
          missing_skills?: Json
          calculated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          opportunity_id: string
          student_id: string
          current_status: ApplicationStatus
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          student_id: string
          current_status?: ApplicationStatus
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          student_id?: string
          current_status?: ApplicationStatus
          applied_at?: string
          updated_at?: string
        }
      }
      application_status_history: {
        Row: {
          id: string
          application_id: string
          status: ApplicationStatus
          note: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          application_id: string
          status: ApplicationStatus
          note?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          status?: ApplicationStatus
          note?: string | null
          changed_by?: string | null
          changed_at?: string
        }
      }
      mentorships: {
        Row: {
          id: string
          student_id: string
          academician_id: string
          skill_id: string | null
          status: MentorshipStatus
          start_date: string | null
          end_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          academician_id: string
          skill_id?: string | null
          status?: MentorshipStatus
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          academician_id?: string
          skill_id?: string | null
          status?: MentorshipStatus
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      workshops: {
        Row: {
          id: string
          academician_id: string
          institution_id: string
          title: string
          description: string | null
          skill_id: string | null
          date: string
          duration: string | null
          capacity: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          academician_id: string
          institution_id: string
          title: string
          description?: string | null
          skill_id?: string | null
          date: string
          duration?: string | null
          capacity?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          academician_id?: string
          institution_id?: string
          title?: string
          description?: string | null
          skill_id?: string | null
          date?: string
          duration?: string | null
          capacity?: number
          status?: string
          created_at?: string
        }
      }
      interventions: {
        Row: {
          id: string
          institution_id: string
          department_id: string | null
          skill_id: string | null
          title: string
          description: string | null
          intervention_type: string
          target_students: number | null
          status: string
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          department_id?: string | null
          skill_id?: string | null
          title: string
          description?: string | null
          intervention_type?: string
          target_students?: number | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          department_id?: string | null
          skill_id?: string | null
          title?: string
          description?: string | null
          intervention_type?: string
          target_students?: number | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
      }
      institution_analytics: {
        Row: {
          id: string
          institution_id: string
          department_id: string | null
          metric_date: string
          total_students: number
          overall_readiness: number
          average_verified_skill: number
          students_needing_intervention: number
          internship_participation: number
          placement_readiness: number
          created_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          department_id?: string | null
          metric_date?: string
          total_students?: number
          overall_readiness?: number
          average_verified_skill?: number
          students_needing_intervention?: number
          internship_participation?: number
          placement_readiness?: number
          created_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          department_id?: string | null
          metric_date?: string
          total_students?: number
          overall_readiness?: number
          average_verified_skill?: number
          students_needing_intervention?: number
          internship_participation?: number
          placement_readiness?: number
          created_at?: string
        }
      }
      industry_skill_demand: {
        Row: {
          id: string
          skill_id: string
          industry_type: string
          demand_count: number
          demand_percentage: number
          trend: string
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          skill_id: string
          industry_type?: string
          demand_count?: number
          demand_percentage?: number
          trend?: string
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          skill_id?: string
          industry_type?: string
          demand_count?: number
          demand_percentage?: number
          trend?: string
          period_start?: string
          period_end?: string
          created_at?: string
        }
      }
    }
  }
}
