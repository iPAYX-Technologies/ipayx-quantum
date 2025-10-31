import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from "https://esm.sh/zod@3.22.4";
import { validateWebhookSignature } from '../_shared/webhook-validator.ts';
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const kycWebhookSchema = z.object({
  user_id: z.string().uuid("Invalid user ID").optional(),
  email: z.string().email("Invalid email format"),
  kyc_status: z.enum(['pending', 'approved', 'rejected'], { errorMap: () => ({ message: "Invalid KYC status" }) }),
  account_id: z.string().max(255).optional(),
  partner_id: z.string().max(255).optional(),
  kyc_url: z.string().url("Invalid KYC URL").optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // 1. Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    
    const rateLimit = await checkIpRateLimit(clientIP, 'webhook:kyc', 100);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests',
        requestId 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Retry-After': '60', 'Content-Type': 'application/json' }
      });
    }

    // 2. Validate webhook signature
    const signature = req.headers.get('x-webhook-signature');
    const secret = Deno.env.get('KYC_WEBHOOK_SECRET');
    
    if (!signature || !secret) {
      console.error('Missing webhook signature or secret');
      return new Response(
        JSON.stringify({ error: 'Webhook signature required', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const bodyString = JSON.stringify(body);
    
    const isValid = await validateWebhookSignature(bodyString, signature, secret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature', requestId }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('KYC webhook received, RequestID:', requestId);

    // 3. Validate and sanitize input
    const validation = kycWebhookSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.issues[0].message);
      return new Response(
        JSON.stringify({ 
          error: validation.error.issues[0].message,
          requestId 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, email, kyc_status, account_id, partner_id, kyc_url } = validation.data;

    // 4. Idempotency check (replay protection)
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('provider', 'kyc')
      .eq('event_type', 'kyc_status_update')
      .eq('payload->>email', email)
      .eq('payload->>kyc_status', kyc_status)
      .gte('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
      .maybeSingle();

    if (existing) {
      console.info(`KYC webhook already processed for: ${email}`);
      return new Response(JSON.stringify({ 
        status: 'already_processed',
        requestId 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Store webhook event FIRST (for idempotency)
    await supabase.from('webhook_events').insert({
      provider: 'kyc',
      event_type: 'kyc_status_update',
      payload: validation.data,
      created_at: new Date().toISOString()
    });

    // Update user account with KYC status
    const { data, error } = await supabase
      .from('user_accounts')
      .update({
        kyc_status,
        partner_account_id: account_id,
        partner_kyc_url: kyc_url,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating user account:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Database operation failed',
          requestId 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User account updated:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'KYC status updated successfully',
        requestId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in kyc-webhook:', error);
    
    // Sanitized error response
    const errorMessage = error instanceof z.ZodError 
      ? 'Invalid payload structure'
      : error?.name === 'SyntaxError'
      ? 'Invalid JSON'
      : 'Processing failed';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        requestId 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});