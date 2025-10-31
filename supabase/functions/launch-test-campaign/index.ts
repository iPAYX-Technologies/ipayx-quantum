import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { requireAdmin } from '../_shared/admin-check.ts';
import { errorResponse } from '../_shared/error-handler.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin authentication
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof Response) return adminCheck;
  const adminUserId = adminCheck;

  try {
    console.log("🚀 AUTO-LAUNCH: Starting test campaign...");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get top lead by AI score
    const { data: topLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, name, email, company, ai_score")
      .order("ai_score", { ascending: false })
      .limit(1);

    if (leadsError) throw leadsError;
    if (!topLeads || topLeads.length === 0) {
      throw new Error("No leads found in database");
    }

    const lead = topLeads[0];
    console.log(`✅ Selected lead: ${lead.name} (${lead.email}) - Score: ${lead.ai_score}`);

    // 2. Launch campaign-manager with this lead
    console.log("📹 Calling campaign-manager to generate video...");
    
    const campaignResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/campaign-manager`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          lead_ids: [lead.id],
          campaign_type: "welcome"
        })
      }
    );

    const campaignResult = await campaignResponse.json();
    
    console.log("📊 Campaign Result:", JSON.stringify(campaignResult, null, 2));

    if (!campaignResponse.ok) {
      console.error("❌ Campaign failed:", campaignResult);
      return new Response(JSON.stringify({
        error: "Campaign failed",
        details: campaignResult,
        lead: lead
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("✅ Campaign launched successfully!");
    
    return new Response(JSON.stringify({
      success: true,
      message: `Campaign lancée pour ${lead.name}`,
      lead: {
        name: lead.name,
        email: lead.email,
        company: lead.company,
        score: lead.ai_score
      },
      result: campaignResult
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("❌ Launch test campaign error:", error);
    return errorResponse(error, corsHeaders);
  }
});
