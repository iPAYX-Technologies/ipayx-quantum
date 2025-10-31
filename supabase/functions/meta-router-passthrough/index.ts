import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { rateLimit } from '../_shared/rate-limit-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add rate limiting (60 requests per minute)
  const rateLimitResult = await rateLimit(req, {
    maxRequests: 60,
    windowMs: 60000,
    identifier: 'meta-router-passthrough'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('Meta Router request:', payload);

    const { email, from_chain, to_chain, asset, amount } = payload;

    // Validate required fields
    if (!email || !from_chain || !to_chain || !asset || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user account and verify KYC status
    const { data: userAccount, error: userError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userAccount) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify KYC is approved
    if (userAccount.kyc_status !== 'approved') {
      return new Response(
        JSON.stringify({ 
          error: 'KYC not approved', 
          kyc_status: userAccount.kyc_status,
          kyc_url: userAccount.partner_kyc_url 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get partner integration details
    const { data: partner, error: partnerError } = await supabase
      .from('partner_integrations')
      .select('*')
      .eq('partner_type', userAccount.partner_id)
      .single();

    if (partnerError || !partner) {
      console.error('Partner not found:', partnerError);
      return new Response(
        JSON.stringify({ error: 'Partner integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PASS-THROUGH: Call partner API (no funds stored in iPayX)
    console.log(`Calling partner API: ${partner.api_endpoint}`);
    
    // Simulate partner API call (replace with actual API call)
    const partnerResponse = {
      tx_hash: `0x${Math.random().toString(16).substring(2)}`,
      status: 'pending',
      timestamp: new Date().toISOString(),
      from_chain,
      to_chain,
      asset,
      amount,
    };

    // Log transaction metadata (no funds stored)
    const { data: txLog, error: txError } = await supabase
      .from('transaction_logs')
      .insert({
        user_account_id: userAccount.id,
        from_chain,
        to_chain,
        asset,
        amount,
        tx_hash: partnerResponse.tx_hash,
        status: partnerResponse.status,
        partner_response: partnerResponse,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error logging transaction:', txError);
    }

    console.log('Transaction logged:', txLog);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Transaction initiated via partner (pass-through)',
        tx_hash: partnerResponse.tx_hash,
        status: partnerResponse.status,
        timestamp: partnerResponse.timestamp,
        note: 'iPayX does not hold funds - all custody with partner'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in meta-router-passthrough:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});