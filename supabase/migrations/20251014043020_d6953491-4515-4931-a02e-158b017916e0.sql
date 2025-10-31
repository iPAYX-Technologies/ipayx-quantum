-- Create enum for KYC status
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'denied', 'under_review');

-- Create enum for partner types
CREATE TYPE public.partner_type AS ENUM ('circle', 'coinbase', 'personna', 'sumsub');

-- Table for user accounts (metadata only, no funds)
CREATE TABLE public.user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  country TEXT NOT NULL,
  kyc_status kyc_status NOT NULL DEFAULT 'pending',
  partner_id partner_type,
  partner_account_id TEXT,
  partner_kyc_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table for partner integrations
CREATE TABLE public.partner_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type partner_type NOT NULL UNIQUE,
  api_endpoint TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  supported_chains TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table for transaction logs (metadata only, no funds stored)
CREATE TABLE public.transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID REFERENCES public.user_accounts(id) ON DELETE CASCADE NOT NULL,
  from_chain TEXT NOT NULL,
  to_chain TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL,
  partner_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_accounts
CREATE POLICY "Users can view their own account"
  ON public.user_accounts
  FOR SELECT
  USING (email = (auth.jwt() ->> 'email'::text));

CREATE POLICY "Anyone can create an account"
  ON public.user_accounts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own account"
  ON public.user_accounts
  FOR UPDATE
  USING (email = (auth.jwt() ->> 'email'::text));

-- RLS Policies for partner_integrations
CREATE POLICY "Anyone can view active partners"
  ON public.partner_integrations
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for transaction_logs
CREATE POLICY "Users can view their own transactions"
  ON public.transaction_logs
  FOR SELECT
  USING (
    user_account_id IN (
      SELECT id FROM public.user_accounts WHERE email = (auth.jwt() ->> 'email'::text)
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default partner integrations
INSERT INTO public.partner_integrations (partner_type, api_endpoint, supported_chains) VALUES
  ('circle', 'https://api.circle.com/v1', ARRAY['ethereum', 'polygon', 'arbitrum', 'stellar']),
  ('coinbase', 'https://api.coinbase.com/v2', ARRAY['ethereum', 'polygon', 'base']),
  ('personna', 'https://withpersona.com/api/v1', ARRAY['ethereum', 'stellar']),
  ('sumsub', 'https://api.sumsub.com', ARRAY['ethereum', 'tron', 'stellar']);