-- Fix: Implement soft deletes for user_accounts (without touching existing profiles policies)

-- Add soft delete columns to user_accounts
ALTER TABLE public.user_accounts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Update SELECT policy to exclude soft-deleted accounts
DROP POLICY IF EXISTS "Users can view their own account" ON public.user_accounts;
CREATE POLICY "Users can view their own account"
ON public.user_accounts 
FOR SELECT
USING (
  (auth.jwt() ->> 'email') = email 
  AND deleted_at IS NULL
);

-- Replace DELETE policy with UPDATE policy for soft deletes
DROP POLICY IF EXISTS "Only service_role can delete accounts" ON public.user_accounts;

CREATE POLICY "Admins can soft delete accounts"
ON public.user_accounts 
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND deleted_at IS NULL
)
WITH CHECK (
  deleted_at IS NOT NULL 
  AND deleted_by = auth.uid()
);

-- Create function for safe soft delete with audit logging
CREATE OR REPLACE FUNCTION public.soft_delete_user_account(
  _account_id UUID,
  _reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin role
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Soft delete the account
  UPDATE public.user_accounts
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    deletion_reason = _reason
  WHERE id = _account_id
  AND deleted_at IS NULL;
  
  -- Log to activity_logs
  INSERT INTO public.activity_logs (user_id, action, metadata)
  VALUES (
    auth.uid(),
    'user_account_soft_deleted',
    jsonb_build_object(
      'account_id', _account_id,
      'reason', _reason,
      'timestamp', now()
    )
  );
  
  RETURN FOUND;
END;
$$;