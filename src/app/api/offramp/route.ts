/**
 * Offramp API Route
 * 
 * Handles crypto-to-fiat offramp operations:
 * - GET: Get a quote for converting crypto to fiat
 * - POST: Create an offramp order
 * 
 * Note: This file follows Next.js App Router conventions but is in a Vite project.
 * For actual usage, these routes should be implemented as Supabase Edge Functions.
 */

import { safeLog } from '@/config/supabaseServer';

/**
 * GET /api/offramp
 * 
 * Fetch an offramp quote (stub implementation)
 * 
 * Query parameters:
 * - cryptoAmount: number - Amount in crypto
 * - cryptoAsset: string - Crypto asset to convert (e.g., "USDC", "BTC")
 * - fiatCurrency: string - Target fiat currency (e.g., "CAD", "USD")
 * - network: string (optional) - Source blockchain network
 * 
 * Response:
 * - 200: { quote: { ... } }
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
    const cryptoAmount = parseFloat(url.searchParams.get('cryptoAmount') || '0');
    const cryptoAsset = url.searchParams.get('cryptoAsset') || 'USDC';
    const fiatCurrency = url.searchParams.get('fiatCurrency') || 'CAD';
    const network = url.searchParams.get('network') || 'polygon';

    // Validate parameters
    if (!cryptoAmount || cryptoAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid cryptoAmount - must be positive number' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!cryptoAsset || !fiatCurrency) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: cryptoAsset, fiatCurrency' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Stub: Generate a mock offramp quote
    // In production, this would call an actual provider API (e.g., NDAX, Transak)
    const exchangeRate = 1.0; // 1 USDC = 1 CAD (approximate)
    const feePct = 0.015; // 1.5% fee
    const totalFees = cryptoAmount * exchangeRate * feePct;
    const fiatAmount = cryptoAmount * exchangeRate - totalFees;

    const quote = {
      provider: 'NDAX', // Using NDAX for offramp (Canadian exchange)
      cryptoAmount,
      cryptoAsset,
      fiatAmount: parseFloat(fiatAmount.toFixed(2)),
      fiatCurrency,
      exchangeRate,
      totalFees: parseFloat(totalFees.toFixed(2)),
      estimatedTimeSec: 600, // 10 minutes
      network,
      metadata: {
        quoteId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
      },
    };

    // Log quote to Supabase (non-blocking)
    await safeLog('offramp_quotes', {
      provider: quote.provider,
      crypto_amount: quote.cryptoAmount,
      crypto_asset: quote.cryptoAsset,
      fiat_amount: quote.fiatAmount,
      fiat_currency: quote.fiatCurrency,
      exchange_rate: quote.exchangeRate,
      total_fees: quote.totalFees,
      network: quote.network,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ quote }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Offramp GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/offramp
 * 
 * Create an offramp order (stub implementation)
 * 
 * Request body:
 * - cryptoAmount: number - Amount in crypto
 * - cryptoAsset: string - Crypto asset to convert
 * - fiatCurrency: string - Target fiat currency
 * - network: string - Source blockchain network
 * - bankAccountId: string - User's bank account identifier
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
    const { cryptoAmount, cryptoAsset, fiatCurrency, network, bankAccountId, quoteId } = body;

    // Validate required fields
    if (!cryptoAmount || cryptoAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid cryptoAmount - must be positive number' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!cryptoAsset || !fiatCurrency || !network || !bankAccountId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: cryptoAsset, fiatCurrency, network, bankAccountId',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // TODO: Implement actual offramp order creation with NDAX or other provider
    // For now, return a stubbed order response
    const orderId = crypto.randomUUID();
    const order = {
      id: orderId,
      status: 'pending',
      provider: 'NDAX',
      cryptoAmount,
      cryptoAsset,
      fiatCurrency,
      network,
      bankAccountId,
      quoteId: quoteId || null,
      createdAt: new Date().toISOString(),
    };

    // Log order creation to Supabase
    await safeLog('offramp_orders', {
      order_id: orderId,
      provider: 'NDAX',
      crypto_amount: cryptoAmount,
      crypto_asset: cryptoAsset,
      fiat_currency: fiatCurrency,
      network,
      bank_account_id: bankAccountId,
      quote_id: quoteId || null,
      status: 'pending',
      created_at: order.createdAt,
    });

    console.log('✅ Offramp order created:', orderId);

    return new Response(
      JSON.stringify({ order }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Offramp POST error:', error);
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
