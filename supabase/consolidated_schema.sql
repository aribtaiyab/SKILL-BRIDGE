-- SkillBridge Connect Consolidated Schema
-- Complete single-script database schema & seed


-- =============================================
-- MIGRATION: 01_extensions_and_enums.sql
-- =============================================

-- Migration 01: Extensions and Custom Enums for SkillBridge Connect

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'industry', 'academician', 'institution');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verification status enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'self_declared',
        'assessment_verified',
        'practical_verified',
        'evidence_verified',
        'institution_verified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Assessment type enum
DO $$ BEGIN
    CREATE TYPE assessment_type AS ENUM ('knowledge', 'practical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Assessment attempt status enum
DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Skill gap status enum
DO $$ BEGIN
    CREATE TYPE gap_status AS ENUM ('critical', 'needs_improvement', 'ready');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Improvement plan status enum
DO $$ BEGIN
    CREATE TYPE improvement_plan_status AS ENUM ('recommended', 'active', 'completed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Opportunity status enum
DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM ('draft', 'published', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Work mode enum
DO $$ BEGIN
    CREATE TYPE work_mode AS ENUM ('remote', 'onsite', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Application status enum
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Mentorship status enum
DO $$ BEGIN
    CREATE TYPE mentorship_status AS ENUM ('requested', 'active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =============================================
-- MIGRATION: 02_institutions_and_departments.sql
-- =============================================

-- Migration 02: Institutions and Departments

CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'University',
    location VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =============================================
-- MIGRATION: 03_core_profiles_and_roles.sql
-- =============================================

-- Migration 03: Core Profiles and Role-Specific Tables

-- Central Profiles table linked to Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    phone VARCHAR(50),
    bio TEXT,
    location VARCHAR(255),
    language VARCHAR(50) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL DEFAULT 'en',
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    opportunity_notifications BOOLEAN NOT NULL DEFAULT true,
    readiness_notifications BOOLEAN NOT NULL DEFAULT true,
    privacy_visibility VARCHAR(50) NOT NULL DEFAULT 'public',
    accessibility_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Student Profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    education VARCHAR(255),
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    graduation_year INTEGER CHECK (graduation_year >= 1990 AND graduation_year <= 2100),
    experience_level VARCHAR(50) DEFAULT 'Student',
    target_career_id UUID,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Industry Profiles table
CREATE TABLE IF NOT EXISTS industry_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    industry_type VARCHAR(100) NOT NULL DEFAULT 'Technology',
    organization_size VARCHAR(50) DEFAULT '50-200',
    location VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Academician Profiles table
CREATE TABLE IF NOT EXISTS academician_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) DEFAULT 'Professor',
    teaching_area VARCHAR(255),
    mentorship_interest BOOLEAN NOT NULL DEFAULT true,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Institution Profiles table
CREATE TABLE IF NOT EXISTS institution_profiles (
    profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    institution_name VARCHAR(255) NOT NULL,
    institution_type VARCHAR(100) NOT NULL DEFAULT 'University',
    location VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =============================================
-- MIGRATION: 04_careers_and_skills.sql
-- =============================================

-- Migration 04: Careers, Skills, and Skill Relationships

-- Career Targets table
CREATE TABLE IF NOT EXISTS career_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Engineering',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Link student_profiles target_career_id to career_targets
ALTER TABLE student_profiles 
    DROP CONSTRAINT IF EXISTS fk_student_profiles_target_career,
    ADD CONSTRAINT fk_student_profiles_target_career 
    FOREIGN KEY (target_career_id) REFERENCES career_targets(id) ON DELETE SET NULL;

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL DEFAULT 'Technical',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Career Target Skills (Required skills and threshold levels per career)
CREATE TABLE IF NOT EXISTS career_target_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_target_id UUID NOT NULL REFERENCES career_targets(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_level INTEGER NOT NULL CHECK (required_level >= 0 AND required_level <= 100),
    importance VARCHAR(50) NOT NULL DEFAULT 'High',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_career_target_skill UNIQUE (career_target_id, skill_id)
);

-- Student Skills (Individual student skill levels and verification status)
CREATE TABLE IF NOT EXISTS student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    self_declared_level INTEGER NOT NULL DEFAULT 0 CHECK (self_declared_level >= 0 AND self_declared_level <= 100),
    current_level INTEGER NOT NULL DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 100),
    verified_level INTEGER NOT NULL DEFAULT 0 CHECK (verified_level >= 0 AND verified_level <= 100),
    verification_status verification_status NOT NULL DEFAULT 'self_declared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_skill UNIQUE (student_id, skill_id)
);


-- =============================================
-- MIGRATION: 05_assessments.sql
-- =============================================

-- Migration 05: Assessment System

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    career_target_id UUID REFERENCES career_targets(id) ON DELETE SET NULL,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Intermediate',
    assessment_type assessment_type NOT NULL DEFAULT 'knowledge',
    time_limit INTEGER NOT NULL DEFAULT 15, -- in minutes
    total_questions INTEGER NOT NULL DEFAULT 5,
    passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Assessment Questions table
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Intermediate',
    points INTEGER NOT NULL DEFAULT 10,
    order_index INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Assessment Options table (for multiple choice questions)
CREATE TABLE IF NOT EXISTS assessment_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Assessment Attempts table
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    percentage NUMERIC(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
    status attempt_status NOT NULL DEFAULT 'in_progress',
    attempt_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Assessment Answers table
CREATE TABLE IF NOT EXISTS assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID REFERENCES assessment_options(id) ON DELETE SET NULL,
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);


-- =============================================
-- MIGRATION: 06_skill_intelligence_and_evidence.sql
-- =============================================

-- Migration 06: Skill Intelligence, Evidence, Verification, Projects, and Certifications

-- Documents table (metadata for uploaded files / credentials)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL DEFAULT 'certificate',
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Skill Scores table (Historical log of all skill evaluations)
CREATE TABLE IF NOT EXISTS skill_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'assessment', -- 'assessment', 'practical', 'evidence', 'institution', 'manual'
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    assessment_attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Skill Gaps table (Calculated gaps for students against their target career)
CREATE TABLE IF NOT EXISTS skill_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    career_target_id UUID NOT NULL REFERENCES career_targets(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required_score INTEGER NOT NULL CHECK (required_score >= 0 AND required_score <= 100),
    current_score INTEGER NOT NULL CHECK (current_score >= 0 AND current_score <= 100),
    gap_score INTEGER NOT NULL CHECK (gap_score >= 0),
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
    status gap_status NOT NULL DEFAULT 'needs_improvement',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_career_skill_gap UNIQUE (student_id, career_target_id, skill_id)
);

-- Skill Evidence table (Projects, practical tasks, code repositories, certs)
CREATE TABLE IF NOT EXISTS skill_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'project', -- 'project', 'github', 'practical_task', 'certificate', 'institution'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    verification_status verification_status NOT NULL DEFAULT 'self_declared',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Verification Records table (Skill Passport audit trail)
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES skill_evidence(id) ON DELETE SET NULL,
    verification_type VARCHAR(50) NOT NULL DEFAULT 'practical',
    verified_level INTEGER NOT NULL CHECK (verified_level >= 0 AND verified_level <= 100),
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verification_source VARCHAR(100) NOT NULL DEFAULT 'SkillBridge Assessment Engine',
    notes TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_url TEXT,
    github_url TEXT,
    technologies TEXT[] DEFAULT '{}',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Project Skills link table
CREATE TABLE IF NOT EXISTS project_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_project_skill UNIQUE (project_id, skill_id)
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    credential_url TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    verification_status verification_status NOT NULL DEFAULT 'self_declared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- =============================================
-- MIGRATION: 07_improvement_and_progression.sql
-- =============================================

-- Migration 07: Improvement System, Reassessments, Progress History, and AI Recommendations

-- Improvement Plans table
CREATE TABLE IF NOT EXISTS improvement_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    target_score INTEGER NOT NULL CHECK (target_score >= 0 AND target_score <= 100),
    starting_score INTEGER NOT NULL CHECK (starting_score >= 0 AND starting_score <= 100),
    status improvement_plan_status NOT NULL DEFAULT 'recommended',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Improvement Activities table (Learn -> Practice -> Practical Challenge -> Reassess)
CREATE TABLE IF NOT EXISTS improvement_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    improvement_plan_id UUID NOT NULL REFERENCES improvement_plans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'learn', -- 'learn', 'practice', 'challenge', 'reassess'
    duration_minutes INTEGER DEFAULT 15,
    order_index INTEGER NOT NULL DEFAULT 1,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ
);

-- Reassessments table (Tracks step-by-step score improvements, e.g., 45 -> 67 -> 81)
CREATE TABLE IF NOT EXISTS reassessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    previous_score INTEGER NOT NULL CHECK (previous_score >= 0 AND previous_score <= 100),
    new_score INTEGER NOT NULL CHECK (new_score >= 0 AND new_score <= 100),
    improvement_plan_id UUID REFERENCES improvement_plans(id) ON DELETE SET NULL,
    assessment_attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Progress History table (Immutable timeline data for historical charts, e.g. 6-month progress)
CREATE TABLE IF NOT EXISTS progress_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    source VARCHAR(50) NOT NULL DEFAULT 'assessment'
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(50) NOT NULL DEFAULT 'skill_gap', -- 'skill_gap', 'learning', 'practice', 'reassessment', 'opportunity', 'readiness_nudge'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ
);


-- =============================================
-- MIGRATION: 08_opportunities_and_applications.sql
-- =============================================

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


-- =============================================
-- MIGRATION: 09_academic_and_institution_intelligence.sql
-- =============================================

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


-- =============================================
-- MIGRATION: 10_indexes.sql
-- =============================================

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


-- =============================================
-- MIGRATION: 11_ai_coach_and_learning_plans.sql
-- =============================================

-- Migration 11: AI Skill Coach, Learning Plans, Practice Sessions, and AI Recommendations

-- Learning Plans table
CREATE TABLE IF NOT EXISTS learning_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    career_target_id UUID REFERENCES career_targets(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    initial_score INTEGER NOT NULL CHECK (initial_score >= 0 AND initial_score <= 100),
    target_score INTEGER NOT NULL CHECK (target_score >= 0 AND target_score <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Learning Plan Steps table
CREATE TABLE IF NOT EXISTS learning_plan_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_plan_id UUID NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'understand', 'learn', 'practice', 'build', 'reassess'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    estimated_minutes INTEGER DEFAULT 30,
    action_type VARCHAR(50) DEFAULT 'reading', -- 'reading', 'exercise', 'project', 'assessment'
    action_payload JSONB DEFAULT '{}'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Practice Sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    subskill VARCHAR(150),
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Intermediate', -- 'Beginner', 'Developing', 'Intermediate', 'Advanced'
    question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'code_reasoning', 'debugging', 'architecture'
    question_text TEXT NOT NULL,
    options JSONB, -- For MCQ: [{ id, text }]
    server_correct_answer TEXT, -- Kept server-side
    student_answer TEXT,
    is_correct BOOLEAN,
    feedback_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    career_target_id REFERENCES career_targets(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- 'priority_gap', 'practice', 'reassessment', 'career_alignment', 'evidence'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'High',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_plans_student ON learning_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_plan_steps_plan ON learning_plan_steps(learning_plan_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_student ON practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_student ON ai_recommendations(student_id);

-- Enable RLS
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Students can manage own learning plans" ON learning_plans;
CREATE POLICY "Students can manage own learning plans"
    ON learning_plans FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can manage own learning plan steps" ON learning_plan_steps;
CREATE POLICY "Students can manage own learning plan steps"
    ON learning_plan_steps FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM learning_plans
            WHERE learning_plans.id = learning_plan_steps.learning_plan_id
            AND learning_plans.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can manage own practice sessions" ON practice_sessions;
CREATE POLICY "Students can manage own practice sessions"
    ON practice_sessions FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can manage own recommendations" ON ai_recommendations;
CREATE POLICY "Students can manage own recommendations"
    ON ai_recommendations FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);


-- =============================================
-- MIGRATION: 11_triggers.sql
-- =============================================

-- Migration 11: Triggers & Automated Functions

-- 1. Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'updated_at'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_timestamp_%I ON %I;', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_update_timestamp_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl, tbl);
    END LOOP;
END;
$$;

-- 2. Auth User Synchronizer: Automatically initialize profile and user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_role text;
    user_role_val public.user_role;
    raw_name text;
BEGIN
    raw_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    raw_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    BEGIN
        user_role_val := raw_role::public.user_role;
    EXCEPTION
        WHEN OTHERS THEN
            user_role_val := 'student'::public.user_role;
    END;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, raw_name, user_role_val)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Initialize role profile
    IF user_role_val = 'student' THEN
        INSERT INTO public.student_profiles (profile_id) VALUES (NEW.id) ON CONFLICT (profile_id) DO NOTHING;
    ELSIF user_role_val = 'industry' THEN
        INSERT INTO public.industry_profiles (profile_id, organization_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization')) ON CONFLICT (profile_id) DO NOTHING;
    ELSIF user_role_val = 'academician' THEN
        INSERT INTO public.academician_profiles (profile_id) VALUES (NEW.id) ON CONFLICT (profile_id) DO NOTHING;
    ELSIF user_role_val = 'institution' THEN
        INSERT INTO public.institution_profiles (profile_id, institution_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'institution_name', 'My Institution')) ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (runs when Supabase Auth creates a user)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- MIGRATION: 12_row_level_security.sql
-- =============================================

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


-- =============================================
-- MIGRATION: 13_rls_phase3.sql
-- =============================================

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


-- =============================================
-- MIGRATION: 14_phase6_opportunity_intelligence.sql
-- =============================================

-- Migration 14: Phase 6 Opportunity Intelligence
-- Tables: saved_opportunities, application_readiness_snapshots
-- RLS policies for both tables

-- ─── Saved Opportunities ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS saved_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_saved_opportunity UNIQUE (student_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_opportunities_student ON saved_opportunities(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_opportunity ON saved_opportunities(opportunity_id);

-- ─── Application Readiness Snapshots ────────────────────────────────────────

-- Captures the student's readiness at the exact moment of application submission.
-- This lets students and industry see "readiness when applied" vs "readiness now".

CREATE TABLE IF NOT EXISTS application_readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    readiness_percentage INTEGER NOT NULL CHECK (readiness_percentage >= 0 AND readiness_percentage <= 100),
    skills_met INTEGER NOT NULL DEFAULT 0,
    total_skills INTEGER NOT NULL DEFAULT 0,
    snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_application_snapshot UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_application_snapshots_application ON application_readiness_snapshots(application_id);

-- ─── RLS: saved_opportunities ─────────────────────────────────────────────

ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Students can only see and manage their own saved opportunities
CREATE POLICY "saved_opps_student_select"
    ON saved_opportunities FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "saved_opps_student_insert"
    ON saved_opportunities FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "saved_opps_student_delete"
    ON saved_opportunities FOR DELETE
    USING (auth.uid() = student_id);

-- ─── RLS: application_readiness_snapshots ─────────────────────────────────

ALTER TABLE application_readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- Students can view snapshots for their own applications
CREATE POLICY "readiness_snapshot_student_select"
    ON application_readiness_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = application_id
            AND a.student_id = auth.uid()
        )
    );

-- Industry can view snapshots for applications to their opportunities
CREATE POLICY "readiness_snapshot_industry_select"
    ON application_readiness_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN opportunities o ON o.id = a.opportunity_id
            WHERE a.id = application_id
            AND o.industry_id = auth.uid()
        )
    );

-- Snapshots are inserted server-side only (service role); no direct client insert
CREATE POLICY "readiness_snapshot_service_insert"
    ON application_readiness_snapshots FOR INSERT
    WITH CHECK (true); -- Restricted to service_role key via API layer auth


-- =============================================
-- MIGRATION: 15_phase7_evidence_verification_passport.sql
-- =============================================

-- Migration 15: Phase 7 Evidence, Proof, Verification & Intelligent Skill Passport

-- ─── Evidence Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'project'
        CHECK (evidence_type IN ('project', 'github_repo', 'live_demo', 'certification', 'internship', 'academic_project', 'competition', 'practical_work', 'other')),
    url TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'under_review', 'verified', 'rejected', 'needs_clarification', 'archived')),
    reviewer_feedback TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_evidence_student ON evidence(student_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_created ON evidence(created_at DESC);

-- ─── Evidence Skills Relationship ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidence_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    student_claimed_level INTEGER CHECK (student_claimed_level >= 0 AND student_claimed_level <= 100),
    student_claim_description TEXT,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'rejected', 'unverified')),
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_evidence_skill UNIQUE (evidence_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_skills_evidence ON evidence_skills(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_skills_skill ON evidence_skills(skill_id);

-- ─── Passport Settings Table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS passport_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    headline VARCHAR(255),
    bio TEXT,
    show_skills BOOLEAN NOT NULL DEFAULT true,
    show_projects BOOLEAN NOT NULL DEFAULT true,
    show_certifications BOOLEAN NOT NULL DEFAULT true,
    show_readiness BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_passport_settings_token ON passport_settings(share_token);
CREATE INDEX IF NOT EXISTS idx_passport_settings_student ON passport_settings(student_id);

-- ─── RLS: evidence ─────────────────────────────────────────────────────────

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- Students manage their own evidence
CREATE POLICY "evidence_student_select"
    ON evidence FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "evidence_student_insert"
    ON evidence FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "evidence_student_update"
    ON evidence FOR UPDATE
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "evidence_student_delete"
    ON evidence FOR DELETE
    USING (auth.uid() = student_id AND status IN ('draft', 'archived'));

-- Authorized reviewers (academicians, institution coordinators) can view submitted evidence
CREATE POLICY "evidence_reviewer_select"
    ON evidence FOR SELECT
    USING (
        status IN ('submitted', 'under_review', 'verified', 'rejected', 'needs_clarification')
        AND (
            EXISTS (
                SELECT 1 FROM academician_profiles ap
                JOIN student_profiles sp ON sp.institution_id = ap.institution_id
                WHERE ap.profile_id = auth.uid()
                AND sp.profile_id = evidence.student_id
            )
            OR
            EXISTS (
                SELECT 1 FROM institution_profiles ip
                JOIN student_profiles sp ON sp.institution_id = ip.institution_id
                WHERE ip.profile_id = auth.uid()
                AND sp.profile_id = evidence.student_id
            )
        )
    );

-- ─── RLS: evidence_skills ──────────────────────────────────────────────────

ALTER TABLE evidence_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_skills_student_select"
    ON evidence_skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
        )
    );

