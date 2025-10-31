import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check database connectivity
    const { error: dbError } = await supabase.from('api_keys').select('count').limit(1).single();
    const dbStatus = dbError ? 'down' : 'up';

    // Check metrics function (simple ping)
    const { error: metricsError } = await supabase.functions.invoke('metrics', {
      body: { endpoint: 'volume24h' }
    });
    const metricsStatus = metricsError ? 'degraded' : 'up';

    const overallStatus = dbStatus === 'up' && metricsStatus === 'up' ? 'operational' : 'degraded';

    return new Response(
      JSON.stringify({
        status: overallStatus,
        version: 'v1',
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus,
          metrics: metricsStatus
        }
      }),
      {
        status: overallStatus === 'operational' ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Status check error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        version: 'v1',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
