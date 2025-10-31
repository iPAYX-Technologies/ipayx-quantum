import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';
import { validateWebhookSignature } from '../_shared/webhook-validator.ts';
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cc-webhook-signature',
};

// Comprehensive Zod schema for Coinbase webhooks
const coinbaseWebhookSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum([
    'charge:created',
    'charge:confirmed',
    'charge:failed',
    'charge:pending',
    'charge:delayed'
  ]),
  created_at: z.string(),
  data: z.object({
    id: z.string().min(1).max(100),
    code: z.string().max(50).optional(),
    addresses: z.array(z.object({
      transaction_hash: z.string().optional()
    })).optional(),
    pricing: z.object({
      local: z.object({
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        currency: z.string().length(3).regex(/^[A-Z]{3}$/)
      }).optional()
    }).optional()
  })
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
    
    const rateLimit = await checkIpRateLimit(clientIP, 'webhook:coinbase', 100);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        error: 'Too many requests',
        requestId 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Retry-After': '60' }
      });
    }

    // 2. Signature validation
    const signature = req.headers.get('x-cc-webhook-signature');
    const secret = Deno.env.get('COINBASE_WEBHOOK_SECRET');
    const body = await req.text();

    if (!secret) {
      console.error('COINBASE_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ 
        error: 'Configuration error',
        requestId 
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    if (!signature) {
      console.error('Missing Coinbase webhook signature');
      return new Response(JSON.stringify({ 
        error: 'Missing signature',
        requestId 
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!await validateWebhookSignature(body, signature, secret)) {
      console.error('Invalid Coinbase webhook signature');
      return new Response(JSON.stringify({ 
        error: 'Invalid signature',
        requestId 
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // 3. Parse and validate payload structure
    let rawEvent;
    try {
      rawEvent = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON',
        requestId 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const validation = coinbaseWebhookSchema.safeParse(rawEvent);
    
    if (!validation.success) {
      console.error('Invalid Coinbase webhook payload:', validation.error.issues[0].message);
      return new Response(JSON.stringify({ 
        error: 'Invalid payload structure',
        requestId 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const event = validation.data;
    console.log('Received Coinbase webhook:', event.type, 'RequestID:', requestId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Idempotency check (replay protection)
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('provider', 'coinbase')
      .eq('event_type', event.type)
      .eq('payload->>id', event.id)
      .maybeSingle();

    if (existing) {
      console.info(`Webhook already processed: ${event.id}`);
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
      provider: 'coinbase',
      event_type: event.type,
      payload: event,
      created_at: new Date().toISOString()
    });

    // Handle different event types
    switch (event.type) {
      case 'charge:confirmed':
        console.log('Coinbase charge confirmed:', event.data.id);
        if (event.data.id) {
          await supabase.from('transaction_logs').update({
            status: 'completed',
            tx_hash: event.data.addresses?.[0]?.transaction_hash
          }).eq('external_id', event.data.id);
        }
        break;

      case 'charge:failed':
        console.log('Coinbase charge failed:', event.data.id);
        if (event.data.id) {
          await supabase.from('transaction_logs').update({
            status: 'failed'
          }).eq('external_id', event.data.id);
        }
        break;

      case 'charge:pending':
        console.log('Coinbase charge pending:', event.data.id);
        break;

      default:
        console.log('Unhandled Coinbase event type:', event.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Coinbase webhook error:', error);
    
    // Sanitized error response
    const errorMessage = error instanceof z.ZodError 
      ? 'Invalid payload structure'
      : error.name === 'SyntaxError'
      ? 'Invalid JSON'
      : 'Processing failed';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
