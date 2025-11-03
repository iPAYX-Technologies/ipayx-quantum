// src/lib/orchestrator.ts

import type { OnRampParams, ProviderName, GetQuoteFn } from '../providers/types';
import { getNdaxQuote } from '../providers/ndax';

const providers: ProviderName[] = ['ndax', 'crossmint', 'transak'];

// Crossmint placeholder (replace with real integration)
const getCrossmintQuote: GetQuoteFn = async (_params) => {
  return { provider: 'crossmint', fee: 0, eta: 5, available: true };
};

// Transak placeholder (replace with real integration)
const getTransakQuote: GetQuoteFn = async (_params) => {
  return { provider: 'transak', fee: 0.03, eta: 10, available: true };
};

const adapters: Record<ProviderName, GetQuoteFn> = {
  ndax: getNdaxQuote,
  crossmint: getCrossmintQuote,
  transak: getTransakQuote,
};

export async function getBestQuote(params: OnRampParams) {
  const quotes = await Promise.all(
    providers.map((provider) => adapters[provider](params))
  );

  const availableQuotes = quotes.filter((q) => q.available);
  if (availableQuotes.length === 0) {
    return null;
  }

  // Select the quote with the lowest fee
  availableQuotes.sort((a, b) => a.fee - b.fee);
  return availableQuotes[0];
}
