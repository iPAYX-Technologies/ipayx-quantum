-- ============================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- Migration: Fix transaction_logs.user_id nullable
-- ============================================

-- Step 1: Backfill NULL user_id values from user_accounts
UPDATE transaction_logs
SET user_id = (
  SELECT user_id 
  FROM user_accounts 
  WHERE user_accounts.id = transaction_logs.user_account_id
)
WHERE user_id IS NULL 
  AND user_account_id IS NOT NULL;

-- Step 2: For any remaining NULLs (orphaned records), set to a system user or delete
-- We'll delete orphaned records for data integrity
DELETE FROM transaction_logs
WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL to enforce data integrity
ALTER TABLE transaction_logs 
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN transaction_logs.user_id IS 'User who initiated the transaction. Required for RLS policies. Must match auth.uid() for user visibility.';