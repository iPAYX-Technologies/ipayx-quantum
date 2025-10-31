import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { z } from 'https://esm.sh/zod@3.22.4';
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive Zod schema for SendGrid webhook events
const sendgridEventSchema = z.object({
  email: z.string().email().max(255),
  timestamp: z.number().int().positive(),
  event: z.enum([
    'delivered',
    'open',
    'click',
    'bounce',
    'dropped',
    'unsubscribe',
    'spamreport',
    'deferred',
    'processed'
  ]),
  sg_message_id: z.string().max(255),
  lead_id: z.string().uuid().optional(),
  campaign_type: z.string().max(100).optional(),
  url: z.string().url().optional()
});

const sendgridWebhookSchema = z.array(sendgridEventSchema);

function verifySignature(payload: string, signature: string, timestamp: string): boolean {
  const SENDGRID_WEBHOOK_KEY = Deno.env.get('SENDGRID_WEBHOOK_VERIFICATION_KEY');
  if (!SENDGRID_WEBHOOK_KEY) {
    console.error('❌ SENDGRID_WEBHOOK_VERIFICATION_KEY not configured');
    return false;
  }
  
  const signedPayload = timestamp + payload;
  const expectedSignature = createHmac('sha256', SENDGRID_WEBHOOK_KEY)
    .update(signedPayload)
    .digest('base64');
  
  return signature === expectedSignature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // 1. Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    
    const rateLimit = await checkIpRateLimit(clientIP, 'webhook:sendgrid', 100);
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
    const signature = req.headers.get('X-Twilio-Email-Event-Webhook-Signature');
    const timestamp = req.headers.get('X-Twilio-Email-Event-Webhook-Timestamp');
    
    if (!signature || !timestamp) {
      console.error('❌ Missing signature headers');
      return new Response(JSON.stringify({ 
        error: 'Missing signature',
        requestId 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // 3. Timestamp validation (replay protection)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 600) {
      console.error('❌ Timestamp too old or in future');
      return new Response(JSON.stringify({ 
        error: 'Timestamp invalid',
        requestId 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const payload = await req.text();
    
    if (!verifySignature(payload, signature, timestamp)) {
      console.error('❌ Invalid signature');
      return new Response(JSON.stringify({ 
        error: 'Invalid signature',
        requestId 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('✅ Signature verified, RequestID:', requestId);
    
    // 4. Parse and validate payload structure
    let rawEvents;
    try {
      rawEvents = JSON.parse(payload);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON',
        requestId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const validation = sendgridWebhookSchema.safeParse(rawEvents);
    
    if (!validation.success) {
      console.error('Invalid SendGrid webhook payload:', validation.error.issues[0].message);
      return new Response(JSON.stringify({ 
        error: 'Invalid payload structure',
        requestId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const events = validation.data;
    console.log(`📬 Received ${events.length} SendGrid events`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    for (const event of events) {
      const { event: eventType, sg_message_id, timestamp, lead_id, campaign_type } = event;
      const messageId = sg_message_id?.split('.')[0]; // Remove .filter suffix

      console.log(`📊 Event: ${eventType} for message: ${messageId}`);

      // Find campaign by SendGrid message ID
      const { data: campaigns, error: findError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('sendgrid_message_id', messageId);

      if (findError || !campaigns || campaigns.length === 0) {
        console.log(`⚠️ Campaign not found for message ID: ${messageId}`);
        continue;
      }

      const campaign = campaigns[0];
      const updates: any = {};

      // Map SendGrid events to campaign status
      switch (eventType) {
        case 'delivered':
          console.log(`✅ Email delivered to ${campaign.lead_id}`);
          break;
          
        case 'open':
          updates.opened_at = new Date(timestamp * 1000).toISOString();
          updates.status = 'opened';
          console.log(`👀 Email opened by ${campaign.lead_id}`);
          
          // Update lead stats
          await supabase
            .from('leads')
            .update({ last_opened_at: updates.opened_at })
            .eq('id', campaign.lead_id);
          break;
          
        case 'click':
          updates.clicked_at = new Date(timestamp * 1000).toISOString();
          updates.status = 'clicked';
          console.log(`🖱️ Link clicked by ${campaign.lead_id}`);
          
          // Update lead stats
          await supabase
            .from('leads')
            .update({ last_clicked_at: updates.clicked_at })
            .eq('id', campaign.lead_id);
          break;
          
        case 'bounce':
        case 'dropped':
          updates.bounced_at = new Date(timestamp * 1000).toISOString();
          updates.status = 'bounced';
          console.log(`❌ Email bounced for ${campaign.lead_id}`);
          break;
          
        case 'unsubscribe':
        case 'spamreport':
          updates.unsubscribed_at = new Date(timestamp * 1000).toISOString();
          updates.status = 'unsubscribed';
          console.log(`🚫 Unsubscribed: ${campaign.lead_id}`);
          break;
          
        default:
          console.log(`ℹ️ Unhandled event type: ${eventType}`);
      }

      // Update campaign if we have changes
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update(updates)
          .eq('id', campaign.id);

        if (updateError) {
          console.error(`❌ Failed to update campaign ${campaign.id}:`, updateError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: events.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ SendGrid webhook error:", error);
    
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});