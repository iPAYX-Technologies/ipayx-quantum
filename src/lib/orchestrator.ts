// src/lib/orchestrator.ts

import type { OnRampParams, ProviderName, GetQuoteFn } from '../providers/types';
import { getNdaxQuote } from '../providers/ndax';
import { getCrossmintQuote } from '../providers/crossmint';

const providers: ProviderName[] = ['ndax', 'crossmint', 'transak'];

// Transak placeholder (replace with real integration)
const getTransakQuote: GetQuoteFn = async (_params) => {
  return { provider: 'transak', fee: 0.03, eta: 10, available: true };
};

const adapters: Record<ProviderName, GetQuoteFn> = {
  ndax: getNdaxQuote,
  crossmint: getCrossmintQuote,
  transak: getTransakQuote,
};

export async function getQuotes(params: OnRampParams) {
  const results = await Promise.allSettled(
    providers.map((provider) => adapters[provider](params))
  );

  return results
    .map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      // Fallback on error
      return {
        provider: providers[index],
        fee: 0,
        eta: 0,
        available: false,
      };
    });
}
