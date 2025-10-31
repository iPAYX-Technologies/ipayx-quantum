import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Auto-followup: Starting scheduled run...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 📧 SEQUENCE 1: Follow-up for emails sent 3 days ago with no opens
    console.log('\n📬 Checking for 3-day follow-ups (no opens)...');
    
    const { data: unopenedLeads, error: error1 } = await supabase
      .from('campaigns')
      .select('lead_id, leads(id, name, email, company, monthly_volume, ai_score)')
      .eq('campaign_type', 'welcome')
      .eq('status', 'sent')
      .lte('sent_at', threeDaysAgo.toISOString())
      .is('opened_at', null);

    if (error1) {
      console.error('❌ Query error (unopened):', error1);
    } else if (unopenedLeads && unopenedLeads.length > 0) {
      console.log(`📨 Found ${unopenedLeads.length} leads for followup_1`);
      
      // Extract unique lead IDs
      const uniqueLeadIds = [...new Set(unopenedLeads.map(c => c.lead_id))];
      
      // Trigger campaign-manager for followup_1
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/campaign-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_ids: uniqueLeadIds,
          campaign_type: 'followup_1'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Followup_1 sent to ${result.sent} leads`);
      } else {
        console.error('❌ Failed to trigger followup_1:', await response.text());
      }
    } else {
      console.log('ℹ️ No unopened emails found (3 days)');
    }

    // 📧 SEQUENCE 2: Final follow-up for emails sent 7 days ago, opened but no clicks
    console.log('\n📬 Checking for 7-day follow-ups (opened but no clicks)...');
    
    const { data: openedNoClickLeads, error: error2 } = await supabase
      .from('campaigns')
      .select('lead_id, leads(id, name, email, company, monthly_volume, ai_score)')
      .in('campaign_type', ['welcome', 'followup_1'])
      .eq('status', 'opened')
      .lte('sent_at', sevenDaysAgo.toISOString())
      .is('clicked_at', null);

    if (error2) {
      console.error('❌ Query error (opened no click):', error2);
    } else if (openedNoClickLeads && openedNoClickLeads.length > 0) {
      console.log(`📨 Found ${openedNoClickLeads.length} leads for followup_2`);
      
      const uniqueLeadIds = [...new Set(openedNoClickLeads.map(c => c.lead_id))];
      
      // Trigger campaign-manager for followup_2
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/campaign-manager`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_ids: uniqueLeadIds,
          campaign_type: 'followup_2'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Followup_2 sent to ${result.sent} leads`);
      } else {
        console.error('❌ Failed to trigger followup_2:', await response.text());
      }
    } else {
      console.log('ℹ️ No opened/unclicked emails found (7 days)');
    }

    // 🎯 BONUS: Identify hot leads (opened + clicked within last 7 days)
    console.log('\n🔥 Identifying hot leads (opened + clicked)...');
    
    const { data: hotLeads, error: error3 } = await supabase
      .from('campaigns')
      .select('lead_id, leads(id, name, email, company, monthly_volume, ai_score)')
      .eq('status', 'clicked')
      .gte('clicked_at', sevenDaysAgo.toISOString());

    if (!error3 && hotLeads && hotLeads.length > 0) {
      console.log(`🔥 Found ${hotLeads.length} hot leads! Consider priority outreach.`);
      
      // Log hot leads for admin review
      for (const lead of hotLeads) {
        const leadData = (lead as any).leads;
        console.log(`  🔥 ${leadData.name} (${leadData.email}) - Score: ${leadData.ai_score || 'N/A'}`);
      }
    }

    console.log('\n✅ Auto-followup run complete!');

    return new Response(JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      followup_1_triggered: unopenedLeads?.length || 0,
      followup_2_triggered: openedNoClickLeads?.length || 0,
      hot_leads_identified: hotLeads?.length || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Auto-followup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});