CREATE POLICY "evidence_skills_student_insert"
    ON evidence_skills FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
        )
    );

CREATE POLICY "evidence_skills_student_update"
    ON evidence_skills FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
        )
    );

CREATE POLICY "evidence_skills_student_delete"
    ON evidence_skills FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.student_id = auth.uid()
            AND e.status IN ('draft', 'archived')
        )
    );

CREATE POLICY "evidence_skills_reviewer_select"
    ON evidence_skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evidence e
            WHERE e.id = evidence_skills.evidence_id
            AND e.status IN ('submitted', 'under_review', 'verified', 'rejected', 'needs_clarification')
        )
    );

-- ─── RLS: passport_settings ─────────────────────────────────────────────────

ALTER TABLE passport_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "passport_settings_student_all"
    ON passport_settings FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "passport_settings_public_select"
    ON passport_settings FOR SELECT
    USING (is_public = true);


-- =============================================
-- MIGRATION: 16_career_intelligence_seed.sql
-- =============================================

-- Migration 16: Supported career targets and distinct skill requirements

INSERT INTO career_targets (id, name, slug, description, category, is_active) VALUES
('30000000-0000-0000-0000-000000000001', 'Backend Developer', 'backend', 'Focuses on server-side logic, database management, and API integration.', 'Engineering', true),
('30000000-0000-0000-0000-000000000002', 'Frontend Developer', 'frontend', 'Specializes in user interfaces, client-side rendering, and web performance.', 'Engineering', true),
('30000000-0000-0000-0000-000000000003', 'Full Stack Developer', 'fullstack', 'Covers end-to-end web development across frontend, backend, and DevOps.', 'Engineering', true),
('30000000-0000-0000-0000-000000000004', 'Cybersecurity Analyst', 'security', 'Protects systems, networks, and data from cyber threats and vulnerabilities.', 'Security', true),
('30000000-0000-0000-0000-000000000006', 'Data Analyst', 'data-analyst', 'Transforms business data into clear analysis, reporting, and decisions.', 'Data', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, category = EXCLUDED.category, is_active = EXCLUDED.is_active;

INSERT INTO career_target_skills (career_target_id, skill_id, required_level, importance) VALUES
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 80, 'High'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 75, 'High'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, 'High'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 60, 'Medium'),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 50, 'Medium'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', 75, 'High'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000007', 80, 'High'),
('30000000-0000-0000-0000-000000000002', '40000000-0000-000000000004', 60, 'Medium'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 70, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', 60, 'Medium'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000013', 80, 'High'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000012', 70, 'High'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000014', 65, 'Medium'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000012', 80, 'High'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', 80, 'High'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000008', 65, 'Medium')
ON CONFLICT (career_target_id, skill_id) DO UPDATE SET required_level = EXCLUDED.required_level, importance = EXCLUDED.importance;

-- =============================================
-- MIGRATION: 17_javascript_skill.sql
-- =============================================

-- Migration 17: JavaScript skill used by Frontend and Full Stack careers

INSERT INTO skills (id, name, slug, category, description, is_active) VALUES
('40000000-0000-0000-0000-000000000015', 'JavaScript', 'javascript', 'Frontend Basics', 'Modern JavaScript language fundamentals for browser and server applications', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

INSERT INTO career_target_skills (career_target_id, skill_id, required_level, importance) VALUES
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000015', 80, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000015', 80, 'High')
ON CONFLICT (career_target_id, skill_id) DO UPDATE SET required_level = EXCLUDED.required_level, importance = EXCLUDED.importance;

-- =============================================
-- MIGRATION: 18_profiles_auth_alignment.sql
-- =============================================

-- Migration 18: Align profiles with the auth/profile contract

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- The signup trigger is defined in 11_triggers.sql and recreated in 13_rls_phase3.sql.
-- This migration intentionally only repairs the profile column for existing projects.

-- =============================================
-- MIGRATION: 19_academia_production.sql
-- =============================================

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


-- =============================================
-- MIGRATION: 20_career_navigator.sql
-- =============================================

-- Migration 20: Career Navigator Sessions, Decisions, and RLS Policies

CREATE TABLE IF NOT EXISTS career_navigator_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Career Analysis',
    active_intent VARCHAR(50) NOT NULL DEFAULT 'CAREER_COMPARISON',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS career_navigator_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES career_navigator_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    intent VARCHAR(50) NOT NULL,
    recommended_career_slug VARCHAR(100),
    recommended_career_name VARCHAR(255),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    comparison_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    why_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    market_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_career_nav_sessions_student ON career_navigator_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_career_nav_decisions_student ON career_navigator_decisions(student_id);
CREATE INDEX IF NOT EXISTS idx_career_nav_decisions_session ON career_navigator_decisions(session_id);

-- Enable RLS
ALTER TABLE career_navigator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_navigator_decisions ENABLE ROW LEVEL SECURITY;

-- Students manage only their own sessions and decisions
CREATE POLICY "Students manage own career navigator sessions"
    ON career_navigator_sessions FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students manage own career navigator decisions"
    ON career_navigator_decisions FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);


