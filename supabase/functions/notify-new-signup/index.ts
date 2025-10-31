import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📬 New signup notification triggered');

  try {
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    // Get request body
    const body = await req.json();
    const { email, company, country, partner_id, created_at } = body;

    console.log('📧 Sending notification for new user:', email);
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [
            { email: 'ybolduc@ipayx.ai' },
            { email: 'support@ipayx.ai' }
          ],
          subject: '🎉 New User Signup - iPAYX Protocol V4'
        }],
        from: { email: 'noreply@ipayx.ai', name: 'iPayX Notifications' },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); border-radius: 12px;">
              <h1 style="color: white; margin-bottom: 20px;">🚀 New User Signup!</h1>
              <div style="background: white; color: #1e293b; padding: 20px; border-radius: 8px;">
                <h2 style="color: #0891b2; margin-top: 0;">User Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; font-weight: bold;">Email:</td>
                    <td style="padding: 10px 0;">${email}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; font-weight: bold;">Company:</td>
                    <td style="padding: 10px 0;">${company || 'Not provided'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; font-weight: bold;">Country:</td>
                    <td style="padding: 10px 0;">${country || 'Not provided'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; font-weight: bold;">Partner ID:</td>
                    <td style="padding: 10px 0;">${partner_id || 'Not selected'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold;">Signup Time:</td>
                    <td style="padding: 10px 0;">${new Date(created_at).toLocaleString()}</td>
                  </tr>
                </table>
                
                <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0891b2; border-radius: 4px;">
                  <p style="margin: 0; font-weight: bold; color: #0891b2;">Next Steps:</p>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Review user profile in the admin dashboard</li>
                    <li>Approve KYC status if needed</li>
                    <li>Assign partner integration</li>
                  </ul>
                </div>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                
                <p style="font-size: 12px; color: #6b7280; margin: 0;">
                  <strong>System:</strong> iPAYX Protocol V4<br>
                  <strong>Notification Type:</strong> New User Registration<br>
                  <strong>Timestamp:</strong> ${new Date().toISOString()}
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

    console.log('✅ Notification sent successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent to admins',
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
