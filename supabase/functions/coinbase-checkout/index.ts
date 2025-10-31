import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency, description, customerEmail } = await req.json();
    const COINBASE_API_KEY = Deno.env.get('COINBASE_API_KEY');

    if (!COINBASE_API_KEY) {
      throw new Error('COINBASE_API_KEY not configured');
    }

    console.log('Creating Coinbase Commerce charge:', { amount, currency, customerEmail });

    // Create Coinbase Commerce Charge
    const res = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify({
        name: 'iPayX Payment',
        description,
        pricing_type: 'fixed_price',
        local_price: {
          amount: amount.toString(),
          currency,
        },
        metadata: {
          customer_email: customerEmail,
        },
        redirect_url: 'https://ipayx.ai/payment/success',
        cancel_url: 'https://ipayx.ai/quote',
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('Coinbase API error:', data);
      throw new Error(`Coinbase API error: ${JSON.stringify(data)}`);
    }

    console.log('Coinbase charge created:', data.data.id);

    // Log transaction
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('transaction_logs').insert({
      external_id: data.data.id,
      provider: 'coinbase',
      amount,
      currency,
      status: 'pending',
      metadata: { customerEmail },
      created_at: new Date().toISOString(),
    });

    console.log('Transaction logged successfully');

    return new Response(
      JSON.stringify({ 
        checkoutUrl: data.data.hosted_url,
        chargeId: data.data.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Coinbase checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
