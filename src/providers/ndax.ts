// src/providers/ndax.ts
// iPayX Quantum — NDAX Provider Integration

import axios from "axios";
import { log } from "@/lib/logger";
import type { GetQuoteFn, OnRampParams, ProviderQuote } from './types';

const NDAX_BASE_URL = process.env.NDAX_BASE_URL || "https://api.ndax.io";
const NDAX_API_KEY = process.env.NDAX_API_KEY || "";
const NDAX_SUPPORTED_COUNTRY = 'CA';

export async function ndaxQuote(symbol: string = "BTC-CAD") {
  try {
    const url = `${NDAX_BASE_URL}/api/v1/public/getticker?instrument=${symbol}`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    log("NDAX quote error:", error instanceof Error ? error.message : error);
    throw new Error(`Failed to fetch NDAX quote for ${symbol}`);
  }
}

export async function ndaxBalance(apiKey: string = NDAX_API_KEY) {
  try {
    const url = `${NDAX_BASE_URL}/api/v1/private/getaccountbalances`;
    const res = await axios.post(url, {}, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    log("NDAX balance fetched successfully");
    return res.data;
  } catch (error) {
    log("NDAX balance error:", error instanceof Error ? error.message : error);
    throw new Error("Failed to fetch NDAX account balances");
  }
}

export async function ndaxWithdraw(toAddress: string, amount: number, asset: string = "USDC", apiKey: string = NDAX_API_KEY) {
  try {
    const url = `${NDAX_BASE_URL}/api/v1/private/withdraw`;
    const res = await axios.post(url, { asset, amount, toAddress }, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.data;
  } catch (error) {
    log("NDAX withdraw error:", error instanceof Error ? error.message : error);
    throw new Error(`Failed to process NDAX withdrawal of ${amount} ${asset}`);
  }
}

// Preserved for backward compatibility with orchestrator
function computeFallbackQuote(params: OnRampParams): ProviderQuote {
  return {
    provider: 'ndax',
    fee: 0.002, // 0.2%
    eta: 15,    // minutes
    available: params.userCountry === NDAX_SUPPORTED_COUNTRY,
  };
}

/**
 * NDAX quote adapter for orchestrator.
 * Environment variables:
 * - NDAX_API_KEY
 * - NDAX_BASE_URL (e.g. https://api.ndax.io or your proxy)
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
    url.searchParams.set('cryptoCurrency', params.cryptoAsset);
    url.searchParams.set('amount', String(params.fiatAmount));
    url.searchParams.set('paymentMethod', params.paymentMethod || '');

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
