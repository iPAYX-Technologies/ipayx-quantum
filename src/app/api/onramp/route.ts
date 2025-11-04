/**
 * Onramp API Route
 * 
 * Handles fiat-to-crypto onramp operations:
 * - GET: Get a quote for converting fiat to crypto
 * - POST: Create an onramp order
 * 
 * Note: This file follows Next.js App Router conventions but is in a Vite project.
 * For actual usage, these routes should be implemented as Supabase Edge Functions.
 */

import { getCybridQuote } from '@/providers/cybrid';
import { safeLog } from '@/config/supabaseServer';
import type { OnRampParams } from '@/providers/types';

/**
 * GET /api/onramp
 * 
 * Fetch an onramp quote from Cybrid
 * 
 * Query parameters:
 * - fiatAmount: number - Amount in fiat currency
 * - fiatCurrency: string - Fiat currency code (e.g., "CAD", "USD")
 * - cryptoAsset: string - Crypto asset to receive (e.g., "USDC", "BTC")
 * - network: string (optional) - Target blockchain network (e.g., "polygon")
 * - walletAddress: string (optional) - Destination wallet address
 * 
 * Response:
 * - 200: { quote: ProviderQuote }
 * - 400: { error: string } - Invalid parameters
 * - 500: { error: string } - Server error
 */
export async function GET(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const fiatAmount = parseFloat(url.searchParams.get('fiatAmount') || '0');
    const fiatCurrency = url.searchParams.get('fiatCurrency') || 'CAD';
    const cryptoAsset = url.searchParams.get('cryptoAsset') || 'USDC';
    const network = url.searchParams.get('network') || 'polygon';
    const walletAddress = url.searchParams.get('walletAddress') || undefined;

    // Validate parameters
    if (!fiatAmount || fiatAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid fiatAmount - must be positive number' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!fiatCurrency || !cryptoAsset) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: fiatCurrency, cryptoAsset' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Build quote request parameters
    const params: OnRampParams = {
      fiatAmount,
      fiatCurrency,
      cryptoAsset,
      network,
      walletAddress,
    };

    // Get quote from Cybrid
    const quote = await getCybridQuote(params);

    if (!quote) {
      return new Response(
        JSON.stringify({ 
          error: 'Unable to fetch quote from Cybrid. Please check provider configuration.',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Log quote to Supabase (non-blocking)
    await safeLog('onramp_quotes', {
      provider: quote.provider,
      fiat_amount: fiatAmount,
      fiat_currency: fiatCurrency,
      crypto_asset: cryptoAsset,
      exchange_rate: quote.exchangeRate,
      total_fees: quote.totalFees,
      network: network,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ quote }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Onramp GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/onramp
 * 
 * Create an onramp order
 * 
 * Request body:
 * - fiatAmount: number - Amount in fiat currency
 * - fiatCurrency: string - Fiat currency code
 * - cryptoAsset: string - Crypto asset to receive
 * - network: string - Target blockchain network
 * - walletAddress: string - Destination wallet address
 * - quoteId: string (optional) - Quote identifier from previous GET request
 * 
 * Response:
 * - 201: { order: { id: string, status: string, ... } }
 * - 400: { error: string } - Invalid parameters
 * - 500: { error: string } - Server error
 */
export async function POST(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse request body
    const body = await request.json();
    const { fiatAmount, fiatCurrency, cryptoAsset, network, walletAddress, quoteId } = body;

    // Validate required fields
    if (!fiatAmount || fiatAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid fiatAmount - must be positive number' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!fiatCurrency || !cryptoAsset || !network || !walletAddress) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: fiatCurrency, cryptoAsset, network, walletAddress',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // TODO: Implement actual order creation with Cybrid
    // For now, return a stubbed order response
    const orderId = crypto.randomUUID();
    const order = {
      id: orderId,
      status: 'pending',
      provider: 'Cybrid',
      fiatAmount,
      fiatCurrency,
      cryptoAsset,
      network,
      walletAddress,
      quoteId: quoteId || null,
      createdAt: new Date().toISOString(),
    };

    // Log order creation to Supabase
    await safeLog('onramp_orders', {
      order_id: orderId,
      provider: 'Cybrid',
      fiat_amount: fiatAmount,
      fiat_currency: fiatCurrency,
      crypto_asset: cryptoAsset,
      network,
      wallet_address: walletAddress,
      quote_id: quoteId || null,
      status: 'pending',
      created_at: order.createdAt,
    });

    console.log('✅ Onramp order created:', orderId);

    return new Response(
      JSON.stringify({ order }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Onramp POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
