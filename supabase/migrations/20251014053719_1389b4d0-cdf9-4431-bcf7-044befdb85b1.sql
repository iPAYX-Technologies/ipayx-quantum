-- ============================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- ============================================

-- Fix 1: Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Fix 2: Create user_roles table with proper RLS
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fix 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix 4: Restrict leads table to admins only (prevent email harvesting)
DROP POLICY IF EXISTS "Allow authenticated read leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert leads" ON public.leads;

CREATE POLICY "Only admins can read leads"
  ON public.leads
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Anyone can submit leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Fix 5: Restrict partner_integrations to service_role only (protect webhook secrets)
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partner_integrations;

CREATE POLICY "Only service_role can access partners"
  ON public.partner_integrations
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Fix 6: Add proper UPDATE/DELETE policies for api_keys
CREATE POLICY "Users can update their own api keys"
  ON public.api_keys
  FOR UPDATE
  USING (email = (auth.jwt() ->> 'email') OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own api keys"
  ON public.api_keys
  FOR DELETE
  USING (email = (auth.jwt() ->> 'email') OR auth.role() = 'service_role');

-- Fix 7: Add DELETE policy for user_accounts
CREATE POLICY "Only service_role can delete accounts"
  ON public.user_accounts
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Fix 8: Add INSERT/UPDATE/DELETE policies for transaction_logs
CREATE POLICY "Only service_role can insert transaction logs"
  ON public.transaction_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Transaction logs are immutable"
  ON public.transaction_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "Transaction logs cannot be deleted"
  ON public.transaction_logs
  FOR DELETE
  USING (false);

-- Fix 9: Create table for agent execution logs
CREATE TABLE public.agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'warning', 'error'
  findings JSONB DEFAULT '[]'::jsonb,
  alerts JSONB DEFAULT '[]'::jsonb,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view agent logs"
  ON public.agent_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only service_role can insert agent logs"
  ON public.agent_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Fix 10: Create table for system metrics
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'latency', 'error_rate', 'db_connections', etc.
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view system metrics"
  ON public.system_metrics
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only service_role can insert metrics"
  ON public.system_metrics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Fix 11: Add RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only admins can assign roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');

CREATE POLICY "Only admins can remove roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role');