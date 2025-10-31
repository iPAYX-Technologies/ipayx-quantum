import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HTML escaping function to prevent XSS in email templates
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const submitLeadSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(100, "Name too long").optional(),
  email: z.string().trim().email("Invalid email format").max(255, "Email too long"),
  company: z.string().trim().min(2, "Company name too short").max(100, "Company name too long"),
  country: z.string().trim().max(60, "Country too long").optional(),
  monthlyVolume: z.string().max(50, "Volume description too long").optional(),
  message: z.string().trim().min(10, "Message too short").max(1000, "Message too long"),
  language: z.enum(['en', 'fr']).optional(),
  source: z.string().optional()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit by IP to prevent spam
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = await checkIpRateLimit(clientIP, 'submit-lead', 10); // 10 requests per minute
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('📥 Received body:', JSON.stringify(body, null, 2));
    
    // Validate and sanitize input
    const validation = submitLeadSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.issues);
      return new Response(
        JSON.stringify({ error: validation.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, company, country, monthlyVolume, message, language } = validation.data;
    
    console.log('📩 New lead submission received');
    console.log('   Email:', email);
    console.log('   Company:', company);
    console.log('   Country:', country);
    console.log('   Monthly Volume:', monthlyVolume);
    console.log('   Message length:', message.length);
    console.log('   Language:', language);

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Insert into leads table
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: name || company,
        email,
        company,
        country: country || null,
        monthly_volume: monthlyVolume,
        message,
        source: body.source || 'landing-contact-form',
        metadata: {
          language,
          submitted_at: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || 'unknown'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database insertion error:', error);
      throw error;
    }

    console.log('✅ Lead stored successfully');
    console.log('   Lead ID:', data.id);
    console.log('   Created at:', data.created_at);

    // Send notification email to ybolduc@ipayx.ai
    console.log('📤 Attempting to send notification email to ybolduc@ipayx.ai...');
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    if (!SENDGRID_API_KEY) {
      console.error('❌ CRITICAL: SENDGRID_API_KEY is NOT SET in environment variables!');
      console.error('⚠️ Email notification will be skipped. Please configure SENDGRID_API_KEY in Supabase secrets.');
    } else {
      console.log('✅ SENDGRID_API_KEY detected, length:', SENDGRID_API_KEY.length);
      console.log('📧 Preparing email to ybolduc@ipayx.ai...');
      
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0891b2;">🆕 New Lead from Landing Page</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(name || 'N/A')}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(email)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(company)}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Country:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(country || 'N/A')}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Monthly Volume:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(monthlyVolume || 'N/A')}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Message:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(message)}</td></tr>
              <tr><td style="padding: 8px;"><strong>Language:</strong></td><td style="padding: 8px;">${escapeHtml(language || 'en')}</td></tr>
            </table>
            <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">Lead ID: ${data.id} | Source: ${escapeHtml(body.source || 'landing-contact-form')} | Submitted: ${data.created_at}</p>
          </div>
        `;

        console.log('🚀 Calling SendGrid API...');
        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: 'ybolduc@ipayx.ai', name: 'Yannick Bolduc' }],
              subject: `[iPAYX Landing] ${company} - ${monthlyVolume || 'N/A'}`
            }],
            from: { email: 'noreply@ipayx.ai', name: 'iPayX Landing Form' },
            content: [{ type: 'text/html', value: emailHtml }]
          })
        });

        console.log('📮 SendGrid API response status:', emailResponse.status);

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('❌ SendGrid API ERROR:', errorText);
          console.error('📊 Response details:', {
            status: emailResponse.status,
            statusText: emailResponse.statusText,
            headers: Object.fromEntries(emailResponse.headers.entries())
          });
          
          if (emailResponse.status === 403) {
            console.error('🚨 AUTHENTICATION FAILED: SENDGRID_API_KEY is INVALID or UNAUTHORIZED');
            console.error('💡 Please verify your SendGrid API key has "Mail Send" permissions');
          } else if (emailResponse.status === 401) {
            console.error('🚨 UNAUTHORIZED: SENDGRID_API_KEY format is incorrect');
          }
        } else {
          console.log('✅ Email notification sent successfully to ybolduc@ipayx.ai!');
          console.log('📬 Email subject:', `[iPAYX Landing] ${company} - ${monthlyVolume || 'N/A'}`);
        }
      } catch (emailError: any) {
        console.error('💥 Email sending exception:', emailError.message);
        console.error('📚 Stack trace:', emailError.stack);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id,
        message: 'Lead submitted successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in submit-lead function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to submit lead. Please try again later.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
