import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock FX rates (in production, use a free API like exchangerate-api.io)
const FX_RATES: Record<string, Record<string, number>> = {
  USD: { MYR: 4.47, GHS: 15.82, INR: 83.12, CAD: 1.36, EUR: 0.92 },
  CAD: { MYR: 3.29, GHS: 11.63, INR: 61.12, USD: 0.74, EUR: 0.68 },
  EUR: { MYR: 4.86, GHS: 17.21, INR: 90.35, USD: 1.09, CAD: 1.47 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base, dest } = await req.json();

    console.log(`FX rate requested: ${base} -> ${dest}`);

    if (!FX_RATES[base] || !FX_RATES[base][dest]) {
      return new Response(
        JSON.stringify({ error: `Unsupported corridor: ${base}->${dest}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rate = FX_RATES[base][dest];
    
    // Add small random variation to simulate live rates
    const variation = 1 + (Math.random() - 0.5) * 0.002;
    const liveRate = rate * variation;

    return new Response(
      JSON.stringify({ 
        base, 
        dest, 
        rate: parseFloat(liveRate.toFixed(4)),
        timestamp: new Date().toISOString() 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching FX rates:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
