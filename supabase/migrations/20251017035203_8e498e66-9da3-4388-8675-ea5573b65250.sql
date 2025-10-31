-- Create table for IP-based rate limiting
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ip_rate_limits_lookup 
  ON public.ip_rate_limits(ip, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Only service_role can manage rate limits"
  ON public.ip_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add cleanup function to automatically delete old entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ip_rate_limits
  WHERE window_start < NOW() - INTERVAL '5 minutes';
END;
$$;