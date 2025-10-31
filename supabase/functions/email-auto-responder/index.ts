import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoResponderRequest {
  senderEmail: string;
  senderName: string;
  subject: string;
  messageBody: string;
  urgencyScore: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🤖 Auto-responder AI agent started');

  try {
    const { senderEmail, senderName, subject, messageBody, urgencyScore }: AutoResponderRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

    if (!LOVABLE_API_KEY || !SENDGRID_API_KEY) {
      throw new Error('Missing API keys');
    }

    console.log(`📧 Processing email from ${senderEmail} (Score: ${urgencyScore}/100)`);

    // Générer réponse automatique avec AI
    const aiPrompt = `Tu es l'agent AI du support iPayX. Génère une réponse professionnelle, courtoise et utile à cet email:

EXPÉDITEUR: ${senderName} (${senderEmail})
SUJET: ${subject}
MESSAGE: ${messageBody}
SCORE D'URGENCE: ${urgencyScore}/100

INSTRUCTIONS:
- Si score < 50: Réponds avec liens vers documentation et ressources publiques
- Si score 50-89: Réponds professionnellement, propose une démo ou sandbox, indique qu'un expert reviendra dans 24-48h
- Sois concis (3-5 paragraphes max)
- Ton professionnel B2B
- Inclus TOUJOURS des liens vers:
  * Documentation: https://preview--ipayx-meta-route.lovable.app/docs
  * Email support: support@ipayx.ai
- Signe "L'équipe iPayX" (JAMAIS de nom personnel)

Réponds en ${senderEmail.toLowerCase().includes('fr') ? 'français' : 'anglais'} selon l'origine.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Tu es un agent de support professionnel B2B. Tes réponses sont concises, utiles et courtoises.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const autoResponse = aiData.choices[0].message.content;

    console.log('🤖 AI-generated response:', autoResponse.substring(0, 100) + '...');

    // Envoyer l'email automatique
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: senderEmail, name: senderName }],
          subject: `Re: ${subject}`
        }],
        from: { email: 'support@ipayx.ai', name: 'iPayX Team' },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">iPayX Protocol</h2>
              </div>
              <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <p>Bonjour ${senderName},</p>
                ${autoResponse.split('\n').map((p: string) => `<p>${p}</p>`).join('')}
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280; margin: 0;">
                  🤖 <em>Cette réponse a été générée automatiquement par notre agent AI. Un membre de l'équipe humaine vous contactera si nécessaire.</em>
                </p>
              </div>
            </div>
          `
        }]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('❌ SendGrid error:', errorText);
      throw new Error(`SendGrid error: ${emailResponse.status}`);
    }

    console.log('✅ Auto-response sent successfully to', senderEmail);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Auto-response sent',
        recipient: senderEmail
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('💥 Auto-responder error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
