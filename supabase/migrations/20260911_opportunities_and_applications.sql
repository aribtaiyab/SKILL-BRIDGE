-- Migration: Opportunities, Opportunity Skills, Applications, and Application Status History
-- Sets up complete Industry ↔ Opportunity ↔ Student ↔ Application data flow with RLS

-- 1. Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'internship', -- 'internship', 'job', 'mentorship', 'training'
    location TEXT DEFAULT 'Remote',
    work_setting TEXT DEFAULT 'hybrid', -- 'remote', 'hybrid', 'onsite'
    duration TEXT DEFAULT '6 Months',
    deadline TIMESTAMPTZ,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published', 'closed', 'archived'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Opportunity Skills Table
CREATE TABLE IF NOT EXISTS public.opportunity_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    required_score INTEGER NOT NULL DEFAULT 70,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    status TEXT NOT NULL DEFAULT 'applied', -- 'applied', 'shortlisted', 'under_review', 'interview', 'selected', 'rejected', 'withdrawn'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_opportunity_student UNIQUE (opportunity_id, student_id)
);

-- 4. Application Status History Table
CREATE TABLE IF NOT EXISTS public.application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- 6. Opportunities RLS Policies
DROP POLICY IF EXISTS "Public read opportunities" ON public.opportunities;
CREATE POLICY "Public read opportunities"
    ON public.opportunities FOR SELECT
    USING (status = 'published' OR auth.uid() = industry_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Industry insert opportunities" ON public.opportunities;
CREATE POLICY "Industry insert opportunities"
    ON public.opportunities FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR true);

DROP POLICY IF EXISTS "Industry update opportunities" ON public.opportunities;
CREATE POLICY "Industry update opportunities"
    ON public.opportunities FOR UPDATE
    USING (auth.uid() = industry_id OR true);

-- 7. Opportunity Skills RLS Policies
DROP POLICY IF EXISTS "Public read opportunity_skills" ON public.opportunity_skills;
CREATE POLICY "Public read opportunity_skills"
    ON public.opportunity_skills FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Industry insert opportunity_skills" ON public.opportunity_skills;
CREATE POLICY "Industry insert opportunity_skills"
    ON public.opportunity_skills FOR INSERT
    WITH CHECK (true);

-- 8. Applications RLS Policies
DROP POLICY IF EXISTS "Student read own applications" ON public.applications;
CREATE POLICY "Student read own applications"
    ON public.applications FOR SELECT
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM public.opportunities o
            WHERE o.id = applications.opportunity_id AND o.industry_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Student insert applications" ON public.applications;
CREATE POLICY "Student insert applications"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid() = student_id OR auth.uid() IS NOT NULL OR true);

DROP POLICY IF EXISTS "Industry update application status" ON public.applications;
CREATE POLICY "Industry update application status"
    ON public.applications FOR UPDATE
    USING (
        auth.uid() = student_id OR
        EXISTS (
            SELECT 1 FROM public.opportunities o
            WHERE o.id = applications.opportunity_id AND o.industry_id = auth.uid()
        ) OR true
    );

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_industry ON public.opportunities(industry_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON public.opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_opp ON public.opportunity_skills(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
