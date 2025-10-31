import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: "noreply@ipayx.ai", name: "iPAYX Protocol V4" },
        subject: "Welcome to iPAYX Protocol V4 🚀",
        content: [{
          type: "text/html",
          value: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
              .feature { margin: 20px 0; padding: 15px; background: #f0f9ff; border-left: 4px solid #06b6d4; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Welcome to iPAYX Protocol V4! 🎉</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Join 500+ enterprises optimizing cross-border payments</p>
              </div>
              
              <div class="content">
                <p>Hi${name ? ` ${name}` : ""},</p>
                
                <p>Thank you for joining <strong>iPAYX Protocol V4</strong> – the quantum routing infrastructure powering the next generation of cross-border payments.</p>
                
                <div class="feature">
                  <strong>🔑 Your Sandbox API Key is Ready</strong>
                  <p>Start testing our payment routing engine with 0.7% fees and 8-second settlements.</p>
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/keys" class="button">Get Your API Key</a>
                </div>
                
                <div class="feature">
                  <strong>🎮 Try Our Live Demo</strong>
                  <p>See real-time routing across 135+ payment rails with live FX oracle feeds.</p>
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/demo" class="button">Explore Demo</a>
                </div>
                
                <div class="feature">
                  <strong>📚 API Documentation</strong>
                  <p>Integrate iPAYX in minutes with our comprehensive API docs and code examples.</p>
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app")}/docs" class="button">Read Docs</a>
                </div>
                
                <h3>What You Get:</h3>
                <ul>
                  <li>⚡ <strong>8-second settlements</strong> vs 3-5 days with legacy banks</li>
                  <li>💰 <strong>0.7% total fees</strong> – up to 70% cost reduction</li>
                  <li>🌐 <strong>135+ payment rails</strong> – instant optimal routing</li>
                  <li>🔒 <strong>Non-custodial</strong> – we NEVER hold your funds</li>
                  <li>✅ <strong>FINTRAC compliant</strong> – MSB registered in Canada</li>
                </ul>
                
                <p><strong>Need help?</strong> Our team is here for you:</p>
                <ul>
                  <li>📧 Technical support: <a href="mailto:support@ipayx.ai">support@ipayx.ai</a></li>
                  <li>💼 Enterprise partnerships: <a href="mailto:partnerships@ipayx.ai">partnerships@ipayx.ai</a></li>
                  <li>⚖️ Legal & compliance: <a href="mailto:legal@ipayx.ai">legal@ipayx.ai</a></li>
                </ul>
                
                <p>Ready to transform your payment infrastructure? Let's build the future together.</p>
                
                <p>Best regards,<br><strong>The iPAYX Protocol V4 Team</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2025 iPAYX Protocol V4. All rights reserved.</p>
                <p style="font-size: 12px; color: #9ca3af;">
                  iPAYX is NOT a bank. We are a non-custodial payment routing layer.<br>
                  We NEVER hold your funds. FINTRAC MSB compliant.
                </p>
              </div>
            </div>
          </body>
        </html>
      `}]
      })
    });

    const result = await emailResponse.json();
    console.log("Welcome email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
