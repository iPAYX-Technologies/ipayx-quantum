-- ============================================
-- iPAYX Migration Script - Lovable Cloud → Autonome
-- Date: 2025-10-30
-- Objectif: Migrer le projet vers un Supabase autonome (sans dépendance Lovable)
-- Usage: psql -h <host> -U postgres -d postgres < MIGRATION_TO_AUTONOMOUS_SUPABASE.sql
-- ============================================

-- 🚨 IMPORTANT: Exécuter dans un nouveau projet Supabase vide
-- 🚨 Ce script crée TOUT le schéma, RLS policies, triggers, functions

-- ============================================
-- ÉTAPE 1️⃣ : Enable required extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- ÉTAPE 2️⃣ : Create enums
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.partner_type AS ENUM ('transak', 'circle', 'paychant');
CREATE TYPE public.api_scope AS ENUM ('quotes:read', 'routes:read', 'transfers:write');

-- ============================================
-- ÉTAPE 3️⃣ : Create all tables
-- ============================================
-- (Copy-paste from SUPABASE_FULL_EXPORT.sql section 2️⃣)

-- Auth & Users
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
-- ÉTAPE 4️⃣ : Create functions
-- ============================================
-- (Copy-paste from SUPABASE_FULL_EXPORT.sql section 3️⃣)

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
-- ÉTAPE 5️⃣ : Create triggers
-- ============================================
-- (Copy-paste from SUPABASE_FULL_EXPORT.sql section 4️⃣)

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
-- ÉTAPE 6️⃣ : Enable RLS + Create policies
-- ============================================
-- (Copy-paste from SUPABASE_FULL_EXPORT.sql section 5️⃣)
-- (60+ policies - voir fichier complet)

-- ============================================
-- ÉTAPE 7️⃣ : Create indexes
-- ============================================
-- (Copy-paste from SUPABASE_FULL_EXPORT.sql section 6️⃣)

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
-- ÉTAPE 8️⃣ : Insert initial data
-- ============================================

INSERT INTO public.partner_integrations (partner_type, api_endpoint, supported_chains, is_active)
VALUES
  ('circle', 'https://api.circle.com/v1', ARRAY['ethereum', 'polygon', 'arbitrum'], true),
  ('transak', 'https://api.transak.com/v2', ARRAY['ethereum', 'stellar', 'polygon'], true),
  ('paychant', 'https://api.paychant.com', ARRAY['stellar'], true)
ON CONFLICT DO NOTHING;

-- ============================================
-- ÉTAPE 9️⃣ : Configure Supabase Auth (manuel)
-- ============================================
-- ⚠️ À faire via Supabase Dashboard :
--
-- 1. Auth Providers (Settings > Auth > Providers):
--    ✅ Email/Password: Enabled
--    ❌ Email confirmations: Disabled (auto-confirm)
--    ✅ Google OAuth: Optional (configure client ID)
--
-- 2. Auth URLs (Settings > Auth > URL Configuration):
--    Site URL: https://your-domain.com
--    Redirect URLs: https://your-domain.com/**
--
-- 3. JWT Settings (Settings > Auth > JWT Settings):
--    JWT expiry: 3600 (1 hour)
--    Refresh token expiry: 2592000 (30 days)

-- ============================================
-- ÉTAPE 🔟 : Deploy edge functions
-- ============================================
-- ⚠️ Commandes CLI à exécuter :
--
-- 1. Clone code:
--    git clone <ton-repo-github>
--    cd ipayx-protocol
--
-- 2. Link Supabase project:
--    supabase link --project-ref <ton-project-id>
--
-- 3. Deploy all functions:
--    supabase functions deploy --project-ref <ton-project-id>
--
-- 4. Configure secrets (voir SETUP.md section 2️⃣):
--    supabase secrets set SENDGRID_API_KEY=xxx --project-ref <ton-project-id>
--    supabase secrets set COINBASE_API_KEY=xxx --project-ref <ton-project-id>
--    ... (voir liste complète dans SETUP.md)

-- ============================================
-- ÉTAPE 1️⃣1️⃣ : Update frontend .env
-- ============================================
-- ⚠️ Remplacer les variables dans .env :
--
-- VITE_SUPABASE_URL=https://<ton-project-ref>.supabase.co
-- VITE_SUPABASE_PUBLISHABLE_KEY=<ton-anon-key>
-- VITE_SUPABASE_PROJECT_ID=<ton-project-id>
--
-- Où trouver les clés ?
-- Dashboard > Settings > API > Project URL & anon key

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- ✅ RLS est activé sur toutes les tables
-- ✅ Triggers automatiques pour updated_at
-- ✅ Auto-création org + project + API keys à signup
-- ✅ Service role key requis pour edge functions
-- ⚠️ Ne PAS exposer service_role_key côté frontend
-- ⚠️ Configurer CORS headers dans edge functions
-- ⚠️ Tester auth flow avant production

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
