import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, amount, toAddress, asset } = await req.json();

    console.log(`[Payment Simulator] Starting payment simulation for ${amount} ${asset} to ${toAddress}`);

    // Simulate wallet connection
    console.log(`🔐 Connecting to ${provider} wallet...`);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate gas estimation
    const gasEstimate = provider === 'Tron USDT' ? 0.02 : 0.05;
    console.log(`⛽ Gas estimated: ${gasEstimate} ${asset}`);

    // Simulate transaction submission
    const txid = `0x${Math.random().toString(16).slice(2, 66)}`;
    console.log(`📤 Submitting transaction...`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate confirmation
    console.log(`✅ Transaction confirmed: ${txid}`);
    console.log(`💰 Paid ${amount} ${asset} to ${toAddress}`);

    return new Response(
      JSON.stringify({
        success: true,
        txid,
        message: `Paid ${amount} ${asset} to wallet`,
        details: {
          provider,
          amount,
          asset,
          toAddress,
          gasUsed: gasEstimate,
          timestamp: new Date().toISOString()
        },
        logs: [
          `🔐 Connected to ${provider}`,
          `⛽ Gas estimated: ${gasEstimate} ${asset}`,
          `📤 Transaction submitted: ${txid}`,
          `✅ Confirmed in 2 blocks`,
          `💰 Paid ${amount} ${asset} to ${toAddress}`
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Payment simulation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
