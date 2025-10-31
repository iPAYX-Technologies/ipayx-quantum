-- Step 1: Remove duplicate emails, keeping only the most recent one
DELETE FROM public.leads a
USING public.leads b
WHERE a.id < b.id 
  AND a.email = b.email;

-- Step 2: Add unique constraint on email column
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_unique ON public.leads(email);