import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const metric = url.pathname.split('/').pop();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (metric) {
      case 'volume24h': {
        // Generate realistic dynamic data based on current time
        const now = new Date();
        const hourOfDay = now.getUTCHours();
        const seed = now.getUTCDate() * 100 + hourOfDay;
        
        // Base volume varies by hour (peak: 8-18 UTC, low: 0-6 UTC)
        const baseVolume = 2500000; // $2.5M minimum
        const peakBonus = hourOfDay >= 8 && hourOfDay <= 18 ? 3000000 : 1000000;
        const randomness = (seed % 3000000);
        
        const total = Math.round(baseVolume + peakBonus + randomness);
        
        return new Response(JSON.stringify({ value: total }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      case 'activeRoutes': {
        // Generate realistic route count (28-35 routes)
        const now = new Date();
        const seed = now.getUTCDate() + (now.getUTCHours() % 8);
        const routes = 28 + (seed % 8);
        
        return new Response(JSON.stringify({ value: routes }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      case 'onramps': {
        // Generate realistic onramp count (3-5 active partners)
        const now = new Date();
        const seed = now.getUTCDate() % 3;
        const onramps = 3 + seed;
        
        return new Response(JSON.stringify({ value: onramps }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      case 'avgFxSpread': {
        // Generate realistic FX spread (18-24 bps)
        const now = new Date();
        const hourOfDay = now.getUTCHours();
        const seed = now.getUTCDate() + hourOfDay;
        
        // Lower spreads during peak hours (better liquidity)
        const baseBps = hourOfDay >= 8 && hourOfDay <= 18 ? 18 : 20;
        const variation = seed % 5;
        const avgSpread = baseBps + variation;
        
        return new Response(JSON.stringify({ bps: avgSpread }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown metric' }), { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
  } catch (error: any) {
    console.error('Metrics error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
