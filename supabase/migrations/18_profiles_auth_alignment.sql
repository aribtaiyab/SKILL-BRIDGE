-- Migration 18: Align profiles with the auth/profile contract

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- The signup trigger is defined in 11_triggers.sql and recreated in 13_rls_phase3.sql.
-- This migration intentionally only repairs the profile column for existing projects.