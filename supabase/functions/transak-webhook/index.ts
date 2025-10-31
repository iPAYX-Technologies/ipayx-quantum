import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-transak-signature',
};

// Comprehensive Zod schema for Transak webhooks
const transakWebhookSchema = z.object({
  eventName: z.enum([
    'ORDER_COMPLETED',
    'ORDER_FAILED',
    'ORDER_PROCESSING',
    'ORDER_CANCELLED',
    'ORDER_REFUNDED'
  ]),
  webhookData: z.object({
    id: z.string().min(1).max(100),
    createdAt: z.string(),
    status: z.string().max(50),
    cryptoCurrency: z.string().max(20).optional(),
    cryptoAmount: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    fiatCurrency: z.string().length(3).optional(),
    fiatAmount: z.number().or(z.string()).optional(),
    network: z.string().max(50).optional(),
    transactionHash: z.string().max(200).optional(),
    walletAddress: z.string().max(200).optional()
  })
}).or(z.object({
  eventName: z.enum([
    'ORDER_COMPLETED',
    'ORDER_FAILED',
    'ORDER_PROCESSING',
    'ORDER_CANCELLED',
    'ORDER_REFUNDED'
  ]),
  data: z.object({
    id: z.string().min(1).max(100),
    createdAt: z.string().optional(),
    status: z.string().max(50).optional(),
    cryptoCurrency: z.string().max(20).optional(),
    cryptoAmount: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    network: z.string().max(50).optional(),
    transactionHash: z.string().max(200).optional()
  })
}));

// Simple HMAC-SHA256 signature verification
async function verifyTransakSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedSignature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // 1. Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    
    const rateLimit = await checkIpRateLimit(clientIP, 'webhook:transak', 100);
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
    const signature = req.headers.get('x-transak-signature');
    const secret = Deno.env.get('TRANSAK_WEBHOOK_SECRET');
    const body = await req.text();

    if (!secret) {
      console.error('TRANSAK_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ 
        error: 'Configuration error',
        requestId 
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    if (signature && !await verifyTransakSignature(body, signature, secret)) {
      console.error('Invalid Transak webhook signature');
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
    
    const validation = transakWebhookSchema.safeParse(rawEvent);
    
    if (!validation.success) {
      console.error('Invalid Transak webhook payload:', validation.error.issues[0].message);
      return new Response(JSON.stringify({ 
        error: 'Invalid payload structure',
        requestId 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const event = validation.data;
    const eventData = 'webhookData' in event ? event.webhookData : event.data;
    console.log('Received Transak webhook:', event.eventName, 'RequestID:', requestId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Idempotency check (replay protection)
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('provider', 'transak')
      .eq('event_type', event.eventName)
      .eq('payload->>id', eventData.id || 'unknown')
      .maybeSingle();

    if (existing) {
      console.info(`Webhook already processed: ${eventData.id}`);
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
      provider: 'transak',
      event_type: event.eventName,
      payload: event,
      created_at: new Date().toISOString()
    });

    // 6. Process webhook (now safe)
    switch (event.eventName) {
      case 'ORDER_COMPLETED':
        console.log('Transak order completed:', eventData.id);
        await supabase.from('transaction_logs').insert({
          from_chain: 'fiat',
          to_chain: eventData.network || 'unknown',
          asset: eventData.cryptoCurrency || 'USDC',
          amount: parseFloat(eventData.cryptoAmount || '0'),
          status: 'completed',
          tx_hash: eventData.transactionHash,
          external_id: eventData.id,
          partner_response: event
        });
        break;

      case 'ORDER_FAILED':
        console.log('Transak order failed:', eventData.id);
        await supabase.from('transaction_logs').insert({
          from_chain: 'fiat',
          to_chain: eventData.network || 'unknown',
          asset: eventData.cryptoCurrency || 'USDC',
          amount: parseFloat(eventData.cryptoAmount || '0'),
          status: 'failed',
          external_id: eventData.id,
          partner_response: event
        });
        break;

      case 'ORDER_PROCESSING':
        console.log('Transak order processing:', eventData.id);
        break;

      default:
        console.log('Unhandled Transak event:', event.eventName);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Transak webhook error:', error);
    
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
