import axios from 'axios';
import type { GetQuoteFn, OnRampParams, ProviderQuote } from './types';

function computeFallbackQuote(_params: OnRampParams): ProviderQuote {
  return {
    provider: 'crossmint',
    fee: 0.0,
    eta: 5,
    available: true,
  };
}

/**
 * Crossmint quote adapter.
 * Environment variables:
 * - CROSSMINT_API_KEY
 * - CROSSMINT_BASE_URL (e.g. https://api.crossmint.com or your proxy)
 *
 * Replace the endpoint and response mapping with Crossmint's real API when available.
 */
export const getCrossmintQuote: GetQuoteFn = async (params: OnRampParams) => {
  const apiKey = process.env.CROSSMINT_API_KEY;
  const baseURL = process.env.CROSSMINT_BASE_URL ?? 'https://api.crossmint.com';

  if (!apiKey) {
    return computeFallbackQuote(params);
  }

  try {
    const resp = await axios.get(`${baseURL}/onramp/quote`, {
      params: {
        fiatCurrency: params.fiatCurrency,
        cryptoCurrency: params.cryptoAsset,
        amount: params.fiatAmount,
        paymentMethod: params.paymentMethod,
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });

    const data = resp.data ?? {};
    const fee = typeof data.fee === 'number' ? data.fee : 0.0;
    const eta = typeof data.etaMinutes === 'number' ? data.etaMinutes : 5;
    const available = typeof data.available === 'boolean' ? data.available : true;

    const quote: ProviderQuote = {
      provider: 'crossmint',
      fee,
      eta,
      available,
      exchangeRate: typeof data.exchangeRate === 'number' ? data.exchangeRate : undefined,
      totalFees: typeof data.totalFees === 'number' ? data.totalFees : undefined,
      estimatedTimeSec: typeof data.estimatedTimeSec === 'number' ? data.estimatedTimeSec : undefined,
      metadata: data.metadata,
    };

    return quote;
  } catch {
    return computeFallbackQuote(params);
  }
};
