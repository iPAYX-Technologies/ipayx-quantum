import { supabase } from "@/integrations/supabase/client";

/**
 * Trigger bulk HeyGen campaign for all hot/warm leads
 * Priority: Hot leads (score >70) first, then warm leads (score >50)
 */
export async function triggerBulkCampaign(campaignType: 'welcome' | 'followup_1' | 'followup_2' = 'welcome', minScore: number = 50) {
  console.log(`🚀 Triggering bulk campaign: ${campaignType} (min score: ${minScore})`);
  
  try {
    const { data, error } = await supabase.functions.invoke('campaign-manager', {
      body: {
        batch_mode: true,
        min_score: minScore,
        campaign_type: campaignType
      }
    });

    if (error) {
      console.error('❌ Bulk campaign failed:', error);
      throw error;
    }

    console.log('✅ Bulk campaign completed:', data);
    return data;
  } catch (error) {
    console.error('💥 Error triggering bulk campaign:', error);
    throw error;
  }
}

/**
 * Send campaign to Sophie Martin (priority lead)
 */
export async function triggerSophieMartinCampaign() {
  console.log('🎯 Triggering campaign for Sophie Martin (BNP Paribas)');
  
  try {
    // First, find Sophie Martin's lead ID
    const { data: sophieLead, error: findError } = await supabase
      .from('leads')
      .select('id')
      .eq('email', 'sophie.martin@bnpparibas.com')
      .maybeSingle();

    if (findError || !sophieLead) {
      console.error('❌ Sophie Martin not found in leads');
      throw new Error('Sophie Martin lead not found');
    }

    const { data, error } = await supabase.functions.invoke('campaign-manager', {
      body: {
        lead_ids: [sophieLead.id],
        campaign_type: 'welcome'
      }
    });

    if (error) {
      console.error('❌ Sophie Martin campaign failed:', error);
      throw error;
    }

    console.log('✅ Sophie Martin campaign sent:', data);
    return data;
  } catch (error) {
    console.error('💥 Error sending Sophie Martin campaign:', error);
    throw error;
  }
}

/**
 * Launch campaign for top 40 HOT leads (score 100, never contacted)
 */
export async function trigger40HotLeadsCampaign() {
  console.log('🚀 Launching campaign for 40 HOT leads (score 100)...');
  
  try {
    // Fetch top 40 HOT leads
    const { data: hotLeads, error: fetchError } = await supabase
      .from('leads')
      .select('id, name, company, email')
      .eq('ai_score', 100)
      .is('last_campaign_sent_at', null)
      .order('created_at', { ascending: true })
      .limit(40);

    if (fetchError) {
      console.error('❌ Failed to fetch HOT leads:', fetchError);
      throw fetchError;
    }

    if (!hotLeads || hotLeads.length === 0) {
      console.warn('⚠️ No HOT leads found (score 100, never contacted)');
      return { success: false, message: 'No eligible leads found' };
    }

    console.log(`📋 Found ${hotLeads.length} HOT leads:`, hotLeads.map(l => `${l.name} (${l.company})`));

    const leadIds = hotLeads.map(lead => lead.id);

    // Launch campaign via edge function
    const { data, error } = await supabase.functions.invoke('campaign-manager', {
      body: {
        lead_ids: leadIds,
        campaign_type: 'welcome'
      }
    });

    if (error) {
      console.error('❌ Campaign launch failed:', error);
      throw error;
    }

    console.log('✅ Campaign launched successfully:', data);
    console.log(`📊 Processing ${leadIds.length} leads - Videos will be generated in 20-30 minutes`);
    return data;
  } catch (error) {
    console.error('💥 Error launching 40 HOT leads campaign:', error);
    throw error;
  }
}
