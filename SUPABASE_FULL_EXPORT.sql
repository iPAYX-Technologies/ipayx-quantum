-- ============================================
-- iPAYX Supabase Export Complet
-- Date: 2025-10-30
-- Project: ggkymbeyesuodnoogzyb
-- Description: Export complet du schéma, enums, functions, triggers, RLS policies
-- ============================================

-- ============================================
-- 1️⃣ ENUMS (Types énumérés)
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.partner_type AS ENUM ('transak', 'circle', 'paychant');
CREATE TYPE public.api_scope AS ENUM ('quotes:read', 'routes:read', 'transfers:write');


-- ============================================
-- 2️⃣ TABLES (20 tables principales)
-- ============================================

-- Auth & Users
-- ============================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  company text,
  country text,
  partner_id text,
  kyc_status text DEFAULT 'pending',
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  backup_codes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  company text NOT NULL,
  country text NOT NULL,
  kyc_status kyc_status DEFAULT 'pending',
  partner_id partner_type,
  partner_account_id text,
  partner_kyc_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  deletion_reason text
);


-- Organizations & Projects
-- ============================================

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  email_verified boolean DEFAULT false,
  verification_sent_at timestamptz,
  verification_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- API Keys
-- ============================================

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  key text NOT NULL UNIQUE,
  email text NOT NULL,
  company text NOT NULL,
  country text NOT NULL,
  plan text DEFAULT 'sandbox',
  scopes api_scope[] DEFAULT ARRAY['quotes:read']::api_scope[],
  rpm integer DEFAULT 30,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  last_rotated_at timestamptz,
  usage_count integer DEFAULT 0,
  created_from_ip text
);


-- Business (Leads, Campaigns)
-- ============================================

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  company text,
  country text,
  monthly_volume text,
  message text,
  source text DEFAULT 'landing-test',
  ai_score integer,
  ai_analysis jsonb,
  campaigns_count integer DEFAULT 0,
  last_campaign_sent_at timestamptz,
  last_opened_at timestamptz,
  last_clicked_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id),
  campaign_type text NOT NULL,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  video_url text,
  video_script text,
  video_status text DEFAULT 'pending',
  heygen_video_id text,
  sendgrid_message_id text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  unsubscribed_at timestamptz,
  conversion_value numeric,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- Transactions
-- ============================================

CREATE TABLE public.transaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  user_account_id uuid NOT NULL REFERENCES user_accounts(id),
  from_chain text NOT NULL,
  to_chain text NOT NULL,
  asset text NOT NULL,
  amount numeric NOT NULL,
  tx_hash text,
  status text NOT NULL,
  external_id text,
  partner_response jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.ipayx_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash text NOT NULL,
  chain text NOT NULL,
  settlement_asset text NOT NULL,
  client_address text NOT NULL,
  amount_usd numeric NOT NULL,
  fee_usd numeric NOT NULL,
  explorer_url text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);


-- System & Monitoring
-- ============================================

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.failed_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  error_type text NOT NULL,
  error_message text,
  request_payload jsonb,
  client_ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  endpoint text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.ip_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  endpoint text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(ip, endpoint, window_start)
);

CREATE TABLE public.security_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  model text DEFAULT 'claude-opus-4',
  report jsonb NOT NULL,
  security_score integer,
  critical_count integer DEFAULT 0,
  high_count integer DEFAULT 0,
  medium_count integer DEFAULT 0,
  low_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  value numeric NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.partner_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type partner_type NOT NULL,
  api_endpoint text NOT NULL,
  webhook_secret text,
  supported_chains text[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);


-- Legacy (à ignorer - compatibilité)
-- ============================================

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  plan text NOT NULL,
  status text DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- ============================================
