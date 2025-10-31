-- Améliorer le trigger de création d'organisation avec meilleur error handling
-- Remplacer la fonction existante avec logging et validation améliorée

CREATE OR REPLACE FUNCTION public.create_default_org_and_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  new_project_id UUID;
  server_key TEXT;
  demo_key TEXT;
  company_name TEXT;
  country_code TEXT;
BEGIN
  -- Logging du début
  RAISE NOTICE 'Creating default org for user: % (%)', NEW.email, NEW.id;
  
  -- Generate API keys
  server_key := 'ipx_live_' || encode(gen_random_bytes(32), 'hex');
  demo_key := 'ipx_demo_' || encode(gen_random_bytes(32), 'hex');

  -- Validate and sanitize company name
  company_name := COALESCE(
    TRIM(NEW.raw_user_meta_data->>'company'),
    'My Organization'
  );
  
  RAISE NOTICE 'Company name from metadata: %', company_name;
  
  -- Enforce length limits (max 100 characters)
  IF LENGTH(company_name) > 100 THEN
    company_name := SUBSTRING(company_name, 1, 100);
    RAISE NOTICE 'Company name truncated to 100 chars';
  END IF;
  
  -- Remove potentially dangerous characters, keep only alphanumeric, spaces, hyphens, dots
  company_name := REGEXP_REPLACE(company_name, '[^a-zA-Z0-9\s\-\.]', '', 'g');
  
  -- Prevent empty or too short names
  IF LENGTH(TRIM(company_name)) < 2 THEN
    company_name := 'My Organization';
    RAISE NOTICE 'Company name too short, using default';
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
  BEGIN
    INSERT INTO public.organizations (name, owner_id)
    VALUES (company_name, NEW.id)
    RETURNING id INTO new_org_id;
    
    RAISE NOTICE 'Created organization: % (%)', company_name, new_org_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create organization: %', SQLERRM;
    RETURN NEW; -- Don't block signup
  END;
  
  -- Create default project
  BEGIN
    INSERT INTO public.projects (org_id, name)
    VALUES (new_org_id, 'Production')
    RETURNING id INTO new_project_id;
    
    RAISE NOTICE 'Created project: Production (%)', new_project_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create project: %', SQLERRM;
    RETURN NEW; -- Don't block signup
  END;
  
  -- Create server API key (live)
  BEGIN
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
    
    RAISE NOTICE 'Created server API key for project %', new_project_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create server API key: %', SQLERRM;
    RETURN NEW; -- Don't block signup
  END;
  
  -- Create demo API key (public)
  BEGIN
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
    
    RAISE NOTICE 'Created demo API key for project %', new_project_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create demo API key: %', SQLERRM;
    RETURN NEW; -- Don't block signup
  END;
  
  -- Add user as organization member with owner role
  BEGIN
    INSERT INTO public.org_members (org_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
    
    RAISE NOTICE 'Added user as org owner';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to add user as org member: %', SQLERRM;
    RETURN NEW; -- Don't block signup
  END;
  
  RAISE NOTICE 'Successfully completed default org setup for user %', NEW.email;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Catch-all error handler - log but don't block signup
  RAISE WARNING 'Unexpected error in create_default_org_and_project for user % (%): %', 
    NEW.email, NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;