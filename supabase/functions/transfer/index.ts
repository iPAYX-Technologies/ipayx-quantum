import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://esm.sh/zod@3.22.4';
import { validateApiKey } from '../_shared/auth-middleware.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const transferSchema = z.object({
  provider: z.enum(['tron-usdt', 'sei-evm', 'evm-multi', 'stellar-sep24', 'xrpl-native']),
  fromChain: z.string().max(50),
  toChain: z.string().max(50),
  token: z.string().max(20),
  amount: z.number().min(0.01).max(10000000),
  fromAddress: z.string().min(10).max(100),
  toAddress: z.string().min(10).max(100)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const auth = await validateApiKey(apiKey, ['transfers:write']);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ error: auth.error }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(apiKey, 'execute');
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetAt: rateLimit.resetAt 
        }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const validation = transferSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validation.error.issues[0].message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { provider, fromChain, toChain, token, amount, fromAddress, toAddress } = validation.data;
    
    console.log(`🔄 Transfer request:`, { provider, fromChain, toChain, token, amount });
    
    // Route vers le bon provider
    let txHash: string;
    let explorerUrl: string;
    
    switch (provider) {
      case "tron-usdt":
        // TODO: Implémenter TronWeb transfer
        txHash = `TRON_${Date.now()}`;
        explorerUrl = `https://tronscan.org/#/transaction/${txHash}`;
        break;
        
      case "sei-evm":
        // TODO: Implémenter Sei EVM transfer
        txHash = `SEI_${Date.now()}`;
        explorerUrl = `https://seitrace.com/tx/${txHash}`;
        break;
        
      case "evm-multi":
        // TODO: Implémenter viem transfer
        txHash = `EVM_${Date.now()}`;
        explorerUrl = `https://etherscan.io/tx/${txHash}`;
        break;
        
      case "stellar-sep24":
        // Appeler Edge Function Stellar
        const stellarResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/stellar-transfer`,
          {
            method: "POST",
            headers: { 
              "apikey": Deno.env.get('SUPABASE_ANON_KEY') || "",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ token, fromAddress, toAddress, amount })
          }
        );
        const stellarResult = await stellarResponse.json();
        txHash = stellarResult.txHash;
        explorerUrl = stellarResult.explorerUrl;
        break;
        
      case "xrpl-native":
        // Appeler Edge Function XRPL
        const xrplResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/xrpl-transfer`,
          {
            method: "POST",
            headers: { 
              "apikey": Deno.env.get('SUPABASE_ANON_KEY') || "",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ token, fromAddress, toAddress, amount })
          }
        );
        const xrplResult = await xrplResponse.json();
        txHash = xrplResult.txHash;
        explorerUrl = xrplResult.explorerUrl;
        break;
        
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    console.log(`✅ Transfer submitted: ${txHash}`);
    
    // Log completed transfer
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userAccount } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('email', 'demo@ipayx.com')
      .maybeSingle();

    if (userAccount) {
      await supabase.from('transaction_logs').insert({
        user_account_id: userAccount.id,
        from_chain: fromChain,
        to_chain: toChain,
        asset: token,
        amount: amount,
        status: 'completed',
        tx_hash: txHash,
        partner_response: {
          provider: provider,
          explorer_url: explorerUrl,
          completed_at: new Date().toISOString()
        }
      });
      
      console.log('✅ Transfer logged:', txHash);
    }
    
    return new Response(
      JSON.stringify({
        txHash,
        explorerUrl,
        status: 'submitted',
        provider,
        note: 'Simulated transfer - replace with real implementation'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Transfer error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Transfer failed', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
