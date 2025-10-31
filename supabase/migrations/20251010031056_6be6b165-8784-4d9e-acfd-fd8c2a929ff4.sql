-- Create leads table for business inquiries
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing-test',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public to insert leads (for form submissions)
CREATE POLICY "Allow public insert leads" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to read all leads
CREATE POLICY "Allow authenticated read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (true);