-- Fix #1: Infinite recursion in org_members RLS policy
-- Create security definer function to break the recursion
CREATE OR REPLACE FUNCTION public.user_org_access(_user_id UUID)
RETURNS TABLE(org_id UUID)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Get orgs where user is a member
  SELECT DISTINCT org_id FROM org_members WHERE user_id = _user_id
  UNION
  -- Get orgs where user is the owner
  SELECT id FROM organizations WHERE owner_id = _user_id;
$$;

-- Drop and recreate the problematic policies
DROP POLICY IF EXISTS "Users can view members in their orgs" ON org_members;
DROP POLICY IF EXISTS "Users can view their own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view projects in their orgs" ON projects;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view members in their orgs"
  ON org_members FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_org_access(auth.uid())));

CREATE POLICY "Users can view their own organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM public.user_org_access(auth.uid())));

CREATE POLICY "Users can view projects in their orgs"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_org_access(auth.uid()) uoa
      WHERE uoa.org_id = projects.org_id
    )
  );

-- Fix #2: Add missing pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the trigger function to include validation
CREATE OR REPLACE FUNCTION public.create_default_org_and_project()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  new_project_id UUID;
  server_key TEXT;
  demo_key TEXT;
  company_name TEXT;
  country_code TEXT;
BEGIN
  -- Generate API keys
  server_key := 'ipx_live_' || encode(gen_random_bytes(32), 'hex');
  demo_key := 'ipx_demo_' || encode(gen_random_bytes(32), 'hex');

  -- Validate and sanitize company name
  company_name := COALESCE(
    TRIM(NEW.raw_user_meta_data->>'company'),
    'My Organization'
  );
  
  -- Enforce length limits (max 100 characters)
  IF LENGTH(company_name) > 100 THEN
    company_name := SUBSTRING(company_name, 1, 100);
  END IF;
  
  -- Remove potentially dangerous characters, keep only alphanumeric, spaces, hyphens, dots
  company_name := REGEXP_REPLACE(company_name, '[^a-zA-Z0-9\s\-\.]', '', 'g');
  
  -- Prevent empty or too short names
  IF LENGTH(TRIM(company_name)) < 2 THEN
    company_name := 'My Organization';
  END IF;

  -- Validate and sanitize country
  country_code := COALESCE(
    TRIM(NEW.raw_user_meta_data->>'country'),
    ''
  );
  
  -- Enforce country code format (2-3 uppercase letters)
  IF country_code !~ '^[A-Z]{2,3}$' THEN
    country_code := '';
  END IF;

  -- Create organization with validated data
  INSERT INTO public.organizations (name, owner_id)
  VALUES (company_name, NEW.id)
  RETURNING id INTO new_org_id;
  
  -- Create default project
  INSERT INTO public.projects (org_id, name)
  VALUES (new_org_id, 'Production')
  RETURNING id INTO new_project_id;
  
  -- Create server API key (live)
  INSERT INTO public.api_keys (
    project_id, email, company, country, plan, key, scopes, is_public
  )
  VALUES (
    new_project_id,
    NEW.email,
    company_name,
    country_code,
    'starter',
    server_key,
    ARRAY['quotes:read', 'routes:read']::api_scope[],
    false
  );
  
  -- Create demo API key (public)
  INSERT INTO public.api_keys (
    project_id, email, company, country, plan, key, scopes, is_public
  )
  VALUES (
    new_project_id,
    NEW.email,
    company_name,
    country_code,
    'demo',
    demo_key,
    ARRAY['quotes:read']::api_scope[],
    true
  );
  
  -- Add user as organization member with owner role
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix #3: Add RLS policies to campaigns table
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view campaigns"
  ON public.campaigns FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only service_role can manage campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service_role can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Only admins can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');