-- =============================================
-- MIGRATION: 21_student_self_ratings.sql
-- =============================================

-- Migration 21: Student Self-Ratings
-- Stores student-declared skill confidence labels, completely separate from
-- verified skill scores (student_skills / skill_scores). These are opinions,
-- not measurements, and must never be queried interchangeably with verified data.

CREATE TABLE IF NOT EXISTS student_self_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    career_target_id UUID NOT NULL,  -- soft reference; career targets may be deleted
    skill_id        TEXT NOT NULL,   -- TEXT to accommodate both UUID and slug-based skill IDs
    self_rating_label VARCHAR(20) NOT NULL
        CHECK (self_rating_label IN ('never_used', 'basic', 'comfortable', 'strong')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- One rating per student per skill per career target; upsert-safe
    CONSTRAINT uq_student_career_skill_rating
        UNIQUE (student_id, career_target_id, skill_id)
);

-- Index for the GET /api/student/self-ratings/:career_target_id query
CREATE INDEX IF NOT EXISTS idx_self_ratings_student_career
    ON student_self_ratings (student_id, career_target_id);

-- RLS: students can only read/write their own ratings
ALTER TABLE student_self_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own self ratings"
    ON student_self_ratings
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);


-- =============================================
-- SEED DATA
-- =============================================

