-- Migration 19: Academia Production Tables and RLS Policies

-- 1. Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'general', -- 'mentorship', 'workshop', 'intervention', 'reassessment', 'opportunity', 'general'
    link VARCHAR(255),
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 2. Create workshop_participants table
CREATE TABLE IF NOT EXISTS workshop_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'enrolled', -- 'enrolled', 'attended', 'completed', 'cancelled'
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    attended_at TIMESTAMPTZ,
    CONSTRAINT uq_workshop_student UNIQUE (workshop_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop ON workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_student ON workshop_participants(student_id);

-- 3. Create intervention_students table
CREATE TABLE IF NOT EXISTS intervention_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pre_score INTEGER NOT NULL DEFAULT 0,
    post_score INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'reassessed', 'completed'
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reassessed_at TIMESTAMPTZ,
    CONSTRAINT uq_intervention_student UNIQUE (intervention_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_intervention_students_intervention ON intervention_students(intervention_id);
CREATE INDEX IF NOT EXISTS idx_intervention_students_student ON intervention_students(student_id);

-- 4. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_students ENABLE ROW LEVEL SECURITY;

-- 5. Notifications RLS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
    DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Workshop Participants RLS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Students view own enrollments" ON workshop_participants;
    DROP POLICY IF EXISTS "Students enroll in workshops" ON workshop_participants;
    DROP POLICY IF EXISTS "Academicians view workshop participants" ON workshop_participants;
    DROP POLICY IF EXISTS "Academicians manage workshop participants" ON workshop_participants;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Students view own enrollments" ON workshop_participants FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students enroll in workshops" ON workshop_participants FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Academicians view workshop participants" ON workshop_participants FOR SELECT USING (
    workshop_id IN (SELECT id FROM workshops WHERE academician_id = auth.uid())
);
CREATE POLICY "Academicians manage workshop participants" ON workshop_participants FOR ALL USING (
    workshop_id IN (SELECT id FROM workshops WHERE academician_id = auth.uid())
);

-- 7. Intervention Students RLS
DO $$ BEGIN
    DROP POLICY IF EXISTS "Students view own intervention status" ON intervention_students;
    DROP POLICY IF EXISTS "Academicians view intervention students" ON intervention_students;
    DROP POLICY IF EXISTS "Academicians manage intervention students" ON intervention_students;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Students view own intervention status" ON intervention_students FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Academicians view intervention students" ON intervention_students FOR SELECT USING (
    intervention_id IN (SELECT id FROM interventions WHERE institution_id IN (SELECT institution_id FROM academician_profiles WHERE profile_id = auth.uid()))
);
CREATE POLICY "Academicians manage intervention students" ON intervention_students FOR ALL USING (
    intervention_id IN (SELECT id FROM interventions WHERE institution_id IN (SELECT institution_id FROM academician_profiles WHERE profile_id = auth.uid()))
);

-- 8. Enhanced Academician access to workshops & interventions
DO $$ BEGIN
    DROP POLICY IF EXISTS "Academicians manage own workshops" ON workshops;
    DROP POLICY IF EXISTS "Academicians manage institution interventions" ON interventions;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Academicians manage own workshops" ON workshops FOR ALL USING (
    academician_id = auth.uid() OR
    institution_id IN (SELECT institution_id FROM academician_profiles WHERE profile_id = auth.uid())
);

CREATE POLICY "Academicians manage institution interventions" ON interventions FOR ALL USING (
    institution_id IN (SELECT institution_id FROM academician_profiles WHERE profile_id = auth.uid())
);
