import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitEntry {
  ip: string;
  endpoint: string;
  count: number;
  window_start: string;
}

const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

export async function checkIpRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

  // Clean up old entries
  await supabase
    .from('ip_rate_limits')
    .delete()
    .lt('window_start', windowStart.toISOString());

  // Get current count for this IP + endpoint
  const { data: existing } = await supabase
    .from('ip_rate_limits')
    .select('count')
    .eq('ip', ip)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .single();

  const currentCount = existing?.count || 0;

  if (currentCount >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment or create entry
  if (existing) {
    await supabase
      .from('ip_rate_limits')
      .update({ count: currentCount + 1 })
      .eq('ip', ip)
      .eq('endpoint', endpoint);
  } else {
    await supabase
      .from('ip_rate_limits')
      .insert({
        ip,
        endpoint,
        count: 1,
        window_start: now.toISOString()
      });
  }

  return { allowed: true, remaining: maxRequests - currentCount - 1 };
}
