import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IPAYX_FEE_PCT = 0.007; // 0.7%

/**
 * Get FX rate via Chainlink (primary) + Pyth (fallback)
 */
async function getFxRate(currency: string): Promise<{ rate: number; source: string }> {
  if (currency === 'USD') return { rate: 1.0, source: 'static' };

  // Try Chainlink first
  const chainlinkRate = await getChainlinkFx(currency);
  if (chainlinkRate) {
    return { rate: chainlinkRate, source: 'chainlink' };
  }

  // Fallback to Pyth
  const pythRate = await getPythFx(currency);
  if (pythRate) {
    return { rate: pythRate, source: 'pyth' };
  }

  // Ultimate fallback: static rates
  const staticRates: Record<string, number> = {
    'CAD': 1.35, 'EUR': 0.92, 'GBP': 0.79, 'GHS': 15.50, 'NGN': 1650.00, 'MYR': 4.45
  };
  return { rate: staticRates[currency] || 1.0, source: 'static_fallback' };
}

async function getChainlinkFx(quote: string): Promise<number | null> {
  const feedAddresses: Record<string, string> = {
    'CAD': '0xa34317DB73e77d453b1B8d04550c44D10e981C8e',
    'EUR': '0xb49f677943BC038e9857d61E7d053CaA2C1734C1',
    'GBP': '0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5',
  };

  const aggregatorAddress = feedAddresses[quote];
  if (!aggregatorAddress) return null;

  try {
    const response = await fetch('https://eth.llamarpc.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_call',
        params: [{ to: aggregatorAddress, data: '0xfeaf968c' }, 'latest']
      })
    });

    const result = await response.json();
    if (result.error || !result.result) return null;

    const hex = result.result.slice(0, 130);
    const answerHex = '0x' + hex.slice(66, 130);
    const answer = parseInt(answerHex, 16);
    
    if (quote === 'EUR' || quote === 'GBP') {
      return 1 / (answer / 1e8);
    }
    return answer / 1e8;
  } catch (error) {
    console.error(`Chainlink error for ${quote}:`, error);
    return null;
  }
}

async function getPythFx(quote: string): Promise<number | null> {
  const priceIds: Record<string, string> = {
    'CAD': 'e13b1c1ffb32f34e1be9545583f01ef385fde7f42ee66049d30570dc866b77ca',
    'EUR': 'a995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
    'GBP': '84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
  };

  const priceId = priceIds[quote];
  if (!priceId) return null;

  try {
    const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${priceId}`);
    const data = await response.json();
    
    if (!data.parsed || data.parsed.length === 0) return null;
    
    const priceData = data.parsed[0].price;
    const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo);
    
    if (quote === 'EUR' || quote === 'GBP') {
      return 1 / price;
    }
    return price;
  } catch (error) {
    console.error(`Pyth error for ${quote}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount_local, currency_local, asset } = await req.json();

    console.log(`💰 Fee calculation — Amount: ${amount_local} ${currency_local}, Asset: ${asset || 'USDC'}`);

    // Get FX rate via oracles
    const { rate: fxRate, source: oracleSource } = await getFxRate(currency_local);
    console.log(`📊 Oracle: ${oracleSource} → ${currency_local} rate: ${fxRate}`);
    
    // Convert to USD
    const amountUsd = amount_local / fxRate;
    
    // Calculate fee in USD (0.7%)
    const feeUsd = +(amountUsd * IPAYX_FEE_PCT).toFixed(2);
    
    // Convert fee back to local currency
    const feeLocal = +(feeUsd * fxRate).toFixed(2);
    
    // Determine settlement asset
    const settlementAsset = 'USDC';
    
    const result = {
      success: true,
      amount_local,
      currency_local,
      fx_rate: fxRate,
      amount_usd: +amountUsd.toFixed(2),
      fee_usd: feeUsd,
      fee_local: feeLocal,
      fee_pct: IPAYX_FEE_PCT * 100,
      settlement_asset: settlementAsset,
      oracle_source: oracleSource,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Fee calculated:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Fee calculation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
