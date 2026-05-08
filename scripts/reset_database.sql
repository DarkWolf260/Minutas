-- SQL Script to Reset Database Schemas to 0 (Integral Supabase Version)
-- Execute this in the Supabase SQL Editor

-- 0. SETUP SCHEMAS AND PERMISSIONS
CREATE SCHEMA IF NOT EXISTS internal;

-- 1. DROP EXISTING TABLES
DROP TABLE IF EXISTS public.personnel CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.lookups CASCADE;
DROP TABLE IF EXISTS public.configs CASCADE;
DROP TABLE IF EXISTS public.history CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;

-- 2. CREATE TABLES

-- Workspaces Table
CREATE TABLE public.workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    estado TEXT,
    municipio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT FALSE
);

-- Personnel Table
CREATE TABLE public.personnel (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    personnel_id TEXT,
    name TEXT NOT NULL,
    cedula TEXT,
    rank TEXT,
    cargo TEXT,
    titulo TEXT,
    role_id TEXT,
    status TEXT,
    department TEXT,
    sex TEXT,
    specialties TEXT[],
    "order" NUMERIC DEFAULT 0,
    modified TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT FALSE
);

-- Reports Table
CREATE TABLE public.reports (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    title TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    content TEXT NOT NULL,
    is_relevant BOOLEAN DEFAULT FALSE,
    status TEXT,
    form_data JSONB,
    modified TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT FALSE
);

-- Templates Table
CREATE TABLE public.templates (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    statistics_category TEXT,
    statistics_sub_categories JSONB,
    statistics_rules JSONB,
    modified TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT FALSE
);

-- Lookups Table
CREATE TABLE public.lookups (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT,
    data JSONB,
    modified TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT FALSE
);

-- Configs Table
CREATE TABLE public.configs (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT,
    data JSONB NOT NULL,
    modified TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT FALSE
);

-- History Table
CREATE TABLE public.history (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    personnel_id TEXT NOT NULL,
    data JSONB NOT NULL,
    modified TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT FALSE
);

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    allowed_workspaces TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX idx_personnel_workspace ON public.personnel(workspace_id);
CREATE INDEX idx_reports_workspace ON public.reports(workspace_id);
CREATE INDEX idx_templates_workspace ON public.templates(workspace_id);

-- 4. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces, public.personnel, public.reports, public.templates;

-- 5. SECURITY FUNCTIONS (Non-Recursive)

-- Function to check admin status using JWT metadata to avoid recursion on profiles table
CREATE OR REPLACE FUNCTION internal.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We check the JWT metadata first for speed and to avoid recursion
  IF (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback to a direct query on profiles, but only if the user is authenticated
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$;

-- Helper function to check workspace access
CREATE OR REPLACE FUNCTION internal.check_workspace_access(ws_id TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = TRUE OR ws_id = ANY(allowed_workspaces))
    )
  );
END;
$$;

-- 6. RLS POLICIES

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lookups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies
CREATE POLICY "View workspaces" ON public.workspaces FOR SELECT USING (internal.check_workspace_access(id));
CREATE POLICY "Manage workspaces" ON public.workspaces FOR ALL USING (internal.is_admin());

-- Profiles Policies
CREATE POLICY "View own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL USING (internal.is_admin());

-- Generic Data Policies
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY['personnel', 'reports', 'templates', 'lookups', 'configs', 'history'];
BEGIN
    FOR t IN SELECT unnest(tables) LOOP
        EXECUTE format('CREATE POLICY "Workspace isolation" ON public.%I FOR ALL USING (internal.check_workspace_access(workspace_id))', t);
    END LOOP;
END $$;

-- 7. GRANTS (Crucial for fixing "Permission Denied")
GRANT USAGE ON SCHEMA internal TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

GRANT EXECUTE ON FUNCTION internal.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION internal.check_workspace_access(TEXT) TO authenticated, anon;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 8. TRIGGER FOR SYNCING ADMIN STATUS TO AUTH METADATA
CREATE OR REPLACE FUNCTION internal.sync_user_admin_status()
RETURNS TRIGGER AS $$
BEGIN
  -- This updates the auth.users table so internal.is_admin() can use JWT metadata
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('is_admin', NEW.is_admin, 'is_approved', NEW.is_approved)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_sync_auth
  AFTER INSERT OR UPDATE OF is_admin, is_approved ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION internal.sync_user_admin_status();

-- 9. INITIAL PROFILE TRIGGER
CREATE OR REPLACE FUNCTION internal.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin, is_approved)
  VALUES (NEW.id, NEW.email, FALSE, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION internal.handle_new_user();
