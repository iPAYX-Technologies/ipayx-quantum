import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.22.4";
import { ethers } from "https://esm.sh/ethers@6.10.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * iPAYX Protocol - Real Blockchain Fee Payment
 * Sends 0.7% fee in USDC to iPAYX wallet on Polygon
 */

const IPAYX_WALLET = Deno.env.get('IPAYX_WALLET_ADDRESS');
if (!IPAYX_WALLET) {
  throw new Error('IPAYX_WALLET_ADDRESS not configured');
}
const POLYGON_RPC = "https://polygon-rpc.com";
const USDC_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon

// Security limits to mitigate wallet key compromise
const MAX_SINGLE_WITHDRAWAL_USD = 10000; // $10K per transaction
const MAX_DAILY_WITHDRAWAL_USD = 50000; // $50K per day

interface FeeRequest {
  amount_usd: number;
  chain: string;
  settlement_asset: string;
  client_address: string;
}

// Zod validation schema for fee requests
const feeRequestSchema = z.object({
  amount_usd: z.number()
    .min(0.01, "Minimum fee amount is $0.01")
    .max(1000000, "Maximum fee amount is $1,000,000")
    .finite("Amount must be a finite number"),
  chain: z.enum(
    ["polygon", "ethereum", "arbitrum", "base", "optimism", "tron", "hedera", "bsc", "stellar", "xrpl"],
    { errorMap: () => ({ message: "Unsupported blockchain for fee payment" }) }
  ),
  settlement_asset: z.enum(
    ["USDC", "USDT"],
    { errorMap: () => ({ message: "Settlement asset must be USDC or USDT" }) }
  ),
  client_address: z.string()
    .trim()
    .min(10, "Client address too short")
    .max(100, "Client address too long")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = feeRequestSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      console.error('❌ Fee request validation failed:', firstError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid fee request', 
          details: firstError.message,
          field: firstError.path.join('.')
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount_usd, chain, settlement_asset, client_address } = validation.data;

    console.log(`💸 Processing iPAYX fee payment: ${amount_usd} USD on ${chain}`);

    // Security check: withdrawal limits
    const feeAmount = amount_usd * 0.007;
    
    if (feeAmount > MAX_SINGLE_WITHDRAWAL_USD) {
      console.error(`❌ Fee amount ${feeAmount} USD exceeds single transaction limit`);
      return new Response(
        JSON.stringify({ 
          error: 'Withdrawal limit exceeded', 
          details: `Maximum single withdrawal is $${MAX_SINGLE_WITHDRAWAL_USD}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily withdrawal limit
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: dailyFees, error: dailyError } = await supabase
      .from('ipayx_fees')
      .select('fee_usd')
      .gte('created_at', today.toISOString())
      .eq('status', 'confirmed');

    if (dailyError) {
      console.error('❌ Error checking daily limit:', dailyError);
    } else {
      const dailyTotal = (dailyFees || []).reduce((sum, fee) => sum + Number(fee.fee_usd), 0);
      
      if (dailyTotal + feeAmount > MAX_DAILY_WITHDRAWAL_USD) {
        console.error(`❌ Daily limit reached: ${dailyTotal} + ${feeAmount} > ${MAX_DAILY_WITHDRAWAL_USD}`);
        return new Response(
          JSON.stringify({ 
            error: 'Daily withdrawal limit reached', 
            details: `Daily limit is $${MAX_DAILY_WITHDRAWAL_USD}. Current: $${dailyTotal.toFixed(2)}` 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get private key from Supabase Secrets
    const privateKey = Deno.env.get('IPAYX_WALLET_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('IPAYX_WALLET_PRIVATE_KEY not configured');
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    // USDC contract interface
    const usdcContract = new ethers.Contract(
      USDC_POLYGON,
      ["function transfer(address to, uint256 amount) returns (bool)"],
      wallet
    );

    // Calculate fee in USDC (6 decimals) - already calculated above for limits
    const amount = ethers.parseUnits(feeAmount.toFixed(6), 6);

    // Send real blockchain transaction
    console.log(`💸 Sending ${feeAmount} USDC to ${IPAYX_WALLET}...`);
    const tx = await usdcContract.transfer(IPAYX_WALLET, amount);

    // Wait for confirmation
    console.log(`⏳ Waiting for confirmation: ${tx.hash}`);
    const receipt = await tx.wait();

    const tx_hash = receipt.hash;
    const explorer_url = `https://polygonscan.com/tx/${tx_hash}`;

    console.log(`✅ Fee transaction confirmed: ${tx_hash}`);
    console.log(`📍 Explorer URL: ${explorer_url}`);

    // Alert on large withdrawals
    if (feeAmount > 1000) {
      console.warn(`🚨 Large withdrawal detected: $${feeAmount.toFixed(2)} USD`);
      console.warn(`Transaction: ${explorer_url}`);
      // In production, send email alert to security team
    }

    // Supabase client already initialized above for daily limit check

    const { error: insertError } = await supabase
      .from('ipayx_fees')
      .insert({
        amount_usd,
        fee_usd: amount_usd * 0.007,
        tx_hash,
        chain,
        settlement_asset,
        client_address,
        explorer_url,
        status: 'confirmed' // In production, start as 'pending' and update after confirmation
      });

    if (insertError) {
      console.error('❌ Error logging fee to database:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        tx_hash,
        explorer_url,
        status: 'confirmed',
        chain,
        settlement_asset
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Fee payment error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Fee payment failed',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
