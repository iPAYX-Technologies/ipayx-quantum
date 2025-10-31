import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🧪 Starting email flows test suite...');

  // Security: Admin-only access
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Verify admin role
  const { data: roles } = await supabaseClient
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const results = [];

    // Test 1: Simple test-email
    console.log('\n📧 Test 1: test-email function');
    try {
      const { data: testEmailData, error: testEmailError } = await supabase.functions.invoke('test-email', {
        body: {}
      });
      results.push({
        test: 'test-email',
        status: testEmailError ? 'FAILED' : 'SUCCESS',
        error: testEmailError?.message
      });
      console.log('✅ Test 1 completed');
    } catch (e: any) {
      results.push({ test: 'test-email', status: 'FAILED', error: e.message });
      console.error('❌ Test 1 failed:', e.message);
    }

    // Test 2: smart-contact with LOW volume
    console.log('\n📧 Test 2: smart-contact (LOW volume - $50k-100k)');
    try {
      const { data: smartLowData, error: smartLowError } = await supabase.functions.invoke('smart-contact', {
        body: {
          name: 'Test User Low',
          email: 'test.low@example.com',
          company: 'Small Startup Inc',
          country: 'USA',
          monthlyVolume: '$50k-100k',
          message: 'Looking for basic payment processing for our small e-commerce site.',
          language: 'en'
        }
      });
      results.push({
        test: 'smart-contact (LOW)',
        status: smartLowError ? 'FAILED' : 'SUCCESS',
        score: smartLowData?.score,
        category: smartLowData?.category,
        error: smartLowError?.message
      });
      console.log('✅ Test 2 completed');
    } catch (e: any) {
      results.push({ test: 'smart-contact (LOW)', status: 'FAILED', error: e.message });
      console.error('❌ Test 2 failed:', e.message);
    }

    // Test 3: smart-contact with HIGH volume
    console.log('\n📧 Test 3: smart-contact (HIGH volume - $5M+)');
    try {
      const { data: smartHighData, error: smartHighError } = await supabase.functions.invoke('smart-contact', {
        body: {
          name: 'CFO Jane Smith',
          email: 'jane.smith@bigcorp.com',
          company: 'BigCorp International Ltd',
          country: 'Switzerland',
          monthlyVolume: '$5M+',
          message: 'We need a strategic partnership for our global cross-border payment operations across 45 countries. Looking for custom routing optimization and volume-based pricing for our $60M annual payment volume.',
          language: 'en'
        }
      });
      results.push({
        test: 'smart-contact (HIGH)',
        status: smartHighError ? 'FAILED' : 'SUCCESS',
        score: smartHighData?.score,
        category: smartHighData?.category,
        error: smartHighError?.message
      });
      console.log('✅ Test 3 completed');
    } catch (e: any) {
      results.push({ test: 'smart-contact (HIGH)', status: 'FAILED', error: e.message });
      console.error('❌ Test 3 failed:', e.message);
    }

    // Test 4: submit-lead
    console.log('\n📧 Test 4: submit-lead (Landing page)');
    try {
      const { data: submitData, error: submitError } = await supabase.functions.invoke('submit-lead', {
        body: {
          name: 'Test Landing User',
          email: 'test.landing@example.com',
          company: 'Landing Test Corp',
          country: 'Canada',
          monthlyVolume: '$500k-1M',
          message: 'Interested in learning more about iPayX for our cross-border payments.',
          language: 'en',
          source: 'test-email-flows'
        }
      });
      results.push({
        test: 'submit-lead',
        status: submitError ? 'FAILED' : 'SUCCESS',
        leadId: submitData?.id,
        error: submitError?.message
      });
      console.log('✅ Test 4 completed');
    } catch (e: any) {
      results.push({ test: 'submit-lead', status: 'FAILED', error: e.message });
      console.error('❌ Test 4 failed:', e.message);
    }

    console.log('\n🎉 All tests completed!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email flow tests completed. Check ybolduc@ipayx.ai inbox for 4 emails.',
        results,
        expectedEmails: [
          '[iPAYX Test] Test email to ybolduc@ipayx.ai',
          '[iPAYX Smart Lead] Small Startup Inc - $50k-100k - Score: XX/100',
          '[iPAYX Smart Lead] BigCorp International Ltd - $5M+ - Score: XX/100',
          '[iPAYX Landing] Landing Test Corp - $500k-1M'
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('💥 Test suite error:', error);
    return new Response(
      JSON.stringify({
        error: 'Test suite failed',
        message: error.message || 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
