/**
 * Server-only Supabase admin client factory
 * 
 * This module provides a Supabase client configured with SERVICE ROLE key
 * for server-side operations that require elevated privileges.
 * 
 * ⚠️ SECURITY WARNING:
 * - NEVER expose this client to frontend code
 * - NEVER use import.meta.env (Vite) to access SERVICE_ROLE_KEY
 * - Only use process.env (Node.js/Edge Functions)
 * - Service role bypasses RLS policies - use with caution
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client with service role privileges
 * 
 * @returns Supabase client with admin access, or null if env vars missing
 */
export function createSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fail fast: Environment variables must be configured
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      '❌ Missing required Supabase environment variables:',
      {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey,
      }
    );
    return null;
  }

  // Create admin client with service role
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

/**
 * Safely log data to Supabase table
 * 
 * This helper function attempts to insert data into a Supabase table,
 * but gracefully handles cases where credentials are missing (returns no-op).
 * 
 * @param table - Name of the Supabase table
 * @param payload - Data to insert
 * @returns True if logged successfully, false otherwise
 */
export async function safeLog(table: string, payload: Record<string, unknown>): Promise<boolean> {
  const client = createSupabaseServerClient();

  // No-op if client creation failed (missing env vars)
  if (!client) {
    console.warn(`⚠️ Supabase client not available - skipping log to ${table}`);
    return false;
  }

  try {
    const { error } = await client.from(table).insert(payload);

    if (error) {
      console.error(`❌ Error logging to ${table}:`, error.message);
      return false;
    }

    console.log(`✅ Successfully logged to ${table}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception logging to ${table}:`, err);
    return false;
  }
}

/**
 * Example usage for reference:
 * 
 * ```typescript
 * import { createSupabaseServerClient, safeLog } from '@/config/supabaseServer';
 * 
 * // In an API route or Edge Function:
 * const supabase = createSupabaseServerClient();
 * if (supabase) {
 *   const { data, error } = await supabase
 *     .from('quotes')
 *     .select('*')
 *     .eq('status', 'pending');
 * }
 * 
 * // Or use safeLog helper:
 * await safeLog('transaction_logs', {
 *   user_id: userId,
 *   amount: 100,
 *   status: 'completed',
 * });
 * ```
 */