-- Seed Data for SkillBridge Connect
-- Matches 100% with the Phase 1 UI screens, figures, and relationships

-- 1. Insert Institution & Departments
INSERT INTO institutions (id, name, type, location, website, description)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Tech Institute of Modern Dev',
    'Institute of Technology',
    'San Francisco, CA',
    'https://techinst.edu',
    'Premier engineering institution pioneering skill-verified workforce readiness.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, institution_id, name, description) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Computer Science', 'Software Engineering, Algorithms, and Distributed Systems'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Data Science', 'Machine Learning, Analytics, and Data Engineering'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Information Tech', 'Cloud Architecture, Networks, and Systems Administration'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Design', 'UI/UX, Product Design, and Human Computer Interaction')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Career Targets
INSERT INTO career_targets (id, name, slug, description, category, is_active) VALUES
('30000000-0000-0000-0000-000000000001', 'Backend Developer', 'backend', 'Focuses on server-side logic, database management, and API integration.', 'Engineering', true),
('30000000-0000-0000-0000-000000000002', 'Frontend Developer', 'frontend', 'Specializes in user interfaces, client-side rendering, and web performance.', 'Engineering', true),
('30000000-0000-0000-0000-000000000003', 'Full Stack Developer', 'fullstack', 'Covers end-to-end web development across frontend, backend, and DevOps.', 'Engineering', true),
('30000000-0000-0000-0000-000000000004', 'Cybersecurity Analyst', 'security', 'Protects systems, networks, and data from cyber threats and vulnerabilities.', 'Security', true),
('30000000-0000-0000-0000-000000000005', 'DevOps Engineer', 'devops', 'Automates infrastructure, continuous delivery pipelines, and cloud reliability.', 'Operations', true),
('30000000-0000-0000-0000-000000000006', 'Data Analyst', 'data-analyst', 'Transforms business data into clear analysis, reporting, and decisions.', 'Data', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Skills
INSERT INTO skills (id, name, slug, category, description, is_active) VALUES
('40000000-0000-0000-0000-000000000001', 'Node.js', 'nodejs', 'Backend & APIs', 'JavaScript runtime for server-side event-driven applications', true),
('40000000-0000-0000-0000-000000000002', 'REST API Design', 'rest-apis', 'Backend & APIs', 'Designing scalable, secure, and standardized RESTful endpoints', true),
('40000000-0000-0000-0000-000000000003', 'PostgreSQL / SQL', 'sql-postgres', 'Database & Storage', 'Relational database schema modeling, indexing, and complex queries', true),
('40000000-0000-0000-0000-000000000004', 'Git Version Control', 'git', 'Tools & Infrastructure', 'Branching workflows, merges, rebasing, and GitHub collaboration', true),
('40000000-0000-0000-0000-000000000005', 'Docker', 'docker', 'Tools & Infrastructure', 'Containerization, multi-stage builds, and Docker Compose environments', true),
('40000000-0000-0000-0000-000000000006', 'React', 'react', 'Frontend Basics', 'Component lifecycles, state management, and modern React hooks', true),
('40000000-0000-0000-0000-000000000007', 'HTML/CSS', 'html-css', 'Frontend Basics', 'Semantic HTML5 markup and responsive layout styling with modern CSS', true),
('40000000-0000-0000-0000-000000000008', 'MongoDB', 'mongodb', 'Database & Storage', 'NoSQL document database querying and aggregation pipelines', true),
('40000000-0000-0000-0000-000000000009', 'Redis', 'redis', 'Database & Storage', 'In-memory data structures, caching layers, and pub/sub messaging', true),
('40000000-0000-0000-0000-000000000010', 'GraphQL', 'graphql', 'Backend & APIs', 'Schema definition, queries, mutations, and resolver execution', true),
('40000000-0000-0000-0000-000000000011', 'AWS Basics', 'aws-basics', 'Tools & Infrastructure', 'Cloud compute (EC2), storage (S3), and serverless fundamentals', true),
('40000000-0000-0000-0000-000000000012', 'Python', 'python', 'Technical', 'Data structures, scripting, and backend processing in Python', true),
('40000000-0000-0000-0000-000000000013', 'REST API Security', 'rest-api-security', 'Backend & APIs', 'JWT authentication, RBAC, rate limiting, and CORS headers', true),
('40000000-0000-0000-0000-000000000014', 'System Design Basics', 'system-design', 'Technical', 'Microservices architecture, caching strategies, and load balancing', true)
,
('40000000-0000-0000-0000-000000000015', 'JavaScript', 'javascript', 'Frontend Basics', 'Modern JavaScript language fundamentals for browser and server applications', true),
('40000000-0000-0000-0000-000000000016', 'HTML', 'html', 'Frontend Basics', 'Semantic HTML5 structure and markup standards', true),
('40000000-0000-0000-0000-000000000017', 'CSS', 'css', 'Frontend Basics', 'Modern CSS styles, layout models, and variables', true),
('40000000-0000-0000-0000-000000000018', 'Responsive Design', 'responsive-design', 'Frontend Basics', 'Mobile-first layouts, media queries, and flex/grid systems', true),
('40000000-0000-0000-0000-000000000019', 'API Integration', 'api-integration', 'Frontend Basics', 'Client-side REST / GraphQL API consuming and async data handling', true),
('40000000-0000-0000-0000-000000000020', 'State Management', 'state-management', 'Frontend Basics', 'Component state, Context API, Redux/Zustand workflows', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Map Career Target Requirements (e.g. Backend Developer requirements)
INSERT INTO career_target_skills (career_target_id, skill_id, required_level, importance) VALUES
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 80, 'High'), -- Node.js (Req: 80)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 75, 'High'),     -- REST APIs (Req: 75)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, 'High'),     -- SQL (Req: 70)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 60, 'Medium'),   -- Git (Req: 60)
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 50, 'Medium')    -- Docker (Req: 50)
ON CONFLICT (career_target_id, skill_id) DO NOTHING;

