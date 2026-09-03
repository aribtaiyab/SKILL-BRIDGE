-- Migration 12: Row Level Security (RLS) Policies

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_target_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reassessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_skill_demand ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 2. Public Read Datasets
CREATE POLICY "Public read active career targets" ON career_targets FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active skills" ON skills FOR SELECT USING (is_active = true);
CREATE POLICY "Public read career target skills" ON career_target_skills FOR SELECT USING (true);
CREATE POLICY "Public read institutions" ON institutions FOR SELECT USING (true);
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read active assessments" ON assessments FOR SELECT USING (is_active = true);
CREATE POLICY "Public read assessment questions" ON assessment_questions FOR SELECT USING (true);
CREATE POLICY "Public read assessment options without answer key leak" ON assessment_options FOR SELECT USING (true);
CREATE POLICY "Public read published opportunities" ON opportunities FOR SELECT USING (status = 'published' OR industry_id = auth.uid());
CREATE POLICY "Public read opportunity skills" ON opportunity_skills FOR SELECT USING (true);
CREATE POLICY "Public read opportunity eligibility" ON opportunity_eligibility FOR SELECT USING (true);
CREATE POLICY "Public read industry skill demand" ON industry_skill_demand FOR SELECT USING (true);

-- 3. Profiles & Settings Policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Public can view basic user profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (user_id = auth.uid());

-- 4. Role-Specific Profile Policies
CREATE POLICY "Students manage own profile" ON student_profiles FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Institutions and Academicians can view student profiles in their institution" ON student_profiles FOR SELECT USING (
    institution_id IN (
        SELECT institution_id FROM academician_profiles WHERE profile_id = auth.uid()
        UNION
        SELECT institution_id FROM institution_profiles WHERE profile_id = auth.uid()
    )
);

CREATE POLICY "Industry users manage own profile" ON industry_profiles FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Public can view industry profiles" ON industry_profiles FOR SELECT USING (true);

CREATE POLICY "Academicians manage own profile" ON academician_profiles FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Public can view academician profiles" ON academician_profiles FOR SELECT USING (true);

CREATE POLICY "Institutions manage own profile" ON institution_profiles FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Public can view institution profiles" ON institution_profiles FOR SELECT USING (true);

-- 5. Student Skills, Gaps, Scores, Evidence & Passport Policies
CREATE POLICY "Students manage own skills" ON student_skills FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Public/Employers can view verified student skills" ON student_skills FOR SELECT USING (verification_status != 'self_declared' OR student_id = auth.uid());

CREATE POLICY "Students manage own scores" ON skill_scores FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students manage own skill gaps" ON skill_gaps FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students manage own evidence" ON skill_evidence FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students view own verification records" ON verification_records FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students manage own projects" ON projects FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students manage project skills" ON project_skills FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE student_id = auth.uid())
);
CREATE POLICY "Students manage own certifications" ON certifications FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students manage own documents" ON documents FOR ALL USING (owner_id = auth.uid());

-- 6. Assessment Attempts & Progression
CREATE POLICY "Students manage own assessment attempts" ON assessment_attempts FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students manage own assessment answers" ON assessment_answers FOR ALL USING (
    attempt_id IN (SELECT id FROM assessment_attempts WHERE student_id = auth.uid())
);
CREATE POLICY "Students manage own improvement plans" ON improvement_plans FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students manage own improvement activities" ON improvement_activities FOR ALL USING (
    improvement_plan_id IN (SELECT id FROM improvement_plans WHERE student_id = auth.uid())
);
CREATE POLICY "Students view own reassessments" ON reassessments FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students view own progress history" ON progress_history FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Students manage own AI recommendations" ON ai_recommendations FOR ALL USING (student_id = auth.uid());

-- 7. Opportunities & Applications
CREATE POLICY "Industry users manage own opportunities" ON opportunities FOR ALL USING (industry_id = auth.uid());
CREATE POLICY "Industry users manage opportunity skills" ON opportunity_skills FOR ALL USING (
    opportunity_id IN (SELECT id FROM opportunities WHERE industry_id = auth.uid())
);
CREATE POLICY "Industry users manage opportunity eligibility" ON opportunity_eligibility FOR ALL USING (
    opportunity_id IN (SELECT id FROM opportunities WHERE industry_id = auth.uid())
);
CREATE POLICY "Students view own opportunity matches" ON opportunity_matches FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students manage own applications" ON applications FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Industry users view applications for their opportunities" ON applications FOR SELECT USING (
    opportunity_id IN (SELECT id FROM opportunities WHERE industry_id = auth.uid())
);
CREATE POLICY "Industry users update application status" ON applications FOR UPDATE USING (
    opportunity_id IN (SELECT id FROM opportunities WHERE industry_id = auth.uid())
);
CREATE POLICY "Application status history read" ON application_status_history FOR SELECT USING (
    application_id IN (
        SELECT id FROM applications WHERE student_id = auth.uid()
        UNION
        SELECT a.id FROM applications a JOIN opportunities o ON a.opportunity_id = o.id WHERE o.industry_id = auth.uid()
    )
);

-- 8. Academician & Institution Intelligence Policies
CREATE POLICY "Mentorship participants access" ON mentorships FOR ALL USING (student_id = auth.uid() OR academician_id = auth.uid());
CREATE POLICY "Institution workshops access" ON workshops FOR ALL USING (
    academician_id = auth.uid() OR institution_id IN (SELECT institution_id FROM institution_profiles WHERE profile_id = auth.uid())
);
CREATE POLICY "Public read workshops" ON workshops FOR SELECT USING (status != 'cancelled');
CREATE POLICY "Institution users manage interventions" ON interventions FOR ALL USING (
    institution_id IN (SELECT institution_id FROM institution_profiles WHERE profile_id = auth.uid())
);
CREATE POLICY "Institution users manage analytics" ON institution_analytics FOR ALL USING (
    institution_id IN (SELECT institution_id FROM institution_profiles WHERE profile_id = auth.uid())
);