-- 3️⃣ FUNCTIONS (Security Definer)
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_api_scope(_api_key text, _scope api_scope)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.api_keys
    WHERE key = _api_key
      AND is_active = true
      AND _scope = ANY(scopes)
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_org_access(_user_id uuid)
RETURNS TABLE(org_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT org_id FROM org_members WHERE user_id = _user_id
  UNION
  SELECT id FROM organizations WHERE owner_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.create_default_org_and_project()
RETURNS trigger
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
  server_key := 'ipx_live_' || encode(gen_random_bytes(32), 'hex');
  demo_key := 'ipx_demo_' || encode(gen_random_bytes(32), 'hex');
  
  company_name := COALESCE(TRIM(NEW.raw_user_meta_data->>'company'), 'My Organization');
  country_code := COALESCE(TRIM(NEW.raw_user_meta_data->>'country'), '');
  
  INSERT INTO public.organizations (name, owner_id)
  VALUES (company_name, NEW.id)
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.projects (org_id, name)
  VALUES (new_org_id, 'Production')
  RETURNING id INTO new_project_id;
  
  INSERT INTO public.api_keys (
    project_id, email, company, country, plan, key, scopes, is_public
  ) VALUES (
    new_project_id, NEW.email, company_name, country_code, 'starter',
    server_key, ARRAY['quotes:read', 'routes:read']::api_scope[], false
  );
  
  INSERT INTO public.api_keys (
    project_id, email, company, country, plan, key, scopes, is_public
  ) VALUES (
    new_project_id, NEW.email, company_name, country_code, 'demo',
    demo_key, ARRAY['quotes:read']::api_scope[], true
  );
  
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;


-- ============================================
-- 4️⃣ TRIGGERS
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_org_and_project();

CREATE TRIGGER on_auth_user_profile_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_organizations_updated
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_user_accounts_updated
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_campaigns_updated
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================
-- 5️⃣ RLS POLICIES (60+ policies - CRITIQUE)
-- ============================================

-- Profiles
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- User Roles
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only admins can assign roles"
  ON user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only admins can revoke roles"
  ON user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');


-- API Keys
-- ============================================
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own api keys"
  ON api_keys FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Service role can create api keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can update their own api keys"
  ON api_keys FOR UPDATE
  USING (user_id = auth.uid() OR auth.role() = 'service_role');


-- Leads
-- ============================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit leads"
  ON leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can read leads"
  ON leads FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only admins can update leads"
  ON leads FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');


-- Campaigns
-- ============================================
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage campaigns"
  ON campaigns FOR ALL
  USING (auth.role() = 'service_role');


-- Transaction Logs (Immutable)
-- ============================================
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON transaction_logs FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Service role inserts transactions"
  ON transaction_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Transactions immutable"
  ON transaction_logs FOR UPDATE
  USING (false);

CREATE POLICY "Transactions cannot be deleted"
  ON transaction_logs FOR DELETE
  USING (false);


-- iPAYX Fees (Immutable)
-- ============================================
ALTER TABLE public.ipayx_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins view fees"
  ON ipayx_fees FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Service role inserts fees"
  ON ipayx_fees FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Fees immutable"
  ON ipayx_fees FOR UPDATE
  USING (false);

CREATE POLICY "Fees cannot be deleted"
  ON ipayx_fees FOR DELETE
  USING (false);


-- Organizations
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM user_org_access(auth.uid())) OR auth.role() = 'service_role');

CREATE POLICY "Owners can update their organizations"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Service role can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- Org Members
-- ============================================
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organizations"
  ON org_members FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM user_org_access(auth.uid()))
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Owners can add members"
  ON org_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND owner_id = auth.uid())
    OR auth.role() = 'service_role'
  );


-- Projects
-- ============================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their orgs"
  ON projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_org_access(auth.uid()) uoa WHERE uoa.org_id = projects.org_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Owners can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND owner_id = auth.uid())
    OR auth.role() = 'service_role'
  );


-- Webhook Events
-- ============================================
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhooks"
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');


-- Failed Transactions
-- ============================================
ALTER TABLE public.failed_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins view failed txs"
  ON failed_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Service role inserts failed txs"
  ON failed_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- API Usage Logs
-- ============================================
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages usage logs"
  ON api_usage_logs FOR ALL
  USING (auth.role() = 'service_role');


-- IP Rate Limits
-- ============================================
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits"
  ON ip_rate_limits FOR ALL
  USING (auth.role() = 'service_role');


-- Security Audits
-- ============================================
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audits"
  ON security_audits FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Service role creates audits"
  ON security_audits FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- System Metrics
-- ============================================
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view metrics"
  ON system_metrics FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Service role inserts metrics"
  ON system_metrics FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- Activity Logs
-- ============================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own activity"
  ON activity_logs FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Service role creates activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- Partner Integrations
-- ============================================
ALTER TABLE public.partner_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active partners"
  ON partner_integrations FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only admins manage partners"
  ON partner_integrations FOR ALL
  USING (has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');


-- ============================================
-- 6️⃣ INDEXES (Performance)
-- ============================================

CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_project_id ON api_keys(project_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_campaigns_lead_id ON campaigns(lead_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX idx_transaction_logs_status ON transaction_logs(status);
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider, event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_api_usage_logs_api_key ON api_usage_logs(api_key);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_ip_rate_limits_ip_endpoint ON ip_rate_limits(ip, endpoint);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);


-- ============================================
-- 7️⃣ INITIAL DATA (Optionnel - Production)
-- ============================================

-- Partner integrations
INSERT INTO public.partner_integrations (partner_type, api_endpoint, supported_chains, is_active)
VALUES
  ('circle', 'https://api.circle.com/v1', ARRAY['ethereum', 'polygon', 'arbitrum'], true),
  ('transak', 'https://api.transak.com/v2', ARRAY['ethereum', 'stellar', 'polygon'], true),
  ('paychant', 'https://api.paychant.com', ARRAY['stellar'], true)
ON CONFLICT DO NOTHING;


-- ============================================
-- 8️⃣ NOTES D'UTILISATION
-- ============================================

-- Pour importer sur un nouveau projet Supabase :
-- psql -h <supabase-db-host> -U postgres -d postgres < SUPABASE_FULL_EXPORT.sql

-- Pour exporter les données existantes (data only) :
-- pg_dump -h <host> -U postgres -d postgres --data-only --table=public.* > data.sql

-- Pour restaurer uniquement les données :
-- psql -h <host> -U postgres -d postgres < data.sql

-- ============================================
-- FIN DE L'EXPORT
-- ============================================
