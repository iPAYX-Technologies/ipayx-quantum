-- Create table for IP-based rate limiting
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip, endpoint)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ip_rate_limits_lookup 
ON public.ip_rate_limits(ip, endpoint, window_start);

-- Enable RLS (but allow all operations since this is system-level rate limiting)
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.ip_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);