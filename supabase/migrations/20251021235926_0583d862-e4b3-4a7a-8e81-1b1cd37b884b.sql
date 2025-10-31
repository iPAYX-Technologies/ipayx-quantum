-- Fix 1: Restrict API keys table to service role only for INSERT
-- This prevents unauthorized public insertion of API keys
DROP POLICY IF EXISTS "Anyone can create api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Authenticated users can create their own api keys" ON public.api_keys;

CREATE POLICY "Only service role can create api keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Fix 2: Add input validation to create_default_org_and_project function
-- This prevents metadata injection and validates company names
CREATE OR REPLACE FUNCTION public.create_default_org_and_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;