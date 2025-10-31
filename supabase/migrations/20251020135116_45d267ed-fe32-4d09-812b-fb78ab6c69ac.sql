-- Add IP tracking for sandbox key generation
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS created_from_ip text;

-- Add email verification tracking for organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS verification_sent_at timestamp with time zone;

-- Create index for sandbox key lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_plan_active ON public.api_keys(plan, is_active);

-- Update api_keys RLS to allow service role to insert sandbox keys
DROP POLICY IF EXISTS "Anyone can create api keys" ON public.api_keys;

CREATE POLICY "Service role can create api keys"
ON public.api_keys
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Authenticated users can create their own api keys"
ON public.api_keys
FOR INSERT
TO authenticated
WITH CHECK (email = (auth.jwt() ->> 'email'::text));