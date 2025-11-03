import type { GetQuoteFn, OnRampParams, ProviderQuote } from './types';

const NDAX_SUPPORTED_COUNTRY = 'CA';

function computeFallbackQuote(params: OnRampParams): ProviderQuote {
  return {
    provider: 'ndax',
    fee: 0.002, // 0.2%
    eta: 15,    // minutes
    available: params.userCountry === NDAX_SUPPORTED_COUNTRY,
  };
}

/**
 * NDAX quote adapter.
 * Environment variables:
 * - NDAX_API_KEY
 * - NDAX_BASE_URL (e.g. https://api.ndax.io or your proxy)
 *
 * Replace the endpoint and response mapping with NDAX's real API when available.
 */
export const getNdaxQuote: GetQuoteFn = async (params: OnRampParams) => {
  const apiKey = process.env.NDAX_API_KEY;
  const baseURL = process.env.NDAX_BASE_URL ?? 'https://api.ndax.io';

  if (params.userCountry !== NDAX_SUPPORTED_COUNTRY) {
    return { ...computeFallbackQuote(params), available: false };
  }

  if (!apiKey) {
    return computeFallbackQuote(params);
  }

  try {
    const url = new URL('/onramp/quote', baseURL);
    url.searchParams.set('fiatCurrency', params.fiatCurrency);
    url.searchParams.set('cryptoCurrency', params.cryptoCurrency);
    url.searchParams.set('amount', String(params.amount));
    url.searchParams.set('paymentMethod', params.paymentMethod);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      return computeFallbackQuote(params);
    }

    const data = await resp.json() as { fee?: number; etaMinutes?: number; available?: boolean };
    const fee = typeof data.fee === 'number' ? data.fee : 0.002;
    const eta = typeof data.etaMinutes === 'number' ? data.etaMinutes : 15;
    const available = typeof data.available === 'boolean' ? data.available : true;

    const quote: ProviderQuote = {
      provider: 'ndax',
      fee,
      eta,
      available,
    };

    return quote;
  } catch {
    return computeFallbackQuote(params);
  }
};
