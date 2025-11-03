import type { GetQuoteFn } from './types';

/**
 * NDAX quote adapter (placeholder).
 * Replace with real NDAX integration when available.
 */
export const getNdaxQuote: GetQuoteFn = async (_params) => {
  return {
    provider: 'ndax',
    fee: 0.02,
    eta: 8,
    available: true,
  };
};
