-- Create failed_transactions table for security monitoring
CREATE TABLE IF NOT EXISTS public.failed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  error_type TEXT NOT NULL,
  client_ip TEXT,
  request_payload JSONB,
  error_message TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.failed_transactions ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read failed transactions
CREATE POLICY "Service role manages failed transactions"
  ON public.failed_transactions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for security monitoring queries
CREATE INDEX idx_failed_transactions_ip_time 
  ON public.failed_transactions(client_ip, created_at DESC);

CREATE INDEX idx_failed_transactions_endpoint 
  ON public.failed_transactions(endpoint, created_at DESC);