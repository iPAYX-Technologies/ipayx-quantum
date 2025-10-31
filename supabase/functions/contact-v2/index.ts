import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const contactSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  name: z.string().trim().min(2, "Name too short").max(100, "Name too long")
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 CONTACT-V2 started');

  // Security: IP-based rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown';

  console.log('📍 Request from IP:', ip);

  // Rate limit: 5 requests per 5 minutes (300 seconds)
  const rateLimit = await checkIpRateLimit(ip, 'contact-v2', 5);

  if (!rateLimit.allowed) {
    console.log('⛔ Rate limit exceeded for IP:', ip);
    return new Response(
      JSON.stringify({ 
        error: 'Too many requests. Please try again in a few minutes.',
        remaining: 0
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '300'
        } 
      }
    );
  }

  console.log('✅ Rate limit OK. Remaining:', rateLimit.remaining);

  try {
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    // Parse and validate input
    const body = await req.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      console.error('❌ Validation failed:', firstError.message);
      return new Response(
        JSON.stringify({ 
          error: firstError.message,
          field: firstError.path[0]
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { email, name } = validation.data;

    // Sanitize name for HTML output (prevent XSS)
    const safeName = name.replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });

    console.log('📧 Sending test email to:', email);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email, name }],
          subject: '✅ iPayX - Test Email'
        }],
        from: { email: 'noreply@ipayx.ai', name: 'iPayX Protocol' },
        content: [{
          type: 'text/html',
          value: `<h1>Hello ${safeName}!</h1><p>This is a test email from iPayX.</p>`
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ SendGrid error:', response.status, error);
      throw new Error(`SendGrid error: ${response.status}`);
    }

    console.log('✅ Email sent successfully!');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('💥 ERROR:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
