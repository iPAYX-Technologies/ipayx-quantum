-- Create ipayx_fees table for real blockchain transaction tracking
CREATE TABLE IF NOT EXISTS public.ipayx_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_usd NUMERIC NOT NULL,
  fee_usd NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  chain TEXT NOT NULL,
  settlement_asset TEXT NOT NULL,
  client_address TEXT NOT NULL,
  explorer_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ipayx_fees ENABLE ROW LEVEL SECURITY;

-- Only service role can manage fee records
CREATE POLICY "Service role can manage ipayx fees"
  ON public.ipayx_fees
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX idx_ipayx_fees_tx_hash ON public.ipayx_fees(tx_hash);
CREATE INDEX idx_ipayx_fees_client_address ON public.ipayx_fees(client_address);
CREATE INDEX idx_ipayx_fees_created_at ON public.ipayx_fees(created_at DESC);