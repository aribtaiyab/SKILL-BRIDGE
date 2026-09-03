-- Migration 13: Phase 3 RLS Additions and Hardening
-- These policies complement the Phase 2 RLS with additional security checks
-- for the Phase 3 auth flows.

-- ─── 1. Handle NEW user profile creation via trigger ─────────────────────────
-- The trigger in 11_triggers.sql handles auto-creating profiles on signup.
-- Ensure the trigger function can insert despite RLS by using SECURITY DEFINER.

-- Re-create the handle_new_user trigger function with SECURITY DEFINER
-- so it can create profiles for new users even when RLS is active.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULL,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Ensure the trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. Application submission security hardening ─────────────────────────────
-- Ensure student_id in applications MUST match auth.uid() — prevents IDOR on INSERT
-- The existing Phase 2 policy covers SELECT/UPDATE, but we add an explicit INSERT check.
DROP POLICY IF EXISTS "Students can insert own applications" ON applications;
CREATE POLICY "Students can insert own applications"
  ON applications
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ─── 3. Application status history INSERT ─────────────────────────────────────
-- Allow both students and industry users to insert status history
-- (students submit → initial status; industry updates → subsequent statuses)
DROP POLICY IF EXISTS "Parties can insert application status history" ON application_status_history;
CREATE POLICY "Parties can insert application status history"
  ON application_status_history
  FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT id FROM applications WHERE student_id = auth.uid()
      UNION
      SELECT a.id FROM applications a
        JOIN opportunities o ON a.opportunity_id = o.id
        WHERE o.industry_id = auth.uid()
    )
  );

-- ─── 4. Profile update must match auth.uid ────────────────────────────────────
-- Ensure profiles can only be updated by their owner (IDOR protection)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── 5. Student profile INSERT (for onboarding upsert) ───────────────────────
DROP POLICY IF EXISTS "Students can create own student profile" ON student_profiles;
CREATE POLICY "Students can create own student profile"
  ON student_profiles
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ─── 6. Industry profile INSERT ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Industry users can create own profile" ON industry_profiles;
CREATE POLICY "Industry users can create own profile"
  ON industry_profiles
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ─── 7. Academician profile INSERT ────────────────────────────────────────────
DROP POLICY IF EXISTS "Academicians can create own profile" ON academician_profiles;
CREATE POLICY "Academicians can create own profile"
  ON academician_profiles
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ─── 8. Institution profile INSERT ────────────────────────────────────────────
DROP POLICY IF EXISTS "Institutions can create own profile" ON institution_profiles;
CREATE POLICY "Institutions can create own profile"
  ON institution_profiles
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ─── 9. Opportunities INSERT — must be own industry_id ───────────────────────
DROP POLICY IF EXISTS "Industry users can create opportunities" ON opportunities;
CREATE POLICY "Industry users can create opportunities"
  ON opportunities
  FOR INSERT
  WITH CHECK (industry_id = auth.uid());

-- ─── 10. Skills are globally readable (needed for skill selection UI) ─────────
DROP POLICY IF EXISTS "Skills are publicly readable" ON skills;
CREATE POLICY "Skills are publicly readable"
  ON skills
  FOR SELECT
  USING (true);

-- ─── 11. Student skills INSERT check ─────────────────────────────────────────
DROP POLICY IF EXISTS "Students can insert own skills" ON student_skills;
CREATE POLICY "Students can insert own skills"
  ON student_skills
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ─── 12. Certifications INSERT check ─────────────────────────────────────────
DROP POLICY IF EXISTS "Students can insert own certifications" ON certifications;
CREATE POLICY "Students can insert own certifications"
  ON certifications
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ─── 13. Projects INSERT check ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can insert own projects" ON projects;
CREATE POLICY "Students can insert own projects"
  ON projects
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- ─── 14. Career targets INSERT check ─────────────────────────────────────────
DROP POLICY IF EXISTS "Students can manage own career targets" ON career_targets;
CREATE POLICY "Students can manage own career targets"
  ON career_targets
  FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
