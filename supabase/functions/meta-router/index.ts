import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { rateLimit } from '../_shared/rate-limit-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const metaRouterSchema = z.object({
  fromNetwork: z.string().trim().min(2, "Invalid source network").max(50, "Network name too long"),
  toNetwork: z.string().trim().min(2, "Invalid target network").max(50, "Network name too long"),
  asset: z.string().trim().min(2, "Invalid asset").max(10, "Asset code too long").regex(/^[A-Z]{2,10}$/, "Asset must be uppercase letters"),
  amount: z.number().min(0.01, "Amount must be positive").max(1000000000, "Amount too large")
});

// Provider configurations
const providers = [
  {
    name: "Circle CCTP",
    type: "bridge",
    supports: ["USDC"],
    networks: ["ETHEREUM", "BASE", "AVAX", "POLYGON", "ARBITRUM", "OPTIMISM"],
    baseFeePct: 0.90,
    etaSec: 180,
    riskScore: 0.95
  },
  {
    name: "LayerZero",
    type: "bridge",
    supports: ["USDC", "USDT"],
    networks: ["ETHEREUM", "BASE", "AVAX", "POLYGON", "ARBITRUM", "OPTIMISM", "SOLANA"],
    baseFeePct: 0.75,
    etaSec: 120,
    riskScore: 0.88
  },
  {
    name: "Wormhole",
    type: "bridge",
    supports: ["USDC", "USDT", "ETH"],
    networks: ["ETHEREUM", "BASE", "AVAX", "POLYGON", "SOLANA"],
    baseFeePct: 0.85,
    etaSec: 120,
    riskScore: 0.85
  },
  {
    name: "Stellar XLM",
    type: "stellar",
    supports: ["USDC", "XLM"],
    networks: ["STELLAR"],
    baseFeePct: 0.35,
    etaSec: 60,
    riskScore: 0.92
  },
  {
    name: "Tron USDT",
    type: "tron",
    supports: ["USDT"],
    networks: ["TRON"],
    baseFeePct: 0.25,
    etaSec: 60,
    riskScore: 0.78
  }
];

async function getMessariMetrics(asset: string) {
  // Static values for stablecoins (Messari API removed)
  return { 
    volatility: 0.02,        // 2% volatility assumed for USDC/USDT
    sentiment: 0.7, 
    volume_24h: 1000000000,  // $1B daily volume (assumed stable)
    price: 1.0               // USDC = $1.00 by definition
  };
}

function scoreRoute(
  provider: any,
  amount: number
): number {
  const feeCost = provider.baseFeePct / 100;
  const latencyCost = provider.etaSec / 1000;
  const liq = 1 / 0.021; // Fixed volatility for stablecoins
  const reliability = (provider.riskScore || 0.8) * liq;
  
  // iPayX markup: 0.7% (FIXED - all-inclusive for client)
  const totalFee = feeCost + 0.007;
  
  const score = (reliability * 100) / (totalFee + latencyCost);
  return parseFloat(score.toFixed(2));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add rate limiting (60 requests per minute)
  const rateLimitResult = await rateLimit(req, {
    maxRequests: 60,
    windowMs: 60000,
    identifier: 'meta-router'
  });

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter 
      }),
      { status: 429, headers: { ...corsHeaders, 'Retry-After': String(rateLimitResult.retryAfter || 60) } }
    );
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize input
    const validation = metaRouterSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fromNetwork, toNetwork, asset, amount } = validation.data;

    // Filter providers that support this route
    const validProviders = providers.filter(p => 
      p.supports.includes(asset) &&
      (p.networks.includes(fromNetwork) || p.networks.includes(toNetwork))
    );

    if (validProviders.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No providers support this route' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get static metrics for the asset
    const assetForMetrics = asset === 'USDT' ? 'usdt' : asset === 'USDC' ? 'usdc' : 'usdc';
    const messariMetrics = await getMessariMetrics(assetForMetrics);

    // Score all routes
    const routes = validProviders.map(provider => {
      const score = scoreRoute(provider, amount);
      const totalFee = provider.baseFeePct + 0.7; // Add iPayX 0.7% markup (all-inclusive)
      
      return {
        provider: provider.name,
        type: provider.type,
        totalFee: parseFloat(totalFee.toFixed(2)),
        etaSec: provider.etaSec,
        riskScore: provider.riskScore,
        score,
        messariMetrics: {
          volatility: messariMetrics.volatility,
          volume_24h: messariMetrics.volume_24h,
          price: messariMetrics.price
        },
        notes: `iPayX Protocol: 0.7% fee (included) • No hidden fees`
      };
    });

    // Sort by score and return top 3
    const topRoutes = routes.sort((a, b) => b.score - a.score).slice(0, 3);

    console.log('Meta-router quote:', { fromNetwork, toNetwork, asset, amount, routes: topRoutes.length });

    // Log transaction for metrics tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user account (or create demo account)
    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('email', 'demo@ipayx.com')
      .maybeSingle();

    if (userAccount) {
      await supabase.from('transaction_logs').insert({
        user_account_id: userAccount.id,
        from_chain: fromNetwork,
        to_chain: toNetwork,
        asset: asset,
        amount: amount,
        status: 'quoted',
        partner_response: {
          routes: topRoutes,
          quoted_at: new Date().toISOString()
        }
      });
      
      console.log('✅ Transaction logged to metrics');
    }

    return new Response(
      JSON.stringify({ 
        routes: topRoutes, 
        corridor: `${fromNetwork}-${toNetwork}`,
        asset,
        amount 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Meta-router error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
