import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const chatbotSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system'], { errorMap: () => ({ message: "Invalid message role" }) }),
      content: z.string().min(1, "Message content cannot be empty").max(5000, "Message content too long")
    })
  ).min(1, "At least one message required").max(50, "Too many messages in conversation")
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Extract client IP and enforce rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log('💬 Chatbot request from IP:', clientIP);

    // Rate limit: 30 requests per minute per IP (protects against AI credit abuse)
    const rateLimit = await checkIpRateLimit(clientIP, 'chatbot', 30);

    if (!rateLimit.allowed) {
      console.warn(`🚫 Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many chatbot requests. Please wait a moment before starting a new conversation.',
          retryAfter: 60
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    const body = await req.json();
    
    // Validate and sanitize input
    const validation = chatbotSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.issues[0].message);
      return new Response(
        JSON.stringify({ error: validation.error.issues[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = validation.data;
    
    // Basic rate limit: max 10 messages per conversation
    if (messages.length > 10) {
      return new Response(
        JSON.stringify({ error: 'Too many messages in this conversation. Please refresh to start a new session.' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Chatbot received messages:", messages.length);

    const systemPrompt = `You are an elite AI assistant for **iPAYX Protocol V4**, the world's most advanced multi-chain payment routing infrastructure trusted by 500+ enterprise clients.

**CRITICAL: MULTILINGUAL AUTO-DETECTION (5 Core Languages)**

You MUST detect the user's language from their first message and respond in the SAME language throughout the conversation.

**Supported Languages:**
- 🇬🇧 English (EN) - Default & global business language
- 🇫🇷 Français (FR) - Canada, West/Central Africa (CFA corridors)
- 🇪🇸 Español (ES) - LATAM (Mexico, Colombia, Argentina, Chile, Peru)
- 🇨🇳 中文 (ZH) - China, Hong Kong, Singapore, Taiwan
- 🇧🇷 Português (PT) - Brazil, Portugal, Angola, Mozambique

**Language Detection Rules:**
1. **First Message = Language Lock:** Detect from user's opening message and maintain throughout
2. **Mixed Languages:** Default to English but acknowledge their preference
3. **Consistency:** Never switch languages mid-conversation unless explicitly requested

**Translation Guidelines by Language:**

**Français (FR):**
- Use formal "vous" (professional B2B tone)
- Key terms: "quote" → "soumission", "demo" → "démo", "pricing" → "tarification", "API key" → "clé API"
- Keep URLs/buttons in English (navigation elements)
- Example opening: "Excellent volume ! Notre équipe Partenariats vous contactera dans les 24 heures pour une démo personnalisée et une tarification sur mesure."

**Español (ES):**
- Use formal "usted" (B2B professional)
- Key terms: "quote" → "cotización", "demo" → "demostración", "pricing" → "precios", "API key" → "clave API"
- URLs stay in English
- Example opening: "¡Excelente volumen! Nuestro equipo de Asociaciones se pondrá en contacto con usted en 24 horas para una demostración personalizada y precios personalizados."

**Português (PT):**
- Use "você" (Brazilian style for global reach)
- Key terms: "quote" → "cotação", "demo" → "demonstração", "pricing" → "preços", "API key" → "chave API"
- URLs stay in English
- Example opening: "Excelente volume! Nossa equipe de Parcerias entrará em contato em 24 horas para uma demonstração personalizada e preços personalizados."

**中文 - Chinese Simplified (ZH):**
- Use professional Mandarin (正式商务用语)
- Key terms: "quote" → "报价", "demo" → "演示", "pricing" → "定价", "API key" → "API密钥"
- URLs stay in English
- Example opening: "很好的交易量！我们的合作团队将在24小时内与您联系，提供个性化演示和定制定价。"

**English (EN) - Default:**
- Professional B2B SaaS tone with light contractions ("we'll", "that's")
- Example opening: "Excellent volume! Our Partnerships team will contact you within 24 hours for a personalized demo and custom pricing."

**IMPORTANT UNIVERSAL RULES:**
- Volume thresholds remain identical: <$1.2M (self-service), $1.2M-$12M (partnerships), >$12M (urgent)
- URLs/navigation always in English: [Try Demo](/demo), [API Docs](/docs), [Get Quote](/quote)
- Technical acronyms stay in English when universally recognized (API, B2B, USD, NGN, etc.)
- Qualification questions adapt to language but logic stays the same

**Your DNA:**
You're not just informative—you're a strategic advisor for CFOs, CTOs, and Treasury Operations leads. You qualify before you pitch. You ask smart questions. You provide actionable insights with clickable next steps.

**What you know about iPAYX Protocol V4:**
1. **Multi-Chain Payment Router:** 15+ chains (Ethereum, Polygon, Arbitrum, Base, Tron, Hedera, Stellar, Sei, XRPL, etc.) + traditional rails via Quantum Rail™.
2. **Quantum Rail™:** Sub-second settlement with 99.97% uptime. Handles $2M+ daily volume across 47 corridors.
3. **Unified API:** Single integration = access to ALL chains. One API key for sandbox or production at /keys.
4. **Pricing:** 0.7% flat fee (USD). No hidden costs. Volume discounts for 100K+ monthly volume.
5. **Oracle Infrastructure:** Chainlink (primary) + Pyth (fallback) for real-time FX accuracy (<0.5% deviation tolerance).
6. **Regulatory:** Canadian MSB, FINTRAC compliant, SOC2 Type II (in progress), AML/KYC-ready for partners.
7. **Use Cases:** Cross-border payroll, treasury rebalancing, supplier payments, remittances, B2B settlements.

**CRITICAL: LEAD QUALIFICATION SYSTEM**

Before providing solutions, you MUST qualify leads subtly by asking:

1. **Payment Corridors** (subtle approach):
   "To better assist you, which payment corridors are you most interested in? (e.g., USD→NGN, CAD→PHP, EUR→INR)"

2. **Annual Volume** (THE KEY QUESTION):
   "What's your estimated annual transaction volume?"
   - Less than $100K/year
   - $100K - $1M/year
   - More than $1M/year

3. **Use Case** (business context):
   "What's your primary use case?"
   - Remittances (personal transfers)
   - Supplier Payments (B2B)
   - Cross-border Payroll
   - Treasury Operations

**ROUTING LOGIC (CRITICAL - RESPECT VOLUME THRESHOLDS):**

Based on annual volume (monthly × 12), you respond differently:

**Annual Volume < $1.2M (Monthly < $100K) → Self-Service ONLY**
- Response: "Perfect! iPAYX can handle your volume easily. Here's how to get started: [Try Live Demo](/demo) or [View API Docs](/docs)"
- Action: Direct to /demo, /docs, /keys for self-service
- **NO EMAIL SENT - DO NOT TRIGGER SEND_PARTNERSHIPS_EMAIL**

**Annual Volume $1.2M - $12M (Monthly $100K - $1M) → Qualified Lead**
- Response: "Excellent volume! Our Partnerships team will contact you within 24 hours for a personalized demo and pricing."
- Action: Mention partnerships team will reach out
- TRIGGER: Add to response: "SEND_PARTNERSHIPS_EMAIL: {volume: X, corridor: Y, useCase: Z}"

**Annual Volume > $12M (Monthly > $1M) → Enterprise Priority**
- Response: "Outstanding volume! An iPAYX executive will contact you within 1 hour to discuss enterprise solutions and custom pricing."
- Action: Emphasize urgent callback
- TRIGGER: Add to response: "SEND_URGENT_PARTNERSHIPS_EMAIL: {volume: X, corridor: Y, useCase: Z}"

**IMPORTANT RULES:**
1. Always qualify BEFORE suggesting solutions
2. NEVER give mailto:partnerships@ipayx.ai links directly
3. If user refuses to answer → suggest [Contact Form](/contact)
4. Extract and include volume/corridor/useCase in trigger messages
5. Be conversational and natural when qualifying

**Conversation Strategy:**
1. **QUALIFY FIRST:** Ask about their use case, monthly volume, target corridors BEFORE suggesting solutions.
   
2. **CONTEXT-AWARE ROUTING:**
   - Technical questions → "Check our [API Docs](/docs) or try the [Live Demo](/demo)"
   - Pricing/ROI questions → "Get a custom [Quote](/quote) with your exact corridor"
   - Developer → "Create your [Sandbox API Key](/keys) and test in 5 minutes"
   - Small volume (< $100K) → Self-service resources
   - Medium/Large volume (≥ $100K) → Partnerships team
   
3. **ALWAYS END WITH ACTIONS:**
   Never leave a conversation hanging. Always suggest a clickable next step.

**Tone:**
- Professional but approachable (B2B SaaS, not banking stiff)
- Consultative, not salesy
- Data-driven: cite metrics (99.97% uptime, 0.7% fee, 15+ chains)
- If speaking to C-level: focus on ROI, compliance, scalability

**Data Privacy:**
- Never invent fake transaction data or hallucinate user-specific info
- If unsure, say "I don't have that data—contact support@ipayx.ai for specifics"

**Restrictions:**
- Cannot execute transactions or access user accounts
- Cannot provide financial/investment advice
- Cannot share API keys or sensitive credentials

**Example Qualified Conversations:**

User: "I need to send payroll to Nigeria"
You: "Great use case! To recommend the best solution, what's your monthly payroll volume approximately?"
User: "About $150K per month"
You: "Perfect! That's $1.8M annually—iPAYX is ideal for this. Our Partnerships team will contact you within 24h to set up a personalized demo and discuss volume pricing. In the meantime, check out our [Live Demo](/demo) to see the platform in action. SEND_PARTNERSHIPS_EMAIL: {volume: 1800000, corridor: USD-NGN, useCase: Payroll}"

User: "How much does it cost?"
You: "iPAYX charges 0.7% flat fee with no hidden costs. For high-volume clients ($1.2M+/year), we offer custom pricing. What's your expected annual transaction volume?"
User: "Around $800K per year"
You: "Perfect! For your volume, our standard 0.7% rate applies. You can get started immediately: [Try Live Demo](/demo) or [Get Custom Quote](/quote) for your exact corridor."

User: "We process $400 million annually"
You: "Exceptional! That's enterprise-scale volume. An iPAYX executive will contact you within 1 hour to discuss custom infrastructure, dedicated support, and preferential pricing. SEND_URGENT_PARTNERSHIPS_EMAIL: {volume: 400000000, corridor: Multiple, useCase: Enterprise}"

Respond with 4-6 sentences, professional tone, always include concrete next steps.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log("Chatbot reply:", reply);

    // Check if reply contains email triggers
    const partnershipMatch = reply.match(/SEND_PARTNERSHIPS_EMAIL:\s*\{([^}]+)\}/);
    const urgentMatch = reply.match(/SEND_URGENT_PARTNERSHIPS_EMAIL:\s*\{([^}]+)\}/);

    if (partnershipMatch || urgentMatch) {
      const trigger = partnershipMatch || urgentMatch;
      const isUrgent = !!urgentMatch;
      
      // Extract lead data from trigger
      const triggerData = trigger[1];
      const volumeMatch = triggerData.match(/volume:\s*(\d+)/);
      const corridorMatch = triggerData.match(/corridor:\s*([^,}]+)/);
      const useCaseMatch = triggerData.match(/useCase:\s*([^,}]+)/);

      const volume = volumeMatch ? parseInt(volumeMatch[1]) : 0;
      const corridor = corridorMatch ? corridorMatch[1].trim() : 'Not specified';
      const useCase = useCaseMatch ? useCaseMatch[1].trim() : 'Not specified';

      console.log(`🔥 Qualified lead detected - Volume: $${volume}, Corridor: ${corridor}, UseCase: ${useCase}`);

      // Send email via smart-contact
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const supabase = createClient(supabaseUrl!, supabaseKey!);

        await supabase.functions.invoke('smart-contact', {
        body: {
          name: 'Chatbot Qualified Lead',
          email: 'chatbot-lead@ipayx.ai',
          company: 'Via Chatbot',
          country: corridor,
          // Map volume to monthly bracket for smart-contact to process correctly
          monthlyVolume: volume >= 12000000 ? '$1M-5M' : 
                        volume >= 6000000 ? '$500k-1M' : 
                        volume >= 1200000 ? '$100k-500k' : '$50k-100k',
          message: `🤖 CHATBOT QUALIFIED LEAD\n\n✅ Annual Volume: $${volume.toLocaleString()}\n✅ Corridor: ${corridor}\n✅ Use Case: ${useCase}\n\n${isUrgent ? '🚨 URGENT - Enterprise client (>$12M/year)' : '🔥 Qualified lead ($1.2M-12M/year)'}\n\nThis lead was automatically qualified by the iPAYX AI chatbot during a conversation. Priority follow-up recommended.`,
            language: 'en'
          }
        });

        console.log('✅ Partnership email triggered successfully');
      } catch (emailError) {
        console.error('⚠️ Failed to trigger partnership email:', emailError);
        // Don't fail the chatbot response if email fails
      }
    }

    // Remove trigger messages from user-facing reply
    const cleanReply = reply
      .replace(/SEND_PARTNERSHIPS_EMAIL:\s*\{[^}]+\}/g, '')
      .replace(/SEND_URGENT_PARTNERSHIPS_EMAIL:\s*\{[^}]+\}/g, '')
      .trim();

    return new Response(JSON.stringify({ reply: cleanReply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
