export type ProviderName = 'ndax' | 'crossmint' | 'transak' | 'cybrid';

export interface ProviderQuote {
  provider: ProviderName;
  fee: number;        // fraction e.g. 0.002 = 0.2%
  eta: number;        // minutes
  available: boolean;
  exchangeRate?: number;
  totalFees?: number;
  estimatedTimeSec?: number;
  metadata?: Record<string, unknown>;
}

export interface OnRampParams {
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAsset: string;
  network?: string;
  walletAddress?: string;
  userCountry?: string;
  paymentMethod?: string;
}

export type GetQuoteFn = (params: OnRampParams) => Promise<ProviderQuote>;
