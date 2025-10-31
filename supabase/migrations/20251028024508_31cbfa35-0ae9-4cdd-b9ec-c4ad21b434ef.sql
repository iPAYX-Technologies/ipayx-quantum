-- ============================================
-- SECURITY FIX: Add RLS to transaction_logs
-- ============================================
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view their own transactions
CREATE POLICY "Users view own transactions"
ON transaction_logs
FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Policy 2: Service role can insert (edge functions)
CREATE POLICY "Service role inserts transactions"
ON transaction_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Transactions are immutable
CREATE POLICY "Transactions immutable"
ON transaction_logs
FOR UPDATE
USING (false);

-- Policy 4: Only admins can delete (GDPR)
CREATE POLICY "Admins delete transactions"
ON transaction_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_status ON transaction_logs(status);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created ON transaction_logs(created_at DESC);

-- ============================================
-- SECURITY FIX: Add RLS to ipayx_fees
-- ============================================
ALTER TABLE ipayx_fees ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can view fee logs
CREATE POLICY "Only admins view fees"
ON ipayx_fees
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- Only service role can insert fees
CREATE POLICY "Service role inserts fees"
ON ipayx_fees
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Fees are immutable
CREATE POLICY "Fees immutable"
ON ipayx_fees
FOR UPDATE
USING (false);

-- No deletes on fee logs (audit trail)
CREATE POLICY "No fee deletions"
ON ipayx_fees
FOR DELETE
USING (false);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ipayx_fees_created ON ipayx_fees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ipayx_fees_status ON ipayx_fees(status);

-- ============================================
-- SECURITY FIX: Add RLS to failed_transactions
-- ============================================
ALTER TABLE failed_transactions ENABLE ROW LEVEL SECURITY;

-- Only admins can view failed transactions
CREATE POLICY "Only admins view failures"
ON failed_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- Service role can insert errors
CREATE POLICY "Service role logs errors"
ON failed_transactions
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- No updates to error logs
CREATE POLICY "Errors immutable"
ON failed_transactions
FOR UPDATE
USING (false);

-- Auto-delete old errors after 90 days (GDPR)
CREATE POLICY "Auto delete old errors"
ON failed_transactions
FOR DELETE
USING (created_at < now() - interval '90 days' AND auth.role() = 'service_role');