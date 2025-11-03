// src/providers/types.ts

export type ProviderName = 'ndax' | 'crossmint' | 'transak';

export interface OnRampParams {
  fiatCurrency: string;
  cryptoCurrency: string;
  amount: number;
  paymentMethod: string;
}

export interface ProviderQuote {
  provider: ProviderName;
  fee: number;
  eta: number;
  available: boolean;
}

export type GetQuoteFn = (params: OnRampParams) => Promise<ProviderQuote>;
