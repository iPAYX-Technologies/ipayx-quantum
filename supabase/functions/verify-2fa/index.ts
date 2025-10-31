import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import * as OTPAuth from "https://esm.sh/otpauth@9.1.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  secret: z.string().min(1),
  code: z.string().length(6).regex(/^\d+$/),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📞 2FA verification request received');

    // Validate input
    const { secret, code } = requestSchema.parse(body);

    // Create TOTP instance with the secret
    const totp = new OTPAuth.TOTP({
      issuer: 'iPayX Protocol',
      label: 'User',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });

    // Verify the code with ±1 period tolerance (30 seconds each side)
    const delta = totp.validate({ 
      token: code, 
      window: 1 
    });

    const valid = delta !== null;

    if (valid) {
      console.log('✅ 2FA code verified successfully');
    } else {
      console.log('❌ Invalid 2FA code');
    }

    return new Response(
      JSON.stringify({ valid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ 2FA verification error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid request format' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