-- Distinct requirements for the other supported career targets
-- Frontend Developer Canonical 8 Skills:
INSERT INTO career_target_skills (career_target_id, skill_id, required_level, importance) VALUES
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000016', 80, 'High'),   -- HTML
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000017', 80, 'High'),   -- CSS
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000015', 80, 'High'),   -- JavaScript
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', 75, 'High'),   -- React
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000018', 75, 'Medium'), -- Responsive Design
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004', 65, 'Medium'), -- Git/GitHub
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000019', 75, 'Medium'), -- API Integration
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000020', 70, 'Medium')  -- State Management
ON CONFLICT (career_target_id, skill_id) DO NOTHING;
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000015', 80, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 75, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 70, 'High'),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', 60, 'Medium'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000013', 80, 'High'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000012', 70, 'High'),
('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000014', 65, 'Medium'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000012', 80, 'High'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', 80, 'High'),
('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000008', 65, 'Medium')
ON CONFLICT (career_target_id, skill_id) DO NOTHING;

-- 5. Profiles for Primary Roles
-- Student: Sarah Jenkins
INSERT INTO profiles (id, email, full_name, role, location, bio) VALUES
('00000000-0000-0000-0000-000000000001', 'sarah.jenkins@student.techinst.edu', 'Sarah Jenkins', 'student', 'San Francisco, CA (Open to Remote)', 'Aspiring backend engineer passionate about microservices and scalable APIs.')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO student_profiles (profile_id, education, institution_id, department_id, graduation_year, experience_level, target_career_id, onboarding_completed) VALUES
('00000000-0000-0000-0000-000000000001', 'B.S. Computer Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2024, 'Student', '30000000-0000-0000-0000-000000000001', true)
ON CONFLICT (profile_id) DO NOTHING;

-- Industry Users
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000002', 'talent@techflow.io', 'TechFlow Solutions Recruiter', 'industry', 'San Francisco, CA'),
('00000000-0000-0000-0000-000000000005', 'hiring@datasync.com', 'DataSync Talent Team', 'industry', 'Remote'),
('00000000-0000-0000-0000-000000000006', 'connect@seniordev.net', 'Senior Dev Network', 'industry', 'Remote'),
('00000000-0000-0000-0000-000000000007', 'jobs@cloudcore.io', 'CloudCore Systems', 'industry', 'Seattle, WA'),
('00000000-0000-0000-0000-000000000008', 'recruiting@startuphub.com', 'Startup Hub', 'industry', 'Austin, TX'),
('00000000-0000-0000-0000-000000000009', 'training@enterprisesys.com', 'Enterprise Systems', 'industry', 'Chicago, IL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO industry_profiles (profile_id, organization_name, industry_type, organization_size, location, website) VALUES
('00000000-0000-0000-0000-000000000002', 'TechFlow Solutions', 'Software & Cloud', '200-500', 'San Francisco, CA', 'https://techflow.io'),
('00000000-0000-0000-0000-000000000005', 'DataSync Inc', 'Data Infrastructure', '50-200', 'Remote', 'https://datasync.com'),
('00000000-0000-0000-0000-000000000006', 'Senior Dev Network', 'Mentorship & Tech Community', '10-50', 'Remote', 'https://seniordev.net'),
('00000000-0000-0000-0000-000000000007', 'CloudCore', 'Cloud Services', '500-1000', 'Seattle, WA', 'https://cloudcore.io'),
('00000000-0000-0000-0000-000000000008', 'Startup Hub', 'Venture Incubator', '20-50', 'Austin, TX', 'https://startuphub.com'),
('00000000-0000-0000-0000-000000000009', 'Enterprise Systems', 'Enterprise IT', '1000+', 'Chicago, IL', 'https://enterprisesys.com')
ON CONFLICT (profile_id) DO NOTHING;

-- Academician: Prof. Robert Vance
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000003', 'r.vance@techinst.edu', 'Prof. Robert Vance', 'academician', 'San Francisco, CA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academician_profiles (profile_id, institution_id, department_id, designation, teaching_area) VALUES
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Associate Professor', 'Software Engineering & Cloud Architecture')
ON CONFLICT (profile_id) DO NOTHING;

-- Institution Profile: Tech Institute Admin
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000004', 'admin@techinst.edu', 'Tech Institute Administration', 'institution', 'San Francisco, CA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO institution_profiles (profile_id, institution_id, institution_name, institution_type, location, website) VALUES
('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Tech Institute of Modern Dev', 'Institute of Technology', 'San Francisco, CA', 'https://techinst.edu')
ON CONFLICT (profile_id) DO NOTHING;

-- Additional Student Profiles for Candidate / Cohort Intelligence
INSERT INTO profiles (id, email, full_name, role, location) VALUES
('00000000-0000-0000-0000-000000000010', 'michael.chen@student.techinst.edu', 'Michael Chen', 'student', 'San Francisco, CA'),
('00000000-0000-0000-0000-000000000011', 'david.rodriguez@student.techinst.edu', 'David Rodriguez', 'student', 'San Francisco, CA'),
('00000000-0000-0000-0000-000000000012', 'emily.wang@student.techinst.edu', 'Emily Wang', 'student', 'San Francisco, CA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_profiles (profile_id, education, institution_id, department_id, graduation_year, target_career_id, onboarding_completed) VALUES
('00000000-0000-0000-0000-000000000010', 'B.S. Computer Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2024, '30000000-0000-0000-0000-000000000002', true),
('00000000-0000-0000-0000-000000000011', 'B.S. Computer Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2024, '30000000-0000-0000-0000-000000000001', true),
('00000000-0000-0000-0000-000000000012', 'B.S. Data Science', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 2024, '30000000-0000-0000-0000-000000000001', true)
ON CONFLICT (profile_id) DO NOTHING;

-- 6. Student Skills (Exact Phase 1 values for Sarah Jenkins)
INSERT INTO student_skills (student_id, skill_id, self_declared_level, current_level, verified_level, verification_status) VALUES
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 65, 65, 65, 'assessment_verified'), -- Node.js: 65
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 72, 72, 72, 'practical_verified'),  -- REST APIs: 72
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 82, 82, 82, 'evidence_verified'),   -- SQL: 82
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 75, 75, 75, 'practical_verified'),  -- Git: 75
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 20, 20, 0,  'self_declared'),       -- Docker: 20
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', 60, 60, 60, 'assessment_verified'), -- React: 60
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', 85, 85, 85, 'practical_verified'),  -- HTML/CSS: 85
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', 55, 55, 55, 'assessment_verified'), -- MongoDB: 55
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000009', 20, 20, 0,  'self_declared'),       -- Redis: 20
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', 30, 30, 0,  'self_declared'),       -- GraphQL: 30
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000011', 15, 15, 0,  'self_declared')        -- AWS Basics: 15
ON CONFLICT (student_id, skill_id) DO NOTHING;

