import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

interface CampaignRequest {
  lead_ids: string[];
  campaign_type: 'welcome' | 'followup_1' | 'followup_2' | 'demo' | 'case_study' | 'urgent';
}

// TEMPORARY: Disable auto-campaigns until DNS/email configuration is fixed
const AUTO_CAMPAIGNS_ENABLED = true;

// VIDEO MODE: Set to false to send text-only emails (skips HeyGen)
const ENABLE_VIDEOS = false;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if auto-campaigns are disabled
  if (!AUTO_CAMPAIGNS_ENABLED) {
    console.log("⏸️ Auto-campaigns temporarily disabled");
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Auto-campaigns temporarily disabled for system optimization",
        reason: "DNS/SPF/DKIM configuration in progress. Manual campaigns can still be sent.",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    const body: CampaignRequest & { batch_mode?: boolean; min_score?: number } = await req.json();
    let { lead_ids, campaign_type, batch_mode, min_score } = body;

    // Batch mode: fetch ALL leads (NO min_score filter - Explee pre-filtered)
    if (batch_mode && !lead_ids) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      const { data: batchLeads, error: batchError } = await supabase
        .from('leads')
        .select('id')
        .is('last_campaign_sent_at', null) // Only unsent leads
        .order('created_at', { ascending: true }); // FIFO order

      if (batchError) {
        throw new Error(`Failed to fetch batch leads: ${batchError.message}`);
      }

      lead_ids = batchLeads?.map(l => l.id) || [];
      console.log(`📧 Batch mode: Found ${lead_ids.length} leads (ALL Explee pre-filtered)`);
    }

    if (!lead_ids || lead_ids.length === 0) {
      throw new Error('No lead_ids provided or found');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const HEYGEN_API_KEY = Deno.env.get("HEYGEN_API_KEY");
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    if (!LOVABLE_API_KEY || !HEYGEN_API_KEY || !SENDGRID_API_KEY) {
      throw new Error('Missing required API keys');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', lead_ids);

    if (leadsError || !leads) {
      throw new Error(`Failed to fetch leads: ${leadsError?.message}`);
    }

    console.log(`📧 Starting campaign for ${leads.length} leads (type: ${campaign_type})`);

    const results = [];

    // Batch processing: 10 leads at a time with 5 second delay
    const BATCH_SIZE = 10;
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(leads.length / BATCH_SIZE)}`);

      for (const lead of batch) {
        try {
          console.log(`\n🎯 Processing lead: ${lead.name} (${lead.email})`);

        let videoUrl = '';
        let videoScript = '';
        let videoId = '';

        if (ENABLE_VIDEOS) {
          // 1️⃣ Generate video script with Lovable AI
          const scriptPrompt = generateScriptPrompt(lead, campaign_type);
          
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a sales video scriptwriter for iPAYX Protocol. Write compelling 30-second video scripts that highlight ROI and cost savings. Be concise, data-driven, and persuasive." },
                { role: "user", content: scriptPrompt },
              ],
            }),
          });

          if (!aiResponse.ok) {
            throw new Error(`AI generation failed: ${aiResponse.status}`);
          }

          const aiData = await aiResponse.json();
          videoScript = aiData.choices[0].message.content;

          console.log(`✅ Generated script (${videoScript.length} chars)`);

          // 2️⃣ Generate video with HeyGen
          console.log("🎬 Generating HeyGen video...");
          
          const heygenResponse = await fetch("https://api.heygen.com/v2/video/generate", {
            method: "POST",
            headers: {
              "X-Api-Key": HEYGEN_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              video_inputs: [{
                character: {
                  type: "avatar",
                  avatar_id: "5b2d91ba718940fdb93c2772396f671c",
                  avatar_style: "normal"
                },
                voice: {
                  type: "text",
                  input_text: videoScript,
                  voice_id: "1bd001e7e50f421d891986aad5158bc8"
                }
              }],
              dimension: { width: 1280, height: 720 },
              aspect_ratio: "16:9",
              test: false,
              caption: false
            }),
          });

          if (!heygenResponse.ok) {
            const errorData = await heygenResponse.json();
            console.error("❌ HeyGen API Error:", errorData);
            throw new Error(`HeyGen failed: ${heygenResponse.status}`);
          }

          const heygenData = await heygenResponse.json();
          videoId = heygenData.data?.video_id;

          console.log(`✅ HeyGen video queued: ${videoId}`);

          // 2.5️⃣ Polling pour attendre la génération (max 60 secondes)
          let attempts = 0;
          const maxAttempts = 12; // 12 × 5s = 60s max

          while (attempts < maxAttempts && !videoUrl) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
            
            const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
              headers: { "X-Api-Key": HEYGEN_API_KEY }
            });
            
            const statusData = await statusResponse.json();
            
            if (statusData.data?.status === 'completed') {
              videoUrl = statusData.data.video_url;
              console.log(`✅ Video ready: ${videoUrl}`);
              break;
            } else if (statusData.data?.status === 'failed') {
              throw new Error('HeyGen video generation failed');
            }
            
            attempts++;
            console.log(`⏳ Video still processing... (${attempts}/${maxAttempts})`);
          }

          if (!videoUrl) {
            throw new Error('HeyGen video timeout after 60 seconds');
          }
        } else {
          console.log("📧 VIDEO MODE DISABLED - Sending text-only email");
          videoScript = "Text-only email (videos disabled)";
        }

        // 3️⃣ Generate email content
        const emailContent = generateEmailContent(lead, campaign_type, videoUrl, videoScript);

        // 4️⃣ Send email via SendGrid
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: lead.email, name: lead.name }],
              subject: emailContent.subject,
              custom_args: {
                lead_id: lead.id,
                campaign_type: campaign_type
              }
            }],
            from: {
              email: 'ybolduc@ipayx.ai',
              name: 'Yannick Bolduc | iPAYX Protocol'
            },
            content: [{
              type: 'text/html',
              value: emailContent.html
            }],
            tracking_settings: {
              click_tracking: { enable: true },
              open_tracking: { enable: true }
            }
          }),
        });

        if (!sendgridResponse.ok) {
          const errorText = await sendgridResponse.text();
          console.error(`❌ SendGrid error:`, errorText);
          throw new Error(`SendGrid send failed: ${sendgridResponse.status}`);
        }

        // Get SendGrid message ID from headers
        const messageId = sendgridResponse.headers.get('X-Message-Id') || '';

        console.log(`📧 Email sent! Message ID: ${messageId}`);

        // 5️⃣ Save campaign to database
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            lead_id: lead.id,
            campaign_type,
            video_url: videoUrl,
            video_script: videoScript,
            email_subject: emailContent.subject,
            email_body: emailContent.html,
            sendgrid_message_id: messageId,
            status: 'sent',
            video_status: videoUrl ? 'completed' : 'failed',
            heygen_video_id: videoId
          })
          .select()
          .single();

        if (campaignError) {
          console.error('❌ Failed to save campaign:', campaignError);
        }

        // 6️⃣ Update lead stats
        await supabase
          .from('leads')
          .update({
            last_campaign_sent_at: new Date().toISOString(),
            campaigns_count: (lead.campaigns_count || 0) + 1
          })
          .eq('id', lead.id);

        results.push({
          lead_id: lead.id,
          lead_email: lead.email,
          success: true,
          campaign_id: campaign?.id,
          video_url: videoUrl,
          message_id: messageId
        });

      } catch (error: any) {
        console.error(`❌ Error processing lead ${lead.email}:`, error);
        
        // Save failed campaign to database for tracking
        try {
          await supabase
            .from('campaigns')
            .insert({
              lead_id: lead.id,
              campaign_type,
              video_script: '',
              email_subject: 'Failed',
              email_body: '',
              status: 'failed',
              video_status: 'failed',
              error_message: error.message
            });
        } catch (dbError) {
          console.error('Failed to log error to database:', dbError);
        }
        
        results.push({
          lead_id: lead.id,
          lead_email: lead.email,
          success: false,
          error: error.message
        });
      }
    }

      // Wait 5 seconds between batches to avoid rate limits
      if (i + BATCH_SIZE < leads.length) {
        console.log(`⏳ Waiting 5 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ Campaign complete: ${successCount}/${leads.length} emails sent`);

    return new Response(JSON.stringify({
      success: true,
      total: leads.length,
      sent: successCount,
      failed: leads.length - successCount,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Campaign manager error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateScriptPrompt(lead: any, campaignType: string): string {
  const name = lead.name?.split(' ')[0] || 'there';
  const company = lead.company || 'your company';
  const volume = lead.monthly_volume || 'your business';
  
  const prompts = {
    welcome: `Write a professional 30-second video script. Use EXACTLY this template with NO modifications:

"Hi, I'm Eric from iPAYX Protocol.

We're like Google Flights, but for your international payments.

Our AI compares 148 routes in real-time to find you the best deal.

But here's what makes us different: our calculator shows you that sometimes paying 0.3% more for an 8-minute transfer beats paying less for a 4-day delay.

Time is money. Visit ipayx.ai to see your savings."

DO NOT add lead name, company, or any personalization. Keep it EXACTLY as written above. Professional, fluent, energetic tone. Max 30 seconds when spoken.`,
    
    followup_1: `Write a follow-up video script for ${name} (we sent them an intro 3 days ago, no response).
    
    Script structure:
    - "Hi ${name}, following up on my previous message"
    - Social proof: "Companies like yours in ${lead.country || 'your region'} are already saving 60-70% on cross-border fees"
    - Case study preview: Mention 1 specific competitor or similar company
    - Urgency: "I've reserved 15 minutes this week for a quick demo"
    - CTA: "Click here to see your personalized ROI calculator"
    
    Keep it brief and value-focused. Max 80 words.`,
    
    followup_2: `Write a final follow-up script for ${name} (7 days since first contact, still no response).
    
    Script structure:
    - "Hi ${name}, I know you're busy, so I'll keep this quick"
    - Direct value: "Based on ${volume}, you're potentially leaving $XXX on the table every month"
    - FOMO: "I'm reaching out to 3 companies in your space this week"
    - Soft close: "If now's not the right time, no problem - but wanted to make sure you saw the numbers"
    - CTA: "One click to see your savings breakdown"
    
    Keep it respectful and non-pushy. Max 70 words.`,
    
    demo: `Write an invitation script for a personalized demo for ${name}.
    
    Script structure:
    - "Hi ${name}, based on our analysis of ${company}"
    - Custom insights: "We've mapped out your exact payment corridors"
    - Demo preview: "I want to show you 3 specific routes where you'd save the most"
    - Value prop: "Most clients find 1-2 quick wins worth $10K-$50K annually"
    - CTA: "Pick a time that works for you"
    
    Keep it consultative and high-value. Max 90 words.`,
    
    case_study: `Write a case study teaser script for ${name}.
    
    Script structure:
    - "Hi ${name}, quick story you might relate to"
    - Case study intro: Similar company in their industry
    - Problem they had: Same pain points as ${name}
    - Results: Specific % savings and time reductions
    - Relevance: "I think you'd see similar results"
    - CTA: "Want to see how we'd approach your corridors?"
    
    Keep it story-driven and relatable. Max 85 words.`,
    
    urgent: `Write an urgent opportunity script for ${name}.
    
    Script structure:
    - "Hi ${name}, time-sensitive update"
    - Opportunity: New route optimization or special pricing
    - Why now: Regulatory change, market shift, or limited availability
    - Benefit: Specific additional savings or advantage
    - CTA: "Let's talk this week before the window closes"
    
    Keep it urgent but not pushy. Max 75 words.`
  };
  
  return prompts[campaignType as keyof typeof prompts] || prompts.welcome;
}

function generateEmailContent(lead: any, campaignType: string, videoUrl: string, videoScript: string): { subject: string; html: string } {
  // Escape all user-supplied data to prevent HTML injection
  const name = escapeHtml(lead.name?.split(' ')[0] || 'there');
  const company = escapeHtml(lead.company || 'your company');
  const volume = escapeHtml(lead.monthly_volume || '');
  
  // Calculate estimated savings
  let estimatedSavings = '';
  if (volume.includes('$')) {
    const volumeNum = parseInt(volume.replace(/[^0-9]/g, ''));
    if (volumeNum > 0) {
      const currentFees = volumeNum * 0.025; // 2.5% average
      const ipayxFees = volumeNum * 0.007; // 0.7%
      const savings = currentFees - ipayxFees;
      estimatedSavings = `$${Math.round(savings).toLocaleString()}`;
    }
  }

  const subjects = {
    welcome: `${name}, économisez ${estimatedSavings || '60-70%'} sur vos paiements internationaux`,
    followup_1: `Re: Économies sur vos paiements transfrontaliers - ${company}`,
    followup_2: `${name}, dernier appel - ${estimatedSavings || 'économies importantes'} vous attendent`,
    demo: `${name}, votre démo personnalisée d'optimisation de paiements`,
    case_study: `Comment ${company} pourrait économiser comme [entreprise similaire]`,
    urgent: `${name}, urgent : Nouvelle optimisation de route disponible`
  };

  // Video embed: show actual video player if URL exists, fallback to simple text message
  const videoEmbed = videoUrl
    ? `<div style="margin: 30px 0; text-align: center;">
         <video controls style="width: 100%; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
           <source src="${videoUrl}" type="video/mp4">
           Your email client doesn't support video playback.
         </video>
         <p style="margin: 15px 0 0; font-size: 14px; color: #6b7280;">
           Can't see the video? <a href="${videoUrl}" style="color: #667eea; text-decoration: none;">Watch it here</a>
         </p>
       </div>`
     : `<div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
         <h2 style="margin: 0 0 15px; font-size: 24px; font-weight: 700;">💰 Vous laissez de l'argent sur la table</h2>
         <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
           ${name}, j'ai analysé votre volume de ${volume} et voici ce que j'ai trouvé :
         </p>
         <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
           <p style="margin: 0 0 10px; font-size: 32px; font-weight: 900;">${estimatedSavings || '$247,000'}</p>
           <p style="margin: 0; font-size: 14px; opacity: 0.9;">Économies annuelles potentielles</p>
         </div>
         <p style="margin: 0 0 15px; font-size: 15px; line-height: 1.6;">
           Notre méta-router compare 148 routes de paiement en temps réel. Comme Google Flights, mais pour vos paiements internationaux.
         </p>
         <p style="margin: 0; font-size: 14px; line-height: 1.5; opacity: 0.95;">
           ✓ Comparaison automatique de toutes les options<br>
           ✓ Optimisation vitesse vs. coût<br>
           ✓ Pas de contrat, pas de frais fixes
         </p>
       </div>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">iPAYX Protocol</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Quantum Payment Routing Infrastructure</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; color: #111827;">Hi ${name},</p>
              
              ${videoEmbed}
              
              ${estimatedSavings ? `
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #92400e; font-weight: 600; text-transform: uppercase;">Your Potential Savings</p>
                <p style="margin: 0; font-size: 32px; color: #92400e; font-weight: 700;">${estimatedSavings}/month</p>
                <p style="margin: 10px 0 0; font-size: 14px; color: #78350f;">Based on ${volume} monthly volume • 0.7% iPAYX fees vs 2-4% traditional</p>
              </div>
              ` : ''}
              
              <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 15px; font-size: 20px; color: #111827;">Why iPAYX?</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563;">
                  <li style="margin-bottom: 10px;">⚡ <strong>8-second settlements</strong> (vs 3-5 days)</li>
                  <li style="margin-bottom: 10px;">💰 <strong>0.7% total fees</strong> (vs 2-4% banks)</li>
                  <li style="margin-bottom: 10px;">🌐 <strong>135+ payment rails</strong> with auto-optimization</li>
                  <li style="margin-bottom: 10px;">🔒 <strong>Non-custodial</strong> architecture (we never hold your funds)</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://ipayx.ai/demo?lead=${lead.id}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  📊 See Your Custom ROI Calculator
                </a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                Want to schedule a quick 15-minute call? Just reply to this email and we'll set something up.
              </p>
              
              <p style="margin: 30px 0 0; font-size: 16px; color: #111827;">
                Best regards,<br>
                <strong>Yan Bolduc</strong><br>
                <span style="color: #6b7280;">CEO | iPAYX Protocol</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280; text-align: center;">
                <a href="https://ipayx.ai" style="color: #667eea; text-decoration: none; margin: 0 10px;">Website</a> |
                <a href="https://ipayx.ai/demo" style="color: #667eea; text-decoration: none; margin: 0 10px;">Live Demo</a> |
                <a href="mailto:partnerships@ipayx.ai" style="color: #667eea; text-decoration: none; margin: 0 10px;">Contact</a>
              </p>
               <p style="margin: 15px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                iPAYX Protocol V4 • FINTRAC MSB Licensed • SOC 2 Type II (in progress)<br>
                <a href="https://ipayx.ai/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return {
    subject: subjects[campaignType as keyof typeof subjects] || subjects.welcome,
    html
  };
}