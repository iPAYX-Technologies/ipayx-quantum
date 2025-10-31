import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const passwordResetSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 Password reset request received');

  try {
    // Validate input
    const body = await req.json();
    const validation = passwordResetSchema.safeParse(body);

    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validation.error.issues[0].message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email } = validation.data;
    console.log('📧 Generating reset link for:', email);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Generate password reset link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://ipayx.lovable.app'}/update-password`
      }
    });

    if (error) {
      console.error('❌ Supabase error generating link:', error);
      throw new Error(`Failed to generate reset link: ${error.message}`);
    }

    if (!data?.properties?.action_link) {
      throw new Error('No reset link generated');
    }

    console.log('✅ Reset link generated successfully');
    console.log('📤 Sending password reset email via SendGrid to:', email);

    // Get SendGrid API key
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    // Send email via SendGrid
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: 'Réinitialisation de votre mot de passe iPAYX'
        }],
        from: { 
          email: 'noreply@ipayx.ai', 
          name: 'iPAYX Protocol' 
        },
        content: [{
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">iPAYX</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Pure couche de routage</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                  <h2 style="color: #0891b2; margin-top: 0;">Réinitialisation de votre mot de passe</h2>
                  
                  <p>Bonjour,</p>
                  
                  <p>Vous avez demandé à réinitialiser votre mot de passe iPAYX. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.properties.action_link}" 
                       style="background: #06b6d4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                      Réinitialiser mon mot de passe
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px;">
                    <strong>Ce lien est valide pendant 1 heure.</strong>
                  </p>
                  
                  <p style="color: #666; font-size: 14px;">
                    Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                  
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    iPAYX Quantum Rail - Infrastructure de paiement blockchain<br>
                    <a href="https://ipayx.ai" style="color: #06b6d4; text-decoration: none;">ipayx.ai</a>
                  </p>
                </div>
              </body>
            </html>
          `
        }]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ SendGrid error:', emailResponse.status, errorText);
      throw new Error(`SendGrid error: ${emailResponse.status} - ${errorText}`);
    }

    console.log('✅ Password reset email sent successfully via SendGrid!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password reset email sent successfully',
        provider: 'SendGrid'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('💥 Error in send-password-reset:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send password reset email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
