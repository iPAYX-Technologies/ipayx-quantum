-- 1. Créer enum pour les scopes API
CREATE TYPE public.api_scope AS ENUM (
  'quotes:read',
  'routes:read', 
  'payments:write',
  'webhooks:read'
);

-- 2. Créer table organizations (SANS policies qui référencent org_members)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Créer table org_members d'abord
CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'finance_read', 'developer')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 4. Maintenant créer les policies organizations qui référencent org_members
CREATE POLICY "Users can view their own organizations"
  ON public.organizations FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their organizations"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

-- 5. Policies org_members
CREATE POLICY "Users can view members in their orgs"
  ON public.org_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Org owners can manage members"
  ON public.org_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND owner_id = auth.uid()
    )
  );

-- 6. Créer table projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their orgs"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = org_id AND (
        o.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.org_members 
          WHERE org_id = o.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Org owners can manage projects"
  ON public.projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND owner_id = auth.uid()
    )
  );

-- 7. Modifier table api_keys pour ajouter project_id et scopes
ALTER TABLE public.api_keys 
  ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN scopes api_scope[] DEFAULT ARRAY['quotes:read']::api_scope[],
  ADD COLUMN is_public BOOLEAN DEFAULT false,
  ADD COLUMN last_rotated_at TIMESTAMPTZ;

UPDATE public.api_keys SET scopes = ARRAY['quotes:read']::api_scope[] WHERE scopes IS NULL;

-- 8. Créer table pour rate limiting
CREATE TABLE public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  endpoint TEXT NOT NULL CHECK (endpoint IN ('quotes', 'execute', 'payments')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_api_usage_logs_key_endpoint_created 
  ON public.api_usage_logs(api_key, endpoint, created_at DESC);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service_role can manage usage logs"
  ON public.api_usage_logs FOR ALL
  USING (auth.role() = 'service_role'::text);

-- 9. Trigger auto-création Org/Project/Keys
CREATE OR REPLACE FUNCTION public.create_default_org_and_project()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  new_project_id UUID;
  server_key TEXT;
  demo_key TEXT;
BEGIN
  server_key := 'ipx_live_' || encode(gen_random_bytes(32), 'hex');
  demo_key := 'ipx_demo_' || encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.organizations (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company', 'My Organization'), 
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.projects (org_id, name)
  VALUES (new_org_id, 'Production')
  RETURNING id INTO new_project_id;
  
  INSERT INTO public.api_keys (
    project_id, email, company, country, plan, key, scopes, is_public
  )
  VALUES (
    new_project_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    'starter',
    server_key,
    ARRAY['quotes:read', 'routes:read']::api_scope[],
    false
  );
  
  INSERT INTO public.api_keys (
    project_id, email, company, country, plan, key, scopes, is_public
  )
  VALUES (
    new_project_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    'demo',
    demo_key,
    ARRAY['quotes:read']::api_scope[],
    true
  );
  
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;

CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_default_org_and_project();

-- 10. Fonction helper pour scopes
CREATE OR REPLACE FUNCTION public.has_api_scope(_api_key TEXT, _scope api_scope)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.api_keys
    WHERE key = _api_key
      AND is_active = true
      AND _scope = ANY(scopes)
  )
$$;

-- 11. Triggers updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();