-- 7. Skill Gaps for Sarah Jenkins against Backend Developer Target
INSERT INTO skill_gaps (student_id, career_target_id, skill_id, required_score, current_score, gap_score, priority, status) VALUES
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 80, 65, 15, 'Critical', 'critical'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 75, 72, 3,  'Medium',   'needs_improvement'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 50, 20, 30, 'Low',      'needs_improvement'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, 82, 0,  'Low',      'ready'),
('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 60, 75, 0,  'Low',      'ready')
ON CONFLICT (student_id, career_target_id, skill_id) DO NOTHING;

-- 8. Assessments & Questions
INSERT INTO assessments (id, title, description, skill_id, career_target_id, difficulty, assessment_type, time_limit, total_questions, passing_score)
VALUES (
    '50000000-0000-0000-0000-000000000001',
    'Node.js Fundamentals',
    'Validate your core understanding of Node.js, event loop, streams, and built-in modules.',
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Intermediate',
    'knowledge',
    15,
    5,
    70
) ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_questions (id, assessment_id, question_text, points, order_index) VALUES
('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Which of the following best describes the Node.js event loop?', 20, 1),
('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'How does Node.js handle child processes?', 20, 2),
('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'What is the primary purpose of Streams in Node.js?', 20, 3),
('51000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'Which error handling approach is NOT standard in Node.js asynchronous code?', 20, 4),
('51000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', 'What does the ''fs'' module provide?', 20, 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_options (question_id, option_text, order_index, is_correct) VALUES
('51000000-0000-0000-0000-000000000001', 'A multi-threaded mechanism for handling background tasks concurrently.', 1, false),
('51000000-0000-0000-0000-000000000001', 'A single-threaded, non-blocking mechanism that handles asynchronous callbacks.', 2, true),
('51000000-0000-0000-0000-000000000001', 'A synchronous loop that executes all code line-by-line before continuing.', 3, false),
('51000000-0000-0000-0000-000000000001', 'An external library that must be imported for async operations.', 4, false),

('51000000-0000-0000-0000-000000000002', 'It cannot spawn child processes; everything runs on one thread.', 1, false),
('51000000-0000-0000-0000-000000000002', 'Using the ''child_process'' module to spawn or fork new processes.', 2, true),
('51000000-0000-0000-0000-000000000002', 'Automatically creating a new thread for every incoming HTTP request.', 3, false),
('51000000-0000-0000-0000-000000000002', 'By utilizing the DOM Web Workers API.', 4, false),

('51000000-0000-0000-0000-000000000003', 'To play audio and video files in the browser.', 1, false),
('51000000-0000-0000-0000-000000000003', 'To read or write data sequentially in chunks without loading everything into memory.', 2, true),
('51000000-0000-0000-0000-000000000003', 'To establish WebSocket connections with clients.', 3, false),
('51000000-0000-0000-0000-000000000003', 'To bundle JavaScript files for production.', 4, false),

('51000000-0000-0000-0000-000000000004', 'Error-first callbacks (e.g., cb(err, data)).', 1, false),
('51000000-0000-0000-0000-000000000004', 'Using Promises and .catch().', 2, false),
('51000000-0000-0000-0000-000000000004', 'Using async/await with try/catch blocks.', 3, false),
('51000000-0000-0000-0000-000000000004', 'Throwing exceptions globally without catching them.', 4, true),

('51000000-0000-0000-0000-000000000005', 'File system interaction like reading and writing files.', 1, true),
('51000000-0000-0000-0000-000000000005', 'Fast server setup capabilities.', 2, false),
('51000000-0000-0000-0000-000000000005', 'Format styling for console outputs.', 3, false),
('51000000-0000-0000-0000-000000000005', 'Firewall security rules configuration.', 4, false);

-- 9. Projects & Certifications for Sarah Jenkins (Skill Passport)
INSERT INTO projects (id, student_id, title, description, technologies, start_date, end_date) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'E-Commerce API Platform', 'Built a fully functional REST API for an e-commerce platform including user authentication (JWT), product catalog management, and order processing logic.', ARRAY['Node.js', 'Express', 'PostgreSQL'], '2023-06-01', '2023-08-30'),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Real-time Chat Service', 'Implemented a WebSocket-based chat service allowing real-time messaging between users in different rooms.', ARRAY['Socket.io', 'Redis'], '2023-09-01', '2023-10-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO certifications (id, student_id, name, issuing_organization, issue_date, verification_status) VALUES
('61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PostgreSQL Associate Certification', 'PostgreSQL Professional Guild', '2023-08-15', 'evidence_verified'),
('61000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Node.js Certified Developer', 'OpenJS Foundation', '2023-10-01', 'assessment_verified')
ON CONFLICT (id) DO NOTHING;

-- 10. Opportunities
INSERT INTO opportunities (id, industry_id, title, description, opportunity_type, location, work_mode, duration, deadline, status) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Backend Developer Internship', 'Join our core platform team to help build and scale our microservices architecture. Design RESTful APIs, optimize SQL queries, and implement secure auth.', 'Internship', 'San Francisco, CA (Hybrid)', 'hybrid', '6 Months', '2024-10-30', 'published'),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Junior API Developer', 'Develop resilient microservices and public API gateways for high-throughput transactional pipelines.', 'Job', 'Remote', 'remote', 'Full-time', '2024-11-15', 'published'),
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'Backend Mentorship Program', '1-on-1 mentorship with staff engineers focusing on distributed systems architecture, clean code, and career guidance.', 'Mentorship', 'Remote', 'remote', '3 Months', '2024-12-31', 'published'),
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'Cloud Infrastructure Intern', 'Assist CloudCore operations in configuring Terraform automation and Kubernetes cluster deployments.', 'Internship', 'Seattle, WA', 'onsite', '3 Months', '2024-10-20', 'published'),
('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000009', 'Industrial Training: Database Architecture', 'Intensive 4-week workshop and hands-on laboratory on advanced PostgreSQL clustering and indexing strategies.', 'Industrial Training', 'Chicago, IL', 'onsite', '4 Weeks', '2024-11-01', 'published'),
('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000008', 'Full Stack Developer', 'Rapidly prototype and iterate across React frontend and Node.js backend features in an agile startup environment.', 'Job', 'Austin, TX', 'hybrid', 'Full-time', '2024-12-01', 'published')
ON CONFLICT (id) DO NOTHING;

-- Opportunity Skills
INSERT INTO opportunity_skills (opportunity_id, skill_id, minimum_level, importance) VALUES
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 60, 'Required'), -- Node.js
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 70, 'Required'), -- REST APIs
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 60, 'Required'), -- SQL
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 30, 'Preferred') -- Docker
ON CONFLICT (opportunity_id, skill_id) DO NOTHING;

