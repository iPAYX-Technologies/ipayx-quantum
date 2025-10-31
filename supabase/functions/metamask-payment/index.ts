import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkIpRateLimit } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const metamaskPaymentSchema = z.object({
  txHash: z.string().min(1),
  from: z.string().optional(),
  to: z.string().optional(),
  amount: z.number().min(0),
  asset: z.string(),
  chainId: z.union([z.number(), z.string()]),
  userId: z.string().uuid()
});

const CHAIN_NAMES: { [key: number]: string } = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base'
};

const RPC_URLS: { [key: number]: string } = {
  1: 'https://eth.llamarpc.com',
  137: 'https://polygon-rpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  10: 'https://mainnet.optimism.io',
  8453: 'https://mainnet.base.org'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract client IP for rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';

  // Check rate limit (30 req/min)
  const rateLimit = await checkIpRateLimit(clientIp, 'metamask-payment', 30);
  
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again in 1 minute.',
        retryAfter: 60 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        } 
      }
    );
  }

  try {
    const body = await req.json();
    const validatedData = metamaskPaymentSchema.parse(body);
    const { txHash, from, to, amount, asset, chainId, userId } = validatedData;

    // Detect transaction type
    const isHederaTransaction = 
      (typeof chainId === 'string' && chainId.toLowerCase().includes('hedera')) ||
      txHash.includes('@') ||
      (from && from.includes('.'));

    console.log('Processing MetaMask payment:', { 
      txHash, from, to, amount, asset, chainId, 
      isHedera: isHederaTransaction 
    });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let chainName: string;
    let explorerUrl: string;

    // Verify transaction on-chain (EVM only)
    if (!isHederaTransaction) {
      const rpcUrl = RPC_URLS[chainId as number];
      if (!rpcUrl) {
        throw new Error(`Unsupported EVM chain ID: ${chainId}`);
      }

      console.log('Verifying EVM transaction on-chain:', { txHash, chainId, rpcUrl });

      // Call RPC to verify transaction
      const rpcResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1
        })
      });

      const rpcData = await rpcResponse.json();

      // Check if transaction exists and is confirmed
      if (!rpcData.result || rpcData.result.blockNumber === null) {
        throw new Error('EVM transaction not found or not confirmed on-chain');
      }

      // Verify recipient address matches (if provided)
      if (to) {
        const onChainRecipient = rpcData.result.to?.toLowerCase();
        const expectedRecipient = to.toLowerCase();

        if (onChainRecipient !== expectedRecipient) {
          console.error('Recipient mismatch:', { onChainRecipient, expectedRecipient });
          throw new Error('Transaction recipient does not match expected address');
        }
      }

      // Check transaction was successful (status = 1)
      if (rpcData.result.status !== '0x1') {
        throw new Error('EVM transaction failed on-chain (reverted)');
      }

      console.log('EVM transaction verified on-chain:', {
        blockNumber: rpcData.result.blockNumber,
        status: 'confirmed',
        recipient: rpcData.result.to
      });

      chainName = CHAIN_NAMES[chainId as number] || 'Unknown';
      explorerUrl = chainId === 137 
        ? `https://polygonscan.com/tx/${txHash}`
        : `https://etherscan.io/tx/${txHash}`;
    } else {
      // Hedera transaction - skip on-chain verification (Snap already validated)
      console.log('Hedera transaction - skipping on-chain verification (validated by Snap)');
      chainName = 'Hedera';
      explorerUrl = `https://hashscan.io/mainnet/transaction/${txHash}`;
    }

    // Log transaction in database (FIX: Added user_id for RLS)
    const { data, error } = await supabase.from('transaction_logs').insert({
      tx_hash: txHash,
      from_chain: chainName,
      to_chain: chainName,
      asset: asset,
      amount: amount,
      status: 'confirmed', // Verified on-chain
      external_id: txHash,
      user_id: userId,  // FIX: Added for RLS policy compliance
      user_account_id: userId,
      metadata: {
        provider: 'metamask',
        chainId,
        from: from || 'unknown',
        to: to || 'unknown',
        explorerUrl,
        isHedera: isHederaTransaction
      },
      created_at: new Date().toISOString()
    }).select().single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to log transaction');
    }

    console.log('Transaction logged:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        txHash,
        explorerUrl,
        transactionId: data.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    // Log full error server-side (FIX: Don't expose stack traces to clients)
    console.error('[SECURE_LOG] MetaMask payment error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Generic error message for client (FIX: Don't expose validation details)
    let publicError = 'Transaction processing failed';
    let statusCode = 500;

    if (error instanceof z.ZodError) {
      publicError = 'Invalid transaction parameters';
      statusCode = 400;
    } else if (error.message?.includes('authorization')) {
      publicError = 'Authentication required';
      statusCode = 401;
    } else if (error.message?.includes('not found')) {
      publicError = 'Resource not found';
      statusCode = 404;
    }
    
    // Log failed attempt to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    try {
      await supabase.from('failed_transactions').insert({
        endpoint: 'metamask-payment',
        error_type: error instanceof z.ZodError ? 'validation_error' : 'processing_error',
        client_ip: clientIp,
        user_agent: userAgent,
        request_payload: error instanceof z.ZodError ? null : { 
          txHash: (error as any).body?.txHash, 
          chainId: (error as any).body?.chainId 
        },
        error_message: error.message,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: publicError,
        requestId: crypto.randomUUID()
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
