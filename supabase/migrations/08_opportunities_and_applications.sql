-- Migration 08: Opportunities, Opportunity Skills, Eligibility, Matches, Applications, and Status History

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    opportunity_type VARCHAR(100) NOT NULL DEFAULT 'Internship', -- 'Internship', 'Job', 'Placement', 'Training', 'Workshop', 'Mentorship', 'Faculty Program', 'Industrial Training', 'Consultancy', 'Research Collaboration'
    location VARCHAR(255) NOT NULL DEFAULT 'Remote',
    work_mode work_mode NOT NULL DEFAULT 'hybrid',
    duration VARCHAR(100) DEFAULT '6 Months',
    deadline DATE,
    eligibility_description TEXT,
    target_audience VARCHAR(255) DEFAULT 'Students & Recent Graduates',
    status opportunity_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Opportunity Skills table (Relational requirements with minimum threshold level)
CREATE TABLE IF NOT EXISTS opportunity_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    minimum_level INTEGER NOT NULL CHECK (minimum_level >= 0 AND minimum_level <= 100),
    importance VARCHAR(50) NOT NULL DEFAULT 'Required', -- 'Required', 'Preferred', 'Bonus'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_opportunity_skill UNIQUE (opportunity_id, skill_id)
);

-- Opportunity Eligibility table (Structured eligibility criteria)
CREATE TABLE IF NOT EXISTS opportunity_eligibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    min_education VARCHAR(100) DEFAULT 'B.S. Computer Science',
    graduation_year INTEGER CHECK (graduation_year >= 1990 AND graduation_year <= 2100),
    experience_level VARCHAR(50) DEFAULT 'Student',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    location_requirements VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Opportunity Matches table (Stores calculated match score, explanation, and missing skills)
CREATE TABLE IF NOT EXISTS opportunity_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_percentage INTEGER NOT NULL CHECK (match_percentage >= 0 AND match_percentage <= 100),
    eligibility_status BOOLEAN NOT NULL DEFAULT true,
    skill_match_percentage INTEGER NOT NULL CHECK (skill_match_percentage >= 0 AND skill_match_percentage <= 100),
    explanation TEXT,
    missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_opportunity_student_match UNIQUE (opportunity_id, student_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_status application_status NOT NULL DEFAULT 'applied',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_opportunity_application UNIQUE (student_id, opportunity_id)
);

-- Application Status History table
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status application_status NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