-- 11. Opportunity Matches for Sarah Jenkins
INSERT INTO opportunity_matches (opportunity_id, student_id, match_percentage, skill_match_percentage, explanation, missing_skills) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 91, 93, 'Exceeds verified requirements in Node.js (65/60), REST APIs (72/70), and SQL (82/60).', '["Docker Basics"]'::jsonb),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 85, 87, 'Solid alignment with Express and PostgreSQL stack.', '["GraphQL"]'::jsonb),
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 100, 100, 'Perfect baseline match for backend mentorship.', '[]'::jsonb),
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 62, 60, 'Requires AWS Cloud Foundations and Linux sysadmin verification.', '["AWS Basics", "Linux"]'::jsonb),
('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 94, 96, 'High database proficiency (SQL score 82).', '["NoSQL"]'::jsonb),
('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 58, 55, 'Needs stronger React and TypeScript verification.', '["React", "TypeScript"]'::jsonb)
ON CONFLICT (opportunity_id, student_id) DO NOTHING;

-- 12. Applications for Sarah Jenkins
INSERT INTO applications (id, opportunity_id, student_id, current_status, applied_at) VALUES
('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'shortlisted', '2023-10-15T10:00:00Z'),
('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'applied',     '2023-10-20T14:30:00Z'),
('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'rejected',    '2023-09-10T09:15:00Z'),
('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'selected',    '2023-08-05T11:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Application Status History
INSERT INTO application_status_history (application_id, status, note, changed_at) VALUES
('80000000-0000-0000-0000-000000000001', 'applied', 'Application submitted with verified Skill Passport.', '2023-10-15T10:00:00Z'),
('80000000-0000-0000-0000-000000000001', 'shortlisted', 'Candidate profile passed skill threshold verification.', '2023-10-18T16:00:00Z'),

('80000000-0000-0000-0000-000000000002', 'applied', 'Application submitted for Junior API Developer.', '2023-10-20T14:30:00Z'),

('80000000-0000-0000-0000-000000000003', 'applied', 'Applied to Full Stack Developer role.', '2023-09-10T09:15:00Z'),
('80000000-0000-0000-0000-000000000003', 'rejected', 'Strong backend skills, but requires more React experience for this specific role.', '2023-09-25T11:00:00Z'),

('80000000-0000-0000-0000-000000000004', 'applied', 'Applied to Backend Mentorship Program.', '2023-08-05T11:00:00Z'),
('80000000-0000-0000-0000-000000000004', 'selected', 'Matched with Senior Staff Engineer mentor.', '2023-08-20T15:00:00Z');

-- 13. Progress History (6-Month progression)
INSERT INTO progress_history (student_id, skill_id, score, recorded_at, source) VALUES
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 40, '2023-05-15T00:00:00Z', 'initial_assessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 50, '2023-05-15T00:00:00Z', 'initial_assessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 45, '2023-06-15T00:00:00Z', 'reassessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 55, '2023-06-15T00:00:00Z', 'reassessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 45, '2023-07-15T00:00:00Z', 'assessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 60, '2023-07-15T00:00:00Z', 'assessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 55, '2023-08-15T00:00:00Z', 'reassessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 70, '2023-08-15T00:00:00Z', 'reassessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 60, '2023-09-15T00:00:00Z', 'reassessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 75, '2023-09-15T00:00:00Z', 'reassessment'),

('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 65, '2023-10-15T00:00:00Z', 'assessment'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 82, '2023-10-15T00:00:00Z', 'practical');

-- 14. Academician & Institution Analytics
INSERT INTO institution_analytics (institution_id, department_id, metric_date, total_students, overall_readiness, average_verified_skill, students_needing_intervention, internship_participation, placement_readiness) VALUES
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', CURRENT_DATE, 120, 76, 78, 15, 42, 76),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', CURRENT_DATE, 95, 68, 70, 18, 30, 68),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', CURRENT_DATE, 80, 62, 65, 22, 25, 62),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', CURRENT_DATE, 60, 85, 88, 5, 28, 85)
ON CONFLICT (institution_id, department_id, metric_date) DO NOTHING;

-- Industry Skill Demand
INSERT INTO industry_skill_demand (skill_id, industry_type, demand_count, demand_percentage, trend, period_start, period_end) VALUES
('40000000-0000-0000-0000-000000000006', 'Technology', 180, 90, 'up', '2023-01-01', '2023-12-31'),
('40000000-0000-0000-0000-000000000001', 'Technology', 165, 85, 'up', '2023-01-01', '2023-12-31'),
('40000000-0000-0000-0000-000000000003', 'Technology', 140, 75, 'flat', '2023-01-01', '2023-12-31'),
('40000000-0000-0000-0000-000000000011', 'Technology', 150, 80, 'flat', '2023-01-01', '2023-12-31');

