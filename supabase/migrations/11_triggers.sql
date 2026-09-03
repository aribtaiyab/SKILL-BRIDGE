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
