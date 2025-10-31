import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Admin-only access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract JWT token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Starting AI security audit...');

    // Step 1: Collect all critical files
    const criticalFiles = [
      // Backend edge functions
      { path: 'supabase/functions/smart-contact/index.ts', category: 'Backend' },
      { path: 'supabase/functions/chatbot/index.ts', category: 'Backend' },
      { path: 'supabase/functions/eliza-orchestrator/index.ts', category: 'Backend' },
      { path: 'supabase/functions/meta-router/index.ts', category: 'Backend' },
      { path: 'supabase/functions/quote/index.ts', category: 'Backend' },
      { path: 'supabase/functions/transfer/index.ts', category: 'Backend' },
      { path: 'supabase/functions/meta-router-passthrough/index.ts', category: 'Backend' },
      // Frontend auth/admin
      { path: 'src/components/ProtectedRoute.tsx', category: 'Frontend Auth' },
      { path: 'src/pages/Admin.tsx', category: 'Frontend Admin' },
      { path: 'src/pages/Dashboard.tsx', category: 'Frontend' },
      // Security docs
      { path: 'SECURITY.md', category: 'Documentation' },
    ];

    // Step 2: Read file contents (simulated - in real implementation would use Deno.readTextFile)
    const fileContents = criticalFiles.map(f => ({
      ...f,
      content: `[Content of ${f.path} - would be read from filesystem in production]`
    }));

    // Step 3: Get RLS policies from database
    const { data: rlsPolicies, error: rlsError } = await supabase.rpc('get_rls_policies');
    
    let rlsPoliciesText = '';
    if (!rlsError && rlsPolicies) {
      rlsPoliciesText = JSON.stringify(rlsPolicies, null, 2);
    }

    // Step 4: Construct audit prompt
    const filesContext = fileContents.map(f => 
      `\n### ${f.category}: ${f.path}\n\`\`\`typescript\n${f.content}\n\`\`\``
    ).join('\n\n');

    const auditPrompt = `You are a senior cybersecurity auditor specializing in fintech SaaS platforms.

**PROJECT CONTEXT:**
- iPAYX Protocol V4: Multi-chain payment aggregator (NO-KYC model)
- Tech Stack: Supabase (auth, DB, edge functions), React, TypeScript
- Critical Features: AI orchestration, multi-tenant API keys, email marketing, rate limiting

**AUDIT SCOPE:**
1. **Backend Security** - Edge functions, SQL injection, auth bypass
2. **Authentication & Authorization** - Admin privilege escalation, IDOR
3. **AI Credit Abuse** - Rate limiting, prompt injection in chatbot/eliza
4. **Data Leakage** - Leads table, transaction logs, PII exposure
5. **Business Logic Flaws** - Inconsistency with NO-KYC model
6. **Compliance** - GDPR, CAN-SPAM for marketing emails

**FILES TO AUDIT:**
${filesContext}

**RLS POLICIES:**
\`\`\`sql
${rlsPoliciesText}
\`\`\`

**OUTPUT FORMAT (STRICT JSON):**
Return a valid JSON object with this exact structure:
{
  "critical_issues": [
    {
      "file": "exact/path/to/file.ts",
      "line": 42,
      "severity": "CRITICAL",
      "category": "SQL Injection | AI Prompt Injection | Auth Bypass | Rate Limiting | Data Leakage | Business Logic",
      "issue": "Brief description of the vulnerability",
      "exploit": "Step-by-step how an attacker exploits this",
      "fix": "Concrete code snippet to fix"
    }
  ],
  "high_issues": [...],
  "medium_issues": [...],
  "low_issues": [...],
  "security_score": 85,
  "executive_summary": "Overall assessment in 2-3 sentences"
}

**CRITICAL RULES:**
- Every issue MUST have: file, line, exploit scenario, fix code
- Prioritize exploitable vulnerabilities over theoretical risks
- Check for consistency between SECURITY.md and actual implementation
- Verify rate limiting is enforced on all public endpoints
- Ensure RLS policies prevent privilege escalation`;

    console.log('🤖 Calling Claude Opus 4 via Lovable AI...');

    // Step 5: Call Lovable AI with Claude Opus 4
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1-20250805',
        messages: [
          { role: 'system', content: 'You are a senior cybersecurity auditor. Return only valid JSON.' },
          { role: 'user', content: auditPrompt }
        ],
        max_tokens: 16000,
        temperature: 0.3 // Lower temperature for more consistent security analysis
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const auditReport = JSON.parse(aiData.choices[0].message.content);

    console.log('📊 Audit completed, score:', auditReport.security_score);

    // Step 6: Store results in database
    const { data: savedAudit, error: saveError } = await supabase
      .from('security_audits')
      .insert({
        model: 'claude-opus-4-1-20250805',
        security_score: auditReport.security_score,
        critical_count: auditReport.critical_issues?.length || 0,
        high_count: auditReport.high_issues?.length || 0,
        medium_count: auditReport.medium_issues?.length || 0,
        low_count: auditReport.low_issues?.length || 0,
        report: auditReport,
        metadata: {
          files_analyzed: criticalFiles.length,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving audit:', saveError);
      throw saveError;
    }

    console.log('✅ Audit saved to database:', savedAudit.id);

    return new Response(
      JSON.stringify({
        success: true,
        audit: savedAudit,
        ...auditReport
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in ai-audit function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});