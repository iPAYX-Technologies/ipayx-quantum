import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// Mock plugin quote fetchers (in production, these would call actual edge functions)
async function fetchPluginQuote(plugin: string, params: any) {
  // Simulated quotes based on plugin characteristics
  const quotes: Record<string, any> = {
    hedera: {
      provider: "hedera-native",
      feePct: 0.003,
      etaSec: 3,
      liq: 9.5,
      vol: 0.05,
      route: [params.fromNetwork, params.toNetwork],
      notes: "Hedera HCS - ultra low fees, 3s finality"
    },
    evm: {
      provider: "evm-multi",
      feePct: 0.006,
      etaSec: 120,
      liq: 9.0,
      vol: 0.08,
      route: [params.fromNetwork, params.toNetwork],
      notes: "EVM chains - CCTP + LayerZero"
    },
    tron: {
      provider: "tron-usdt",
      feePct: 0.004,
      etaSec: 3,
      liq: 9.2,
      vol: 0.06,
      route: [params.fromNetwork, params.toNetwork],
      notes: "Tron TRC20 - 3s finality, low cost"
    },
    stellar: {
      provider: "stellar-sep24",
      feePct: 0.005,
      etaSec: 5,
      liq: 8.5,
      vol: 0.07,
      route: [params.fromNetwork, params.toNetwork],
      notes: "Stellar - SEP-24 off-ramp"
    },
    xrpl: {
      provider: "xrpl-mpt",
      feePct: 0.004,
      etaSec: 4,
      liq: 8.8,
      vol: 0.06,
      route: [params.fromNetwork, params.toNetwork],
      notes: "XRPL - MPT token support"
    },
    ccip: {
      provider: "chainlink-ccip",
      feePct: 0.007,
      etaSec: 180,
      liq: 10.0,
      vol: 0.10,
      route: [params.fromNetwork, params.toNetwork],
      notes: "Chainlink CCIP - maximum security"
    }
  };

  return quotes[plugin] || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request body with try-catch
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error(`❌ JSON parse error:`, parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON body',
        requestId: crypto.randomUUID()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { fromNetwork, toNetwork, asset, amount } = body;
    
    // Validate required parameters
    if (!fromNetwork || !toNetwork || !asset || !amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        required: ['fromNetwork', 'toNetwork', 'asset', 'amount'],
        received: { fromNetwork, toNetwork, asset, amount }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`🤖 Eliza AI Orchestrator - Valid Request:`, { fromNetwork, toNetwork, asset, amount });

    // 1. Fetch quotes from all available plugins
    const plugins = ['hedera', 'evm', 'tron', 'stellar', 'xrpl', 'ccip'];
    const quotePromises = plugins.map(plugin => 
      fetchPluginQuote(plugin, { fromNetwork, toNetwork, asset, amount })
    );
    
    const quotes = await Promise.all(quotePromises);
    const validQuotes = quotes.filter(q => q !== null);

    console.log(`✅ Fetched ${validQuotes.length} quotes:`, validQuotes.map(q => q.provider));

    // 2. Build Eliza AI prompt for intelligent scoring
    const elizaPrompt = `
Tu es Eliza, l'orchestrateur AI du protocole iPAYX V4. Ton rôle est d'analyser les routes multi-chain et recommander la meilleure option.

**Contexte:**
- Transfer: ${amount} ${asset} de ${fromNetwork} vers ${toNetwork}
- Plugins disponibles: Hedera, EVM (Polygon/Arbitrum), Tron, Stellar, XRPL, Chainlink CCIP

**Routes Disponibles:**
${validQuotes.map((q, i) => `
${i + 1}. **${q.provider}**
   - Frais: ${(q.feePct * 100).toFixed(2)}%
   - Vitesse: ${q.etaSec}s
   - Liquidité: ${q.liq}/10
   - Volatilité: ${q.vol}
   - Notes: ${q.notes}
`).join('\n')}

**Critères de Scoring (par ordre d'importance):**
1. **Frais** (40%) - Plus bas = meilleur
2. **Liquidité** (25%) - Plus haut = meilleur
3. **Vitesse** (20%) - Plus rapide = meilleur
4. **Volatilité** (15%) - Plus bas = meilleur

**Instructions:**
1. Calcule un score composite pour chaque route (0-100)
2. Identifie la route optimale
3. Explique ton raisonnement en 2-3 phrases (français technique)

**Format de Réponse (JSON strict):**
{
  "bestRoute": "nom-du-provider",
  "score": 85,
  "reasoning": "Hedera offre le meilleur compromis avec des frais ultra-bas (0.3%), une liquidité élevée (9.5/10) et une finalité instantanée (3s). Bien que CCIP soit plus sécurisé, ses frais 2x plus élevés ne justifient pas la différence pour ce montant.",
  "rankings": [
    { "provider": "hedera-native", "score": 85, "rank": 1 },
    { "provider": "tron-usdt", "score": 78, "rank": 2 },
    { "provider": "xrpl-mpt", "score": 72, "rank": 3 }
  ]
}
`;

    // 3. Call Lovable AI (Gemini 2.5 Flash) for intelligent analysis
    console.log(`🧠 Calling Lovable AI (Gemini 2.5 Flash)...`);
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "Tu es Eliza, l'orchestrateur AI d'iPAYX Protocol V4. Tu analyses les routes blockchain et recommandes la meilleure option en français technique. Réponds UNIQUEMENT en JSON valide." 
          },
          { role: "user", content: elizaPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`❌ Lovable AI error (${aiResponse.status}):`, errorText);
      
      // Fallback: simple scoring algorithm
      const fallbackRanking = validQuotes.map(q => {
        const feeScore = (1 - q.feePct) * 40;
        const liqScore = (q.liq / 10) * 25;
        const speedScore = (1 - Math.min(q.etaSec / 600, 1)) * 20;
        const volScore = (1 - q.vol) * 15;
        const totalScore = feeScore + liqScore + speedScore + volScore;
        
        return {
          provider: q.provider,
          score: Math.round(totalScore),
          feePct: q.feePct,
          etaSec: q.etaSec
        };
      }).sort((a, b) => b.score - a.score);

      return new Response(JSON.stringify({
        bestRoute: fallbackRanking[0].provider,
        score: fallbackRanking[0].score,
        reasoning: `Analyse automatique: ${fallbackRanking[0].provider} sélectionné (${fallbackRanking[0].score}/100) - frais ${(fallbackRanking[0].feePct * 100).toFixed(2)}%, ETA ${fallbackRanking[0].etaSec}s`,
        rankings: fallbackRanking.slice(0, 3).map((r, i) => ({ ...r, rank: i + 1 })),
        mode: "fallback"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await aiResponse.json();
    console.log(`✅ Lovable AI response:`, aiData);

    // Parse AI response
    let elizaDecision;
    try {
      const aiContent = aiData.choices[0].message.content.trim();
      // Remove markdown code blocks if present
      const jsonContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      elizaDecision = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error(`❌ Failed to parse AI response:`, parseError);
      throw new Error("Invalid AI response format");
    }

    console.log(`🎯 Eliza Decision:`, elizaDecision);

    // 4. Auto-split iPAYX fee to MetaMask (0.7%)
    const selectedQuote = validQuotes.find(q => q.provider === elizaDecision.bestRoute) || validQuotes[0];
    const ipayxFeeUsd = selectedQuote.amount_usd * 0.007; // 0.7% fee
    
    console.log(`💰 Triggering iPAYX fee payment: $${ipayxFeeUsd.toFixed(2)} USDC on Polygon`);

    try {
      const feeResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-ipayx-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount_usd: ipayxFeeUsd,
          chain: 'polygon',
          settlement_asset: 'USDC',
          client_address: body.userWalletAddress || 'unknown'
        })
      });

      if (feeResponse.ok) {
        const feeData = await feeResponse.json();
        console.log(`✅ Fee payment initiated:`, feeData);
      } else {
        console.error(`⚠️ Fee payment failed (non-blocking):`, await feeResponse.text());
      }
    } catch (feeError) {
      console.error(`⚠️ Fee payment error (non-blocking):`, feeError);
    }

    // 5. Return enriched response
    return new Response(JSON.stringify({
      ...elizaDecision,
      quotes: validQuotes,
      ipayxFee: { usd: ipayxFeeUsd, chain: 'polygon', asset: 'USDC' },
      timestamp: new Date().toISOString(),
      model: "google/gemini-2.5-flash",
      mode: "ai"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SECURE_LOG] Eliza Orchestrator error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      error: 'Request processing failed',
      requestId: crypto.randomUUID()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
