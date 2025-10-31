-- Fix RLS Policies: Migrate from email-based to user_id-based authorization
-- Issue: auth_jwt_multi_tables (CRITICAL)

-- Step 1: Add user_id columns to tables using email-based RLS
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE transaction_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Backfill user_id from profiles table
UPDATE api_keys ak SET user_id = p.id
FROM profiles p WHERE ak.email = p.email AND ak.user_id IS NULL;

UPDATE user_accounts ua SET user_id = p.id
FROM profiles p WHERE ua.email = p.email AND ua.user_id IS NULL;

UPDATE transaction_logs tl SET user_id = p.id
FROM profiles p 
WHERE tl.user_account_id IN (SELECT id FROM user_accounts WHERE email = p.email)
AND tl.user_id IS NULL;

UPDATE subscriptions s SET user_id = p.id
FROM profiles p WHERE s.email = p.email AND s.user_id IS NULL;

-- Step 3: Make user_id NOT NULL after backfill (for new records only)
ALTER TABLE api_keys ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE user_accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE subscriptions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Step 4: Update RLS policies to use auth.uid() instead of email

-- Fix api_keys policies
DROP POLICY IF EXISTS "Users can view their own api keys" ON api_keys;
CREATE POLICY "Users can view their own api keys"
ON api_keys FOR SELECT
USING (user_id = auth.uid() OR auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Users can update their own api keys" ON api_keys;
CREATE POLICY "Users can update their own api keys"
ON api_keys FOR UPDATE
USING (user_id = auth.uid() OR auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Users can delete their own api keys" ON api_keys;
CREATE POLICY "Users can delete their own api keys"
ON api_keys FOR DELETE
USING (user_id = auth.uid() OR auth.role() = 'service_role'::text);

-- Fix user_accounts policies
DROP POLICY IF EXISTS "Users can view their own account" ON user_accounts;
CREATE POLICY "Users can view their own account"
ON user_accounts FOR SELECT
USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update their own account" ON user_accounts;
CREATE POLICY "Users can update their own account"
ON user_accounts FOR UPDATE
USING (user_id = auth.uid());

-- Fix transaction_logs policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transaction_logs;
CREATE POLICY "Users can view their own transactions"
ON transaction_logs FOR SELECT
USING (user_id = auth.uid());

-- Fix subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON subscriptions FOR SELECT
USING (user_id = auth.uid() OR auth.role() = 'service_role'::text);

-- Step 5: Fix campaigns table RLS (campaigns_missing_rls)
-- Currently only admins can manage, need proper SELECT policy

DROP POLICY IF EXISTS "Only admins can view campaigns" ON campaigns;
CREATE POLICY "Users can view campaigns for their organization"
ON campaigns FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.role() = 'service_role'::text
  OR EXISTS (
    SELECT 1 FROM leads l
    JOIN profiles p ON l.email = p.email
    WHERE l.id = campaigns.lead_id
    AND p.id = auth.uid()
  )
);