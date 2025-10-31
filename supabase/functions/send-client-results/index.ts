import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClientResultsRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  breakdown: Array<{
    step: string;
    provider: string;
    fee: string;
    eta: string;
  }>;
  totalFeePct: number;
  ipayxFee: string;
  savings: string;
  clientEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      fromCurrency, 
      toCurrency, 
      amount, 
      breakdown, 
      totalFeePct, 
      ipayxFee, 
      savings,
      clientEmail 
    }: ClientResultsRequest = await req.json();

    console.log(`📧 Sending client results: ${fromCurrency} → ${toCurrency}, $${amount}`);

    // Générer HTML template
    const breakdownRows = breakdown.map(step => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; text-align: left;">${step.step}</td>
        <td style="padding: 12px; text-align: left;">${step.provider}</td>
        <td style="padding: 12px; text-align: right;">${step.fee}</td>
        <td style="padding: 12px; text-align: right;">${step.eta}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>iPAYX Quote Results</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <!-- Header avec Logo -->
          <div style="text-align: center; margin-bottom: 30px; background: white; padding: 20px; border-radius: 8px;">
            <img src="https://ggkymbeyesuodnoogzyb.supabase.co/storage/v1/object/public/assets/ipayx-logo.svg" alt="iPAYX Protocol" style="height: 60px;" />
            <h1 style="color: #33B5E5; margin-top: 20px; margin-bottom: 10px;">Client Quote Results</h1>
            <p style="color: #666; margin: 0;">Quantum Rail Cross-Border Payment Analysis</p>
          </div>

          <!-- Corridor Summary -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #33B5E5;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Corridor Summary</h2>
            <p style="margin: 5px 0; font-size: 16px; color: #555;">
              <strong style="color: #333;">From:</strong> ${fromCurrency}<br>
              <strong style="color: #333;">To:</strong> ${toCurrency}<br>
              <strong style="color: #333;">Amount:</strong> $${amount.toLocaleString('en-US')}
            </p>
          </div>

          <!-- Fee Breakdown -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Detailed Fee Breakdown</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #33B5E5; color: white;">
                  <th style="padding: 12px; text-align: left; border-radius: 4px 0 0 0;">Step</th>
                  <th style="padding: 12px; text-align: left;">Provider</th>
                  <th style="padding: 12px; text-align: right;">Fee</th>
                  <th style="padding: 12px; text-align: right; border-radius: 0 4px 0 0;">ETA</th>
                </tr>
              </thead>
              <tbody>
                ${breakdownRows}
              </tbody>
            </table>
          </div>

          <!-- Total Fees -->
          <div style="background: linear-gradient(135deg, #e8f4f8 0%, #d4eaf3 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #33B5E5;">
            <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Total Cost Analysis</h2>
            <p style="margin: 5px 0; font-size: 16px; color: #555;">
              <strong style="color: #333;">Total Fee:</strong> ${totalFeePct.toFixed(2)}%<br>
              <strong style="color: #33B5E5;">iPAYX Fee:</strong> ${ipayxFee}<br>
              <strong style="color: #22c55e;">Est. Savings vs Traditional Wire*:</strong> <span style="color: #22c55e; font-weight: bold; font-size: 18px;">${savings}</span>
            </p>
          </div>

          <!-- Legal Disclaimer -->
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #856404;">
              <strong>⚠️ Legal Disclaimer:</strong>
            </p>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #856404; line-height: 1.6;">
              Estimated savings calculated vs avg. 2.5% traditional wire transfer fee. 
              Actual costs depend on your bank's fees, third-party agreements, and market conditions. 
              iPAYX Protocol cannot guarantee these savings.
            </p>
            <p style="margin: 0; font-size: 11px; color: #856404; font-style: italic;">
              By using this quote tool, you acknowledge that all figures are estimates for planning 
              purposes only. Always verify final costs with your financial institution before proceeding.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
              © ${new Date().getFullYear()} iPAYX Protocol | Quantum Rail Cross-Border Payments
            </p>
            <p style="color: #999; font-size: 11px; margin: 5px 0;">
              This quote was generated automatically. For support, contact <a href="mailto:support@ipayx.ai" style="color: #33B5E5;">support@ipayx.ai</a>
            </p>
          </div>
        </body>
      </html>
    `;

    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: "support@ipayx.ai" }],
          subject: `Quote Results: ${fromCurrency} → ${toCurrency} | $${amount.toLocaleString()}`
        }],
        from: { 
          email: "support@ipayx.ai", 
          name: "iPAYX Protocol" 
        },
        reply_to: { 
          email: clientEmail || "support@ipayx.ai" 
        },
        content: [{
          type: "text/html",
          value: emailHtml
        }]
      })
    });

    if (!emailResponse.ok) {
      throw new Error(`SendGrid error: ${emailResponse.status}`);
    }

    console.log("✅ Email sent successfully:", emailResponse.status);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
