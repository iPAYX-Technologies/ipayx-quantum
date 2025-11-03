// src/providers/cybrid.ts

import axios from 'axios';
import type { GetQuoteFn, OnRampParams, ProviderQuote } from './types';

import {
  Configuration,
  CustomersApi,
  AccountsApi,
  TradesApi,
  TransfersApi,
} from '@cybrid/cybrid-api-bank-typescript';

// Bank (dashboard) base URL for SDK calls (customers, trades, transfers, etc.)
const BANK_BASE_URL =
  import.meta.env.VITE_CYBRID_BANK_BASE_URL ??
  import.meta.env.VITE_CYBRID_BASE_URL ??
  'https://bank.sandbox.cybrid.app';

const cybridConfig = new Configuration({
  basePath: BANK_BASE_URL,
  accessToken: import.meta.env.VITE_CYBRID_API_KEY,
});

function requireEnv(name: string): string {
  const v = import.meta.env[name];
  if (!v || !v.trim()) throw new Error(`Missing required env: ${name}`);
  return v;
}

function bankGuid(): string {
  return requireEnv('VITE_CYBRID_BANK_GUID');
}

// 1) Créer un client business
export async function createBusinessCustomer() {
  const customersApi = new CustomersApi(cybridConfig);
  const res = await customersApi.createCustomer(bankGuid(), {
    type: 'business',
    name: 'iPayX Quantum Test Client',
    email: 'test@ipayx.ai',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  // @ts-expect-error - SDK version compatibility: response may have .body or .data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res as any).body ?? res;
}

// 2) Simuler un dépôt fiat CAD
export async function fundCadAccount(accountGuid: string, amount: string) {
  const accountsApi = new AccountsApi(cybridConfig);
  const res = await accountsApi.fundAccount(accountGuid, {
    amount,
    currency: 'CAD',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  // @ts-expect-error - SDK version compatibility: response may have .body or .data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res as any).body ?? res;
}

// 3) Acheter du USDC avec CAD
export async function buyUSDC(accountGuid: string, amount: string) {
  const tradesApi = new TradesApi(cybridConfig);
  const res = await tradesApi.createTrade(bankGuid(), {
    productType: 'crypto_buy',
    buyAmount: amount,
    buyCurrency: 'USDC',
    sellCurrency: 'CAD',
    accountGuid,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  // @ts-expect-error - SDK version compatibility: response may have .body or .data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res as any).body ?? res;
}

// 4) Transférer USDC sur Polygon
export async function withdrawUSDCPolygon(accountGuid: string, toAddress: string, amount: string) {
  const transfersApi = new TransfersApi(cybridConfig);
  const res = await transfersApi.createTransfer(bankGuid(), {
    accountGuid,
    amount,
    network: 'polygon',
    toAddress,
    asset: 'USDC',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  // @ts-expect-error - SDK version compatibility: response may have .body or .data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res as any).body ?? res;
}

// 5) Flow complet sandbox Cybrid
export async function cybridFullFlow() {
  const customer = await createBusinessCustomer();
  // @ts-expect-error - customer type from SDK may not have accounts property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const account = customer?.accounts?.find?.((a: any) => a?.type === 'fiat' && a?.asset === 'CAD');
  if (!account) throw new Error('No CAD account found');

  await fundCadAccount(account.guid as string, '10000');        // Dépôt 10k CAD
  await buyUSDC(account.guid as string, '10000');               // Achat 10k USDC
  await withdrawUSDCPolygon(
    account.guid as string,
    '0x000000000000000000000000000000000000dead',
    '10000'
  ); // Retrait test

  console.log('Cybrid sandbox flow completed: CAD → USDC → Polygon');
}

// ---------- Adapter quote pour orchestrateur ----------
function computeFallbackQuote(_params: OnRampParams): ProviderQuote {
  return {
    provider: 'cybrid',
    fee: 0.004, // 0.4% (à ajuster selon ton deal)
    eta: 10,
    available: true,
  };
}

/**
 * Cybrid quote adapter (MVP).
 * IMPORTANT:
 * - Utiliser l'API public base pour les quotes (par défaut: https://api.cybrid.xyz)
 * - Ne pas confondre avec le BANK_BASE_URL du SDK.
 *
 * ENV supportées:
 * - VITE_CYBRID_QUOTE_BASE_URL (override optionnel, sinon default public)
 * - VITE_CYBRID_API_KEY (Bearer)
 */
export const getCybridQuote: GetQuoteFn = async (params: OnRampParams) => {
  const apiKey = import.meta.env.VITE_CYBRID_API_KEY;
  const quoteBaseURL = import.meta.env.VITE_CYBRID_QUOTE_BASE_URL ?? 'https://api.cybrid.xyz';

  if (!apiKey) return computeFallbackQuote(params);

  try {
    const resp = await axios.get(`${quoteBaseURL}/onramp/quote`, {
      params: {
        fiatCurrency: params.fiatCurrency,
        cryptoCurrency: params.cryptoCurrency,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (resp?.data ?? {}) as any;
    const fee = typeof data.fee === 'number' ? data.fee : 0.004;
    const eta = typeof data.etaMinutes === 'number' ? data.etaMinutes : 10;
    const available = typeof data.available === 'boolean' ? data.available : true;

    return {
      provider: 'cybrid',
      fee,
      eta,
      available,
    };
  } catch {
    return computeFallbackQuote(params);
  }
};
