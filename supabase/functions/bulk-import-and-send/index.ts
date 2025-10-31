import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🚀 Starting bulk import and send process...');

    // 1️⃣ Parse CSV from request body
    const { csvData } = await req.json();
    
    if (!csvData) {
      throw new Error('No CSV data provided');
    }

    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
    
    console.log(`📊 CSV Headers: ${headers.join(', ')}`);

    const leads = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parse CSV line (handle quoted fields)
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let char of line) {
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const row: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        row[header] = values[index]?.replace(/"/g, '') || '';
      });

      const email = row['Email']?.toLowerCase().trim();
      
      // Skip invalid emails
      if (!email || email === 'not found' || !email.includes('@')) {
        skipped++;
        continue;
      }

      // Map company size to monthly volume
      const sizeToVolume: Record<string, string> = {
        '11-50': '$100K-$500K',
        '51-200': '$500K-$2M',
        '201-500': '$2M-$10M',
        '501-1000': '$10M-$50M',
        '1001-5000': '$50M-$200M',
        '5001-10,000': '$200M-$1B',
        '10,001+': '$1B+'
      };

      const name = [row['First Name'], row['Last Name']].filter(Boolean).join(' ').trim() || null;
      const company = row['Company']?.trim() || null;
      const country = row['Geo - company']?.trim() || null;
      const size = row['Size']?.trim() || null;
      const monthly_volume = size ? (sizeToVolume[size] || '$100K+') : '$100K+';

      leads.push({
        email,
        name,
        company,
        country,
        monthly_volume,
        source: 'prospect_300_bulk',
        ai_score: 100, // All Explee leads are HOT
        metadata: {
          job_title: row['Job Title'] || '',
          linkedin: row['LinkedIn'] || '',
          domain: row['Domain'] || '',
          size: size || '',
          imported_at: new Date().toISOString(),
          csv_line: i
        }
      });
    }

    console.log(`✅ Parsed ${leads.length} valid leads (${skipped} skipped "not found")`);

    // 2️⃣ Insert leads into database (batch insert with conflict handling)
    const BATCH_SIZE = 50;
    let totalInserted = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('leads')
        .upsert(batch, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
      } else {
        totalInserted += data?.length || 0;
        console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Inserted ${data?.length || 0} leads`);
      }
    }

    console.log(`📥 Total leads inserted/updated: ${totalInserted}`);

    // 3️⃣ Fetch ALL leads with source 'prospect_300_bulk' (force re-send)
    const { data: targetLeads, error: fetchError } = await supabase
      .from('leads')
      .select('id')
      .eq('source', 'prospect_300_bulk')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch target leads: ${fetchError.message}`);
    }

    const leadIds = targetLeads?.map(l => l.id) || [];
    console.log(`🎯 Found ${leadIds.length} leads to send campaign to`);

    if (leadIds.length === 0) {
      throw new Error('No leads found with source prospect_300_bulk');
    }

    // 4️⃣ Trigger campaign-manager for these specific leads
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const campaignResponse = await fetch(`${SUPABASE_URL}/functions/v1/campaign-manager`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lead_ids: leadIds,
        campaign_type: 'welcome',
        force_resend: true
      })
    });

    if (!campaignResponse.ok) {
      const errorText = await campaignResponse.text();
      console.error('❌ Campaign manager failed:', errorText);
      throw new Error(`Campaign launch failed: ${campaignResponse.status}`);
    }

    const campaignResult = await campaignResponse.json();
    console.log('✅ Campaign launched:', campaignResult);

    return new Response(JSON.stringify({
      success: true,
      total_parsed: leads.length,
      total_inserted: totalInserted,
      skipped_invalid: skipped,
      campaign_sent: campaignResult.sent || 0,
      campaign_total: campaignResult.total || 0,
      message: `🚀 Imported ${totalInserted} leads and launched campaign for ${leadIds.length} leads!`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Bulk import and send error:", error);
    return errorResponse(error, corsHeaders);
  }
});
