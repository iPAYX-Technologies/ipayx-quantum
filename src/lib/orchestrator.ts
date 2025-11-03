// src/lib/orchestrator.ts

import type { OnRampParams, ProviderName, GetQuoteFn, ProviderQuote } from '../providers/types';
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

export async function getAllQuotes(params: OnRampParams) {
  const quotes = await Promise.all(
    providers.map((provider) => adapters[provider](params))
  );
  return quotes;
}

export function getBestQuote(quotes: ProviderQuote[]) {
  const available = quotes.filter((q) => q.available);
  if (available.length === 0) return null;
  
  return available.reduce((best, current) => {
    if (current.fee < best.fee) return current;
    if (current.fee === best.fee && current.eta < best.eta) return current;
    return best;
  });
}
