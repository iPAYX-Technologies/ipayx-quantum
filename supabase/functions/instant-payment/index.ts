import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * iPAYX Protocol - Instant Payment to MetaMask
 * Prélève automatiquement 0.7% (calculé en USD stable) et l'envoie vers le wallet iPAYX
 * Settlement: USDC (default) ou USDT (Tron)
 */

const IPAYX_WALLET = Deno.env.get('IPAYX_WALLET_ADDRESS');
if (!IPAYX_WALLET) {
  throw new Error('IPAYX_WALLET_ADDRESS not configured');
}
const IPAYX_FEE_PCT = 0.007; // 0.7% en USD

// Validation schema for payment inputs
const paymentSchema = z.object({
  amount: z.number()
    .min(1, "Amount must be at least $1")
    .max(10000000, "Amount exceeds maximum limit"),
  chain: z.enum(['ETHEREUM', 'TRON', 'POLYGON', 'BSC', 'STELLAR', 'XRPL'], {
    errorMap: () => ({ message: 'Invalid blockchain network' })
  }),
  token: z.enum(['USDC', 'USDT'], {
    errorMap: () => ({ message: 'Unsupported token' })
  }),
  userAddress: z.string()
    .trim()
    .min(10, "Invalid wallet address")
    .max(100, "Address too long"),
  userEmail: z.string().email("Invalid email address"),
  currency: z.enum(['USD', 'CAD', 'EUR', 'GBP']).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔐 Validate API key
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      console.error('❌ Missing API key');
      return new Response(
        JSON.stringify({ error: 'Missing API key. Include Authorization: Bearer ipx_live_xxx header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check API key validity and scopes
    const { validateApiKey } = await import('../_shared/auth-middleware.ts');
    const auth = await validateApiKey(apiKey, ['payments:write']);
    if (!auth.valid) {
      console.error('❌ Invalid API key or insufficient scopes:', auth.error);
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply rate limiting (5 requests/minute for payments)
    const { checkRateLimit } = await import('../_shared/rate-limiter.ts');
    const rateLimit = await checkRateLimit(apiKey, 'payments');
    if (!rateLimit.allowed) {
      console.error('❌ Rate limit exceeded for API key:', apiKey.substring(0, 12));
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 10 payments per minute.',
          reset_at: rateLimit.resetAt
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': rateLimit.resetAt
          } 
        }
      );
    }

    console.log(`✅ API key validated for project: ${auth.projectId}`);

    const body = await req.json();
    
    // Validate input with Zod schema
    const validation = paymentSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.issues[0].message);
      return new Response(
        JSON.stringify({ error: validation.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, chain, token, userAddress, userEmail, currency } = validation.data;

    console.log(`💰 Processing instant payment — Amount: ${amount} ${token} on ${chain}`);

    // Get real-time FX rate from oracle
    const currencyLocal = currency || 'USD';
    let fxRate = 1.0;
    let fxSource = 'direct';

    if (currencyLocal !== 'USD') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      const fxResponse = await fetch(`${supabaseUrl}/functions/v1/fx-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          base: currencyLocal,
          dest: 'USD'
        })
      });

      if (!fxResponse.ok) {
        console.error('❌ FX oracle error:', await fxResponse.text());
        throw new Error('Unable to fetch current FX rates. Please try again.');
      }

      const fxData = await fxResponse.json();
      fxRate = fxData.rate;
      fxSource = 'live-oracle';
      
      // Check rate staleness (max 5 minutes old)
      if (fxData.timestamp) {
        const ageSeconds = (Date.now() - new Date(fxData.timestamp).getTime()) / 1000;
        if (ageSeconds > 300) {
          throw new Error('FX rates are stale. Please contact support.');
        }
      }

      console.log(`📊 Live FX Rate: ${currencyLocal}/USD = ${fxRate} at ${fxData.timestamp}`);
    }

    const amountUsd = amount / fxRate;

    // Calculer le montant des frais iPAYX (0.7% en USD)
    const feeUsd = +(amountUsd * IPAYX_FEE_PCT).toFixed(2);
    const feeLocal = +(feeUsd * fxRate).toFixed(2);
    const amountAfterFeeUsd = amountUsd - feeUsd;

    // Settlement asset (USDC ou USDT selon chain)
    const settlementAsset = chain === 'TRON' ? 'USDT' : 'USDC';
    const chainLower = chain.toLowerCase();

    console.log(`💸 iPAYX Fee: ${feeUsd} USD (${feeLocal} ${currencyLocal}) — 0.7%`);
    console.log(`✅ User receives: ${amountAfterFeeUsd.toFixed(2)} USD`);
    console.log(`📍 iPAYX Wallet: ${IPAYX_WALLET}`);
    console.log(`🔐 Settlement: ${settlementAsset}`);

    // Call send-ipayx-fee edge function for real blockchain payment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    const feeResponse = await fetch(`${supabaseUrl}/functions/v1/send-ipayx-fee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        amount_usd: feeUsd,
        chain: chainLower,
        settlement_asset: settlementAsset,
        client_address: userAddress
      })
    });

    if (!feeResponse.ok) {
      const feeError = await feeResponse.json();
      console.error('❌ Fee payment failed:', feeError);
      throw new Error(`Fee payment failed: ${feeError.message || 'Unknown error'}`);
    }

    const feeResult = await feeResponse.json();
    const { tx_hash, explorer_url } = feeResult;

    console.log(`✅ Fee payment confirmed: ${tx_hash}`);

    // Send confirmation email via SendGrid
    try {
      const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
      
      if (SENDGRID_API_KEY) {
        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: userEmail }],
              subject: `✅ iPAYX Payment Confirmed - ${amountUsd} USD`
            }],
            from: { 
              email: 'noreply@ipayx.ai', 
              name: 'iPAYX Protocol' 
            },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); border-radius: 12px;">
                  <h1 style="color: white;">✅ Payment Confirmed</h1>
                  <div style="background: white; color: #1e293b; padding: 20px; border-radius: 8px;">
                    <p><strong>💰 Amount:</strong> ${amountUsd} USD</p>
                    <p><strong>💳 Fee (0.7%):</strong> ${feeUsd} USD</p>
                    <p><strong>⛓️ Chain:</strong> ${chainLower}</p>
                    <p><strong>🔗 Transaction:</strong> <code>${tx_hash}</code></p>
                    <a href="${explorer_url}" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #0891b2; color: white; text-decoration: none; border-radius: 5px;">View on Explorer</a>
                  </div>
                </div>
              `
            }]
          })
        });

        if (!emailResponse.ok) {
          console.warn('⚠️ Email failed but payment succeeded:', await emailResponse.text());
        } else {
          console.log('📧 Confirmation email sent to:', userEmail);
        }
      }
    } catch (emailError) {
      console.warn('⚠️ Email error (payment still succeeded):', emailError);
    }
    
    const result = {
      success: true,
      ipayxFee: {
        amount_usd: feeUsd,
        amount_local: feeLocal,
        currency_local: currencyLocal,
        settlement_asset: settlementAsset,
        wallet_address: IPAYX_WALLET,
        chain,
        tx_hash,
        explorer_url
      },
      userPayment: {
        amount_usd: +amountAfterFeeUsd.toFixed(2),
        amount_local: +(amount - feeLocal).toFixed(2),
        currency_local: currencyLocal,
        token,
        user_address: userAddress,
        chain
      },
      fx_rate: fxRate,
      oracle_source: fxSource,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Instant payment processed:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Instant payment error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Payment processing failed. Please check your input and try again.' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
