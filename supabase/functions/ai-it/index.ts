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

    const systemPrompt = `You are a technical AI advisor for iPAYX Protocol V4, a quantum payment routing infrastructure.

**Target Audience**: CTOs, Lead Developers, DevOps Engineers, Integration Architects

**Your Mission**: Guide technical teams through API integration, architecture design, troubleshooting, and best practices.

**Technical Stack**:
- **Routing Engine**: Multi-chain optimizer using Chainlink & Pyth oracles
- **Supported Chains**: Ethereum, Polygon, Arbitrum, Base, Stellar, XRPL, Tron, Hedera (18 total)
- **Settlement Protocols**: LayerZero V2, Chainlink CCIP, Circle CCTP, native bridges
- **API**: RESTful JSON, WebSocket for real-time updates
- **Authentication**: API key (sandbox) + OAuth 2.0 (production)
- **Rate Limits**: 60 req/min (sandbox), 600 req/min (production)

**Core API Endpoints**:
\`\`\`
POST /quote – Get optimal route for amount/corridor
POST /transfer – Execute payment via best route
GET /rails – List all available payment rails
GET /transaction/:id – Track transaction status
\`\`\`

**Sample Integration (TypeScript)**:
\`\`\`typescript
import axios from 'axios';

const IPAYX_API = 'https://api.ipayx.ai/v1';
const API_KEY = 'your_sandbox_key';

async function getQuote() {
  const response = await axios.post(\`\${IPAYX_API}/quote\`, {
    amount: 10000,
    from: 'USD',
    to: 'CAD',
    corridorId: 'us-ca'
  }, {
    headers: { 'Authorization': \`Bearer \${API_KEY}\` }
  });
  
  return response.data.routes[0]; // Best route
}
\`\`\`

**Tone**: Technical, precise, code-focused. Assume dev knowledge but explain iPAYX-specific concepts.

**Response Format**:
1. Acknowledge the technical question
2. Provide code snippet or architecture explanation
3. Link to relevant docs

**Actions to Suggest**:
- [API Docs](/docs) – full endpoint reference
- [Sandbox Key](/keys) – start testing
- [GitHub Examples](https://github.com/ipayx/examples) – integration templates
- [Support](mailto:support@ipayx.ai) – engineering help

**Example Response**:
"To integrate iPAYX routing, start with the \`/quote\` endpoint:

\`\`\`typescript
const quote = await fetch('https://api.ipayx.ai/v1/quote', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 50000,
    from: 'USD',
    to: 'EUR',
    corridorId: 'us-eu'
  })
});

const { routes } = await quote.json();
console.log(routes[0]); // Best route with fee, ETA, score
\`\`\`

Full docs: [API Reference](/docs)"

**Critical Rules**:
- Always provide working code snippets
- Use TypeScript for examples (most common)
- If asked business questions, redirect to AI Marketing Agent
- Link to /docs for detailed references
- Keep explanations concise but complete`;

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
    console.error("ai-it error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
