import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LIMITS = {
  quotes: { rpm: 30, window: 60 },
  execute: { rpm: 5, window: 60 },
  payments: { rpm: 10, window: 60 }
};

export async function checkRateLimit(
  apiKey: string,
  endpoint: 'quotes' | 'execute' | 'payments'
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const limit = LIMITS[endpoint];
  const windowStart = new Date(Date.now() - limit.window * 1000);
  const resetAt = new Date(Date.now() + limit.window * 1000).toISOString();

  // Count requests in window
  const { count } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('api_key', apiKey)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart.toISOString());

  const remaining = limit.rpm - (count || 0);
  
  if (remaining <= 0) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Log usage
  await supabase.from('api_usage_logs').insert({
    api_key: apiKey,
    endpoint,
    created_at: new Date().toISOString()
  });

  return { allowed: true, remaining, resetAt };
}
