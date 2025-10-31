import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🧪 Test email edge function started');

  // Security: Admin-only access
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Verify admin role
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roles) {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { 
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    console.log('📤 Sending test email via SendGrid...');
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'ybolduc@ipayx.ai', name: 'Yannick Bolduc' }],
          subject: '🧪 Test Email from iPAYX Protocol'
        }],
        from: { 
          email: 'noreply@ipayx.ai', 
          name: 'iPAYX Protocol' 
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); border-radius: 12px;">
              <h1 style="color: white; margin-bottom: 20px;">🚀 iPAYX - Test Email Successful!</h1>
              <div style="background: white; color: #1e293b; padding: 20px; border-radius: 8px;">
                <p><strong>📧 Destinataire:</strong> ybolduc@ipayx.ai</p>
                <p><strong>⏰ Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>✅ Status:</strong> <span style="color: #16a34a; font-weight: bold;">EMAIL SYSTEM OPERATIONAL</span></p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                  Edge Function: <code>supabase/functions/test-email</code><br>
                  Project: iPAYX Protocol v4<br>
                  Provider: SendGrid (Twilio)
                </p>
              </div>
            </div>
          `
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SendGrid error:', response.status, errorText);
      throw new Error(`SendGrid error: ${response.status} - ${errorText}`);
    }

    console.log('✅ Test email sent successfully via SendGrid!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test email sent to ybolduc@ipayx.ai',
        provider: 'SendGrid',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('💥 Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
