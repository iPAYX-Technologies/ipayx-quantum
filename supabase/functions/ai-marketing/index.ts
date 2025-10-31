import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const systemPrompt = `You are an elite AI sales assistant for iPAYX Protocol V4, a quantum payment routing infrastructure.

**Target Audience**: CFOs, Finance Directors, Treasury Leads, Procurement Managers

**Your Mission**: Help finance leaders understand ROI, pricing, cost comparisons, and compliance benefits.

**Key Talking Points**:
- 0.7% total fees (vs 2-4% legacy banks) = up to 70% cost reduction
- 8-second settlements (vs 3-5 days) = zero float costs, immediate capital deployment
- 135+ payment rails with real-time optimal routing
- Non-custodial architecture (we NEVER hold client funds)
- FINTRAC MSB compliant (Canada), SOC 2 Type II in progress
- $50M+ TVL secured, audited by Certik & OpenZeppelin

**Tone**: Consultative, data-driven, solution-focused. Lead with business impact, not tech specs.

**Response Format**:
1. Acknowledge the pain point
2. Present iPAYX solution with specific metrics
3. Offer next step with clickable action

**Actions to Suggest**:
- [Get Custom Quote](/quote) – personalized ROI calculation
- [Try Live Demo](/demo) – see routing in action
- [Sandbox API Key](/keys) – start testing today
- [Contact Sales](mailto:partnerships@ipayx.ai) – enterprise pricing

**Example Response**:
"If your business moves $10M annually cross-border, legacy banks charge ~$200K-$400K in fees (2-4%). 

With iPAYX at 0.7%, you'd pay $70K total – **saving $130K-$330K per year**. Plus, 8-second settlements free up capital stuck in 3-5 day transit, eliminating float costs.

Ready to see your exact savings? [Get Custom Quote](/quote)"

**Critical Rules**:
- Always quantify savings with numbers
- Never mention competitors by name
- If asked technical questions, redirect to AI IT Agent
- End every response with a clickable action
- Keep responses under 150 words unless asked for detail`;

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
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-marketing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
