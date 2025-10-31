import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { validateApiKey } from "../_shared/auth-middleware.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const quoteSchema = z.object({
  from: z.string().trim().min(2, "Invalid source currency").max(10, "Currency code too long").regex(/^[A-Z]{3}$/, "Currency must be 3-letter code"),
  to: z.string().trim().min(2, "Invalid target currency").max(10, "Currency code too long").regex(/^[A-Z]{3}$/, "Currency must be 3-letter code"),
  amount: z.number().min(0.01, "Amount must be positive").max(1000000000, "Amount too large"),
  kyc: z.boolean().optional()
});

const rails = [
  {"name":"Rail-A","type":"kyc","baseFeePct":0.90,"latencyMin":10,"liq":9,"vol":0.1},
  {"name":"Rail-B","type":"kyc","baseFeePct":1.10,"latencyMin":12,"liq":9,"vol":0.2},
  {"name":"Rail-C","type":"nkyc","baseFeePct":0.80,"latencyMin":8,"liq":8,"vol":0.3},
  {"name":"Rail-D","type":"nkyc","baseFeePct":0.60,"latencyMin":6,"liq":9,"vol":0.4}
];

const scenarios = [
  {"id":"cad-usd","from":"CAD","to":"USD","amount":50000,"oracle":{"ref":0.74}},
  {"id":"usd-inr","from":"USD","to":"INR","amount":10000,"oracle":{"ref":83.12}},
  {"id":"usd-mxn","from":"USD","to":"MXN","amount":10000,"oracle":{"ref":17.12}},
  {"id":"eur-brl","from":"EUR","to":"BRL","amount":25000,"oracle":{"ref":5.53}}
];

function scoreRail(r: any): number {
  const fxSpread = Math.abs(r.quoteFX - r.oracleFX);
  return (
    -r.feePct * 2 -
    r.etaMin / 10 -
    fxSpread * 10 +
    r.liq -
    r.vol * 5 +
    (r.status === 'live' ? 2 : -5)
  );
}

function generateQuoteFX(oracleFX: number, seed: number): number {
  const random = (Math.sin(seed) * 10000) % 1;
  const spread = (Math.abs(random) * 0.04);
  return oracleFX + (random > 0.5 ? spread : -spread);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validation API key + scopes
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const auth = await validateApiKey(apiKey, ['quotes:read']);
    if (!auth.valid) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(apiKey, 'quotes');
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        remaining: 0,
        resetAt: rateLimit.resetAt 
      }), { 
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt
        } 
      });
    }

    const body = await req.json();
    
    // Validate and sanitize input
    const validation = quoteSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { from, to, amount, kyc } = validation.data;

    const scenarioId = `${from.toLowerCase()}-${to.toLowerCase()}`;
    const scenario = scenarios.find(s => s.id === scenarioId);

    if (!scenario) {
      return new Response(
        JSON.stringify({ error: `Unsupported corridor: ${from}-${to}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const filteredRails = rails.filter(r => kyc ? r.type === 'kyc' : r.type === 'nkyc');

    const IPAYX_FEE = 0.007; // 0.7% frais iPAYX Protocol

    const scoredRails = filteredRails.map((rail, index) => {
      const quoteFX = generateQuoteFX(scenario.oracle.ref, index);
      const totalFeePct = rail.baseFeePct + IPAYX_FEE;
      
      const railInput = {
        name: rail.name,
        feePct: totalFeePct,
        etaMin: rail.latencyMin,
        quoteFX,
        oracleFX: scenario.oracle.ref,
        liq: rail.liq,
        vol: rail.vol,
        status: 'live'
      };
      const score = scoreRail(railInput);
      
      return {
        rail: rail.name,
        score: parseFloat(score.toFixed(2)),
        feePct: totalFeePct,
        etaMin: rail.latencyMin,
        quoteFX: parseFloat(quoteFX.toFixed(4)),
        oracleFX: scenario.oracle.ref,
        fxSpread: parseFloat(Math.abs(quoteFX - scenario.oracle.ref).toFixed(4)),
        liq: rail.liq,
        vol: rail.vol,
        status: 'live'
      };
    });

    const sorted = scoredRails.sort((a, b) => b.score - a.score).slice(0, 3);

    return new Response(
      JSON.stringify({ routes: sorted, corridor: `${from}-${to}`, amount }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});