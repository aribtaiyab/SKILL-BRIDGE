-- Migration 10: Performance Optimization & Foreign Key Indexes

-- Profile & Role Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_target_career ON student_profiles(target_career_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_institution ON student_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_department ON student_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_academician_profiles_institution ON academician_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_academician_profiles_department ON academician_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_institution_profiles_institution ON institution_profiles(institution_id);

-- Skills & Career Indexes
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_career_targets_slug ON career_targets(slug);
CREATE INDEX IF NOT EXISTS idx_career_target_skills_career ON career_target_skills(career_target_id);
CREATE INDEX IF NOT EXISTS idx_career_target_skills_skill ON career_target_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill ON student_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_verification ON student_skills(verification_status);

-- Assessments Indexes
CREATE INDEX IF NOT EXISTS idx_assessments_skill ON assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessments_career ON assessments(career_target_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_options_question ON assessment_options(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt ON assessment_answers(attempt_id);

-- Skill Intelligence & Evidence Indexes
CREATE INDEX IF NOT EXISTS idx_skill_scores_student ON skill_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_scores_skill ON skill_scores(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_student ON skill_gaps(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_career ON skill_gaps(career_target_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_skill ON skill_gaps(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_status ON skill_gaps(status);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_student ON skill_evidence(student_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_student ON verification_records(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_student ON projects(student_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_project ON project_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill ON project_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_certifications_student ON certifications(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_student ON progress_history(student_id);

-- Opportunities & Applications Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_industry ON opportunities(industry_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_opportunity ON opportunity_skills(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_skill ON opportunity_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_student ON opportunity_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_matches_opportunity ON opportunity_matches(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(current_status);
CREATE INDEX IF NOT EXISTS idx_application_status_history_app ON application_status_history(application_id);

-- Academician & Institution Intelligence Indexes
CREATE INDEX IF NOT EXISTS idx_mentorships_student ON mentorships(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_academician ON mentorships(academician_id);
CREATE INDEX IF NOT EXISTS idx_workshops_academician ON workshops(academician_id);
CREATE INDEX IF NOT EXISTS idx_workshops_institution ON workshops(institution_id);
CREATE INDEX IF NOT EXISTS idx_interventions_institution ON interventions(institution_id);
CREATE INDEX IF NOT EXISTS idx_interventions_department ON interventions(department_id);
CREATE INDEX IF NOT EXISTS idx_institution_analytics_institution ON institution_analytics(institution_id);
CREATE INDEX IF NOT EXISTS idx_industry_skill_demand_skill ON industry_skill_demand(skill_id);
