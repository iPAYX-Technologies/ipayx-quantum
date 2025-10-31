import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schema
const circlePaymentSchema = z.object({
  amount: z.number().min(100).max(10000000),
  currency: z.enum(['USD', 'CAD', 'EUR', 'GBP']),
  method: z.enum(['wire', 'ach', 'sepa', 'eft', 'card', 'bank']),
  country: z.string().length(2),
  customerEmail: z.string().email(),
  description: z.string().max(200)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract client IP for rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';

  // Check rate limit (30 req/min)
  const rateLimit = await checkIpRateLimit(clientIp, 'circle-payment', 30);
  
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again in 1 minute.',
        retryAfter: 60 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        } 
      }
    );
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = circlePaymentSchema.parse(body);
    const { amount, currency, method, description, customerEmail, country } = validatedData;
    const CIRCLE_API_KEY = Deno.env.get('CIRCLE_API_KEY');

    if (!CIRCLE_API_KEY) {
      throw new Error('CIRCLE_API_KEY not configured');
    }

    console.log('Creating Circle payment:', { amount, currency, method, country });

    // Determine payment source based on method and country
    let source;
    let verification = 'cvv';
    
    if (method === 'wire') {
      source = { type: 'wire' };
      verification = 'none';
    } else if (method === 'eft') {
      source = { type: 'eft' };
      verification = 'micro_deposits';
    } else if (method === 'bank' || method === 'ach') {
      source = country === 'US' ? { type: 'ach' } : { type: 'sepa' };
      verification = 'micro_deposits';
    } else if (method === 'sepa') {
      source = { type: 'sepa' };
      verification = 'micro_deposits';
    } else {
      // Card / Apple Pay / Google Pay
      source = { type: 'card' };
      verification = 'cvv';
    }

    // Create Circle payment
    const res = await fetch('https://api.circle.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: { amount: amount.toString(), currency },
        description,
        settlementCurrency: 'USD',
        metadata: { email: customerEmail, country, method },
        source,
        verification,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('Circle API error:', data);
      throw new Error(`Circle API error: ${JSON.stringify(data)}`);
    }

    console.log('Circle payment created:', data.data.id);

    // Log transaction
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('transaction_logs').insert({
      external_id: data.data.id,
      provider: 'circle',
      amount,
      currency,
      status: 'pending',
      metadata: { customerEmail, country, method },
      created_at: new Date().toISOString(),
    });

    const checkoutUrl = `https://checkout.circle.com/payment/${data.data.id}`;

    return new Response(
      JSON.stringify({ 
        checkoutUrl,
        paymentId: data.data.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Circle payment error:', error);
    
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Sanitize error message (don't expose internal details)
    const sanitizedError = error instanceof z.ZodError 
      ? 'Invalid payment parameters' 
      : 'Payment processing failed';
    
    // Log failed attempt to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    try {
      await supabase.from('failed_transactions').insert({
        endpoint: 'circle-payment',
        error_type: error instanceof z.ZodError ? 'validation_error' : 'processing_error',
        client_ip: clientIp,
        user_agent: userAgent,
        request_payload: error instanceof z.ZodError ? null : { 
          amount: (error as any).body?.amount, 
          currency: (error as any).body?.currency 
        },
        error_message: sanitizedError,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: sanitizedError }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
