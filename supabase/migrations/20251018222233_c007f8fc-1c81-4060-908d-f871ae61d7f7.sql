-- Create security_audits table to store AI audit results
CREATE TABLE IF NOT EXISTS public.security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model TEXT NOT NULL DEFAULT 'claude-opus-4',
  security_score INTEGER,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  report JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;

-- Only admins can view audits
CREATE POLICY "Admins can view security audits"
ON public.security_audits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- Only service role can insert audits
CREATE POLICY "Service role can insert audits"
ON public.security_audits
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX idx_security_audits_created_at ON public.security_audits(created_at DESC);