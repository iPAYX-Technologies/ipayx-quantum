import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PARTNERSHIP_TARGETS = [
  {
    name: 'Messari',
    email: 'partnerships@messari.io',
    template: 'messari',
    expected_leads: 50,
  },
  {
    name: 'Hedera Foundation',
    email: 'partnerships@hedera.com',
    template: 'hedera',
    expected_leads: 30,
  },
  {
    name: 'XRPL Commons',
    email: 'partnerships@xrplcommons.org',
    template: 'xrpl',
    expected_leads: 40,
  },
  {
    name: 'Ripple (alternative)',
    email: 'partnerships@ripple.com',
    template: 'xrpl',
    expected_leads: 50,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partner, custom_message } = await req.json();
    
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    console.log('🤝 Sending partnership email to:', partner || 'all partners');

    const targets = partner 
      ? PARTNERSHIP_TARGETS.filter(p => p.name === partner)
      : PARTNERSHIP_TARGETS;

    const results = await Promise.all(
      targets.map(async (target) => {
        const emailContent = getPartnershipEmail(target.template, custom_message);
        
        const emailPayload = {
          personalizations: [
            {
              to: [{ email: target.email, name: target.name }],
              subject: emailContent.subject,
            },
          ],
          from: {
            email: 'yannick@ipayx.ai',
            name: 'Yannick Bolduc - CEO, iPAYX Protocol',
          },
          content: [
            {
              type: 'text/html',
              value: emailContent.html,
            },
          ],
        };

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to send to ${target.name}:`, error);
          return { partner: target.name, success: false, error };
        }

        console.log(`✅ Sent partnership email to ${target.name}`);
        
        return {
          partner: target.name,
          success: true,
          expected_leads: target.expected_leads,
        };
      })
    );

    // Log to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('leads').insert(
      results
        .filter(r => r.success)
        .map(r => ({
          email: `partnerships+${r.partner.toLowerCase().replace(/\s+/g, '')}@ipayx.ai`,
          name: `${r.partner} Partnership`,
          company: r.partner,
          source: 'partnership-outreach',
          metadata: {
            partner_type: 'ecosystem',
            expected_leads: r.expected_leads,
            sent_at: new Date().toISOString(),
          },
        }))
    );

    const totalExpectedLeads = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.expected_leads || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: results.filter(r => r.success).length,
        results,
        expected_leads: totalExpectedLeads,
        timeline: '24-48 hours for responses',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Partnership email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getPartnershipEmail(template: string, customMessage?: string): { subject: string; html: string } {
  const templates: Record<string, { subject: string; html: string }> = {
    messari: {
      subject: 'Partnership opportunity - iPAYX payment rails for crypto projects',
      html: `
        <p>Hey Messari team,</p>
        
        <p><strong>Yannick Bolduc here, CEO of iPAYX Protocol.</strong></p>
        
        <p>I see you're tracking 3,000+ crypto projects in your database. Many of them struggle with:</p>
        <ul>
          <li>❌ Expensive fiat on/off ramps (2-5% fees)</li>
          <li>❌ Slow cross-border settlements (2-5 days)</li>
          <li>❌ Multi-currency payment chaos</li>
        </ul>
        
        <p><strong>iPAYX solves this:</strong></p>
        <ul>
          <li>✅ 0.7% flat fee (vs 2-5% industry standard)</li>
          <li>✅ 8-second settlements (135 blockchain + traditional rails)</li>
          <li>✅ One API for global payments</li>
        </ul>
        
        <p><strong>Partnership proposal:</strong></p>
        <ol>
          <li>Co-branded webinar: "Payment Infrastructure for Crypto Companies"</li>
          <li>iPAYX featured in Messari newsletter (150K+ readers)</li>
          <li>Intro to 5-10 portfolio companies needing better payment rails</li>
        </ol>
        
        <p><strong>In exchange:</strong></p>
        <ul>
          <li>We'll integrate Messari data in our dashboards</li>
          <li>10% revenue share on closed deals from your intros</li>
          <li>Co-marketing across our channels</li>
        </ul>
        
        <p>Available for a 15-min call this week to discuss?</p>
        
        ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
        
        <p>Best,<br>
        <strong>Yannick Bolduc</strong><br>
        CEO, iPAYX Protocol<br>
        yannick@ipayx.ai | <a href="https://ipayx.ai">ipayx.ai</a></p>
      `,
    },
    hedera: {
      subject: 'Hedera integration - 8-second settlements for HBAR payments',
      html: `
        <p>Hi Hedera team,</p>
        
        <p><strong>Yannick Bolduc, CEO of iPAYX Protocol here.</strong></p>
        
        <p>We've integrated Hedera as a core payment rail in our multi-chain routing system:</p>
        <ul>
          <li>⚡ 8-second finality</li>
          <li>💰 $0.0001 transaction fees</li>
          <li>🌍 HBAR → fiat on/off ramps (0.7% fees)</li>
        </ul>
        
        <p><strong>Partnership opportunity:</strong></p>
        <ol>
          <li>Introduce us to 3-5 Hedera ecosystem companies needing payment optimization</li>
          <li>Joint case study: "How [Hedera Project] saved 60% on cross-border payments"</li>
          <li>Feature iPAYX in Hedera developer documentation</li>
        </ol>
        
        <p><strong>What you get:</strong></p>
        <ul>
          <li>Increased HBAR transaction volume</li>
          <li>Real-world payment use case showcase</li>
          <li>Co-marketing to our 500+ enterprise prospects</li>
        </ul>
        
        ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
        
        <p>Let's schedule a quick intro call?</p>
        
        <p>Best,<br>
        <strong>Yannick Bolduc</strong><br>
        CEO, iPAYX Protocol<br>
        yannick@ipayx.ai</p>
      `,
    },
    xrpl: {
      subject: 'XRP Ledger + iPAYX - Instant cross-border settlement partnership',
      html: `
        <p>Hey XRPL / Ripple team,</p>
        
        <p><strong>Yannick Bolduc here, CEO of iPAYX Protocol.</strong></p>
        
        <p>We're routing cross-border payments through XRP Ledger:</p>
        <ul>
          <li>⚡ 3-5 second settlement finality</li>
          <li>🌍 150+ country coverage</li>
          <li>💰 70% cheaper than Swift/Western Union</li>
        </ul>
        
        <p><strong>Partnership proposal:</strong></p>
        <ol>
          <li>Intro to 5-10 remittance companies using XRP rails</li>
          <li>Joint case studies with XRPL payment providers</li>
          <li>Feature iPAYX in XRPL ecosystem documentation</li>
        </ol>
        
        <p><strong>Value for XRPL:</strong></p>
        <ul>
          <li>Drive real payment volume to XRP Ledger</li>
          <li>Showcase enterprise adoption</li>
          <li>Co-market the partnership</li>
        </ul>
        
        ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
        
        <p>15-min intro call this week?</p>
        
        <p>Best,<br>
        <strong>Yannick Bolduc</strong><br>
        CEO, iPAYX Protocol<br>
        yannick@ipayx.ai | <a href="https://ipayx.ai">ipayx.ai</a></p>
      `,
    },
  };

  return templates[template] || templates.messari;
}
