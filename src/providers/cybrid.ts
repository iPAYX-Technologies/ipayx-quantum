/**
 * Cybrid provider integration for onramp/offramp services
 * 
 * This adapter provides:
 * - Quote fetching from Cybrid API
 * - Sandbox flow helpers for testing full onramp journeys
 * - Safe fallback when env variables are missing
 */

import axios from 'axios';
import type { OnRampParams, ProviderQuote } from './types';

// Constants for currency conversions
const CENTS_PER_CAD = 100;
const USDC_DECIMALS = 6;

/**
 * Get a quote from Cybrid for converting fiat to crypto
 * 
 * @param params - Onramp parameters (fiat amount, currencies, etc.)
 * @returns Standardized provider quote or null if env vars missing
 */
export async function getCybridQuote(params: OnRampParams): Promise<ProviderQuote | null> {
  const apiKey = process.env.CYBRID_API_KEY;
  const baseUrl = process.env.CYBRID_BASE_URL || 'https://api.cybrid.xyz';

  // Safe fallback: return null if credentials not configured
  if (!apiKey) {
    console.warn('⚠️ CYBRID_API_KEY not configured - returning null quote');
    return null;
  }

  try {
    // Example: Fetch quote from Cybrid API
    // NOTE: Adjust endpoint and payload based on actual Cybrid API documentation
    const response = await axios.post(
      `${baseUrl}/api/quotes`,
      {
        product_type: 'crypto_purchase',
        bank_fiat: params.fiatAmount.toFixed(2),
        fiat_currency: params.fiatCurrency,
        crypto_currency: params.cryptoAsset,
        network: params.network || 'polygon',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;

    // Transform Cybrid response to standardized ProviderQuote format
    return {
      provider: 'Cybrid',
      fiatAmount: params.fiatAmount,
      fiatCurrency: params.fiatCurrency,
      cryptoAmount: parseFloat(data.deliver_amount || '0'),
      cryptoAsset: params.cryptoAsset,
      exchangeRate: parseFloat(data.exchange_rate || '1.0'),
      totalFees: parseFloat(data.fee || '0'),
      estimatedTimeSec: 300, // 5 minutes typical for Cybrid
      network: params.network,
      metadata: {
        quoteId: data.quote_guid,
        expiresAt: data.expires_at,
      },
    };
  } catch (error) {
    console.error('❌ Cybrid quote error:', error);
    // Return null on error to allow other providers to be tried
    return null;
  }
}

/**
 * SANDBOX HELPERS - For testing full Cybrid flows in sandbox mode
 * These functions are useful for end-to-end testing but not needed for production quotes
 */

/**
 * Create a business customer in Cybrid sandbox
 * @returns Customer GUID or null on error
 */
export async function createBusinessCustomer(): Promise<string | null> {
  const apiKey = process.env.CYBRID_API_KEY;
  const baseUrl = process.env.CYBRID_BASE_URL || 'https://api.cybrid.xyz';

  if (!apiKey) {
    console.warn('⚠️ CYBRID_API_KEY not configured');
    return null;
  }

  try {
    const response = await axios.post(
      `${baseUrl}/api/customers`,
      {
        type: 'business',
        name: 'iPayX Test Customer',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.guid || null;
  } catch (error) {
    console.error('❌ Cybrid createBusinessCustomer error:', error);
    return null;
  }
}

/**
 * Fund a CAD account in Cybrid sandbox (for testing)
 * @param customerGuid - Customer identifier
 * @param amountCad - Amount in CAD cents
 * @returns Account GUID or null on error
 */
export async function fundCadAccount(customerGuid: string, amountCad: number): Promise<string | null> {
  const apiKey = process.env.CYBRID_API_KEY;
  const baseUrl = process.env.CYBRID_BASE_URL || 'https://api.cybrid.xyz';

  if (!apiKey) {
    console.warn('⚠️ CYBRID_API_KEY not configured');
    return null;
  }

  try {
    const response = await axios.post(
      `${baseUrl}/api/accounts`,
      {
        customer_guid: customerGuid,
        asset: 'CAD',
        type: 'fiat',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const accountGuid = response.data.guid;

    // Fund the account (sandbox only) - convert CAD to cents
    await axios.post(
      `${baseUrl}/api/deposits`,
      {
        account_guid: accountGuid,
        amount: amountCad,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return accountGuid;
  } catch (error) {
    console.error('❌ Cybrid fundCadAccount error:', error);
    return null;
  }
}

/**
 * Execute a USDC purchase using Cybrid
 * @param customerGuid - Customer identifier
 * @param quoteGuid - Quote identifier from getCybridQuote
 * @returns Trade GUID or null on error
 */
export async function buyUSDC(customerGuid: string, quoteGuid: string): Promise<string | null> {
  const apiKey = process.env.CYBRID_API_KEY;
  const baseUrl = process.env.CYBRID_BASE_URL || 'https://api.cybrid.xyz';

  if (!apiKey) {
    console.warn('⚠️ CYBRID_API_KEY not configured');
    return null;
  }

  try {
    const response = await axios.post(
      `${baseUrl}/api/trades`,
      {
        customer_guid: customerGuid,
        quote_guid: quoteGuid,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.guid || null;
  } catch (error) {
    console.error('❌ Cybrid buyUSDC error:', error);
    return null;
  }
}

/**
 * Withdraw USDC to Polygon network
 * @param customerGuid - Customer identifier
 * @param amountUsdc - Amount in USDC (smallest unit)
 * @param destinationAddress - Polygon wallet address
 * @returns Withdrawal GUID or null on error
 */
export async function withdrawUSDCPolygon(
  customerGuid: string,
  amountUsdc: number,
  destinationAddress: string
): Promise<string | null> {
  const apiKey = process.env.CYBRID_API_KEY;
  const baseUrl = process.env.CYBRID_BASE_URL || 'https://api.cybrid.xyz';

  if (!apiKey) {
    console.warn('⚠️ CYBRID_API_KEY not configured');
    return null;
  }

  try {
    const response = await axios.post(
      `${baseUrl}/api/external_wallet_transfers`,
      {
        customer_guid: customerGuid,
        asset: 'USDC',
        network: 'polygon',
        amount: amountUsdc,
        destination_address: destinationAddress,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.guid || null;
  } catch (error) {
    console.error('❌ Cybrid withdrawUSDCPolygon error:', error);
    return null;
  }
}

/**
 * Execute full Cybrid flow: create customer, fund account, buy USDC, withdraw to Polygon
 * This is a sandbox testing helper that orchestrates the entire onramp journey
 * 
 * @param cadAmount - Amount in CAD to convert
 * @param polygonAddress - Destination Polygon wallet address
 * @returns Object with status and details, or null on failure
 */
export async function cybridFullFlow(
  cadAmount: number,
  polygonAddress: string
): Promise<{ success: boolean; details: Record<string, unknown> } | null> {
  console.log('🚀 Starting Cybrid full flow sandbox test...');

  // Step 1: Create business customer
  const customerGuid = await createBusinessCustomer();
  if (!customerGuid) {
    console.error('❌ Failed to create customer');
    return null;
  }
  console.log('✅ Created customer:', customerGuid);

  // Step 2: Fund CAD account
  const accountGuid = await fundCadAccount(customerGuid, cadAmount * CENTS_PER_CAD);
  if (!accountGuid) {
    console.error('❌ Failed to fund account');
    return null;
  }
  console.log('✅ Funded CAD account:', accountGuid);

  // Step 3: Get quote for USDC purchase
  const quote = await getCybridQuote({
    fiatAmount: cadAmount,
    fiatCurrency: 'CAD',
    cryptoAsset: 'USDC',
    network: 'polygon',
    walletAddress: polygonAddress,
  });

  if (!quote || !quote.metadata?.quoteId) {
    console.error('❌ Failed to get quote');
    return null;
  }
  console.log('✅ Received quote:', quote);

  // Step 4: Execute trade
  const tradeGuid = await buyUSDC(customerGuid, quote.metadata.quoteId as string);
  if (!tradeGuid) {
    console.error('❌ Failed to execute trade');
    return null;
  }
  console.log('✅ Executed trade:', tradeGuid);

  // Step 5: Withdraw USDC to Polygon
  const withdrawalGuid = await withdrawUSDCPolygon(
    customerGuid,
    quote.cryptoAmount * Math.pow(10, USDC_DECIMALS),
    polygonAddress
  );

  if (!withdrawalGuid) {
    console.error('❌ Failed to withdraw USDC');
    return null;
  }
  console.log('✅ Withdrawal initiated:', withdrawalGuid);

  return {
    success: true,
    details: {
      customerGuid,
      accountGuid,
      quoteId: quote.metadata.quoteId,
      tradeGuid,
      withdrawalGuid,
      cryptoAmount: quote.cryptoAmount,
      fiatAmount: cadAmount,
    },
  };
}
