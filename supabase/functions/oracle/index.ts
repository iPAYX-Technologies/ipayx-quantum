import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const scenarios = [
  {"id":"cad-usd","from":"CAD","to":"USD","oracle":{"ref":0.74}},
  {"id":"usd-inr","from":"USD","to":"INR","oracle":{"ref":83.12}},
  {"id":"usd-mxn","from":"USD","to":"MXN","oracle":{"ref":17.12}},
  {"id":"eur-brl","from":"EUR","to":"BRL","oracle":{"ref":5.53}}
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pair = url.searchParams.get('pair');

    if (!pair) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: pair (e.g., USD-INR)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scenarioId = pair.toLowerCase().replace('_', '-');
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (!scenario) {
      return new Response(
        JSON.stringify({ error: `Unsupported pair: ${pair}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Oracle rate requested for:', pair);

    return new Response(
      JSON.stringify({ 
        pair: `${scenario.from}-${scenario.to}`,
        ref: scenario.oracle.ref,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error getting oracle rate:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});