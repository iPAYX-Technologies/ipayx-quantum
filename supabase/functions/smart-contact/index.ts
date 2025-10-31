import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  country: string;
  monthlyVolume: string;
  message: string;
  language: 'en' | 'fr';
}

interface AIAnalysis {
  score: number;
  category: 'URGENT' | 'NORMAL' | 'LOW';
  reason: string;
  emailCorporate: boolean;
  volumeSignificant: boolean;
  needExplicit: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Smart-contact edge function started');

  try {
    // 1️⃣ Verify environment variables at startup
    const sendgridKey = Deno.env.get("SENDGRID_API_KEY");
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('🔑 Environment check:', {
      sendgridKey: sendgridKey ? `...${sendgridKey.slice(-4)}` : '❌ NOT_SET',
      lovableKey: lovableKey ? '✅ SET' : '❌ NOT_SET',
      supabaseUrl: supabaseUrl ? '✅ SET' : '❌ NOT_SET',
      supabaseKey: supabaseKey ? '✅ SET' : '❌ NOT_SET'
    });

    if (!sendgridKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    // 2️⃣ Parse and validate request body
    console.log('📥 Parsing request body...');
    
    const smartContactSchema = z.object({
      name: z.string().trim().min(2, "Name too short").max(100, "Name too long"),
      email: z.string().trim().email("Invalid email").max(255, "Email too long"),
      company: z.string().trim().min(2, "Company name too short").max(100, "Company name too long"),
      country: z.string().trim().max(60, "Country name too long"),
      monthlyVolume: z.string().max(50, "Volume description too long"),
      message: z.string().trim().min(10, "Message too short").max(1000, "Message too long"),
      language: z.enum(['en', 'fr'], { errorMap: () => ({ message: "Language must be 'en' or 'fr'" }) })
    });

    const body = await req.json();
    const validation = smartContactSchema.safeParse(body);

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

    const formData = validation.data;
    const { name, email, company, country, monthlyVolume, message, language } = formData;

    console.log('📧 Contact form received:', { name, email, company, country, monthlyVolume });

    // 3️⃣ Initialize Supabase client
    console.log('🔌 Initializing Supabase client...');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // 4️⃣ Analyze lead with AI
    console.log('🤖 Starting AI analysis...');
    const aiAnalysis = await analyzeLeadWithAI(formData);
    console.log('✅ AI Analysis complete:', { score: aiAnalysis.score, category: aiAnalysis.category });

    // 5️⃣ Store lead in database
    console.log('💾 Storing lead in database...');
    const { error: dbError } = await supabase
      .from('leads')
      .insert([{
        name,
        email: email.toLowerCase().trim(),
        company,
        country,
        monthly_volume: monthlyVolume,
        message,
        source: 'smart-contact',
        ai_score: aiAnalysis.score,
        ai_analysis: aiAnalysis,
        metadata: {
          language,
          timestamp: new Date().toISOString(),
          userAgent: req.headers.get('user-agent')
        }
      }]);

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
    console.log('✅ Lead stored successfully');

    // 6️⃣ Send emails via SendGrid
    console.log('📤 Sending emails...');
    await sendEmails(formData, aiAnalysis);
    console.log('✅ All emails sent successfully');

    // 7️⃣ If score < 90, trigger AI auto-responder
    if (aiAnalysis.score < 90) {
      console.log(`🤖 Triggering AI auto-responder (Score: ${aiAnalysis.score}/100)`);
      
      try {
        const { error: autoResponderError } = await supabase.functions.invoke('email-auto-responder', {
          body: {
            senderEmail: formData.email,
            senderName: formData.name,
            subject: `${formData.company} - ${formData.monthlyVolume}`,
            messageBody: formData.message,
            urgencyScore: aiAnalysis.score
          }
        });

        if (autoResponderError) {
          console.error('⚠️ Auto-responder failed:', autoResponderError);
          // Don't throw - auto-responder failure shouldn't break the main flow
        } else {
          console.log('✅ AI auto-responder triggered successfully');
        }
      } catch (autoResponderErr) {
        console.error('⚠️ Auto-responder exception:', autoResponderErr);
        // Continue even if auto-responder fails
      }
    } else {
      console.log(`🚨 CODE ROUGE (Score: ${aiAnalysis.score}/100) - No auto-responder needed`);
    }

    // 7️⃣ Return success
    console.log('🎉 Smart-contact completed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        score: aiAnalysis.score,
        category: aiAnalysis.category 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('💥 CRITICAL ERROR in smart-contact:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function analyzeLeadWithAI(data: ContactFormData): Promise<AIAnalysis> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const prompt = `Analyse ce lead B2B de manière stricte et professionnelle. Donne un score de 0 à 100 basé sur ces critères précis:

DONNÉES DU LEAD:
- Nom: ${data.name}
- Email: ${data.email}
- Entreprise: ${data.company}
- Pays: ${data.country}
- Volume mensuel: ${data.monthlyVolume}
- Message: ${data.message}

CRITÈRES DE SCORING ULTRA-STRICT (FILTRAGE AGRESSIF):

⛔ **DISQUALIFICATION AUTOMATIQUE** (Score 0):
- Email personnel (Gmail, Yahoo, Hotmail, Outlook, iCloud, QQ, 163, etc.) = SCORE 0
- Message générique/spam ("Hi", "Hello", "Interested", "More info", etc.) = SCORE 0
- Entreprise vague ("Company", "Business", "Test", un seul mot) = SCORE 0
- Pas de volume significatif (moins de $100k/mois) = SCORE 0
- Pays à haut risque sans contexte légitime = SCORE 0

✅ **CRITÈRES POSITIFS** (Si pas disqualifié):
1. Email corporatif @entreprise.com (OBLIGATOIRE) = +20 points
2. Volume mensuel:
   - "$5M+" = +30 points
   - "$1M-5M" = +25 points
   - "$500k-1M" = +15 points
   - "$100k-500k" = +10 points
3. Message détaillé (>150 chars, besoins concrets, KPI mentionnés) = +25 points
4. Entreprise vérifiable (LinkedIn, site web clair) = +15 points
5. Urgence justifiée ou deadline = +10 points

🚨 **DÉCLENCHEURS CODE ROUGE** (95-100):
- Titre C-Level + email corporatif validé = +40 points BONUS
- Fortune 500 / Entreprise cotée = +40 points BONUS
- Mots VIP: "partnership", "acquisition", "investment", "strategic alliance" = +30 points BONUS

📊 **CATÉGORIES FINALES**:
- 90-100 = CODE ROUGE 🔴 (Alerte CEO immédiate)
- 70-89 = URGENT 🟠 (Équipe commerciale + notification CEO si >80)
- 50-69 = NORMAL 🟡 (Agent IA répond)
- 1-49 = LOW 🟢 (Ressources publiques uniquement)
- 0 = REJETÉ ⛔ (Aucun email client, juste log interne)

Retourne UNIQUEMENT un JSON valide avec cette structure exacte (pas de markdown, pas de texte avant/après):
{
  "score": 85,
  "category": "URGENT",
  "reason": "Email corporatif Visa + volume $5M+ + besoin explicite corridors Asie-Europe",
  "emailCorporate": true,
  "volumeSignificant": true,
  "needExplicit": true
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Tu es un expert en qualification de leads B2B pour une fintech de paiements internationaux. Tu réponds UNIQUEMENT en JSON valide, sans markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis: AIAnalysis = JSON.parse(jsonContent);
    
    return analysis;
  } catch (error) {
    console.error('AI analysis error:', error);
    // Fallback scoring based on simple rules
    const emailCorporate = !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
      .some(domain => data.email.toLowerCase().includes(domain));
    const volumeSignificant = ['$1M-5M', '$5M+'].includes(data.monthlyVolume);
    const needExplicit = data.message.length > 100;

    let score = 0;
    if (emailCorporate) score += 20;
    if (data.monthlyVolume === '$5M+') score += 30;
    else if (data.monthlyVolume === '$1M-5M') score += 25;
    else if (data.monthlyVolume === '$500k-1M') score += 15;
    else score += 10;
    if (needExplicit) score += 25;
    if (data.company.split(' ').length > 1) score += 15;

    const category = score >= 80 ? 'URGENT' : score >= 50 ? 'NORMAL' : 'LOW';

    return {
      score,
      category,
      reason: 'Fallback scoring (AI unavailable)',
      emailCorporate,
      volumeSignificant,
      needExplicit
    };
  }
}

async function sendEmails(data: ContactFormData, analysis: AIAnalysis) {
  const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
  
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  console.log('📧 Generating email content...');
  
  // 1. Email to client (personalized based on score)
  const clientEmail = generateClientEmail(data, analysis);
  
  // 2. Email to support@ipayx.ai (with AI analysis)
  const supportEmail = generateSupportEmail(data, analysis);

  console.log('📤 Sending emails with SendGrid key ending:', `...${SENDGRID_API_KEY.slice(-4)}`);

  // Send email 1: Client
  console.log('📨 Sending email 1 to client:', data.email);
  const clientResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: data.email, name: data.name }],
        subject: clientEmail.subject
      }],
      from: { email: 'support@ipayx.ai', name: 'iPayX Team' },
      content: [{ type: 'text/html', value: clientEmail.html }]
    })
  });

  if (!clientResponse.ok) {
    const errorText = await clientResponse.text();
    console.error(`❌ Email 1 (client) FAILED:`, {
      status: clientResponse.status,
      statusText: clientResponse.statusText,
      error: errorText
    });
    throw new Error(`SendGrid error (client email): ${clientResponse.status} - ${errorText}`);
  }
  console.log(`✅ Email 1 sent successfully to ${data.email}`);

  // Send email 2: Internal notification to ybolduc@ipayx.ai ONLY (Option A)
  console.log(`📨 Sending internal notification to ybolduc@ipayx.ai`);
  console.log(`📊 Lead details: Score ${analysis.score}/100 | Volume: ${data.monthlyVolume}`);
  
  const supportResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: 'ybolduc@ipayx.ai', name: 'Yannick Bolduc' }],
        subject: `[iPAYX Smart Lead] ${data.company} - ${data.monthlyVolume} - Score: ${analysis.score}/100`
      }],
      from: { email: 'noreply@ipayx.ai', name: 'iPayX AI Agent' },
      content: [{ type: 'text/html', value: supportEmail.html }]
    })
  });

  if (!supportResponse.ok) {
    const errorText = await supportResponse.text();
    console.error(`❌ Email 2 (ybolduc@) FAILED:`, {
      status: supportResponse.status,
      statusText: supportResponse.statusText,
      error: errorText
    });
    throw new Error(`SendGrid error (internal email): ${supportResponse.status} - ${errorText}`);
  }
  console.log(`✅ Email 2 sent successfully to ybolduc@ipayx.ai`);
}

