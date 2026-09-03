-- Migration 09: Academic & Institutional Intelligence

-- Mentorships table
CREATE TABLE IF NOT EXISTS mentorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    academician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    status mentorship_status NOT NULL DEFAULT 'requested',
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Workshops table
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL,
    duration VARCHAR(50) DEFAULT '2 Hours',
    capacity INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Interventions table (Institutional actions targeting skill gaps)
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    intervention_type VARCHAR(100) NOT NULL DEFAULT 'workshop', -- 'workshop', 'mentorship', 'training', 'assessment', 'industry_program'
    target_students INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- 'planned', 'in_progress', 'completed'
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Institution Analytics table (Time-series / snapshot storage for institutional dashboards)
CREATE TABLE IF NOT EXISTS institution_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_students INTEGER NOT NULL DEFAULT 0,
    overall_readiness INTEGER NOT NULL DEFAULT 0 CHECK (overall_readiness >= 0 AND overall_readiness <= 100),
    average_verified_skill INTEGER NOT NULL DEFAULT 0 CHECK (average_verified_skill >= 0 AND average_verified_skill <= 100),
    students_needing_intervention INTEGER NOT NULL DEFAULT 0,
    internship_participation INTEGER NOT NULL DEFAULT 0,
    placement_readiness INTEGER NOT NULL DEFAULT 0 CHECK (placement_readiness >= 0 AND placement_readiness <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_institution_dept_date UNIQUE (institution_id, department_id, metric_date)
);

-- Industry Skill Demand table (Aggregated real-world hiring trends)
CREATE TABLE IF NOT EXISTS industry_skill_demand (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    industry_type VARCHAR(100) NOT NULL DEFAULT 'Technology',
    demand_count INTEGER NOT NULL DEFAULT 0,
    demand_percentage INTEGER NOT NULL DEFAULT 0 CHECK (demand_percentage >= 0 AND demand_percentage <= 100),
    trend VARCHAR(20) NOT NULL DEFAULT 'up', -- 'up', 'flat', 'down'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