function generateClientEmail(data: ContactFormData, analysis: AIAnalysis) {
  const isFrench = data.language === 'fr';
  const emoji = analysis.category === 'URGENT' ? '🔴' : analysis.category === 'NORMAL' ? '🟡' : '🟢';
  
  // Escape all user inputs
  const safeName = escapeHtml(data.name);
  const safeCompany = escapeHtml(data.company);
  const safeVolume = escapeHtml(data.monthlyVolume);
  
  if (analysis.category === 'URGENT') {
    return {
      subject: isFrench ? 'Votre demande iPayX - Examen prioritaire' : 'Your iPayX Request - Priority Review',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">${emoji} ${isFrench ? 'Merci de votre intérêt pour iPayX' : 'Thank you for your interest in iPayX'}</h2>
          <p>${isFrench ? 'Bonjour' : 'Hi'} ${safeName},</p>
          <p>${isFrench 
            ? `Nous avons bien reçu votre demande concernant <strong>${safeCompany}</strong>.`
            : `We received your request regarding <strong>${safeCompany}</strong>.`}
          </p>
          <p>${isFrench
            ? `Compte tenu de votre volume mensuel (${safeVolume}), nous avons <strong>priorisé votre demande</strong>. Un expert de notre équipe vous contactera dans les <strong>24 heures</strong> pour discuter :`
            : `Given your monthly volume (${safeVolume}), we've <strong>prioritized your request</strong>. An expert from our team will contact you within <strong>24 hours</strong> to discuss:`}
          </p>
          <ul>
            <li>${isFrench ? 'Optimisation du routage personnalisée' : 'Custom routing optimization'}</li>
            <li>${isFrench ? 'Tarification basée sur le volume (meilleure que nos 0,7% standard)' : 'Volume-based pricing (better than our standard 0.7%)'}</li>
            <li>${isFrench ? 'Calendrier d\'intégration et exigences KYC' : 'Integration timeline and KYC requirements'}</li>
          </ul>
          <p>${isFrench ? 'En attendant, explorez notre démo en direct :' : 'In the meantime, explore our live demo:'} <a href="https://demo.ipayx.com" style="color: #0891b2;">demo.ipayx.com</a></p>
          <p style="margin-top: 30px; color: #666;">${isFrench ? 'Cordialement,' : 'Best regards,'}<br><strong>L'équipe iPayX</strong></p>
        </div>
      `
    };
  } else if (analysis.category === 'NORMAL') {
    return {
      subject: isFrench ? 'Votre demande iPayX - Bien reçue' : 'Your iPayX Request - Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">${emoji} ${isFrench ? 'Merci de votre intérêt' : 'Thank you for your interest'}</h2>
          <p>${isFrench ? 'Bonjour' : 'Hi'} ${safeName},</p>
          <p>${isFrench
            ? `Nous avons bien reçu votre demande pour <strong>${safeCompany}</strong>. Notre équipe examine votre besoin et vous contactera dans les <strong>48 heures</strong>.`
            : `We received your request for <strong>${safeCompany}</strong>. Our team is reviewing your needs and will contact you within <strong>48 hours</strong>.`}
          </p>
          <p>${isFrench ? 'En attendant, découvrez :' : 'In the meantime, discover:'}</p>
          <ul>
            <li><a href="https://demo.ipayx.com" style="color: #0891b2;">${isFrench ? 'Notre démo interactive' : 'Our interactive demo'}</a></li>
            <li><a href="https://ipayx.com/docs" style="color: #0891b2;">${isFrench ? 'Documentation technique' : 'Technical documentation'}</a></li>
          </ul>
          <p style="margin-top: 30px; color: #666;">${isFrench ? 'Cordialement,' : 'Best regards,'}<br><strong>L'équipe iPayX</strong></p>
        </div>
      `
    };
  } else {
    return {
      subject: isFrench ? 'Merci de votre intérêt pour iPayX' : 'Thank you for your interest in iPayX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">${emoji} ${isFrench ? 'Merci de votre intérêt' : 'Thank you for your interest'}</h2>
          <p>${isFrench ? 'Bonjour' : 'Hi'} ${safeName},</p>
          <p>${isFrench
            ? `Merci d'avoir contacté iPayX. Voici quelques ressources pour mieux comprendre notre plateforme :`
            : `Thank you for contacting iPayX. Here are some resources to learn more about our platform:`}
          </p>
          <ul>
            <li><a href="https://demo.ipayx.com" style="color: #0891b2;">${isFrench ? 'Démo interactive' : 'Interactive demo'}</a></li>
            <li><a href="https://ipayx.com/docs" style="color: #0891b2;">${isFrench ? 'Documentation complète' : 'Complete documentation'}</a></li>
            <li><a href="https://ipayx.com" style="color: #0891b2;">${isFrench ? 'En savoir plus sur iPayX' : 'Learn more about iPayX'}</a></li>
          </ul>
          <p>${isFrench
            ? 'Notre équipe vous contactera si votre besoin correspond à nos services actuels.'
            : 'Our team will contact you if your needs align with our current services.'}
          </p>
          <p style="margin-top: 30px; color: #666;">${isFrench ? 'Cordialement,' : 'Best regards,'}<br><strong>L'équipe iPayX</strong></p>
        </div>
      `
    };
  }
}

function generateSupportEmail(data: ContactFormData, analysis: AIAnalysis) {
  const isCodeRed = analysis.score >= 90;
  const emoji = isCodeRed ? '🚨🔴' : analysis.category === 'URGENT' ? '🟠' : analysis.category === 'NORMAL' ? '🟡' : '🟢';
  const priority = isCodeRed ? 'CODE ROUGE' : analysis.category === 'URGENT' ? 'URGENT' : analysis.category === 'NORMAL' ? 'NORMAL' : 'LOW';
  
  // Escape all user inputs
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeCompany = escapeHtml(data.company);
  const safeCountry = escapeHtml(data.country);
  const safeVolume = escapeHtml(data.monthlyVolume);
  const safeMessage = escapeHtml(data.message);
  const safeReason = escapeHtml(analysis.reason);
  
  // Si score < 90%, l'agent répond automatiquement (ne notifie PAS le CEO)
  if (analysis.score < 90) {
    return {
      subject: `${emoji} [AUTO-HANDLED BY AI] ${priority} - ${safeCompany} [Score: ${analysis.score}/100]`,
      html: `
        <div style="font-family: monospace; max-width: 800px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            ✅ ${emoji} Lead Auto-Géré par Agent AI - ${safeCompany}
          </h2>
          
          <div style="background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; margin-bottom: 20px;">
            <strong>📊 Score: ${analysis.score}/100</strong> - Catégorie: ${priority}<br>
            <strong>🤖 Action AI:</strong> Réponse automatique envoyée au lead (pas de notification CEO requise)
          </div>

          <h3 style="color: #334155; margin-top: 20px;">📋 Détails du Lead</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Nom:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeName}</td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeEmail}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Entreprise:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeCompany}</td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Volume mensuel:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeVolume}</td>
            </tr>
          </table>

          <h3 style="color: #334155;">🤖 Analyse AI</h3>
          <p style="background: white; padding: 15px; border-radius: 6px;">
            ${safeReason}
          </p>

          <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
            📌 <em>Cet email est archivé pour référence. Aucune action manuelle requise.</em>
          </p>
        </div>
      `
    };
  }

  // CODE ROUGE 🚨 - Score 90%+: CEO DOIT voir immédiatement
  return {
    subject: `🚨🔴 CODE ROUGE ABSOLU - ${safeCompany} [Score: ${analysis.score}/100] - ACTION CEO REQUISE`,
    html: `
      <div style="font-family: monospace; max-width: 800px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px;">
          ${emoji} New Lead: ${safeCompany}
        </h2>
        
        <h3 style="color: #334155; margin-top: 20px;">📋 Lead Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: white;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Name:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeName}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeEmail}</td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Company:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeCompany}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Country:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeCountry}</td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Monthly Volume:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${safeVolume}</strong></td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Language:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${data.language === 'fr' ? 'French 🇫🇷' : 'English 🇬🇧'}</td>
          </tr>
        </table>

        <h3 style="color: #334155;">💬 Message</h3>
        <div style="background: white; padding: 15px; border-left: 4px solid #0891b2; margin-bottom: 20px;">
          "${safeMessage}"
        </div>

        <h3 style="color: #334155;">🤖 AI Analysis</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background: ${analysis.category === 'URGENT' ? '#fee2e2' : analysis.category === 'NORMAL' ? '#fef3c7' : '#dcfce7'};">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Score:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong style="font-size: 18px;">${analysis.score}/100</strong></td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Category:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${emoji} ${analysis.category}</strong></td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Priority:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>${priority}</strong></td>
          </tr>
          <tr style="background: white;">
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Reason:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${safeReason}</td>
          </tr>
        </table>

        <h3 style="color: #334155;">✓ Validation Checks</h3>
        <ul style="list-style: none; padding-left: 0;">
          <li>${analysis.emailCorporate ? '✅' : '❌'} Corporate email verified</li>
          <li>${analysis.volumeSignificant ? '✅' : '❌'} Significant volume</li>
          <li>${analysis.needExplicit ? '✅' : '❌'} Explicit need identified</li>
        </ul>

        <div style="margin-top: 30px; padding: 15px; background: ${analysis.category === 'URGENT' ? '#fee2e2' : analysis.category === 'NORMAL' ? '#fef3c7' : '#dcfce7'}; border-radius: 6px;">
          <strong>⏰ Action Required:</strong> ${
            analysis.category === 'URGENT' 
              ? 'Respond within 24 hours' 
              : analysis.category === 'NORMAL' 
              ? 'Respond within 48 hours' 
              : 'Low priority - respond when capacity allows'
          }
        </div>
      </div>
    `
  };
}
